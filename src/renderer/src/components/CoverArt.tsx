import React from 'react'

interface CoverArtProps {
  src: string | null
  size?: number
  className?: string
}

export function CoverArtDisplay({ src, size = 48, className = '' }: CoverArtProps) {
  const fileUrl = src ? `local-file://${encodeURIComponent(src.replace(/\\/g, '/'))}` : null

  return (
    <div
      className={`flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: 'var(--suno-border)',
        backgroundImage: fileUrl ? `url("${fileUrl}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {!src && (
        <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none" stroke="var(--suno-muted)" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3"/>
          <line x1="12" y1="9" x2="12" y2="2"/>
        </svg>
      )}
    </div>
  )
}

interface CoverArtEditorProps {
  src: string | null
  songId: number
  onUpdate: (path: string | null) => void
}

export function CoverArtEditor({ src, songId, onUpdate }: CoverArtEditorProps) {
  const fileUrl = src ? `local-file://${encodeURIComponent(src.replace(/\\/g, '/'))}` : null

  async function handlePick() {
    const sourcePath = await window.api.coverArt.pick()
    if (!sourcePath) return
    const savedPath = await window.api.coverArt.save(sourcePath, songId)
    onUpdate(savedPath)
  }

  async function handleRemove() {
    if (src) {
      await window.api.coverArt.delete(src)
    }
    onUpdate(null)
  }

  return (
    <div className="space-y-2">
      <div
        className="relative rounded-xl overflow-hidden flex items-center justify-center group cursor-pointer"
        style={{
          width: '100%',
          paddingTop: '100%',
          backgroundColor: 'var(--suno-surface)',
          border: '2px dashed var(--suno-border)'
        }}
        onClick={handlePick}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {fileUrl ? (
            <>
              <img
                src={fileUrl}
                alt="Cover art"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              >
                <span className="text-white text-sm font-medium">Change Cover</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center p-4" style={{ color: 'var(--suno-muted)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              <span className="text-xs">Click to add cover art</span>
            </div>
          )}
        </div>
      </div>
      {src && (
        <button
          onClick={handleRemove}
          className="w-full py-1.5 text-xs rounded-lg transition-colors"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
        >
          Remove Cover Art
        </button>
      )}
    </div>
  )
}
