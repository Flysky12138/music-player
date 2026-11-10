'use client'

import { convertFileSrc } from '@tauri-apps/api/core'
import { cn } from 'cn'
import { pick } from 'es-toolkit'
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { useShallow } from 'zustand/shallow'

import { PlayerView, PlayerViewActions } from '@/components/player-view'
import { Button } from '@/components/ui/button'
import { usePlayerAudio } from '@/provider/audio-provider'
import { usePlayerStore } from '@/store/player'

import { PlayMode } from './play-mode'
import { PlayListMenu } from './playlist-menu'
import { Progress } from './progress'
import { Volume } from './volume'

export function StatusBar() {
  const playerViewRef = React.useRef<null | PlayerViewActions>(null)

  const { canSwitch, next, prev, song } = usePlayerStore(
    useShallow(state => ({
      canSwitch: state.playOrder.length > 1,
      song: state.playlist[state.playOrder[state.currentIndex]],
      ...pick(state, ['next', 'prev'])
    }))
  )

  const { playing, toggle } = usePlayerAudio()

  if (!song) return null

  return (
    <AnimatePresence>
      {song && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex h-statusbar justify-center py-3"
          data-slot="status-bar"
          exit={{ opacity: 0, y: '100%' }}
          initial={{ opacity: 0, y: '100%' }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <div
            className={cn(
              'pointer-events-auto relative flex w-full items-center rounded-lg bg-card px-2 shadow',
              'max-w-2xl transition-[max-width] xl:max-w-3xl'
            )}
          >
            <div className="grid w-full grid-cols-[1fr_auto_1fr] gap-6">
              {/* 左 */}
              <div className="flex items-center gap-1 overflow-hidden">
                {song.cover_path ? (
                  <Image
                    alt={song.title}
                    className={cn('size-11 shrink-0 animate-spin rounded-full paused', {
                      running: playing
                    })}
                    height={40}
                    src={convertFileSrc(song.cover_path)}
                    width={40}
                  />
                ) : (
                  <div className="size-11 shrink-0 rounded-full bg-muted" />
                )}
                <div className="overflow-hidden">
                  <p className="truncate">{song.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {song.artist.map((artist, index) => (
                      <React.Fragment key={artist}>
                        {index > 0 && <span>, </span>}
                        <Link
                          className="link"
                          href={`/artist/details?name=${encodeURIComponent(artist)}`}
                          onNavigate={() => {
                            playerViewRef.current?.close()
                          }}
                        >
                          {artist}
                        </Link>
                      </React.Fragment>
                    ))}
                  </p>
                </div>

                <span aria-hidden className="ml-auto" />

                <Volume />
              </div>

              {/* 中 */}
              <div className="flex items-center justify-center gap-3">
                <Button aria-label="上一首" className="rounded-full" disabled={!canSwitch} size="icon" variant="secondary" onClick={prev}>
                  <SkipBackIcon />
                </Button>
                <Button
                  aria-label={playing ? '暂停' : '播放'}
                  className="rounded-full"
                  size="icon-lg"
                  onClick={() => {
                    void toggle()
                  }}
                >
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </Button>
                <Button aria-label="下一首" className="rounded-full" disabled={!canSwitch} size="icon" variant="secondary" onClick={next}>
                  <SkipForwardIcon />
                </Button>
              </div>

              {/* 右 */}
              <div className="flex items-center gap-1">
                <PlayMode />
                <PlayListMenu />
                <Progress />

                <span aria-hidden className="ml-auto" />

                <PlayerView actionsRef={playerViewRef} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * `StatusBar` 组件弹出后，同步出现的空白区域，用于占位
 */
export function StatusBarPlaceholder({ className, offset = 0 }: { className?: string; offset?: number }) {
  const hasSong = usePlayerStore(state => Boolean(state.playlist[state.playOrder[state.currentIndex]]))

  return (
    <div
      aria-hidden
      className={cn('h-0 shrink-0 transition-[height] duration-300', className)}
      data-slot="status-bar-placeholder"
      style={
        hasSong
          ? {
              height: `calc(var(--height-statusbar) + ${offset}px)`
            }
          : undefined
      }
    />
  )
}
