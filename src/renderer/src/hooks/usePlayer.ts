import { useEffect, useCallback } from 'react'
import { Howl, Howler } from 'howler'
import { useLibraryStore, Song } from '../store/library'

// Module-level singletons — all usePlayer() callers share the same Howl instance.
// Without this, SongList and AudioPlayer each get their own howlRef, so controls
// in AudioPlayer operate on a null ref while the actual Howl lives in SongList.
const howlSingleton: { current: Howl | null } = { current: null }
const seekIntervalSingleton: { current: ReturnType<typeof setInterval> | null } = { current: null }

export function usePlayer() {
  const {
    player,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setCurrentSong,
    setQueue,
    playNext: storePlayNext,
    playPrev: storePlayPrev,
    setVolume: storeSetVolume
  } = useLibraryStore()

  const stopSeekInterval = useCallback(() => {
    if (seekIntervalSingleton.current) {
      clearInterval(seekIntervalSingleton.current)
      seekIntervalSingleton.current = null
    }
  }, [])

  const startSeekInterval = useCallback(() => {
    stopSeekInterval()
    seekIntervalSingleton.current = setInterval(() => {
      if (howlSingleton.current?.playing()) {
        const pos = howlSingleton.current.seek() as number
        setCurrentTime(isNaN(pos) ? 0 : pos)
        // Duration may not be ready at onload time with html5 mode — keep checking
        const dur = howlSingleton.current.duration()
        if (dur && isFinite(dur) && dur > 0) {
          setDuration(dur)
        }
      }
    }, 250)
  }, [stopSeekInterval, setCurrentTime, setDuration])

  const destroyHowl = useCallback(() => {
    stopSeekInterval()
    if (howlSingleton.current) {
      howlSingleton.current.unload()
      howlSingleton.current = null
    }
  }, [stopSeekInterval])

  const playSong = useCallback((song: Song) => {
    destroyHowl()
    setCurrentSong(song)
    setDuration(0)
    setCurrentTime(0)

    const fileUrl = `local-file://${encodeURIComponent(song.file_path.replace(/\\/g, '/'))}`

    const howl = new Howl({
      src: [fileUrl],
      html5: true,
      volume: player.volume,
      onload: () => {
        const dur = howl.duration()
        if (dur && isFinite(dur) && dur > 0) {
          setDuration(dur)
        }
      },
      onplay: () => {
        setIsPlaying(true)
        // Re-check duration — html5 audio may not have it ready at onload time
        const dur = howl.duration()
        if (dur && isFinite(dur) && dur > 0) {
          setDuration(dur)
        }
        startSeekInterval()
      },
      onpause: () => {
        setIsPlaying(false)
        stopSeekInterval()
      },
      onstop: () => {
        setIsPlaying(false)
        stopSeekInterval()
        setCurrentTime(0)
      },
      onend: () => {
        stopSeekInterval()
        setCurrentTime(0)
        const nextSong = storePlayNext()
        if (nextSong) {
          playSong(nextSong)
        } else {
          setIsPlaying(false)
        }
      },
      onloaderror: (_id, err) => {
        console.error('Howler load error:', err)
        setIsPlaying(false)
      }
    })

    howlSingleton.current = howl
    howl.play()
  }, [destroyHowl, player.volume, setCurrentSong, setDuration, setIsPlaying, setCurrentTime, startSeekInterval, stopSeekInterval, storePlayNext])

  const togglePlay = useCallback(() => {
    if (!howlSingleton.current) return
    if (howlSingleton.current.playing()) {
      howlSingleton.current.pause()
    } else {
      howlSingleton.current.play()
    }
  }, [])

  const seek = useCallback((time: number) => {
    if (!howlSingleton.current) return
    howlSingleton.current.seek(time)
    setCurrentTime(time)
  }, [setCurrentTime])

  const setVolume = useCallback((vol: number) => {
    storeSetVolume(vol)
    if (howlSingleton.current) {
      howlSingleton.current.volume(vol)
    }
    Howler.volume(vol)
  }, [storeSetVolume])

  const playNext = useCallback(() => {
    const nextSong = storePlayNext()
    if (nextSong) playSong(nextSong)
  }, [storePlayNext, playSong])

  const playPrev = useCallback(() => {
    if (howlSingleton.current && (howlSingleton.current.seek() as number) > 3) {
      seek(0)
      return
    }
    const prevSong = storePlayPrev()
    if (prevSong) playSong(prevSong)
  }, [storePlayPrev, playSong, seek])

  const playSongFromQueue = useCallback((songs: Song[], index: number) => {
    setQueue(songs, index)
    playSong(songs[index])
  }, [setQueue, playSong])

  // Sync volume changes from store to the active Howl
  useEffect(() => {
    if (howlSingleton.current) {
      howlSingleton.current.volume(player.volume)
    }
  }, [player.volume])

  return {
    playSong,
    playSongFromQueue,
    togglePlay,
    seek,
    setVolume,
    playNext,
    playPrev,
    isPlaying: player.isPlaying,
    currentTime: player.currentTime,
    duration: player.duration,
    volume: player.volume,
    currentSong: player.currentSong
  }
}
