'use client'

import { pick } from 'es-toolkit'
import { Repeat1Icon, RepeatIcon, ShuffleIcon } from 'lucide-react'
import { useShallow } from 'zustand/shallow'

import { Button } from '@/components/ui/button'
import { PlayMode as PlayModeType, usePlayerStore } from '@/store/player'

const PLAY_MODES = {
  random: { icon: ShuffleIcon, label: '随机播放', next: 'single' },
  sequence: { icon: RepeatIcon, label: '顺序播放', next: 'random' },
  single: { icon: Repeat1Icon, label: '单曲循环', next: 'sequence' }
} as const satisfies Record<PlayModeType, unknown>

export function PlayMode() {
  const { playMode, setPlayMode } = usePlayerStore(useShallow(state => pick(state, ['playMode', 'setPlayMode'])))

  const { icon: Icon, label, next } = PLAY_MODES[playMode]

  return (
    <Button
      aria-label={label}
      size="icon"
      variant="ghost"
      onClick={() => {
        setPlayMode(next)
      }}
    >
      <Icon />
    </Button>
  )
}
