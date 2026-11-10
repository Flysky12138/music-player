import { cn } from 'cn'

import { SongQuality } from '@/tauri/song'

/**
 * 各音质等级对应的背景色
 */
const QUALITY_STYLES: Record<SongQuality, string> = {
  HQ: 'bg-orange-500',
  HR: 'bg-yellow-500',
  SQ: 'bg-blue-500'
}

/**
 * 音质标记
 */
export function QualityBadge({ quality }: { quality: null | SongQuality }) {
  if (!quality) return null

  return (
    <span className={cn('inline-block rounded-xs px-1 text-[0.6em] font-bold', QUALITY_STYLES[quality])} data-slot="quality-badge">
      {quality}
    </span>
  )
}
