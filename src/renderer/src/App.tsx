import React, { useEffect, useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import SongList from './components/SongList'
import SongDetail from './components/SongDetail'
import AudioPlayer from './components/AudioPlayer'
import FirstRunModal from './components/FirstRunModal'
import { useLibraryStore } from './store/library'

export default function App() {
  const [rootFolder, setRootFolder] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showFirstRun, setShowFirstRun] = useState(false)
  const [scanStatus, setScanStatus] = useState<string | null>(null)

  const { loadSongs, loadGenres, loadAlbums, activeGenre, activeAlbum } = useLibraryStore()

  const initialize = useCallback(async () => {
    const root = await window.api.library.getRoot()
    setRootFolder(root)
    if (!root) {
      setShowFirstRun(true)
    } else {
      await loadGenres()
      await loadAlbums()
      await loadSongs()
    }
    setIsInitialized(true)
  }, [loadGenres, loadAlbums, loadSongs])

  useEffect(() => {
    initialize()
  }, [initialize])

  async function handleFolderSelected(folder: string) {
    setRootFolder(folder)
    setShowFirstRun(false)
    setScanStatus('Scanning library...')
    const result = await window.api.library.scan(folder)
    setScanStatus(`Found ${result.added} songs${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''}`)
    await loadGenres()
    await loadAlbums()
    await loadSongs()
    setTimeout(() => setScanStatus(null), 4000)
  }

  async function handleRescan() {
    if (!rootFolder) return
    setScanStatus('Scanning...')
    const result = await window.api.library.scan(rootFolder)
    await loadGenres()
    await loadAlbums()
    await loadSongs(activeGenre ?? undefined, activeAlbum ?? undefined)
    setScanStatus(`Scanned: ${result.added} songs`)
    setTimeout(() => setScanStatus(null), 3000)
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--suno-bg)' }}>
        <div className="text-center" style={{ color: 'var(--suno-muted)' }}>
          <svg className="animate-spin w-8 h-8 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Loading SUNO Manager...
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--suno-bg)', color: 'var(--suno-text)' }}
    >
      {/* Main 3-panel area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onRescan={handleRescan} scanStatus={scanStatus} />
        <SongList />
        <SongDetail />
      </div>

      {/* Bottom player bar */}
      <AudioPlayer />

      {/* First-run modal */}
      {showFirstRun && (
        <FirstRunModal onFolderSelected={handleFolderSelected} />
      )}
    </div>
  )
}
