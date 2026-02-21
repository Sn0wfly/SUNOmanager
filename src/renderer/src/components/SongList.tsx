import React, { useCallback } from 'react'
import { useLibraryStore, Song } from '../store/library'
import { usePlayer } from '../hooks/usePlayer'
import StarRating from './StarRating'
import { CoverArtDisplay } from './CoverArt'

function SongCard({ song, isSelected, isPlaying, onSelect, onPlay }: {
  song: Song
  isSelected: boolean
  isPlaying: boolean
  onSelect: (song: Song) => void
  onPlay: (song: Song) => void
}) {
  const tags = (() => {
    try { return JSON.parse(song.tags) as string[] } catch { return [] }
  })()

  return (
    <div
      onClick={() => onSelect(song)}
      onDoubleClick={() => onPlay(song)}
      className="group flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all"
      style={{
        backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
        borderLeft: isSelected ? '2px solid var(--suno-accent)' : '2px solid transparent',
        borderBottom: '1px solid var(--suno-border)'
      }}
    >
      {/* Cover art */}
      <div className="relative flex-shrink-0">
        <CoverArtDisplay src={song.cover_art_path} size={44} />
        {isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: 'rgba(124, 58, 237, 0.8)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: isPlaying ? '#a78bfa' : 'var(--suno-text)' }}
            >
              {song.title}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--suno-muted)' }}>
              {[song.genre, song.album].filter(Boolean).join(' / ')}
            </p>
          </div>
          <StarRating value={song.rating} readonly size={12} />
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa' }}
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs" style={{ color: 'var(--suno-border)' }}>+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Play button (shows on hover) */}
      <button
        onClick={e => { e.stopPropagation(); onPlay(song) }}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: 'var(--suno-accent)' }}
        title="Play"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
      </button>
    </div>
  )
}

export default function SongList() {
  const { songs, selectedSong, setSelectedSong, isLoading } = useLibraryStore()
  const { playSongFromQueue, currentSong, isPlaying } = usePlayer()

  const handleSelect = useCallback((song: Song) => {
    setSelectedSong(song)
  }, [setSelectedSong])

  const handlePlay = useCallback((song: Song) => {
    const index = songs.findIndex(s => s.id === song.id)
    playSongFromQueue(songs, index >= 0 ? index : 0)
  }, [songs, playSongFromQueue])

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center flex-1"
        style={{ color: 'var(--suno-muted)', borderRight: '1px solid var(--suno-border)' }}
      >
        <svg className="animate-spin w-6 h-6 mb-2" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Loading songs...
      </div>
    )
  }

  if (songs.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center flex-1 p-6 text-center"
        style={{ color: 'var(--suno-muted)', borderRight: '1px solid var(--suno-border)' }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 opacity-40">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <p className="text-sm font-medium">No songs found</p>
        <p className="text-xs mt-1 opacity-70">Try rescanning your library or adjusting filters</p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col w-72 flex-shrink-0 overflow-hidden"
      style={{ borderRight: '1px solid var(--suno-border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--suno-border)', backgroundColor: 'var(--suno-surface)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--suno-text)' }}>
          Songs
        </span>
        <span className="text-xs" style={{ color: 'var(--suno-muted)' }}>
          {songs.length} tracks
        </span>
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto">
        {songs.map(song => (
          <SongCard
            key={song.id}
            song={song}
            isSelected={selectedSong?.id === song.id}
            isPlaying={currentSong?.id === song.id && isPlaying}
            onSelect={handleSelect}
            onPlay={handlePlay}
          />
        ))}
      </div>
    </div>
  )
}
