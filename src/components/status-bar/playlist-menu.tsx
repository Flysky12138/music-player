'use client'

import { cn } from 'cn'
import { pick } from 'es-toolkit'
import { ListVideoIcon, XIcon } from 'lucide-react'
import { List, RowComponentProps, useListRef } from 'react-window'
import { useShallow } from 'zustand/shallow'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { PlayerStore, usePlayerStore } from '@/store/player'
import { Song } from '@/tauri/song'

const PLAYLIST_ROW_HEIGHT = 32
const PLAYLIST_MAX_VISIBLE_ROWS = 8

export function PlayListMenu() {
  const listRef = useListRef(null)

  const { currentIndex, playlist, removeFromPlaylist, setCurrentSong } = usePlayerStore(
    useShallow(state => ({
      currentIndex: state.playOrder[state.currentIndex] ?? -1,
      ...pick(state, ['playlist', 'removeFromPlaylist', 'setCurrentSong'])
    }))
  )

  if (playlist.length <= 1) return null

  return (
    <DropdownMenu
      onOpenChangeComplete={newOpen => {
        if (!newOpen) return

        const list = listRef.current
        if (!list || currentIndex < 0 || currentIndex >= playlist.length) return

        list.scrollToRow({
          align: 'center',
          behavior: 'smooth',
          index: currentIndex
        })
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button aria-label="播放列表" size="icon" variant="ghost">
            <ListVideoIcon />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-52 min-w-auto" side="top">
        <DropdownMenuGroup
          render={
            <List
              className="no-scrollbar"
              listRef={listRef}
              rowComponent={PlayListRowComponent}
              rowCount={playlist.length}
              rowHeight={PLAYLIST_ROW_HEIGHT}
              rowProps={{
                currentIndex,
                playlist,
                removeFromPlaylist,
                setCurrentSong
              }}
              style={{
                height: Math.min(playlist.length, PLAYLIST_MAX_VISIBLE_ROWS) * PLAYLIST_ROW_HEIGHT
              }}
            />
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PlayListRowComponent({
  ariaAttributes,
  currentIndex,
  index,
  playlist,
  removeFromPlaylist,
  setCurrentSong,
  style
}: RowComponentProps<
  Pick<PlayerStore, 'removeFromPlaylist' | 'setCurrentSong'> & {
    currentIndex: number
    playlist: Song[]
  }
>) {
  const song = playlist[index]

  return (
    <DropdownMenuItem
      key={song.id}
      className="group"
      style={style}
      {...ariaAttributes}
      onClick={() => {
        setCurrentSong(song.id)
      }}
    >
      <div
        className={cn('flex gap-2 truncate', {
          '**:text-blue-500!': index === currentIndex
        })}
      >
        <p className="shrink-0 tabular-nums">{String(index + 1).padStart(String(playlist.length).length, '0')}.</p>
        <p className="truncate">{song.title}</p>
      </div>
      <DropdownMenuShortcut className="hidden group-hover:inline">
        <Button
          aria-label="删除"
          size="icon-xs"
          variant="ghost"
          onClick={event => {
            event.stopPropagation()
            removeFromPlaylist(song.id)
          }}
        >
          <XIcon />
        </Button>
      </DropdownMenuShortcut>
    </DropdownMenuItem>
  )
}
