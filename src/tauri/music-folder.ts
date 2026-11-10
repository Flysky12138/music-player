import { invoke } from '@tauri-apps/api/core'

export interface MusicFolder {
  created_at: string
  id: number
  path: string
  updated_at: string
}

export function addMusicFolder(path: string) {
  return invoke<MusicFolder>('add_music_folder', { path })
}

export function listMusicFolders() {
  return invoke<MusicFolder[]>('list_music_folders')
}

export function removeMusicFolder(id: number) {
  return invoke<boolean>('remove_music_folder', { id })
}
