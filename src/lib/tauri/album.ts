import { invoke } from '@tauri-apps/api/core'

import { Song } from './song'

export interface Album {
  artist: string[]
  cover_path: null | string
  duration_ms: number
  name: string
  song_count: number
}

export function listAlbums(keyword?: string) {
  return invoke<Album[]>('list_albums', { keyword: keyword ?? null })
}

export function listAlbumSongs(name: string) {
  return invoke<Song[]>('list_album_songs', { name })
}
