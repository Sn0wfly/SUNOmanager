/// <reference types="vite/client" />

// Re-define API types for the renderer without importing from preload (cross-project)
export interface Song {
  id: number
  title: string
  file_path: string
  genre: string | null
  album: string | null
  lyrics: string | null
  style_prompt: string | null
  weirdness_pct: number
  style_pct: number
  audio_influence_pct: number
  notes: string | null
  rating: number
  tags: string
  date_created: string | null
  cover_art_path: string | null
  created_at: string
  updated_at: string
}

interface ScanResult {
  added: number
  skipped: number
  errors: string[]
}

interface GenreInfo {
  genre: string
  count: number
}

interface AlbumInfo {
  genre: string
  album: string
  count: number
}

interface WindowAPI {
  songs: {
    getAll: (genre?: string, album?: string) => Promise<Song[]>
    get: (id: number) => Promise<Song | undefined>
    update: (id: number, updates: Partial<Song>) => Promise<Song>
    search: (query: string) => Promise<Song[]>
  }
  library: {
    scan: (folder?: string) => Promise<ScanResult>
    setRoot: (folderPath: string) => Promise<string>
    getRoot: () => Promise<string | null>
    pickFolder: () => Promise<string | null>
    getGenres: () => Promise<GenreInfo[]>
    getAlbums: (genre?: string) => Promise<AlbumInfo[]>
  }
  settings: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<void>
  }
  coverArt: {
    pick: () => Promise<string | null>
    save: (sourcePath: string, songId: number) => Promise<string>
    delete: (coverPath: string) => Promise<void>
  }
}

declare global {
  interface Window {
    api: WindowAPI
  }
}
