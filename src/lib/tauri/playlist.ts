import { invoke } from '@tauri-apps/api/core'

import { Song } from './song'

export interface PlaylistSnapshot {
  current_song_id: null | number
  /**
   * 按播放队列顺序排列的歌曲
   */
  songs: Song[]
}

/**
 * 读取播放队列
 */
export function getPlaylist() {
  return invoke<PlaylistSnapshot>('get_playlist')
}

/**
 * 覆盖保存播放队列
 */
export function savePlaylist(songIds: number[], currentSongId: null | number) {
  return invoke<null>('save_playlist', {
    currentSongId,
    songIds
  })
}
