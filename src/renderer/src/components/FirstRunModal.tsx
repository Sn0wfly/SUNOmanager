import React, { useState } from 'react'

interface FirstRunModalProps {
  onFolderSelected: (folder: string) => void
}

export default function FirstRunModal({ onFolderSelected }: FirstRunModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handlePickFolder() {
    setIsLoading(true)
    try {
      const folder = await window.api.library.pickFolder()
      if (folder) {
        await window.api.library.setRoot(folder)
        onFolderSelected(folder)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="rounded-xl p-10 max-w-md w-full mx-4 text-center" style={{ backgroundColor: 'var(--suno-card)', border: '1px solid var(--suno-border)' }}>
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--suno-accent)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--suno-text)' }}>
            Welcome to SUNO Manager
          </h1>
          <p className="text-sm" style={{ color: 'var(--suno-muted)' }}>
            Select the root folder where your SUNO music files are stored.
            The app will scan all subfolders for audio files.
          </p>
        </div>

        <div className="mb-6 p-4 rounded-lg text-left text-xs" style={{ backgroundColor: 'var(--suno-surface)', color: 'var(--suno-muted)' }}>
          <p className="font-semibold mb-1" style={{ color: 'var(--suno-text)' }}>Expected folder structure:</p>
          <pre className="leading-relaxed">
{`📁 Music/
  📁 Genre/
    📁 Album/
      🎵 song.mp3
      📄 song.txt  ← imported as notes`}
          </pre>
        </div>

        <button
          onClick={handlePickFolder}
          disabled={isLoading}
          className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all"
          style={{
            backgroundColor: isLoading ? 'var(--suno-border)' : 'var(--suno-accent)',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Selecting...
            </span>
          ) : (
            '📂 Select Music Folder'
          )}
        </button>
      </div>
    </div>
  )
}
