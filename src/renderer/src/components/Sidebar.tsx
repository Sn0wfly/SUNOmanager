import React, { useState } from 'react'
import { useLibraryStore } from '../store/library'

interface SidebarProps {
  onRescan: () => void
  onChangeFolder: () => void
  scanStatus: string | null
}

export default function Sidebar({ onRescan, onChangeFolder, scanStatus }: SidebarProps) {
  const {
    genres,
    bands,
    albums,
    searchQuery,
    activeGenre,
    activeBand,
    activeAlbum,
    setSearchQuery,
    setActiveGenre,
    setActiveBand,
    setActiveAlbum,
    loadBands,
    loadAlbums,
    loadSongs,
    searchSongs
  } = useLibraryStore()

  const [expandedGenres, setExpandedGenres] = useState<Set<string>>(new Set())
  const [expandedBands, setExpandedBands] = useState<Set<string>>(new Set())
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [showFolderInfo, setShowFolderInfo] = useState(false)

  function toggleGenre(genre: string) {
    setExpandedGenres(prev => {
      const next = new Set(prev)
      next.has(genre) ? next.delete(genre) : next.add(genre)
      return next
    })
  }

  function toggleBand(genre: string, band: string) {
    const key = `${genre}::${band}`
    setExpandedBands(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function handleGenreClick(genre: string) {
    setActiveGenre(genre)
    setActiveBand(null)
    setActiveAlbum(null)
    setSearchQuery('')
    await loadBands(genre)
    await loadAlbums(genre)
    await loadSongs(genre)
    toggleGenre(genre)
  }

  async function handleBandClick(genre: string, band: string) {
    setActiveBand(band)
    setActiveAlbum(null)
    setSearchQuery('')
    await loadAlbums(genre, band)
    await loadSongs(genre, band)
    toggleBand(genre, band)
  }

  async function handleAlbumClick(genre: string, band: string | null, album: string) {
    setActiveAlbum(album)
    setSearchQuery('')
    await loadSongs(genre, band ?? undefined, album)
  }

  async function handleAllClick() {
    setActiveGenre(null)
    setActiveBand(null)
    setActiveAlbum(null)
    setSearchQuery('')
    await loadSongs()
  }

  function handleSearch(query: string) {
    setSearchQuery(query)
    if (searchTimer) clearTimeout(searchTimer)
    const timer = setTimeout(() => searchSongs(query), 300)
    setSearchTimer(timer)
  }

  const genreBands = (genre: string) => bands.filter(b => b.genre === genre)
  const bandAlbums = (genre: string, band: string) =>
    albums.filter(a => a.genre === genre && a.band === band)
  // Albums directly under a genre (no band set)
  const genreDirectAlbums = (genre: string) =>
    albums.filter(a => a.genre === genre && !a.band)

  const isAllActive = !activeGenre && !activeBand && !activeAlbum && !searchQuery

  return (
    <div
      className="flex flex-col w-56 flex-shrink-0 overflow-hidden"
      style={{
        backgroundColor: 'var(--suno-surface)',
        borderRight: '1px solid var(--suno-border)'
      }}
    >
      {/* App title */}
      <div className="p-4 pb-3" style={{ borderBottom: '1px solid var(--suno-border)' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--suno-accent)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <span className="font-bold text-sm tracking-wide" style={{ color: 'var(--suno-text)' }}>
            SUNO Manager
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="p-3" style={{ borderBottom: '1px solid var(--suno-border)' }}>
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="var(--suno-muted)" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search songs..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            style={{ paddingLeft: '28px', fontSize: '12px' }}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* All songs */}
        <button
          onClick={handleAllClick}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors"
          style={{
            backgroundColor: isAllActive ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
            color: isAllActive ? '#a78bfa' : 'var(--suno-muted)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          All Songs
        </button>

        {/* Genres */}
        {genres.length > 0 && (
          <div className="mt-3">
            <div className="px-3 mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--suno-muted)', letterSpacing: '0.08em' }}>
                Genres
              </p>
              <button
                onClick={() => setShowFolderInfo(true)}
                title="How to organize your folder structure"
                style={{ color: 'var(--suno-muted)', background: 'none', padding: 0, lineHeight: 1 }}
                className="transition-colors hover:text-purple-400"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </button>
            </div>

            {genres.map(({ genre, count }) => {
              const isGenreActive = activeGenre === genre
              const isGenreExpanded = expandedGenres.has(genre)
              const genreBandList = genreBands(genre)
              const directAlbums = genreDirectAlbums(genre)

              return (
                <div key={genre}>
                  {/* Genre row */}
                  <button
                    onClick={() => handleGenreClick(genre)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm text-left transition-colors"
                    style={{
                      backgroundColor: isGenreActive && !activeBand && !activeAlbum ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                      color: isGenreActive ? '#a78bfa' : 'var(--suno-muted)'
                    }}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <svg
                        width="12" height="12" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2"
                        style={{
                          transition: 'transform 0.15s',
                          transform: isGenreExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          flexShrink: 0
                        }}
                      >
                        <polyline points="9,18 15,12 9,6"/>
                      </svg>
                      <span className="truncate">{genre}</span>
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--suno-border)' }}>{count}</span>
                  </button>

                  {/* Bands under this genre */}
                  {isGenreExpanded && (
                    <div className="ml-3 mt-0.5 space-y-0.5">
                      {/* Bands */}
                      {genreBandList.map(({ band, count: bCount }) => {
                        const bandKey = `${genre}::${band}`
                        const isBandActive = isGenreActive && activeBand === band
                        const isBandExpanded = expandedBands.has(bandKey)
                        const albumList = bandAlbums(genre, band)

                        return (
                          <div key={band}>
                            {/* Band row */}
                            <button
                              onClick={() => handleBandClick(genre, band)}
                              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm text-left transition-colors"
                              style={{
                                backgroundColor: isBandActive && !activeAlbum ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                                color: isBandActive ? '#a78bfa' : 'var(--suno-muted)'
                              }}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <svg
                                  width="10" height="10" viewBox="0 0 24 24"
                                  fill="none" stroke="currentColor" strokeWidth="2"
                                  style={{
                                    transition: 'transform 0.15s',
                                    transform: isBandExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    flexShrink: 0
                                  }}
                                >
                                  <polyline points="9,18 15,12 9,6"/>
                                </svg>
                                <span className="truncate text-xs">{band}</span>
                              </span>
                              <span className="text-xs flex-shrink-0" style={{ color: 'var(--suno-border)' }}>{bCount}</span>
                            </button>

                            {/* Albums under this band */}
                            {isBandExpanded && albumList.length > 0 && (
                              <div className="ml-4 mt-0.5 space-y-0.5">
                                {albumList.map(({ album, count: aCount }) => (
                                  <button
                                    key={album}
                                    onClick={() => handleAlbumClick(genre, band, album)}
                                    className="w-full flex items-center justify-between px-3 py-1 rounded-lg text-left transition-colors"
                                    style={{
                                      backgroundColor: activeAlbum === album && activeBand === band ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                                      color: activeAlbum === album && activeBand === band ? '#a78bfa' : 'var(--suno-muted)'
                                    }}
                                  >
                                    <span className="truncate text-xs">{album}</span>
                                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--suno-border)' }}>{aCount}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Albums directly under genre (no band) */}
                      {directAlbums.map(({ album, count: aCount }) => (
                        <button
                          key={album}
                          onClick={() => handleAlbumClick(genre, null, album)}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors"
                          style={{
                            backgroundColor: activeAlbum === album && !activeBand ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                            color: activeAlbum === album && !activeBand ? '#a78bfa' : 'var(--suno-muted)'
                          }}
                        >
                          <span className="truncate text-xs">{album}</span>
                          <span className="text-xs flex-shrink-0" style={{ color: 'var(--suno-border)' }}>{aCount}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Folder structure info modal */}
      {showFolderInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowFolderInfo(false)}
        >
          <div
            className="rounded-xl p-5 shadow-2xl"
            style={{
              backgroundColor: 'var(--suno-card)',
              border: '1px solid var(--suno-border)',
              width: 340,
              maxWidth: '90vw'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--suno-accent)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="text-sm font-semibold" style={{ color: 'var(--suno-text)' }}>
                  Folder Structure
                </span>
              </div>
              <button
                onClick={() => setShowFolderInfo(false)}
                style={{ color: 'var(--suno-muted)', background: 'none', padding: 0, lineHeight: 1 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Description */}
            <p className="text-xs mb-3" style={{ color: 'var(--suno-muted)', lineHeight: 1.6 }}>
              Organize your music folder with 4 levels so SUNO Manager can detect genre, band and album automatically:
            </p>

            {/* Folder tree */}
            <div
              className="rounded-lg p-3 mb-3 text-xs font-mono"
              style={{ backgroundColor: 'var(--suno-surface)', border: '1px solid var(--suno-border)', color: '#a78bfa', lineHeight: 2 }}
            >
              <div style={{ color: 'var(--suno-text)' }}>📁 SunoFolder/</div>
              <div style={{ color: '#34d399' }}>  📁 Genre/</div>
              <div style={{ color: '#60a5fa' }}>    📁 Band/</div>
              <div style={{ color: 'var(--suno-muted)' }}>      📁 Album/</div>
              <div style={{ color: 'var(--suno-muted)' }}>        🎵 song.mp3</div>
            </div>

            {/* Example */}
            <p className="text-xs mb-2 font-medium" style={{ color: 'var(--suno-muted)' }}>Example:</p>
            <div
              className="rounded-lg p-3 text-xs font-mono"
              style={{ backgroundColor: 'var(--suno-surface)', border: '1px solid var(--suno-border)', lineHeight: 2 }}
            >
              <div style={{ color: 'var(--suno-text)' }}>📁 Suno/</div>
              <div style={{ color: '#34d399' }}>  📁 Lofi/</div>
              <div style={{ color: '#60a5fa' }}>    📁 Linkin Park/</div>
              <div style={{ color: 'var(--suno-muted)' }}>      📁 Meteora Covers/</div>
              <div style={{ color: 'var(--suno-muted)' }}>        🎵 Numb.mp3</div>
              <div style={{ color: '#34d399' }}>  📁 Mathcore/</div>
              <div style={{ color: '#60a5fa' }}>    📁 Linkin Park/</div>
              <div style={{ color: 'var(--suno-muted)' }}>      📁 Hybrid Theory/</div>
              <div style={{ color: 'var(--suno-muted)' }}>        🎵 Crawling.mp3</div>
            </div>

            <p className="text-xs mt-3" style={{ color: 'var(--suno-muted)', lineHeight: 1.6 }}>
              The same band can appear under multiple genres. After reorganizing, hit <span style={{ color: '#a78bfa' }}>Rescan Folder</span>.
            </p>
          </div>
        </div>
      )}

      {/* Bottom buttons */}
      <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--suno-border)' }}>
        {scanStatus && (
          <p className="text-xs text-center truncate" style={{ color: 'var(--suno-accent)' }}>
            {scanStatus}
          </p>
        )}
        <button
          onClick={onRescan}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            color: '#a78bfa',
            border: '1px solid rgba(124, 58, 237, 0.2)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23,4 23,10 17,10"/>
            <polyline points="1,20 1,14 7,14"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Rescan Folder
        </button>
        <button
          onClick={onChangeFolder}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--suno-muted)',
            border: '1px solid var(--suno-border)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
          Change Folder
        </button>
      </div>
    </div>
  )
}
