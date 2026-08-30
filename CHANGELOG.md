# Changelog

## [1.3.4](https://github.com/weaverb/digital-cr-logbook/compare/v1.3.3...v1.3.4) (2026-08-30)


### Bug Fixes

* drop backward-compatibility fallback for pre-release backup vaults ([b189614](https://github.com/weaverb/digital-cr-logbook/commit/b18961456a0249a3bd2451fc32f55b91972c4056))
* drop hang-prone File System Access API save path; disambiguate new e2e locators ([b3e68d2](https://github.com/weaverb/digital-cr-logbook/commit/b3e68d266486789bc5e8febb8df60bea8f386df5))
* raise minimum readable type size app-wide ([26bc585](https://github.com/weaverb/digital-cr-logbook/commit/26bc5858f289a80d7ecc2de3bc5e32310f82613f))
* require restore confirmation and remove fabricated SQLite/PRAGMA status claims ([c708be6](https://github.com/weaverb/digital-cr-logbook/commit/c708be6e6abd0918fcd8e0113ab717cc57f0dd47))
* **test:** await generate12WordSeed() now that it's async ([b07335c](https://github.com/weaverb/digital-cr-logbook/commit/b07335c20ffec1b23aaded0ca2c74f699a1be05a))
* use real BIP-39 wordlist+checksum and PBKDF2-600k for backup vault ([c190833](https://github.com/weaverb/digital-cr-logbook/commit/c1908339d8dd5b9ec7b04fd9824f0924f8506351))


### BREAKING CHANGES

* .crbk backup vaults created by any pre-release build
of this app (anything using the 310-word, non-BIP-39-compliant
wordlist and PBKDF2 at 100,000 iterations) can no longer be restored.
There is no supported migration path for those files. This is
acceptable pre-release, before there's a real installed user base to
support; going forward, a change like this should instead bump the
backup file format and support both, not silently drop compatibility.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EQE22tuzbGBGbaoNCHVTSY

## [1.3.3](https://github.com/weaverb/digital-cr-logbook/compare/v1.3.2...v1.3.3) (2026-08-30)


### Bug Fixes

* repair broken gunmetal classes and consolidate ad-hoc purple/indigo accents ([85e4e6b](https://github.com/weaverb/digital-cr-logbook/commit/85e4e6b5dfda35883b1c1cf9e9bc94b8bec20551))

## [1.3.2](https://github.com/weaverb/digital-cr-logbook/compare/v1.3.1...v1.3.2) (2026-08-30)


### Bug Fixes

* add aria-labels, focus rings, and error banners for a11y audit ([5867f3c](https://github.com/weaverb/digital-cr-logbook/commit/5867f3cd9addbabc972e10c7a85f35ffd2185b3b))
* de-emphasize command palette trigger and add form section grouping ([4f60c80](https://github.com/weaverb/digital-cr-logbook/commit/4f60c801e3618ed079f9ddc2787963c472738dd0))
* **test:** disambiguate cell locators that now match the new aria-labels ([c1361e5](https://github.com/weaverb/digital-cr-logbook/commit/c1361e5ad2bb527cb61ae62c93b50c73fcb641c7))

## [1.3.1](https://github.com/weaverb/digital-cr-logbook/compare/v1.3.0...v1.3.1) (2026-08-19)


### Bug Fixes

* **ci:** optimize playwright webServer command and add step timeout ([39d8b11](https://github.com/weaverb/digital-cr-logbook/commit/39d8b11af2856734e2dab26aa0fcc474bb0f8d03))
* **ci:** switch release-notes-generator to angular preset and backfill v1.3.0 in changelog ([cd099ce](https://github.com/weaverb/digital-cr-logbook/commit/cd099ce129347c6b63016c1624c12b060f0b4753))

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-08-17

### Added
- **ATF C&R Master List CSV Import & Replace Engine**: Built dynamic CSV parser engine (`src/lib/crLibraryStorage.ts`) and modal dialog (`src/components/ImportCRCSVModal.tsx`) allowing Type 03 collectors to import and hot-swap updated official ATF Curios & Relics master CSV datasets (`curios_and_relics_master_list_*.csv`) directly in the app without requiring software updates or rebuilds.
- **Enhanced Section Filtering**: Added Section IIIA (Antique) and Section I (Ammunition) section filter buttons in the C&R Reference tab and live badge count indicators.
- **Acquisition Autocomplete Dynamic Hook**: Integrated the active C&R reference library into the New Acquisition modal autocomplete picker.
- **User Guide Workflow 4 & FAQ #6**: Added detailed walkthrough for C&R CSV import and FAQ guidance in `docs/index.html` and `cr_list/README_CR_LIST.md`.
- **Playwright E2E Test Suite**: Added browser automation test cases covering CSV upload, drag-and-drop, validation preview, library hot-swapping, and bundled default dataset restore.

### Fixed
- **Storage Quota Resilience**: Upgraded custom C&R storage from browser `localStorage` to IndexedDB (`cr_logbook_db`) with memory caching to safely store large (>4,200+ item, ~3.3MB) C&R datasets without exceeding the 5MB browser storage quota.

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
