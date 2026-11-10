import { open } from '@tauri-apps/plugin-dialog'

/**
 * 弹出系统目录选择框，用户取消时返回 null
 */
export async function pickDirectory(title: string) {
  return open({ directory: true, multiple: false, title })
}
