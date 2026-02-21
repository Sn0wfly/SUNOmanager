import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export interface Song {
  id: number
  title: string
  file_path: string
  genre: string | null
  album: string | null
  lyrics: string | null
  style_prompt: string | null
  weirdness_pct: number
  style_pct: number
  audio_influence_pct: number
  notes: string | null
  rating: number
  tags: string  // JSON array string
  date_created: string | null
  cover_art_path: string | null
  created_at: string
  updated_at: string
}

export interface SongUpdate {
  title?: string
  lyrics?: string
  style_prompt?: string
  weirdness_pct?: number
  style_pct?: number
  audio_influence_pct?: number
  notes?: string
  rating?: number
  tags?: string
  date_created?: string
  cover_art_path?: string
  genre?: string
  album?: string
}

let db: Database.Database

function getDbPath(): string {
  // Portable mode: store DB next to the executable
  if (app.isPackaged) {
    const exeDir = path.dirname(app.getPath('exe'))
    return path.join(exeDir, 'suno-manager.db')
  }
  return path.join(app.getPath('userData'), 'suno-manager.db')
}

export function initDb(): void {
  const dbPath = getDbPath()
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  createTables()
}

function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL UNIQUE,
      genre TEXT,
      album TEXT,
      lyrics TEXT,
      style_prompt TEXT,
      weirdness_pct INTEGER DEFAULT 0,
      style_pct INTEGER DEFAULT 0,
      audio_influence_pct INTEGER DEFAULT 0,
      notes TEXT,
      rating INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      date_created TEXT,
      cover_art_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

// --- Settings ---

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

// --- Songs ---

export function getAllSongs(genre?: string, album?: string): Song[] {
  let query = 'SELECT * FROM songs'
  const params: string[] = []
  const conditions: string[] = []

  if (genre) {
    conditions.push('genre = ?')
    params.push(genre)
  }
  if (album) {
    conditions.push('album = ?')
    params.push(album)
  }
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }
  query += ' ORDER BY genre, album, title'
  return db.prepare(query).all(...params) as Song[]
}

export function getSongById(id: number): Song | undefined {
  return db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as Song | undefined
}

export function searchSongs(query: string): Song[] {
  const q = `%${query}%`
  return db.prepare(`
    SELECT * FROM songs
    WHERE title LIKE ?
       OR lyrics LIKE ?
       OR style_prompt LIKE ?
       OR notes LIKE ?
       OR tags LIKE ?
       OR genre LIKE ?
       OR album LIKE ?
    ORDER BY title
  `).all(q, q, q, q, q, q, q) as Song[]
}

export function upsertSong(song: Omit<Song, 'id' | 'created_at' | 'updated_at'>): number {
  const stmt = db.prepare(`
    INSERT INTO songs (title, file_path, genre, album, lyrics, style_prompt,
      weirdness_pct, style_pct, audio_influence_pct, notes, rating, tags, date_created, cover_art_path)
    VALUES (@title, @file_path, @genre, @album, @lyrics, @style_prompt,
      @weirdness_pct, @style_pct, @audio_influence_pct, @notes, @rating, @tags, @date_created, @cover_art_path)
    ON CONFLICT(file_path) DO UPDATE SET
      title = excluded.title,
      genre = excluded.genre,
      album = excluded.album,
      updated_at = CURRENT_TIMESTAMP
  `)
  const result = stmt.run(song)
  return Number(result.lastInsertRowid)
}

export function updateSong(id: number, updates: SongUpdate): void {
  const fields = Object.keys(updates)
  if (fields.length === 0) return

  const setClause = fields.map(f => `${f} = @${f}`).join(', ')
  const stmt = db.prepare(`
    UPDATE songs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = @id
  `)
  stmt.run({ ...updates, id })
}

export function deleteSong(id: number): void {
  db.prepare('DELETE FROM songs WHERE id = ?').run(id)
}

export function getGenres(): { genre: string; count: number }[] {
  return db.prepare(`
    SELECT genre, COUNT(*) as count FROM songs
    WHERE genre IS NOT NULL
    GROUP BY genre ORDER BY genre
  `).all() as { genre: string; count: number }[]
}

export function getAlbums(genre?: string): { genre: string; album: string; count: number }[] {
  if (genre) {
    return db.prepare(`
      SELECT genre, album, COUNT(*) as count FROM songs
      WHERE genre = ? AND album IS NOT NULL
      GROUP BY album ORDER BY album
    `).all(genre) as { genre: string; album: string; count: number }[]
  }
  return db.prepare(`
    SELECT genre, album, COUNT(*) as count FROM songs
    WHERE album IS NOT NULL
    GROUP BY genre, album ORDER BY genre, album
  `).all() as { genre: string; album: string; count: number }[]
}

export function getCoverArtDir(): string {
  let dir: string
  if (app.isPackaged) {
    dir = path.join(path.dirname(app.getPath('exe')), 'cover-art')
  } else {
    dir = path.join(app.getPath('userData'), 'cover-art')
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}
