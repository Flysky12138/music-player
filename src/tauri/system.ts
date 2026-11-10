import { invoke } from '@tauri-apps/api/core'

/**
 * 在系统文件管理器中打开目录
 */
export function openDirectory(path: string) {
  return invoke<void>('open_directory', { path })
}
