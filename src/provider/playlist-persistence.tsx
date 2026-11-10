'use client'

import { pick } from 'es-toolkit'
import React from 'react'
import { toast } from 'sonner'
import { useShallow } from 'zustand/shallow'

import { usePlayerStore } from '@/store/player'
import { getPlaylist, savePlaylist } from '@/tauri/playlist'

const TOAST_ID = '01a1b059-7b1d-7559-91f4-3cda6dba84ff'

/**
 * 把播放队列持久化到数据库。
 *
 * 只保存歌曲 id，读取时再从数据库还原成最新的歌曲信息，避免文件重新扫描后
 * 封面、歌词路径等字段过期。
 */
export function PlaylistPersistence() {
  const { currentIndex, playlist, playOrder, restorePlaylist } = usePlayerStore(
    useShallow(state => pick(state, ['currentIndex', 'playlist', 'playOrder', 'restorePlaylist']))
  )

  // 读取完成前不能写库，否则会用空队列覆盖上次保存的数据
  const [restored, setRestored] = React.useState(false)

  React.useEffect(() => {
    let ignore = false

    const timer = setTimeout(() => {
      getPlaylist()
        .then(snapshot => {
          if (ignore) return

          restorePlaylist(snapshot)
          setRestored(true)
        })
        .catch(error => {
          toast.error(`读取播放队列失败：${String(error)}`, {
            id: TOAST_ID,
            richColors: true
          })
        })
    }, 1000)

    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [restorePlaylist])

  React.useEffect(() => {
    if (!restored) return

    const songIds = playlist.map(song => song.id)
    const currentSongId = playlist[playOrder[currentIndex]]?.id ?? null

    savePlaylist(songIds, currentSongId).catch(error => {
      toast.error(`保存播放队列失败：${String(error)}`, {
        id: TOAST_ID,
        richColors: true
      })
    })
  }, [currentIndex, playOrder, playlist, restored])

  return null
}
