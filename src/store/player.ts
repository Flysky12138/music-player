import { clamp, pick, range, shuffle } from 'es-toolkit'
import { create, StateCreator } from 'zustand'
import { persist } from 'zustand/middleware'

import { PlaylistSnapshot } from '@/lib/tauri/playlist'
import { Song } from '@/lib/tauri/song'

export interface PlayerStore {
  playMode: PlayMode
  volume: number

  /**
   * 当前歌曲在 `playOrder` 中的位置
   */
  currentIndex: number
  playlist: Song[]
  /**
   * 当前播放顺序，元素是 `playlist` 的 index。动态维护内容，实现随机播放
   */
  playOrder: number[]
  /**
   * 播放请求计数。变化时表示需要开始播放，例如选中新的播放列表
   *
   * @default 0
   */
  playSignal: number

  setVolume: (volume: number) => void

  /**
   * 从播放队列中移除单首歌曲
   */
  removeFromPlaylist: (id: number) => void
  /**
   * 启动时恢复上次的播放队列。不会触发播放
   */
  restorePlaylist: (snapshot: PlaylistSnapshot) => void
  setPlaylist: (playlist: Song[]) => void
  setPlayMode: (mode: PlayMode) => void

  next: () => void
  prev: () => void
  setCurrentIndex: (index: number) => void
  setCurrentSong: (id: number) => void
}

export type PlayMode = 'random' | 'sequence' | 'single'

function middleware(fn: StateCreator<PlayerStore>) {
  return persist(fn, {
    name: 'music',
    version: 1,
    partialize: state => pick(state, ['playMode', 'volume'])
  })
}

export const usePlayerStore = create<PlayerStore>()(
  middleware((set, get) => ({
    playMode: 'sequence',
    volume: 1,

    currentIndex: 0,
    playlist: [],
    playOrder: [],
    playSignal: 0,

    setVolume: volume => set({ volume: clamp(volume, 0, 1) }),

    removeFromPlaylist: id => {
      const { currentIndex, playlist, playOrder } = get()

      const playlistIndex = playlist.findIndex(song => song.id === id)
      if (playlistIndex === -1) return

      const nextPlaylist = playlist.filter((_, index) => index !== playlistIndex)

      // playOrder 存的是 playlist 下标，删掉一项后后面的下标要整体前移
      const nextPlayOrder = playOrder.filter(index => index !== playlistIndex).map(index => (index > playlistIndex ? index - 1 : index))

      // 播放歌曲索引更新
      let nextCurrentIndex = currentIndex
      const orderPosition = playOrder.indexOf(playlistIndex)
      if (orderPosition !== -1) {
        if (orderPosition < currentIndex) {
          // 删的是当前歌曲之前的：位置前移一位
          nextCurrentIndex = currentIndex - 1
        } else if (orderPosition === currentIndex) {
          // 删的正是当前歌曲：位置不变，接着播队列里的下一首
          nextCurrentIndex = Math.min(currentIndex, nextPlayOrder.length - 1)
        }
      }

      set({
        currentIndex: clamp(nextCurrentIndex, 0, Math.max(nextPlayOrder.length - 1, 0)),
        playlist: nextPlaylist,
        playOrder: nextPlayOrder
      })
    },
    restorePlaylist: ({ current_song_id, songs }) => {
      const { playMode } = get()

      const playlistIndex = songs.findIndex(song => song.id === current_song_id)
      const indexOrder = range(songs.length)

      // 随机模式下把当前歌曲排在队首，和 setPlayMode 的行为保持一致
      const playOrder =
        playMode === 'random' && playlistIndex !== -1 ? [playlistIndex, ...shuffle(indexOrder.filter(index => index !== playlistIndex))] : indexOrder

      set({
        currentIndex: Math.max(playOrder.indexOf(playlistIndex), 0),
        playlist: songs,
        playOrder
      })
    },
    setPlaylist: playlist => {
      const { playMode, playSignal } = get()

      const indexOrder = range(playlist.length)

      set({
        currentIndex: 0,
        playlist,
        playOrder: playMode === 'random' ? shuffle(indexOrder) : indexOrder,
        playSignal: playSignal + 1
      })
    },
    setPlayMode: playMode => {
      const { currentIndex, playOrder } = get()
      const count = playOrder.length

      if (count === 0) {
        set({ currentIndex: 0, playMode, playOrder: [] })
        return
      }

      const currentSongIndex = playOrder[currentIndex]

      if (playMode === 'random') {
        const remaining = range(count).filter(index => index !== currentSongIndex)
        set({
          currentIndex: 0,
          playMode,
          playOrder: [currentSongIndex, ...shuffle(remaining)]
        })
        return
      }

      if (playMode === 'sequence') {
        const newPlayOrder = range(count)
        set({
          currentIndex: newPlayOrder.indexOf(currentSongIndex),
          playMode,
          playOrder: newPlayOrder
        })
        return
      }

      set({ playMode })
    },

    next: () => {
      const { currentIndex, playMode, playOrder } = get()
      const count = playOrder.length

      if (count === 0) return

      // 单曲循环不影响手动下一首
      if (currentIndex < count - 1) {
        set({ currentIndex: currentIndex + 1 })
        return
      }

      // 播放到队列末尾，再次打乱歌曲顺序
      if (playMode === 'random') {
        const currentSongIndex = playOrder[currentIndex]
        const remaining = range(count).filter(index => index !== currentSongIndex)
        set({
          currentIndex: 0,
          playOrder: [currentSongIndex, ...shuffle(remaining)]
        })
        return
      }

      set({ currentIndex: 0 })
    },
    prev: () => {
      const { currentIndex, playOrder } = get()
      const count = playOrder.length

      if (count === 0) return

      set({ currentIndex: currentIndex > 0 ? currentIndex - 1 : count - 1 })
    },
    setCurrentIndex: index => {
      const { playOrder } = get()
      const count = playOrder.length

      set({ currentIndex: count > 0 ? clamp(index, 0, count - 1) : 0 })
    },
    setCurrentSong: id => {
      const { playlist, playOrder } = get()

      const playlistIndex = playlist.findIndex(song => song.id === id)
      if (playlistIndex === -1) return

      const currentIndex = playOrder.indexOf(playlistIndex)
      if (currentIndex === -1) return

      set({ currentIndex })
    }
  }))
)
