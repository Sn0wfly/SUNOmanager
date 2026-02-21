import fs from 'fs'
import path from 'path'
import { upsertSong } from './db'

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.mp4', '.aac', '.opus'])

interface ScanResult {
  added: number
  skipped: number
  errors: string[]
}

/**
 * Walks the folder tree:
 *  rootFolder/
 *    GenreName/             ← Level 2 = genre
 *      AlbumName/           ← Level 3 = album
 *        song.mp3
 *      song.mp3             ← also valid (no album)
 *    song.mp3               ← also valid (no genre/album)
 */
export async function scanLibrary(rootFolder: string): Promise<ScanResult> {
  const result: ScanResult = { added: 0, skipped: 0, errors: [] }

  if (!fs.existsSync(rootFolder)) {
    result.errors.push(`Root folder does not exist: ${rootFolder}`)
    return result
  }

  walkDir(rootFolder, rootFolder, null, null, result)
  return result
}

function walkDir(
  rootFolder: string,
  currentPath: string,
  genre: string | null,
  album: string | null,
  result: ScanResult
): void {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(currentPath, { withFileTypes: true })
  } catch (e: unknown) {
    result.errors.push(`Cannot read directory: ${currentPath}`)
    return
  }

  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name)

    if (entry.isDirectory()) {
      const depth = getDepth(rootFolder, fullPath)
      let newGenre = genre
      let newAlbum = album

      if (depth === 1) {
        newGenre = entry.name
        newAlbum = null
      } else if (depth === 2 && genre !== null) {
        newAlbum = entry.name
      }

      walkDir(rootFolder, fullPath, newGenre, newAlbum, result)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (AUDIO_EXTENSIONS.has(ext)) {
        try {
          importAudioFile(fullPath, entry.name, genre, album)
          result.added++
        } catch (e: unknown) {
          result.errors.push(`Failed to import ${fullPath}: ${(e as Error).message}`)
          result.skipped++
        }
      }
    }
  }
}

function getDepth(rootFolder: string, targetPath: string): number {
  const rel = path.relative(rootFolder, targetPath)
  return rel.split(path.sep).length - 1
}

function importAudioFile(
  filePath: string,
  fileName: string,
  genre: string | null,
  album: string | null
): void {
  const ext = path.extname(fileName)
  const baseName = path.basename(fileName, ext)

  // Look for a .txt sidecar file with the same base name
  const txtPath = path.join(path.dirname(filePath), baseName + '.txt')
  let notes: string | null = null
  if (fs.existsSync(txtPath)) {
    try {
      notes = fs.readFileSync(txtPath, 'utf-8').trim() || null
    } catch {
      // ignore
    }
  }

  // Try to parse date from file stats
  const stats = fs.statSync(filePath)
  const dateCreated = stats.birthtime.toISOString().split('T')[0]

  upsertSong({
    title: cleanTitle(baseName),
    file_path: filePath,
    genre,
    album,
    lyrics: null,
    style_prompt: null,
    weirdness_pct: 0,
    style_pct: 0,
    audio_influence_pct: 0,
    notes,
    rating: 0,
    tags: '[]',
    date_created: dateCreated,
    cover_art_path: null
  })
}

function cleanTitle(name: string): string {
  // Remove leading numbers/separators like "01 - " or "01. "
  return name
    .replace(/^\d+[\s._-]+/, '')
    .replace(/_/g, ' ')
    .trim()
}
