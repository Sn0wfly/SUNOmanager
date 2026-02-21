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
 *    Genre/               ← depth 0 = genre
 *      Band/              ← depth 1 = band
 *        Album/           ← depth 2 = album
 *          song.mp3
 *        song.mp3         ← valid (no album)
 *      song.mp3           ← valid (no band/album)
 *    song.mp3             ← valid (no genre/band/album)
 */
export async function scanLibrary(rootFolder: string): Promise<ScanResult> {
  const result: ScanResult = { added: 0, skipped: 0, errors: [] }

  if (!fs.existsSync(rootFolder)) {
    result.errors.push(`Root folder does not exist: ${rootFolder}`)
    return result
  }

  walkDir(rootFolder, rootFolder, null, null, null, result)
  return result
}

function walkDir(
  rootFolder: string,
  currentPath: string,
  genre: string | null,
  band: string | null,
  album: string | null,
  result: ScanResult
): void {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(currentPath, { withFileTypes: true })
  } catch {
    result.errors.push(`Cannot read directory: ${currentPath}`)
    return
  }

  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name)

    if (entry.isDirectory()) {
      const depth = getDepth(rootFolder, fullPath)
      let newGenre = genre
      let newBand = band
      let newAlbum = album

      if (depth === 0) {
        newGenre = entry.name
        newBand = null
        newAlbum = null
      } else if (depth === 1 && genre !== null) {
        newBand = entry.name
        newAlbum = null
      } else if (depth === 2 && band !== null) {
        newAlbum = entry.name
      }

      walkDir(rootFolder, fullPath, newGenre, newBand, newAlbum, result)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (AUDIO_EXTENSIONS.has(ext)) {
        try {
          importAudioFile(fullPath, entry.name, genre, band, album)
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
  band: string | null,
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

  const stats = fs.statSync(filePath)
  const dateCreated = stats.birthtime.toISOString().split('T')[0]

  upsertSong({
    title: cleanTitle(baseName),
    file_path: filePath,
    genre,
    band,
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
  return name
    .replace(/^\d+[\s._-]+/, '')
    .replace(/_/g, ' ')
    .trim()
}
