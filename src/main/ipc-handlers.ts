import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import {
  getAllSongs,
  getSongById,
  updateSong,
  searchSongs,
  getSetting,
  setSetting,
  getGenres,
  getBands,
  getAlbums,
  getCoverArtDir
} from './db'
import { scanLibrary } from './scanner'

export function registerIpcHandlers(): void {
  // --- Songs ---

  ipcMain.handle('songs:getAll', (_event, genre?: string, band?: string, album?: string) => {
    return getAllSongs(genre, band, album)
  })

  ipcMain.handle('songs:get', (_event, id: number) => {
    return getSongById(id)
  })

  ipcMain.handle('songs:update', (_event, id: number, updates: Record<string, unknown>) => {
    updateSong(id, updates as Parameters<typeof updateSong>[1])
    return getSongById(id)
  })

  ipcMain.handle('songs:search', (_event, query: string) => {
    return searchSongs(query)
  })

  // --- Library ---

  ipcMain.handle('library:scan', async (_event, folder?: string) => {
    const root = folder ?? getSetting('root_folder')
    if (!root) return { added: 0, skipped: 0, errors: ['No root folder set'] }
    return scanLibrary(root)
  })

  ipcMain.handle('library:setRoot', (_event, folderPath: string) => {
    setSetting('root_folder', folderPath)
    return folderPath
  })

  ipcMain.handle('library:getRoot', () => {
    return getSetting('root_folder')
  })

  ipcMain.handle('library:pickFolder', async (event) => {
    const win = require('electron').BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory'],
      title: 'Select Music Library Folder'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('library:getGenres', () => {
    return getGenres()
  })

  ipcMain.handle('library:getBands', (_event, genre?: string) => {
    return getBands(genre)
  })

  ipcMain.handle('library:getAlbums', (_event, genre?: string, band?: string) => {
    return getAlbums(genre, band)
  })

  // --- Settings ---

  ipcMain.handle('settings:get', (_event, key: string) => {
    return getSetting(key)
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    setSetting(key, value)
  })

  // --- Cover Art ---

  ipcMain.handle('coverArt:pick', async (event) => {
    const win = require('electron').BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }],
      title: 'Select Cover Art'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('coverArt:save', (_event, sourcePath: string, songId: number) => {
    const dir = getCoverArtDir()
    const ext = path.extname(sourcePath)
    const destName = `song-${songId}${ext}`
    const destPath = path.join(dir, destName)
    fs.copyFileSync(sourcePath, destPath)
    return destPath
  })

  ipcMain.handle('coverArt:delete', (_event, coverPath: string) => {
    try {
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath)
      }
    } catch {
      // ignore
    }
  })
}
