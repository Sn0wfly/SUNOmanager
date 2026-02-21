import { create } from 'zustand'

export interface Song {
  id: number
  title: string
  file_path: string
  genre: string | null
  band: string | null
  album: string | null
  lyrics: string | null
  style_prompt: string | null
  weirdness_pct: number
  style_pct: number
  audio_influence_pct: number
  notes: string | null
  rating: number
  tags: string
  date_created: string | null
  cover_art_path: string | null
  created_at: string
  updated_at: string
}

export interface GenreInfo {
  genre: string
  count: number
}

export interface BandInfo {
  genre: string
  band: string
  count: number
}

export interface AlbumInfo {
  genre: string
  band: string | null
  album: string
  count: number
}

interface PlayerState {
  currentSong: Song | null
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  queue: Song[]
  queueIndex: number
}

interface LibraryStore {
  // Songs
  songs: Song[]
  selectedSong: Song | null
  genres: GenreInfo[]
  bands: BandInfo[]
  albums: AlbumInfo[]
  searchQuery: string
  activeGenre: string | null
  activeBand: string | null
  activeAlbum: string | null
  isLoading: boolean

  // Player
  player: PlayerState

  // Actions
  setSongs: (songs: Song[]) => void
  setSelectedSong: (song: Song | null) => void
  updateSongInList: (song: Song) => void
  setGenres: (genres: GenreInfo[]) => void
  setBands: (bands: BandInfo[]) => void
  setAlbums: (albums: AlbumInfo[]) => void
  setSearchQuery: (query: string) => void
  setActiveGenre: (genre: string | null) => void
  setActiveBand: (band: string | null) => void
  setActiveAlbum: (album: string | null) => void
  setIsLoading: (loading: boolean) => void

  // Player actions
  setCurrentSong: (song: Song | null) => void
  setIsPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setQueue: (songs: Song[], index: number) => void
  playNext: () => Song | null
  playPrev: () => Song | null

  // Library actions
  loadSongs: (genre?: string, band?: string, album?: string) => Promise<void>
  loadGenres: () => Promise<void>
  loadBands: (genre?: string) => Promise<void>
  loadAlbums: (genre?: string, band?: string) => Promise<void>
  searchSongs: (query: string) => Promise<void>
  refreshSong: (id: number) => Promise<void>
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  songs: [],
  selectedSong: null,
  genres: [],
  bands: [],
  albums: [],
  searchQuery: '',
  activeGenre: null,
  activeBand: null,
  activeAlbum: null,
  isLoading: false,

  player: {
    currentSong: null,
    isPlaying: false,
    volume: 0.8,
    currentTime: 0,
    duration: 0,
    queue: [],
    queueIndex: -1
  },

  setSongs: (songs) => set({ songs }),
  setSelectedSong: (song) => set({ selectedSong: song }),
  updateSongInList: (song) => set((state) => ({
    songs: state.songs.map(s => s.id === song.id ? song : s),
    selectedSong: state.selectedSong?.id === song.id ? song : state.selectedSong
  })),
  setGenres: (genres) => set({ genres }),
  setBands: (bands) => set({ bands }),
  setAlbums: (albums) => set({ albums }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveGenre: (genre) => set({ activeGenre: genre }),
  setActiveBand: (band) => set({ activeBand: band }),
  setActiveAlbum: (album) => set({ activeAlbum: album }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  setCurrentSong: (song) => set((state) => ({
    player: { ...state.player, currentSong: song, currentTime: 0 }
  })),
  setIsPlaying: (playing) => set((state) => ({
    player: { ...state.player, isPlaying: playing }
  })),
  setVolume: (volume) => set((state) => ({
    player: { ...state.player, volume }
  })),
  setCurrentTime: (time) => set((state) => ({
    player: { ...state.player, currentTime: time }
  })),
  setDuration: (duration) => set((state) => ({
    player: { ...state.player, duration }
  })),
  setQueue: (songs, index) => set((state) => ({
    player: { ...state.player, queue: songs, queueIndex: index }
  })),

  playNext: () => {
    const { player } = get()
    if (player.queue.length === 0) return null
    const nextIndex = (player.queueIndex + 1) % player.queue.length
    const nextSong = player.queue[nextIndex]
    set((state) => ({
      player: { ...state.player, queueIndex: nextIndex, currentSong: nextSong, currentTime: 0 }
    }))
    return nextSong
  },

  playPrev: () => {
    const { player } = get()
    if (player.queue.length === 0) return null
    const prevIndex = (player.queueIndex - 1 + player.queue.length) % player.queue.length
    const prevSong = player.queue[prevIndex]
    set((state) => ({
      player: { ...state.player, queueIndex: prevIndex, currentSong: prevSong, currentTime: 0 }
    }))
    return prevSong
  },

  loadSongs: async (genre?: string, band?: string, album?: string) => {
    set({ isLoading: true })
    const songs = await window.api.songs.getAll(genre, band, album) as Song[]
    set({ songs, isLoading: false })
  },

  loadGenres: async () => {
    const genres = await window.api.library.getGenres()
    set({ genres })
  },

  loadBands: async (genre?: string) => {
    const bands = await window.api.library.getBands(genre)
    set({ bands })
  },

  loadAlbums: async (genre?: string, band?: string) => {
    const albums = await window.api.library.getAlbums(genre, band)
    set({ albums })
  },

  searchSongs: async (query: string) => {
    if (!query.trim()) {
      const { activeGenre, activeBand, activeAlbum } = get()
      await get().loadSongs(activeGenre ?? undefined, activeBand ?? undefined, activeAlbum ?? undefined)
      return
    }
    set({ isLoading: true })
    const songs = await window.api.songs.search(query) as Song[]
    set({ songs, isLoading: false })
  },

  refreshSong: async (id: number) => {
    const song = await window.api.songs.get(id) as Song | undefined
    if (song) {
      get().updateSongInList(song)
    }
  }
}))
