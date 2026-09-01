/**
 * Dagger CI for digital-cr-logbook
 *
 * Local checks (`dagger call ci` / `dagger check`) and the same functions
 * back Dagger Cloud's automatic Checks-on-push. Mirrors the app's own
 * package.json scripts (lint/test/build/test:e2e) inside pinned containers
 * so results are identical locally, in Cloud Checks, and (eventually) in
 * the release pipeline.
 */
import { dag, Container, Directory, object, func, check, argument } from "@dagger.io/dagger"

// Keep in sync with @playwright/test's resolved version in the app's package.json/bun.lock.
const PLAYWRIGHT_IMAGE = "mcr.microsoft.com/playwright:v1.62.1-jammy"

const SOURCE_EXCLUDES = [
  "node_modules",
  "dist",
  ".git",
  "src-tauri/target",
  "coverage",
  "playwright-report",
  "test-results",
  ".dagger",
]

@object()
export class DigitalCrLogbook {
  /**
   * Base container with dependencies installed. Shared by lint/test/build
   * so the `bun install` layer is cached identically across all of them.
   *
   * `package.json`/`bun.lock` are copied in and installed *before* the
   * rest of the source — so `bun install` only re-runs when a dependency
   * actually changes, not on every source edit. Copying the whole source
   * up front (the naive approach) makes every downstream step, install
   * included, invalidate on any file change.
   */
  @func()
  buildEnv(@argument({ defaultPath: "/" }) source: Directory): Container {
    return dag
      .container()
      .from("oven/bun:1")
      .withWorkdir("/src")
      .withMountedCache("/root/.bun/install/cache", dag.cacheVolume("bun-install-cache"))
      .withFile("/src/package.json", source.file("package.json"))
      .withFile("/src/bun.lock", source.file("bun.lock"))
      .withExec(["bun", "install", "--frozen-lockfile"])
      .withDirectory("/src", source, { exclude: SOURCE_EXCLUDES })
  }

  /** `bun run lint` (oxlint). */
  @func()
  @check()
  async lint(@argument({ defaultPath: "/" }) source: Directory): Promise<string> {
    return this.buildEnv(source).withExec(["bun", "run", "lint"]).stdout()
  }

  /** `bun run test` (vitest run). */
  @func()
  @check()
  async test(@argument({ defaultPath: "/" }) source: Directory): Promise<string> {
    return this.buildEnv(source).withExec(["bun", "run", "test"]).stdout()
  }

  /** `bun run test:coverage`, exported as a Directory. Not part of `ci`/checks. */
  @func()
  testCoverage(@argument({ defaultPath: "/" }) source: Directory): Directory {
    return this.buildEnv(source)
      .withExec(["bun", "run", "test:coverage"])
      .directory("/src/coverage")
  }

  /** `bun run build` (tsc -b && vite build), exported as a Directory for reuse by e2e. */
  @func()
  build(@argument({ defaultPath: "/" }) source: Directory): Directory {
    return this.buildEnv(source).withExec(["bun", "run", "build"]).directory("/src/dist")
  }

  /** Check wrapper around `build` — fails the check if the build fails. */
  @func()
  @check()
  async buildCheck(@argument({ defaultPath: "/" }) source: Directory): Promise<void> {
    await this.buildEnv(source).withExec(["bun", "run", "build"]).sync()
  }

  /**
   * `playwright test` against the built `dist/`, run inside the official
   * Playwright image (bundles every font/GTK dependency Chromium needs —
   * this is what lets e2e run outside the distrobox workaround). `dist/`
   * and `node_modules` come from the Bun-based build stage. The `bun`
   * binary itself is copied in (not reinstalled via curl) because
   * playwright.config.ts's `webServer.command` shells out to
   * `bun run preview`; Playwright's own CLI stays plain Node.
   */
  @func()
  @check()
  async e2e(@argument({ defaultPath: "/" }) source: Directory): Promise<string> {
    const built = this.buildEnv(source).withExec(["bun", "run", "build"])
    const nodeModules = built.directory("/src/node_modules")
    const dist = built.directory("/src/dist")
    const bunBinary = dag.container().from("oven/bun:1").file("/usr/local/bin/bun")

    return dag
      .container()
      .from(PLAYWRIGHT_IMAGE)
      .withDirectory("/src", source, { exclude: SOURCE_EXCLUDES })
      .withDirectory("/src/node_modules", nodeModules)
      .withDirectory("/src/dist", dist)
      .withFile("/usr/local/bin/bun", bunBinary)
      .withWorkdir("/src")
      .withEnvVariable("CI", "true")
      .withExec(["node_modules/.bin/playwright", "test"])
      .stdout()
  }

  /** Run everything checks run, in order, failing fast — convenience wrapper for local use. */
  @func()
  async ci(@argument({ defaultPath: "/" }) source: Directory): Promise<string> {
    const results: string[] = []
    results.push(await this.lint(source))
    results.push(await this.test(source))
    await this.buildCheck(source)
    results.push(await this.e2e(source))
    return results.join("\n---\n")
  }
}
