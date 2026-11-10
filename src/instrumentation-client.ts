import { platform } from '@tauri-apps/plugin-os'

/**
 * 把运行平台写到 `<html>` 上，供 CSS 做平台差异化处理。
 */
try {
  document.documentElement.dataset.os = platform()
} catch {
  // 浏览器里没有 Tauri 注入的平台信息，忽略即可
}
