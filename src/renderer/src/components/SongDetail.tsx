import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useLibraryStore, Song } from '../store/library'
import StarRating from './StarRating'
import TagInput from './TagInput'
import SliderField from './SliderField'
import { CoverArtEditor } from './CoverArt'

interface EditState {
  title: string
  lyrics: string
  style_prompt: string
  weirdness_pct: number
  style_pct: number
  audio_influence_pct: number
  notes: string
  rating: number
  tags: string[]
  date_created: string
  cover_art_path: string | null
  genre: string
  album: string
}

function parseTags(tags: string): string[] {
  try {
    const parsed = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function toEditState(song: Song): EditState {
  return {
    title: song.title ?? '',
    lyrics: song.lyrics ?? '',
    style_prompt: song.style_prompt ?? '',
    weirdness_pct: song.weirdness_pct ?? 0,
    style_pct: song.style_pct ?? 0,
    audio_influence_pct: song.audio_influence_pct ?? 0,
    notes: song.notes ?? '',
    rating: song.rating ?? 0,
    tags: parseTags(song.tags),
    date_created: song.date_created ?? '',
    cover_art_path: song.cover_art_path ?? null,
    genre: song.genre ?? '',
    album: song.album ?? ''
  }
}

export default function SongDetail() {
  const { selectedSong, updateSongInList } = useLibraryStore()
  const [edit, setEdit] = useState<EditState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset edit state when selected song changes
  useEffect(() => {
    if (selectedSong) {
      setEdit(toEditState(selectedSong))
    } else {
      setEdit(null)
    }
  }, [selectedSong?.id])

  const save = useCallback(async (updates: Partial<EditState>, songId: number) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    setIsSaving(true)
    const dbUpdates: Record<string, unknown> = { ...updates }
    if ('tags' in updates) {
      dbUpdates.tags = JSON.stringify(updates.tags)
    }
    const updated = await window.api.songs.update(songId, dbUpdates as Parameters<typeof window.api.songs.update>[1])
    updateSongInList(updated as Song)
    setIsSaving(false)
    setSavedAt(new Date())
  }, [updateSongInList])

  const scheduleAutosave = useCallback((field: Partial<EditState>) => {
    if (!selectedSong) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      save(field, selectedSong.id)
    }, 800)
  }, [selectedSong, save])

  function updateField<K extends keyof EditState>(key: K, value: EditState[K]) {
    setEdit(prev => prev ? { ...prev, [key]: value } : null)
    scheduleAutosave({ [key]: value } as Partial<EditState>)
  }

  async function handleBlurSave(key: keyof EditState) {
    if (!edit || !selectedSong) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    await save({ [key]: edit[key] } as Partial<EditState>, selectedSong.id)
  }

  async function handleCoverArtUpdate(path: string | null) {
    if (!selectedSong) return
    updateField('cover_art_path', path)
    await save({ cover_art_path: path }, selectedSong.id)
  }

  if (!selectedSong || !edit) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center" style={{ color: 'var(--suno-muted)' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 opacity-30">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <p className="text-sm">Select a song to edit details</p>
        <p className="text-xs mt-1 opacity-60">Double-click a song to play it</p>
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ backgroundColor: 'var(--suno-bg)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-3"
        style={{
          backgroundColor: 'var(--suno-surface)',
          borderBottom: '1px solid var(--suno-border)'
        }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--suno-text)' }}>Song Details</span>
        <span className="text-xs" style={{ color: isSaving ? '#a78bfa' : 'var(--suno-muted)' }}>
          {isSaving ? '● Saving...' : savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : ''}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Cover art + title row */}
        <div className="flex gap-4">
          <div style={{ width: 120, flexShrink: 0 }}>
            <CoverArtEditor
              src={edit.cover_art_path}
              songId={selectedSong.id}
              onUpdate={handleCoverArtUpdate}
            />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--suno-muted)' }}>Title</label>
              <input
                type="text"
                value={edit.title}
                onChange={e => updateField('title', e.target.value)}
                onBlur={() => handleBlurSave('title')}
                className="font-semibold"
                placeholder="Song title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--suno-muted)' }}>Rating</label>
              <StarRating value={edit.rating} onChange={v => { updateField('rating', v); save({ rating: v }, selectedSong.id) }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--suno-muted)' }}>Genre</label>
                <input
                  type="text"
                  value={edit.genre}
                  onChange={e => updateField('genre', e.target.value)}
                  onBlur={() => handleBlurSave('genre')}
                  placeholder="Genre"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--suno-muted)' }}>Album</label>
                <input
                  type="text"
                  value={edit.album}
                  onChange={e => updateField('album', e.target.value)}
                  onBlur={() => handleBlurSave('album')}
                  placeholder="Album"
                />
              </div>
            </div>
          </div>
        </div>

        {/* File path (read-only) */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--suno-muted)' }}>File</label>
          <p className="text-xs truncate px-2 py-1.5 rounded" style={{ backgroundColor: 'var(--suno-surface)', color: 'var(--suno-muted)', border: '1px solid var(--suno-border)' }}>
            {selectedSong.file_path}
          </p>
        </div>

        {/* Date created */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--suno-muted)' }}>Date Created</label>
          <input
            type="date"
            value={edit.date_created}
            onChange={e => updateField('date_created', e.target.value)}
            onBlur={() => handleBlurSave('date_created')}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--suno-muted)' }}>Tags</label>
          <TagInput
            tags={edit.tags}
            onChange={tags => { updateField('tags', tags); save({ tags }, selectedSong.id) }}
          />
        </div>

        {/* SUNO Parameters */}
        <div className="space-y-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--suno-card)', border: '1px solid var(--suno-border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--suno-muted)' }}>SUNO Parameters</p>
          <SliderField
            label="Weirdness"
            value={edit.weirdness_pct}
            onChange={v => updateField('weirdness_pct', v)}
          />
          <SliderField
            label="Style Strength"
            value={edit.style_pct}
            onChange={v => updateField('style_pct', v)}
          />
          <SliderField
            label="Audio Influence"
            value={edit.audio_influence_pct}
            onChange={v => updateField('audio_influence_pct', v)}
          />
        </div>

        {/* Style Prompt */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--suno-muted)' }}>Style Prompt</label>
          <textarea
            value={edit.style_prompt}
            onChange={e => updateField('style_prompt', e.target.value)}
            onBlur={() => handleBlurSave('style_prompt')}
            rows={3}
            placeholder="e.g. upbeat indie pop, female vocals, dreamy synth..."
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Lyrics */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--suno-muted)' }}>Lyrics</label>
          <textarea
            value={edit.lyrics}
            onChange={e => updateField('lyrics', e.target.value)}
            onBlur={() => handleBlurSave('lyrics')}
            rows={10}
            placeholder="Paste lyrics here..."
            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--suno-muted)' }}>Notes</label>
          <textarea
            value={edit.notes}
            onChange={e => updateField('notes', e.target.value)}
            onBlur={() => handleBlurSave('notes')}
            rows={4}
            placeholder="Private notes, generation details, etc..."
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Timestamps */}
        <div className="text-xs pt-2 pb-1" style={{ color: 'var(--suno-border)' }}>
          <p>Added: {new Date(selectedSong.created_at).toLocaleString()}</p>
          <p>Updated: {new Date(selectedSong.updated_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
