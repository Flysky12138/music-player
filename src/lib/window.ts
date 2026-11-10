import { UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { platform } from '@tauri-apps/plugin-os'
import { asyncNoop } from 'es-toolkit'

/**
 * 是否运行在 Tauri 容器中（浏览器调试时为 false）
 */
export function isTauriRuntime() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * 是否运行在 macOS 上
 */
export const isMacOS = (() => {
  if (!isTauriRuntime()) return false

  try {
    return platform() === 'macos'
  } catch {
    return false
  }
})()

/**
 * 窗口控制封装。
 *
 * 浏览器预览时退化为空实现，避免开发阶段因缺少 Tauri 运行时直接报错。
 */
export const appWindow = {
  close: () => (isTauriRuntime() ? getCurrentWindow().close() : Promise.resolve()),
  isMaximized: () => (isTauriRuntime() ? getCurrentWindow().isMaximized() : Promise.resolve(false)),
  minimize: () => (isTauriRuntime() ? getCurrentWindow().minimize() : Promise.resolve()),
  onResized: (handler: () => void): Promise<UnlistenFn> => (isTauriRuntime() ? getCurrentWindow().onResized(handler) : Promise.resolve(asyncNoop)),
  toggleMaximize: () => (isTauriRuntime() ? getCurrentWindow().toggleMaximize() : Promise.resolve())
}
