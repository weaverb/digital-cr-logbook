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

#### Fedora / RHEL / Silverblue:
```bash
sudo dnf install -y pkg-config glib2-devel gtk3-devel webkit2gtk4.1-devel openssl-devel libsoup3-devel
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
│   └── curios_and_relics_master_list_2026_08_06.csv   # Pre-seeded 4,207 ATF C&R entries
├── src/
│   ├── App.tsx                                         # Dual-Pane Tactical Logbook UI
│   ├── index.css                                       # Tailwind CSS v4 & custom tokens
│   └── main.tsx
├── PRODUCT.md                                         # Durable Product Context
├── software_architecture_plan.md                      # Full System & Schema Architecture
├── vite.config.ts
└── package.json
```

---

## 📐 Engineering & Release Standards

This repository strictly enforces the following engineering guidelines:

- **Conventional Commits (v1.0.0)**: All commits follow the specification defined at [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
  - Format: `<type>[optional scope]: <description>` (e.g., `feat(boundbook): add inline A&D entry validation`)
- **Semantic Versioning (v2.0.0)**: Releases adhere to `MAJOR.MINOR.PATCH` as specified at [SemVer](https://semver.org/).

---

## 🔒 License & Compliance

Designed strictly for compliance with **27 CFR § 478.125(f)**. All user data, cryptographic keys, and bound book records remain 100% local on the user's hardware with zero network telemetry.
