<div align="center">

# 🎵 SUNO Manager

**A sleek local desktop app for organizing and playing your SUNO AI-generated music library**

[![Electron](https://img.shields.io/badge/Electron-31-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D4?style=for-the-badge&logo=windows&logoColor=white)](https://microsoft.com/windows)

---

> Stop losing track of your AI creations. SUNO Manager scans your local folders, imports your songs with full metadata, and gives you a clean dark-themed desktop app to browse, play and organize everything — completely offline.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📁 **Auto-import** | Scans folder trees (`Genre → Album → song.mp3`) and imports everything automatically |
| 🎧 **Full-featured player** | Seekable progress bar, play/pause, next/prev, volume control |
| ✏️ **Metadata editor** | Edit title, genre, album, lyrics, style prompt, SUNO parameters, notes and tags |
| ⭐ **Rating system** | 5-star ratings per song with visual feedback |
| 🏷️ **Tags** | Add and filter songs by custom tags |
| 🖼️ **Cover art** | Attach cover images per song, displayed in player and song list |
| 🔍 **Search & filter** | Search by title, filter by genre and album from the sidebar |
| 🗂️ **Genre / Album browser** | Collapsible sidebar tree with track counts |
| 🎛️ **SUNO parameters** | Track Weirdness %, Style Strength %, and Audio Influence % per song |
| 💾 **SQLite database** | All metadata stored locally — your data never leaves your machine |

---

## 📸 Screenshots

<div align="center">

### Main Library View
![Main library view with song list, details panel and player bar](https://github.com/user-attachments/assets/placeholder-main)

### Song Detail & Metadata Editor
![Song detail panel showing metadata fields, tags, SUNO parameters and cover art](https://github.com/user-attachments/assets/placeholder-detail)

### Audio Player
![Bottom player bar with progress bar, playback controls and volume slider](https://github.com/user-attachments/assets/placeholder-player)

</div>

> **Note:** Replace the placeholder image URLs above with actual screenshots after your first run.

---

## 🏗️ Tech Stack

```
Electron 31       — Desktop shell, file system access, custom protocol handler
React 19          — UI rendering
TypeScript 5.5    — Type safety across main + renderer processes
electron-vite     — Fast HMR dev server + production bundler
better-sqlite3    — Synchronous SQLite for blazing-fast local queries
Howler.js         — HTML5 audio engine with seek support
Zustand           — Minimal global state (library + player)
Tailwind CSS 3    — Utility-first styling with dark theme
electron-builder  — Packages everything into a portable .exe
```

---

## 📂 Folder Convention

SUNO Manager expects your music organized like this:

```
Music Root/
├── Lofi/                      ← Genre
│   ├── Chill Beats/           ← Album
│   │   ├── song1.mp3
│   │   ├── song1.txt          ← Sidecar text → imported as Notes
│   │   └── song2.wav
│   └── Ambient/
│       └── track.mp3
└── Mathcore/
    └── My Album/
        └── heavy_riff.wav
```

Level 2 folders become **genres**, level 3 folders become **albums**. `.txt` sidecars with the same base name are auto-imported as song notes.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with C++ workload (required for `better-sqlite3`)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/Sn0wfly/SUNOmanager.git
cd SUNOmanager

# Install dependencies (skipping native scripts first)
npm install --ignore-scripts

# Rebuild native modules for your Electron version
npx @electron/rebuild -f -w better-sqlite3

# Start in dev mode
npm run dev
```

### Build a Portable .exe

```bash
npm run build:win
# → dist/SUNOmanager.exe
```

---

## 🗄️ Database Schema

All song metadata is stored in a local SQLite database (`~/.config/suno-manager/library.db`):

```sql
songs (
  id                  INTEGER PRIMARY KEY,
  title               TEXT,
  file_path           TEXT UNIQUE,
  genre               TEXT,
  album               TEXT,
  lyrics              TEXT,
  style_prompt        TEXT,
  weirdness_pct       INTEGER,
  style_pct           INTEGER,
  audio_influence_pct INTEGER,
  notes               TEXT,
  rating              INTEGER,
  tags                TEXT,        -- JSON array
  date_created        TEXT,
  cover_art_path      TEXT,
  created_at          TEXT,
  updated_at          TEXT
)
```

---

## 🔧 Development Notes

### Native Module Compilation
`better-sqlite3` requires native compilation against Electron's Node headers. If you get compile errors, make sure you're using **v12+** (v9.x is not compatible with MSVC 2022):

```bash
npx @electron/rebuild -f -w better-sqlite3 --version 31.7.7
```

### Project Structure

```
src/
├── main/
│   ├── index.ts          # Electron main process, local-file:// protocol
│   ├── db.ts             # SQLite schema and all CRUD queries
│   ├── scanner.ts        # Folder walker and audio file importer
│   └── ipc-handlers.ts   # IPC channel handlers (bridge to renderer)
├── preload/
│   └── index.ts          # contextBridge API exposure
└── renderer/src/
    ├── App.tsx            # Root 3-panel layout + player
    ├── store/library.ts   # Zustand store (songs + player state)
    ├── hooks/usePlayer.ts # Howler.js integration (module-level singleton)
    └── components/        # AudioPlayer, SongList, SongDetail, Sidebar...
```

---

## 📝 License

MIT © [Sn0wfly](https://github.com/Sn0wfly)
