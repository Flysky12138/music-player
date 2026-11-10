import { invoke } from '@tauri-apps/api/core'

import { Song } from './song'

export interface SongFolder {
  cover_path: null | string
  /**
   * 目录名，用于展示
   */
  name: string
  /**
   * 目录路径，作为唯一标识
   */
  path: string
  song_count: number
}

/**
 * 查询有歌曲的目录，可选按目录路径搜索
 */
export function listSongFolders(keyword?: string) {
  return invoke<SongFolder[]>('list_song_folders', { keyword: keyword ?? null })
}

/**
 * 按目录查询全部歌曲
 */
export function listSongFolderSongs(path: string) {
  return invoke<Song[]>('list_song_folder_songs', { path })
}
