'use client'

import { Volume1Icon, Volume2Icon, VolumeXIcon } from 'lucide-react'
import { usePrevious } from 'react-use'

import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePlayerAudio } from '@/provider/audio-provider'

export function Volume() {
  const { setVolume, volume } = usePlayerAudio()

  // 静音前记住上一次的音量，方便一键恢复
  const prevVolume = usePrevious(volume)

  const volumePercent = Math.round(volume * 100)
  const VolumeIcon = volume === 0 ? VolumeXIcon : volume < 0.5 ? Volume1Icon : Volume2Icon

  return (
    <HoverCard>
      <HoverCardTrigger
        closeDelay={0}
        delay={100}
        render={
          <Button
            aria-label={volume === 0 ? '取消静音' : '静音'}
            size="icon"
            variant="ghost"
            onClick={() => {
              setVolume(volume === 0 ? (prevVolume ?? 1) : 0)
            }}
          >
            <VolumeIcon />
          </Button>
        }
      />
      <HoverCardContent alignOffset={0} className="w-auto space-y-2" side="top">
        <Tooltip open>
          <TooltipTrigger className="block">
            <Slider
              className="*:min-h-28!"
              id="volume"
              max={100}
              min={0}
              orientation="vertical"
              step={1}
              value={[volumePercent]}
              onValueChange={value => {
                setVolume((typeof value === 'number' ? value : value[0]) / 100)
              }}
            />
          </TooltipTrigger>
          <TooltipContent className="px-1 duration-400 *:last:-z-10" side="top" sideOffset={18}>
            <Label className="inline-block w-[3ch] text-center tabular-nums" htmlFor="volume">
              {volumePercent}
            </Label>
          </TooltipContent>
        </Tooltip>
      </HoverCardContent>
    </HoverCard>
  )
}
