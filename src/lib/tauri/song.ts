import { invoke } from '@tauri-apps/api/core'

import { Page } from './page'

export interface ListSongsParams {
  /**
   * 按标题、艺术家或专辑模糊搜索
   */
  keyword?: string
  /**
   * 页码，从 1 开始
   */
  page?: number
  pageSize?: number
}

export interface Song {
  album: null | string
  artist: string[]
  bit_depth: null | number
  bitrate: null | number
  channels: null | number
  cover_path: null | string
  created_at: string
  duration_ms: null | number
  file_modified_at: number
  file_size: number
  folder_id: null | number
  id: number
  lyrics_path: null | string
  path: string
  quality: null | SongQuality
  sample_rate: null | number
  title: string
  track_number: null | number
  updated_at: string
}

/**
 * 音质等级：HQ 有损 / SQ CD 级无损 / HR 高解析
 */
export type SongQuality = 'HQ' | 'HR' | 'SQ'

/**
 * 查询全部歌曲（不分页），用于「播放全部」这类需要完整列表的场景
 */
export function listAllSongs({ keyword }: Pick<ListSongsParams, 'keyword'> = {}) {
  return invoke<Song[]>('list_all_songs', {
    keyword: keyword ?? null
  })
}

/**
 * 分页查询歌曲
 */
export function listSongs({ keyword, page, pageSize }: ListSongsParams = {}) {
  return invoke<Page<Song>>('list_songs', {
    keyword: keyword ?? null,
    page: page ?? null,
    pageSize: pageSize ?? null
  })
}
