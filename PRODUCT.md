# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 18 + TypeScript + Vite (Tauri v2 ready) with Tailwind CSS & Lucide Icons, using **Bun** for package management, script execution, and development bundling.

## Users

Federal Firearms License (FFL) Type 03 Collectors of Curios and Relics requiring an offline, 100% compliant digital bound book and collection management system.

## Product Purpose

Provides an immutable, 27 CFR § 478.125(f) compliant digital acquisition & disposition bound book combined with maintenance tracking, range logs, contact rolodex, and an integrated offline ATF Master C&R Reference Database (4,200+ pre-seeded records).

## Positioning

100% offline, privacy-first desktop application with BIP-39 12-word seed phrase encrypted portable backups (.crbk), zero telemetry, single-file storage, and 1-click compliant ATF audit PDF/CSV export.

## Operating Context

Local desktop execution (Windows, macOS, Linux or portable USB drives), high-density data tables, fast multi-field search across 4,200+ ATF C&R records, zero cloud dependency, offline inspection readiness.

## Capabilities and Constraints

- **Compliance**: 27 CFR § 478.125(f) & ATF Rulings 2016-1 / 2021R-05F. Immutable audit logs (`ATF_AUDIT_LOG`), auto-incrementing line tracking, locked records upon disposition.
- **Master C&R DB**: Pre-seeded `curios_and_relics_master_list_2026_08_06.csv` (4,207 records) with instant offline search & auto-fill.
- **Portability**: BIP-39 seed phrase derived AES-256-GCM encrypted backup archives (`.crbk`).
- **Auxiliary Modules**: Range logs, maintenance tracking, contacts rolodex, and media attachment storage.
- **Development Standards**: Strict adherence to [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`) and [Semantic Versioning 2.0.0](https://semver.org/) (`MAJOR.MINOR.PATCH`).

## Brand Commitments

- **Tone & Aesthetic**: Dark Gunmetal & Slate tactical aesthetic, high contrast, dense audit tables, crisp typography, and high visual clarity.
- **Security & Privacy**: Zero cloud sync, zero telemetry, full offline user data sovereignty.

## Evidence on Hand

- `software_architecture_plan.md`: Comprehensive system architecture and schema design.
- `cr_list/curios_and_relics_master_list_2026_08_06.csv`: 4,207 extracted ATF C&R entries across publications from 1972 through April 2025.

## Product Principles

1. **Compliance First**: Audit trail integrity and ATF bound book compliance are paramount; record edits require explicit reason logging.
2. **Absolute Privacy**: All data and encryption keys stay strictly local on the user's hardware.
3. **High Data Density**: Optimize for fast scanning, filtering, and multi-field searching of large firearm catalogs.
4. **Resilient & Portable**: Single-file SQLite storage with BIP-39 seed phrase recovery for complete user peace of mind.

## Accessibility & Inclusion

High contrast palette, full keyboard navigation support for rapid bound book entry, clean sans-serif typography, and explicit visual indicators for record status and compliance locks.
