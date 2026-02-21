import React, { useState, useEffect, useCallback } from 'react'
import { useLibraryStore } from '../store/library'

interface SidebarProps {
  onRescan: () => void
  scanStatus: string | null
}

export default function Sidebar({ onRescan, scanStatus }: SidebarProps) {
  const {
    genres,
    albums,
    searchQuery,
    activeGenre,
    activeAlbum,
    setSearchQuery,
    setActiveGenre,
    setActiveAlbum,
    loadAlbums,
    loadSongs,
    searchSongs
  } = useLibraryStore()

  const [expandedGenres, setExpandedGenres] = useState<Set<string>>(new Set())
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  function toggleGenre(genre: string) {
    setExpandedGenres(prev => {
      const next = new Set(prev)
      if (next.has(genre)) {
        next.delete(genre)
      } else {
        next.add(genre)
      }
      return next
    })
  }

  async function handleGenreClick(genre: string) {
    setActiveGenre(genre)
    setActiveAlbum(null)
    setSearchQuery('')
    await loadAlbums(genre)
    await loadSongs(genre)
    toggleGenre(genre)
  }

  async function handleAlbumClick(album: string) {
    setActiveAlbum(album)
    setSearchQuery('')
    await loadSongs(activeGenre ?? undefined, album)
  }

  async function handleAllClick() {
    setActiveGenre(null)
    setActiveAlbum(null)
    setSearchQuery('')
    await loadSongs()
  }

  function handleSearch(query: string) {
    setSearchQuery(query)
    if (searchTimer) clearTimeout(searchTimer)
    const timer = setTimeout(() => {
      searchSongs(query)
    }, 300)
    setSearchTimer(timer)
  }

  // Get albums for a genre
  const genreAlbums = (genre: string) =>
    albums.filter(a => a.genre === genre)

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
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--suno-muted)"
            strokeWidth="2"
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
            backgroundColor: !activeGenre && !activeAlbum && !searchQuery ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
            color: !activeGenre && !activeAlbum && !searchQuery ? '#a78bfa' : 'var(--suno-muted)'
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
            <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--suno-border)', letterSpacing: '0.08em' }}>
              Genres
            </p>
            {genres.map(({ genre, count }) => (
              <div key={genre}>
                <button
                  onClick={() => handleGenreClick(genre)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm text-left transition-colors"
                  style={{
                    backgroundColor: activeGenre === genre ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                    color: activeGenre === genre ? '#a78bfa' : 'var(--suno-muted)'
                  }}
                >
                  <span className="flex items-center gap-2 truncate">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        transition: 'transform 0.15s',
                        transform: expandedGenres.has(genre) ? 'rotate(90deg)' : 'rotate(0deg)',
                        flexShrink: 0
                      }}
                    >
                      <polyline points="9,18 15,12 9,6"/>
                    </svg>
                    <span className="truncate">{genre}</span>
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--suno-border)' }}>{count}</span>
                </button>

                {/* Albums under this genre */}
                {expandedGenres.has(genre) && genreAlbums(genre).length > 0 && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {genreAlbums(genre).map(({ album, count: aCount }) => (
                      <button
                        key={album}
                        onClick={() => handleAlbumClick(album)}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm text-left transition-colors"
                        style={{
                          backgroundColor: activeAlbum === album ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                          color: activeAlbum === album ? '#a78bfa' : 'var(--suno-muted)'
                        }}
                      >
                        <span className="truncate text-xs">{album}</span>
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--suno-border)' }}>{aCount}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rescan button */}
      <div className="p-3" style={{ borderTop: '1px solid var(--suno-border)' }}>
        {scanStatus && (
          <p className="text-xs mb-2 text-center truncate" style={{ color: 'var(--suno-accent)' }}>
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
      </div>
    </div>
  )
}
