'use client'

import { convertFileSrc } from '@tauri-apps/api/core'
import { pick } from 'es-toolkit'
import React from 'react'
import { useShallow } from 'zustand/shallow'

import { useAudio } from '@/hooks/use-audio'
import { useMediaKeys } from '@/hooks/use-media-keys'
import { useMediaSession } from '@/hooks/use-media-session'
import { usePlayerStore } from '@/store/player'
import { recordSongPlay } from '@/tauri/statistics'

/**
 * 播放满这么长时间（秒）才计入一次播放，避免快速切歌把次数刷虚
 */
const PLAY_COUNT_THRESHOLD = 30

interface PlayerAudio {
  playing: boolean
  /**
   * 当前音量，取值 0 ~ 1
   */
  volume: number

  pause: () => void
  play: () => Promise<boolean>
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggle: () => Promise<boolean>
}

interface PlayerProgress {
  currentTime: number
  duration: number
}

/**
 * 播放控制。只在播放状态变化时更新，不随进度频繁变化。
 */
const AudioContext = React.createContext<null | PlayerAudio>(null)

/**
 * 播放进度。随 `timeupdate` 频繁更新，单独拆开避免整个播放器重复渲染。
 */
const ProgressContext = React.createContext<null | PlayerProgress>(null)

/**
 * 全局唯一的音频实例，供状态栏和播放页共享播放进度。
 */
export function AudioProvider({ children }: React.PropsWithChildren) {
  const { next, playMode, playSignal, prev, setVolume, song, volume } = usePlayerStore(
    useShallow(state => ({
      song: state.playlist[state.playOrder[state.currentIndex]],
      ...pick(state, ['next', 'playMode', 'playSignal', 'prev', 'setVolume', 'volume'])
    }))
  )

  const { currentTime, duration, pause, play, playing, seek, toggle } = useAudio(song?.path ? convertFileSrc(song.path) : null, {
    loop: playMode === 'single',
    volume,
    onEnded: next,
    /**
     * 文件已不存在（被删除或扫描清理）时，把这首歌从队列里移掉，然后继续播下一首。
     * 只有队列被清空时才会真正停下来。
     */
    onError: () => {
      // 错误事件可能在队列已经变化之后才到达，这里取最新状态并兜底
      const { currentIndex, playlist, playOrder, removeFromPlaylist, setCurrentIndex } = usePlayerStore.getState()

      const failed = playlist[playOrder[currentIndex]]
      if (!failed) return

      const wasLast = currentIndex >= playOrder.length - 1

      removeFromPlaylist(failed.id)

      // 队尾失败时移除会退回上一首，这里改成回到队首继续，和 next() 到队尾的行为一致
      if (wasLast) {
        setCurrentIndex(0)
      }
    }
  })

  // 选中新的播放列表后自动播放
  React.useEffect(() => {
    if (playSignal === 0) return

    void play()
  }, [play, playSignal])

  // 同步到系统媒体控制（系统媒体面板、锁屏、耳机线控）
  useMediaSession({ currentTime, duration, next, pause, play, playing, prev, seek, song })

  // 系统媒体键由 Rust 侧全局快捷键转发，媒体会话没激活时也能用
  useMediaKeys({ next, pause, prev, seek, toggle })

  /**
   * 已经计入播放统计的歌曲。
   * 切歌后歌曲 id 变化即可再次计数，同一首歌连续循环播放只算一次。
   */
  const countedSongRef = React.useRef<null | number>(null)

  React.useEffect(() => {
    if (!song || countedSongRef.current === song.id) return

    // 短音频按半首歌计，避免时长不足 30 秒的音频永远统计不到
    const threshold = duration > 0 ? Math.min(PLAY_COUNT_THRESHOLD, duration / 2) : PLAY_COUNT_THRESHOLD

    if (currentTime < threshold) return

    countedSongRef.current = song.id

    void recordSongPlay(song.id).catch(() => {
      // 统计失败不影响播放
    })
  }, [currentTime, duration, song])

  const audio = React.useMemo<PlayerAudio>(
    () => ({
      pause,
      play,
      playing,
      seek,
      setVolume,
      toggle,
      volume
    }),
    [pause, play, playing, seek, setVolume, toggle, volume]
  )

  const progress = React.useMemo<PlayerProgress>(
    () => ({
      currentTime,
      duration
    }),
    [currentTime, duration]
  )

  return (
    <AudioContext value={audio}>
      <ProgressContext value={progress}>{children}</ProgressContext>
    </AudioContext>
  )
}

export function usePlayerAudio() {
  const audio = React.use(AudioContext)

  if (!audio) {
    throw new Error('usePlayerAudio 必须在 AudioProvider 内使用')
  }

  return audio
}

export function usePlayerProgress() {
  const progress = React.use(ProgressContext)

  if (!progress) {
    throw new Error('usePlayerProgress 必须在 AudioProvider 内使用')
  }

  return progress
}
