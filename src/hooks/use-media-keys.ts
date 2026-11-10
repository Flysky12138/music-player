import { listen } from '@tauri-apps/api/event'
import React from 'react'

import { isTauriRuntime } from '@/lib/window'

/**
 * Rust 侧 `media_keys` 模块转发的媒体键动作
 */
export type MediaKeyAction = 'next' | 'play-pause' | 'prev' | 'stop'

interface UseMediaKeysOptions {
  next: () => void
  pause: () => void
  prev: () => void
  seek: (time: number) => void
  toggle: () => Promise<boolean>
}

/**
 * 响应 Rust 侧注册的系统媒体键。
 *
 * WebView2 的媒体会话只有在播放过媒体之后才会生效（冷启动、暂停状态下换歌都会失效），
 * 所以按键改由 Rust 的全局快捷键转发过来，不再依赖媒体会话。
 */
export function useMediaKeys({ next, pause, prev, seek, toggle }: UseMediaKeysOptions) {
  React.useEffect(() => {
    if (!isTauriRuntime()) return

    let disposed = false
    let unlisten: (() => void) | undefined

    void listen<MediaKeyAction>('media-control', ({ payload }) => {
      switch (payload) {
        case 'next':
          next()
          break
        case 'play-pause':
          void toggle()
          break
        case 'prev':
          prev()
          break
        case 'stop':
          pause()
          seek(0)
          break
      }
    }).then(off => {
      if (disposed) {
        off()
      } else {
        unlisten = off
      }
    })

    return () => {
      disposed = true
      unlisten?.()
    }
  }, [next, pause, prev, seek, toggle])
}
