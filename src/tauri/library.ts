import { invoke } from '@tauri-apps/api/core'

export interface ScanSummary {
  discovered: number
  failed: number
  folder_count: number
  indexed: number
  removed: number
  unchanged: number
}

/**
 * 扫描全部音乐目录，返回本次扫描的统计结果
 */
export function scanLibrary() {
  return invoke<ScanSummary>('scan_library')
}
