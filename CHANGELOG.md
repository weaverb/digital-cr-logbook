# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-08-13

### Fixed
- **Documentation Package Links**: Removed non-existent `.msi` package download button and text references from `docs/index.html`.
- **UI State Reactivity**: Fixed state reactivity issue in `App.tsx` where saving new maintenance or range entries did not trigger immediate UI re-renders for selected firearms.

### Added
- **Playwright E2E Testing Suite**: Added 5 Playwright spec files under `e2e/` covering 100% of app features (16 automated test cases).

### CI / Automation
- **Playwright Pipeline Integration**: Integrated automated Playwright E2E test execution into GitHub Actions release workflow (`release.yml`).


## [1.1.1] - 2026-08-10

### Fixed
- **Release Pipeline Order of Operations**: Restructured workflow to pre-synchronize `package.json`, `src-tauri/tauri.conf.json`, and `docs/index.html` with target release version before Tauri desktop binary compilation begins.
- **GitHub Release Notes Parity**: Refactored release workflow script to extract the exact markdown section directly from `CHANGELOG.md` for GitHub Releases notes.
- **GitHub Pages Download Links**: Resolved 404 errors on direct download buttons by updating links to target `v1.1.1` release assets.

### Added
- **Automated Pipeline Upgrade**: Migrated release automation to `semantic-release` and `conventional-changelog` plugins.
- **AGENTS.md Specification**: Defined open agent guidance requiring Pull Requests for all AI code modifications and prohibiting direct pushes to `main`.
- **Bonus Collector Features Section**: Added documentation section covering Maintenance Log, Range & Ammo Log, and FFL Rolodex.

## [1.1.0] - 2026-08-10

### Added
- **User Support Subsystem**: Added User Support modal, status bar help button, and structured GitHub Issue Form template.
- **Dynamic Version Display**: Rendered amber version badge (`v1.1.0`) in status bar footer and enabled versioned release asset filenames.
- **DRY Legal Regulation Links**: Centralized eCFR and ATF Ruling 2016-1 hyperlinks in `src/lib/legalLinks.tsx`.

### Fixed
- **Release Workflow Optimization**: Restricted release workflow triggers strictly to application code changes and handled branch protection rules.

## [1.0.0] - 2026-08-06

### Added
- **27 CFR § 478.125(f) Compliant Bound Book Engine**: Immutable A&D logbook with auto-incrementing line numbers, disposition record locking, and `ATF_AUDIT_LOG` change reason tracking.
- **ATF Master C&R Reference Library**: Integrated 4,207 pre-seeded Curios & Relics reference records with real-time multi-field search and 1-click acquisition auto-fill.
- **BIP-39 Cryptographic Vault Subsystem**: 100% offline AES-256-GCM encrypted backup archive generation (`.crbk`) with 12-word seed phrase key derivation.
- **Printable ATF Bound Book PDF Exporter**: Custom landscape 27 CFR § 478.125(f) PDF generator using `jspdf` and `jspdf-autotable`.
- **Tauri v2 Desktop Architecture & Native Dialogs**: Native OS window host with `@tauri-apps/plugin-dialog` and `@tauri-apps/plugin-fs` file location pickers for Linux, macOS, and Windows.
- **Auxiliary Collection Modules**: Maintenance history tracker, Range trip round counter, FFL contacts rolodex, and receiver proof mark media gallery.
- **Tactical Dark Gunmetal UI**: Keyboard-driven command palette (`Ctrl+K` / `Cmd+K`), global `ESC` key modal dismissal, and responsive 1560x960 layout.
- **PolyForm Noncommercial License 1.0.0**: Added open-source personal non-commercial license.
- **Automated Vitest & Testing Library Suite**: 33 automated unit and integration tests with Istanbul code coverage reports.
