import { invoke } from '@tauri-apps/api/core'

export interface LibraryStatistics {
  play: PlayStatistics
  quality: QualityStatistics
}

export interface PlayStatistics {
  /**
   * 今日播放次数
   */
  today: number
  /**
   * 播放次数最多的歌曲
   */
  top_songs: TopSong[]
  /**
   * 累计播放次数
   */
  total: number
  /**
   * 近 7 天（含今天）播放次数
   */
  week: number
}

export interface QualityStatistics {
  hq: number
  hr: number
  sq: number
  unknown: number
}

export interface TopSong {
  artist: string[]
  cover_path: null | string
  play_count: number
  song_id: number
  title: string
}

export function getLibraryStatistics() {
  return invoke<LibraryStatistics>('get_library_statistics')
}

/**
 * 记录一次歌曲播放
 */
export function recordSongPlay(songId: number) {
  return invoke<null>('record_song_play', { songId })
}
