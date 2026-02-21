import React, { useCallback, useState } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import { CoverArtDisplay } from './CoverArt'

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    setVolume,
    playNext,
    playPrev
  } = usePlayer()

  const [isDragging, setIsDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)

  const handleSeekMouseDown = useCallback(() => {
    setIsDragging(true)
    setDragTime(currentTime)
  }, [currentTime])

  const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDragTime(Number(e.target.value))
  }, [])

  const handleSeekMouseUp = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    const value = Number((e.target as HTMLInputElement).value)
    setIsDragging(false)
    seek(value)
  }, [seek])

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value) / 100)
  }, [setVolume])

  const displayTime = isDragging ? dragTime : currentTime
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0

  return (
    <div
      className="flex-shrink-0 flex items-center gap-4 px-4"
      style={{
        height: '72px',
        backgroundColor: 'var(--suno-surface)',
        borderTop: '1px solid var(--suno-border)'
      }}
    >
      {/* Song info */}
      <div className="flex items-center gap-3 w-64 flex-shrink-0">
        <CoverArtDisplay src={currentSong?.cover_art_path ?? null} size={44} />
        <div className="min-w-0">
          {currentSong ? (
            <>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--suno-text)' }}>
                {currentSong.title}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--suno-muted)' }}>
                {[currentSong.genre, currentSong.album].filter(Boolean).join(' / ') || 'Unknown'}
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--suno-muted)' }}>No song playing</p>
          )}
        </div>
      </div>

      {/* Controls + progress */}
      <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
        {/* Transport buttons */}
        <div className="flex items-center gap-3">
          {/* Prev */}
          <button
            onClick={playPrev}
            disabled={!currentSong}
            className="transition-colors"
            style={{ color: currentSong ? 'var(--suno-muted)' : 'var(--suno-border)', background: 'none' }}
            title="Previous"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19,20 9,12 19,4"/>
              <line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={!currentSong}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{
              backgroundColor: currentSong ? 'var(--suno-accent)' : 'var(--suno-border)',
              color: 'white'
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={playNext}
            disabled={!currentSong}
            className="transition-colors"
            style={{ color: currentSong ? 'var(--suno-muted)' : 'var(--suno-border)', background: 'none' }}
            title="Next"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,4 15,12 5,20"/>
              <line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full flex items-center gap-2 max-w-xl">
          <span className="text-xs tabular-nums flex-shrink-0" style={{ color: 'var(--suno-muted)', minWidth: '34px', textAlign: 'right' }}>
            {formatTime(displayTime)}
          </span>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 100}
              value={displayTime}
              onMouseDown={handleSeekMouseDown}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
              className="w-full"
              disabled={!currentSong}
              style={{ '--track-fill': `${progress}%` } as React.CSSProperties}
            />
          </div>
          <span className="text-xs tabular-nums flex-shrink-0" style={{ color: 'var(--suno-muted)', minWidth: '34px' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 w-32 flex-shrink-0">
        <button
          onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
          style={{ color: 'var(--suno-muted)', background: 'none' }}
          title="Mute/Unmute"
        >
          {volume === 0 ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : volume < 0.5 ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
              <path d="M15.54 8.46a5 5 0 010 7.07"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
              <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
            </svg>
          )}
        </button>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={handleVolume}
            className="w-full"
            style={{ '--track-fill': `${Math.round(volume * 100)}%` } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  )
}
