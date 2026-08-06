# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
