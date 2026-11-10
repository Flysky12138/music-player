import { convertFileSrc } from '@tauri-apps/api/core'
import React from 'react'
import { useLatest } from 'react-use'

import { Song } from '@/tauri/song'

interface UseMediaSessionOptions {
  currentTime: number
  duration: number
  playing: boolean
  song: Song | undefined
  next: () => void
  pause: () => void
  play: () => Promise<boolean>
  prev: () => void
  seek: (time: number) => void
}

/**
 * 系统未给出 `seekOffset` 时的快进/快退秒数
 */
const SEEK_OFFSET = 10

/**
 * 把播放状态同步到系统媒体控制（系统媒体面板、锁屏、耳机线控等）。
 *
 * 运行环境不支持 Media Session 时静默跳过，不影响播放器本身。
 */
export function useMediaSession({ currentTime, duration, next, pause, play, playing, prev, seek, song }: UseMediaSessionOptions) {
  const progressRef = useLatest({ currentTime, duration })

  // 元数据
  React.useEffect(() => {
    const mediaSession = getMediaSession()

    if (!mediaSession) return

    if (!song || typeof MediaMetadata === 'undefined') {
      mediaSession.metadata = null
      return
    }

    mediaSession.metadata = new MediaMetadata({
      album: song.album ?? '',
      artist: song.artist.join(' / '),
      artwork: song.cover_path ? [{ src: convertFileSrc(song.cover_path) }] : [],
      title: song.title
    })
  }, [song])

  // 注册 Media Session 动作
  React.useEffect(() => {
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => void play()],
      ['pause', pause],
      [
        'stop',
        () => {
          pause()
          seek(0)
        }
      ],
      ['previoustrack', prev],
      ['nexttrack', next],
      [
        'seekbackward',
        details => {
          seek(progressRef.current.currentTime - (details.seekOffset ?? SEEK_OFFSET))
        }
      ],
      [
        'seekforward',
        details => {
          seek(progressRef.current.currentTime + (details.seekOffset ?? SEEK_OFFSET))
        }
      ],
      [
        'seekto',
        details => {
          if (details.seekTime === undefined) return

          seek(details.seekTime)
        }
      ]
    ]

    for (const [action, handler] of handlers) {
      registerAction(action, handler)
    }

    return () => {
      for (const [action] of handlers) {
        registerAction(action, null)
      }
    }
  }, [next, pause, play, prev, progressRef, seek])

  // 播放状态
  React.useEffect(() => {
    const mediaSession = getMediaSession()

    if (!mediaSession) return

    mediaSession.playbackState = song ? (playing ? 'playing' : 'paused') : 'none'
  }, [playing, song])

  // 播放进度
  React.useEffect(() => {
    const mediaSession = getMediaSession()

    // 时长未知（还在加载）时不能上报进度，否则系统会抛错
    if (!mediaSession || !Number.isFinite(duration) || duration <= 0) return

    try {
      mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(Math.max(currentTime, 0), duration)
      })
    } catch {
      // 进度暂时不合法时忽略，等下一次 timeupdate 再同步
    }
  }, [currentTime, duration])
}

/**
 * 当前环境是否支持 Media Session
 */
function getMediaSession() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return null

  return navigator.mediaSession
}

function registerAction(action: MediaSessionAction, handler: MediaSessionActionHandler | null) {
  const mediaSession = getMediaSession()

  try {
    mediaSession?.setActionHandler(action, handler)
  } catch {
    // 部分动作在当前的 webview 中不受支持，跳过即可
  }
}
