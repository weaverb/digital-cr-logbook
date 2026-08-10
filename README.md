
<a href="https://buymeacoffee.com/weaverb" target="_blank">
  <img src=".github/imgs/blue-button.png" alt="Buy me a coffee" height="35">
</a>

# C&R Collector Digital Logbook

A 100% offline, privacy-first, portable desktop bound book and collection management system custom-engineered for Federal Firearms License (FFL) **Type 03 Collectors of Curios and Relics**.

Pursuant to **27 CFR § 478.125(f)** and **ATF Rulings 2016-1 / 2021R-05F**, collectors must maintain accurate acquisition and disposition records. This application provides a legally compliant Bound Book combined with maintenance tracking, range logs, contact management, and an offline ATF Master C&R Reference Library (4,200+ pre-seeded records).

---

## 🛠️ Technology Stack

- **Runtime & Package Manager**: [Bun](https://bun.sh/) (v1.3+)
- **Frontend Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Custom Dark Gunmetal & Slate Tactical Theme
- **Desktop Engine**: Tauri v2 + Rust Core + SQLite (WAL mode)
- **Encryption Vault**: BIP-39 12-Word Seed Phrase + AES-256-GCM / Argon2id (`.crbk` archives)

---

## 🚀 Getting Started

### Mode 1: Web Application Mode (Recommended for Instant Dev)

Web mode requires **no system libraries or C compilers**.

```bash
# Install dependencies with Bun
bun install

# Start Vite web server (Instant)
bun dev
```

---

### Mode 2: Native Desktop App Mode (Tauri v2 + Rust)

To run or build the native desktop binary wrapper (`bun run tauri:dev` / `bun run tauri:build`), install the required system libraries (`glib-2.0`, `gtk-3`, `webkit2gtk-4.1`, `pkg-config`):

#### Fedora (Standard Workstation):
```bash
sudo dnf install -y pkg-config glib2-devel gtk3-devel webkit2gtk4.1-devel openssl-devel libsoup3-devel
```

#### Bazzite / Fedora Silverblue / OSTree (Immutable OS Setup):
Bazzite uses an immutable system image. To run native Tauri GTK desktop builds on Bazzite, use **Distrobox** (pre-installed on Bazzite) with Rust, Bun, and GTK headers:

```bash
# 1. Create and enter a fresh Fedora development container
distrobox create -n dev --image fedora:latest
distrobox enter dev

# 2. Install GTK & C compiler toolchain inside Distrobox
sudo dnf install -y gcc gcc-c++ make pkg-config glib2-devel gtk3-devel webkit2gtk4.1-devel openssl-devel libsoup3-devel curl git

# 3. Install Rust toolchain inside Distrobox
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# 4. Install Bun runtime inside Distrobox
curl -fsSL https://bun.sh/install | bash
source "$HOME/.bashrc"

# 5. Navigate to project directory, install packages, and launch native desktop
cd ~/github.com/weaverb/digital-cr-logbook
bun install
bun run tauri:dev
```

#### Debian / Ubuntu / Mint:
```bash
sudo apt update
sudo apt install -y build-essential pkg-config libglib2.0-dev libgtk-3-dev libwebkit2gtk-4.1-dev libssl-dev libsoup-3.0-dev
```

#### Arch Linux / Manjaro:
```bash
sudo pacman -S --needed base-devel pkgconf glib2 gtk3 webkit2gtk-4.1 openssl libsoup3
```

Then run:

```bash
# Launch Native Desktop Window
bun run tauri:dev

# Build Standalone Linux Executable / AppImage
bun run tauri:build
```

---

## 📑 Project Structure

```txt
digital-cr-logbook/
├── cr_list/
│   ├── curios_and_relics_master_list_2026_08_06.csv   # Pre-seeded 4,207 ATF C&R entries
│   ├── generate_cr_csv.py                              # Master list extraction script
│   └── README_CR_LIST.md                               # Dataset update guide
├── src/
│   ├── components/                                     # Modals & UI Components
│   │   ├── AuditDashboardModal.tsx                     # Live ATF compliance scorecard
│   │   ├── AuditLogViewerModal.tsx                     # ATF_AUDIT_LOG history viewer
│   │   ├── BackupVaultModal.tsx                        # BIP-39 encrypted vault backup & restore
│   │   ├── CommandPaletteModal.tsx                     # Ctrl+K / Cmd+K global search & action launcher
│   │   ├── ContactsRolodexModal.tsx                    # FFL Dealer & Collector directory
│   │   ├── EditRecordModal.tsx                         # Record amendment with mandatory audit reason
│   │   ├── LogDispositionModal.tsx                     # Disposition logging & 27 CFR locking
│   │   ├── MediaGalleryModal.tsx                       # Receiver proof marks & scan attachment store
│   │   ├── NewAcquisitionModal.tsx                     # Bound book entry with live C&R autocomplete
│   │   ├── PDFExportDialogModal.tsx                    # Customizable printable ATF PDF options
│   │   └── VaultHealthModal.tsx                        # SQLite WAL & line continuity diagnostics
│   ├── data/
│   │   └── cr_master_data.json                         # Pre-compiled 4,207 ATF C&R reference database
│   ├── hooks/
│   │   └── useEscapeKey.ts                             # Global ESC key modal dismissal hook
│   ├── lib/
│   │   ├── cryptoVault.ts                              # BIP-39 seed phrase key derivation & AES-256-GCM
│   │   ├── fileSaveHelper.ts                           # Native OS location picker save wrapper
│   │   ├── osHelper.ts                                 # OS platform detection (Ctrl+K vs Cmd+K)
│   │   ├── pdfExporter.ts                              # 27 CFR § 478.125(f) printable PDF builder
│   │   └── storage.ts                                  # LocalStorage & audit logging engine
│   ├── types/
│   │   └── logbook.ts                                  # TypeScript interfaces & domain models
│   ├── App.tsx                                         # Dual-Pane Tactical Logbook UI
│   ├── index.css                                       # Tailwind CSS v4 & custom tokens
│   └── main.tsx
├── src-tauri/                                          # Tauri v2 Desktop Engine
│   ├── capabilities/
│   │   └── default.json                                # Native window permissions (dialog, fs)
│   ├── icons/                                          # Desktop application icon set
│   ├── src/
│   │   ├── lib.rs                                      # Rust plugin initializer
│   │   └── main.rs                                     # Desktop binary entrypoint
│   ├── Cargo.toml                                      # Rust package manifest
│   └── tauri.conf.json                                 # Desktop window & bundle configuration
├── PRODUCT.md                                          # Durable Product Context
├── software_architecture_plan.md                       # Full System & Schema Architecture
├── vite.config.ts
└── package.json
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`Ctrl + K`** *(Linux / Windows)* / **`Cmd + K`** *(macOS)* | Open Global Command Palette & Instant Search |
| **`ESC`** | Close any open modal |

---

## 📐 Engineering & Release Standards

This repository strictly enforces the following engineering guidelines:

- **Conventional Commits (v1.0.0)**: All commits follow the specification defined at [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
  - Format: `<type>[optional scope]: <description>` (e.g., `feat(boundbook): add inline A&D entry validation`)
- **Semantic Versioning (v2.0.0)**: Releases adhere to `MAJOR.MINOR.PATCH` as specified at [SemVer](https://semver.org/).

### 🤖 Automated Release Pipeline (`semantic-release`)

Releases are fully automated via [semantic-release](https://semantic-release.org/) on every merge to `main`:

1. **Commit Analysis**: `@semantic-release/commit-analyzer` parses Conventional Commits to calculate the SemVer version bump (`feat:` -> minor, `fix:`/`perf:`/`security:` -> patch, `BREAKING CHANGE:` -> major).
2. **Release Notes & Changelog**: `@semantic-release/release-notes-generator` and `@semantic-release/changelog` format change items and update `CHANGELOG.md`.
3. **Multi-File Version Sync**: `@semantic-release/exec` invokes `bun scripts/update-version-files.js` to synchronize `src-tauri/tauri.conf.json` and `docs/index.html` download URLs.
4. **Git Commit & Asset Push**: `@semantic-release/git` commits updated release files (`package.json`, `src-tauri/tauri.conf.json`, `CHANGELOG.md`, `docs/index.html`) with message `chore(release): ${nextRelease.version} [skip ci]`.
5. **GitHub Release & Assets**: `@semantic-release/github` tags the release, creates the GitHub Release, and attaches all 4 multi-platform desktop binaries (`.exe`, `.msi`, `.dmg`, `.AppImage`, `.deb`).

---

## 🔒 License & Compliance

Designed strictly for compliance with **27 CFR § 478.125(f)**. All user data, cryptographic keys, and bound book records remain 100% local on the user's hardware with zero network telemetry.

Licensed under the **PolyForm Noncommercial License 1.0.0** (`LICENSE`). You are free to copy, modify, distribute, and use this software for **personal, non-commercial purposes**. Commercial use, rental, or integration into paid services is strictly prohibited.

