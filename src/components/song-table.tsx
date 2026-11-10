'use client'

import { CellContext, createColumnHelper } from '@tanstack/react-table'
import { convertFileSrc } from '@tauri-apps/api/core'
import { cn } from 'cn'
import { PlayIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { useAsyncFn } from 'react-use'

import { formatDuration } from '@/lib/format'
import { usePlayerStore } from '@/store/player'
import { Song } from '@/tauri/song'

import { DataTable, DataTableContext, dataTableFeatures } from './data-table'
import { QualityBadge } from './quality-badge'
import { Button } from './ui/button'
import { Spinner } from './ui/spinner'

const columnHelper = createColumnHelper<typeof dataTableFeatures, Song>()
const titleCollator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' })

interface SongTableContextValue {
  /**
   * 播放全部。分页时已加载的行并非完整列表，需要完整列表时由调用方注入；不传则播放已加载的行
   */
  playAll?: () => Promise<void>
}

const SongTableContext = React.createContext<SongTableContextValue>({})

const columns = columnHelper.columns([
  columnHelper.display({
    cell: BodyCellIndex,
    header: HeaderCellIndex,
    id: 'index',
    meta: {
      className: cn('w-12 text-center tabular-nums')
    }
  }),
  columnHelper.accessor('title', {
    header: '标题',
    meta: {
      enableSorting: true
    },
    sortFn: (rowA, rowB, columnId) => titleCollator.compare(rowA.getValue(columnId), rowB.getValue(columnId)),
    cell: ({ cell }) => {
      const song = cell.row.original
      return (
        <div className="flex items-center gap-2">
          {song.cover_path ? (
            <Image alt={song.title} className="shrink-0 rounded-sm" height={40} src={convertFileSrc(song.cover_path)} width={40} />
          ) : (
            <div className="size-10 shrink-0 rounded-sm bg-muted" />
          )}
          <div className="grid">
            <p className="truncate">{song.title}</p>
            <div className="flex items-center gap-1 overflow-hidden">
              <QualityBadge quality={song.quality} />
              <p className="truncate text-muted-foreground">
                {song.artist.map((artist, index) => (
                  <React.Fragment key={artist}>
                    {index > 0 && <span>, </span>}
                    <Link className="link" href={`/artist/details?name=${encodeURIComponent(artist)}`}>
                      {artist}
                    </Link>
                  </React.Fragment>
                ))}
              </p>
            </div>
          </div>
        </div>
      )
    }
  }),
  columnHelper.accessor('album', {
    header: '专辑',
    meta: {
      className: cn('truncate'),
      enableSorting: true
    },
    cell: ({ cell }) => {
      const album = cell.getValue()
      if (!album) return null
      return (
        <Link className="link" href={`/album/details?name=${encodeURIComponent(album)}`}>
          {album}
        </Link>
      )
    }
  }),
  columnHelper.accessor('duration_ms', {
    header: '时长',
    sortFn: 'datetime',
    meta: {
      className: cn('w-30 tabular-nums'),
      enableSorting: true
    },
    cell: ({ cell }) => {
      const duration = cell.getValue<number>()
      if (!duration) return null
      return formatDuration(duration)
    }
  })
])

interface SongTableProps {
  /**
   * 是否还有未加载的数据
   */
  hasMore?: boolean
  songs: Song[]
  /**
   * 滚动到底部附近时触发加载下一页；不传则只渲染已有数据
   */
  loadMoreRows?: () => Promise<void>
  /**
   * 播放全部。分页数据只包含已加载的行，需要完整列表时由调用方自行获取；不传则直接播放已加载的行
   */
  playAll?: () => Promise<void>
}

export function SongTable({ hasMore, loadMoreRows, playAll, songs }: SongTableProps) {
  const contextValue = React.useMemo<SongTableContextValue>(() => ({ playAll }), [playAll])

  return (
    <SongTableContext value={contextValue}>
      <DataTable columns={columns} data={songs} hasMore={hasMore} loadMoreRows={loadMoreRows} />
    </SongTableContext>
  )
}

function BodyCellIndex({ row }: CellContext<typeof dataTableFeatures, Song>) {
  const setPlaylist = usePlayerStore(state => state.setPlaylist)

  return (
    <>
      <span className="group-hover/row:hidden">{String(row.getDisplayIndex() + 1).padStart(2, '0')}</span>
      <Button
        aria-label="播放"
        className="inline-flex not-group-hover/row:hidden"
        size="icon"
        variant="ghost"
        onClick={() => {
          setPlaylist([row.original])
        }}
      >
        <PlayIcon />
      </Button>
    </>
  )
}

function HeaderCellIndex() {
  const rows = React.use(DataTableContext).rows as Song[]
  const { playAll } = React.use(SongTableContext)

  const setPlaylist = usePlayerStore(state => state.setPlaylist)

  const [{ loading }, handlePlayAll] = useAsyncFn(async () => {
    if (playAll) {
      await playAll()
      return
    }

    setPlaylist(rows)
  }, [playAll, rows, setPlaylist])

  return (
    <>
      <span className="group-hover/row:hidden">#</span>
      <Button
        aria-label="播放全部"
        className="inline-flex not-group-hover/row:hidden"
        disabled={rows.length === 0 || loading}
        size="icon"
        variant="ghost"
        onClick={() => {
          void handlePlayAll()
        }}
      >
        {loading ? <Spinner /> : <PlayIcon />}
      </Button>
    </>
  )
}
