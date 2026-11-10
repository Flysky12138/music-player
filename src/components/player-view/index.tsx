'use client'

import { Dialog } from '@base-ui/react/dialog'
import { convertFileSrc } from '@tauri-apps/api/core'
import { pick } from 'es-toolkit'
import { ChevronUpIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React from 'react'
import useSwr from 'swr'
import { useShallow } from 'zustand/shallow'

import { StatusBarPlaceholder } from '@/components/status-bar'
import { Button } from '@/components/ui/button'
import { parseLyric } from '@/lib/format'
import { usePlayerStore } from '@/store/player'

import { Lyrics } from './lyrics'

export interface PlayerViewActions {
  close(): void
}

interface PlayerViewProps {
  actionsRef?: React.RefObject<null | PlayerViewActions>
}

export function PlayerView({ actionsRef: ref }: PlayerViewProps) {
  const actionsRef = React.useRef<Dialog.Root.Actions>(null)

  const [open, setOpen] = React.useState(false)

  const { song } = usePlayerStore(
    useShallow(state => ({
      song: state.playlist[state.playOrder[state.currentIndex]],
      ...pick(state, ['next', 'prev'])
    }))
  )

  const coverPath = song.cover_path ? convertFileSrc(song.cover_path) : null

  const { data: lyrics, isLoading } = useSwr(
    song.lyrics_path ? ['01a19bcf-e096-77ec-a4b6-c9035d0eaf27', song.lyrics_path] : null,
    async ([, path]) => {
      return fetch(convertFileSrc(path))
        .then(res => res.text())
        .then(parseLyric)
    }
  )

  React.useImperativeHandle(ref, () => ({
    close: () => {
      actionsRef.current?.close()
    }
  }))

  return (
    <Dialog.Root
      actionsRef={actionsRef}
      onOpenChange={(nextOpen, eventDetails) => {
        // 退场动画交给 motion：先阻止弹窗自行卸载，等动画结束后再调用 unmount
        if (!nextOpen) {
          eventDetails.preventUnmountOnClose()
        }
        setOpen(nextOpen)
      }}
    >
      <Dialog.Trigger
        render={
          <Button aria-label="播放大屏" size="icon" variant="ghost">
            <ChevronUpIcon className="transition-transform duration-400 in-aria-expanded:rotate-180" strokeWidth={3} />
          </Button>
        }
      />
      <Dialog.Portal data-slot="player-view">
        <Dialog.Popup
          className="fixed inset-0 z-30 flex flex-col overflow-hidden bg-background"
          render={
            <motion.div
              animate={open ? 'open' : 'closed'}
              initial="closed"
              transition={{ duration: 0.4, ease: 'circInOut' }}
              variants={{
                closed: { opacity: 0, y: '100%' },
                open: { opacity: 1, y: 0 }
              }}
              onAnimationComplete={definition => {
                // 只有真正停留在关闭状态才卸载，避免动画被打断（快速开关）时误卸载
                if (definition === 'closed' && !open) {
                  actionsRef.current?.unmount()
                }
              }}
            />
          }
        >
          <div aria-hidden data-tauri-drag-region className="h-titlebar shrink-0" />

          {/* 背景 */}
          <AnimatePresence initial={false} mode="popLayout">
            {coverPath && open && (
              <div key={coverPath} aria-hidden className="absolute inset-0 -z-10 overflow-clip opacity-40">
                <motion.img
                  alt="Background"
                  animate={{ opacity: 1 }}
                  className="size-full scale-110 object-cover object-bottom blur-2xl brightness-80 dark:brightness-50"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  src={coverPath}
                  transition={{ duration: 0.6 }}
                />
              </div>
            )}
          </AnimatePresence>

          <div className="mx-auto grid size-full max-w-350 grid-cols-2 2xl:gap-16">
            <div className="@container-size grid place-items-center">
              {coverPath ? (
                <>
                  {open && (
                    <AnimatePresence initial={false} mode="popLayout">
                      <motion.img
                        key={coverPath}
                        alt={song.title}
                        animate={{ opacity: 1 }}
                        className="aspect-square w-[60cqmin] rounded-xl xl:w-[70cqmin] 2xl:w-[80cqmin]"
                        exit={{ opacity: 0 }}
                        height={200}
                        initial={{ opacity: 0 }}
                        src={coverPath}
                        transition={{ duration: 0.6 }}
                        width={200}
                      />
                    </AnimatePresence>
                  )}
                </>
              ) : (
                <div className="aspect-square w-[60cqmin] rounded-full bg-muted xl:w-[70cqmin] 2xl:w-[80cqmin]" />
              )}
            </div>

            <div className="@container-size h-full max-h-190 transform-gpu self-center py-10 contain-content not-xl:pr-8">
              {lyrics?.length ? (
                <>
                  {open && (
                    <Lyrics
                      lyrics={lyrics}
                      render={
                        <motion.div
                          key={song.id}
                          animate={{ opacity: 1, y: 0 }}
                          initial={{ opacity: 0, y: 50 }}
                          transition={{
                            duration: 0.3
                          }}
                        />
                      }
                    />
                  )}
                </>
              ) : (
                <>{!isLoading ? <div className="flex h-full flex-col justify-center text-muted-foreground">未发现歌词</div> : null}</>
              )}
            </div>
          </div>

          <StatusBarPlaceholder />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
