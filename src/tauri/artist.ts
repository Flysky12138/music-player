import { invoke } from '@tauri-apps/api/core'

import { Song } from './song'

export interface Artist {
  album_count: number
  cover_path: null | string
  name: string
  song_count: number
}

export function listArtists(keyword?: string) {
  return invoke<Artist[]>('list_artists', { keyword: keyword ?? null })
}

export function listArtistSongs(name: string) {
  return invoke<Song[]>('list_artist_songs', { name })
}
