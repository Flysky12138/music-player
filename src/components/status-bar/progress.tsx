'use client'

import React from 'react'

import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Slider } from '@/components/ui/slider'
import { formatTime } from '@/lib/format'
import { usePlayerAudio, usePlayerProgress } from '@/provider/audio-provider'

export function Progress() {
  const { currentTime, duration } = usePlayerProgress()
  const { seek } = usePlayerAudio()

  // 拖动中的目标进度。非空时优先于播放进度，否则 timeupdate 会把滑块拽回去
  const [seeking, setSeeking] = React.useState<null | number>(null)

  const time = seeking ?? currentTime

  return (
    <HoverCard
      onOpenChange={open => {
        if (open) return
        setSeeking(null)
      }}
    >
      <HoverCardTrigger
        closeDelay={0}
        delay={100}
        render={
          <Button aria-label="播放进度" className="tabular-nums" variant="ghost">
            {formatTime(time)}/{formatTime(duration)}
          </Button>
        }
      />
      <HoverCardContent align="center" className="w-52" side="top">
        <Slider
          aria-label="播放进度"
          className="cursor-pointer"
          max={Math.max(duration, 1)}
          step={1}
          value={[time]}
          onValueChange={value => {
            setSeeking(toTime(value))
          }}
          onValueCommitted={value => {
            seek(toTime(value))
            setSeeking(null)
          }}
        />
      </HoverCardContent>
    </HoverCard>
  )
}

/**
 * Base UI 的单滑块可能回传单个数字，也可能回传数组，这里统一取值
 */
function toTime(value: number | readonly number[]) {
  return typeof value === 'number' ? value : value[0]
}
