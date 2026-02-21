import { contextBridge, ipcRenderer } from 'electron'
import type { Song, SongUpdate } from '../main/db'

export type { Song, SongUpdate }

export interface ScanResult {
  added: number
  skipped: number
  errors: string[]
}

export interface GenreInfo {
  genre: string
  count: number
}

export interface AlbumInfo {
  genre: string
  album: string
  count: number
}

const api = {
  // Songs
  songs: {
    getAll: (genre?: string, album?: string): Promise<Song[]> =>
      ipcRenderer.invoke('songs:getAll', genre, album),
    get: (id: number): Promise<Song | undefined> =>
      ipcRenderer.invoke('songs:get', id),
    update: (id: number, updates: Partial<SongUpdate>): Promise<Song> =>
      ipcRenderer.invoke('songs:update', id, updates),
    search: (query: string): Promise<Song[]> =>
      ipcRenderer.invoke('songs:search', query)
  },

  // Library
  library: {
    scan: (folder?: string): Promise<ScanResult> =>
      ipcRenderer.invoke('library:scan', folder),
    setRoot: (folderPath: string): Promise<string> =>
      ipcRenderer.invoke('library:setRoot', folderPath),
    getRoot: (): Promise<string | null> =>
      ipcRenderer.invoke('library:getRoot'),
    pickFolder: (): Promise<string | null> =>
      ipcRenderer.invoke('library:pickFolder'),
    getGenres: (): Promise<GenreInfo[]> =>
      ipcRenderer.invoke('library:getGenres'),
    getAlbums: (genre?: string): Promise<AlbumInfo[]> =>
      ipcRenderer.invoke('library:getAlbums', genre)
  },

  // Settings
  settings: {
    get: (key: string): Promise<string | null> =>
      ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string): Promise<void> =>
      ipcRenderer.invoke('settings:set', key, value)
  },

  // Cover Art
  coverArt: {
    pick: (): Promise<string | null> =>
      ipcRenderer.invoke('coverArt:pick'),
    save: (sourcePath: string, songId: number): Promise<string> =>
      ipcRenderer.invoke('coverArt:save', sourcePath, songId),
    delete: (coverPath: string): Promise<void> =>
      ipcRenderer.invoke('coverArt:delete', coverPath)
  }
}

// Expose typed API to renderer via contextBridge
contextBridge.exposeInMainWorld('api', api)

export type API = typeof api
