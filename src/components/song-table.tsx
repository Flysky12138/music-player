'use client'

import {
  CellContext,
  createColumnHelper,
  createSortedRowModel,
  Header,
  metaHelper,
  ReactTable,
  rowSortingFeature,
  SortDirection,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable
} from '@tanstack/react-table'
import { convertFileSrc } from '@tauri-apps/api/core'
import { cn } from 'cn'
import { asyncNoop } from 'es-toolkit'
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, LucideIcon, PlayIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { useAsyncFn } from 'react-use'
import { useVirtualizer } from 'react-window'
import { useInfiniteLoader } from 'react-window-infinite-loader'

import { formatDuration } from '@/lib/format'
import { Song } from '@/lib/tauri/song'
import { usePlayerStore } from '@/store/player'

import { QualityBadge } from './quality-badge'
import { Button } from './ui/button'
import { Spinner } from './ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnMeta: metaHelper<{
    className?: string
    /**
     * 是否允许排序
     *
     * @description 由于列配置不能覆盖全局配置，因此额外添加这个属性，实现控制某列是否允许排序
     */
    enableSorting?: boolean
  }>(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    datetime: sortFn_datetime,
    text: sortFn_text
  }
})

const columnHelper = createColumnHelper<typeof features, Song>()
const titleCollator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' })

interface SongTableContextValue {
  /**
   * 当前行模型（已含排序）的歌曲
   *
   * 表头里也要「播放全部」。但表头上下文里的 `table` 是 table-core 内部的稳定实例，
   * 直接调用 `table.getRowModel()` 会被 React Compiler 按引用缓存成首次渲染的结果，
   * 因此改由 `SongTable` 通过 context 下发。
   */
  rows: Song[]
  /**
   * 播放全部。分页时已加载的行并非完整列表，因此由调用方注入获取完整列表的逻辑
   */
  playAll: () => Promise<void>
}

const SongTableContext = React.createContext<SongTableContextValue>({ playAll: asyncNoop, rows: [] })

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

export function SongTable({ hasMore, loadMoreRows = asyncNoop, playAll, songs }: SongTableProps) {
  const setPlaylist = usePlayerStore(state => state.setPlaylist)

  const [scrollElement, setScrollElement] = React.useState<HTMLDivElement | null>(null)
  const [tbody, setTbody] = React.useState<HTMLTableSectionElement | null>(null)

  const table = useTable({
    columns,
    data: songs,
    enableMultiSort: true,
    features
  })

  const rows = table.getRowModel().rows
  const rowSongs = React.useMemo(() => rows.map(row => row.original), [rows])

  const contextValue = React.useMemo<SongTableContextValue>(
    () => ({ playAll: playAll ?? (async () => setPlaylist(rowSongs)), rows: rowSongs }),
    [playAll, rowSongs, setPlaylist]
  )

  const onItemsRendered = useInfiniteLoader({
    loadMoreRows,
    rowCount: rows.length + (hasMore ? 1 : 0),
    isRowLoaded: index => index < rows.length || !hasMore
  })

  const { items, totalSize } = useVirtualizer({
    count: rows.length,
    element: tbody,
    itemSize: 60,
    scrollElement,
    onItemsRendered
  })

  const first = items[0]
  const last = items[items.length - 1]
  const spaceBefore = first ? first.offset : 0
  const spaceAfter = last ? totalSize - last.offset - last.size : 0

  return (
    <div
      ref={setScrollElement}
      className={cn('no-scrollbar size-full scroll-fade-b overflow-y-auto')}
      data-slot="song-table"
      style={{ scrollPaddingTop: 60 }}
    >
      <Table aria-rowcount={rows.length + 1} className="w-full table-fixed">
        <TableHeader className="sticky top-0 bg-background">
          <SongTableContext value={contextValue}>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} aria-rowindex={1} className="group/row">
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className={header.column.columnDef.meta?.className} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : header.column.columnDef.meta?.enableSorting ? (
                      <RowsSort header={header} table={table} />
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </SongTableContext>
        </TableHeader>

        <TableBody ref={setTbody}>
          {spaceBefore > 0 && <tr aria-hidden style={{ height: spaceBefore }} />}

          {items.map(({ index, size }) => {
            const row = rows[index]
            return (
              <TableRow key={row.id} aria-rowindex={index + 2} className="group/row" style={{ height: size }}>
                {row.getAllCells().map(cell => (
                  <TableCell
                    key={cell.id}
                    className={cn(cell.column.columnDef.meta?.className, {
                      'pl-5': cell.column.columnDef.meta?.enableSorting
                    })}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            )
          })}

          {spaceAfter > 0 && <tr aria-hidden style={{ height: spaceAfter }} />}
        </TableBody>
      </Table>
    </div>
  )
}

function BodyCellIndex({ row }: CellContext<typeof features, Song>) {
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
  const { playAll, rows } = React.use(SongTableContext)

  const [{ loading }, handlePlayAll] = useAsyncFn(async () => {
    await playAll()
  }, [playAll])

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

/**
 * 表头排序按钮
 */
function RowsSort({ header, table }: { header: Header<typeof features, Song>; table: ReactTable<typeof features, Song> }) {
  const record = React.useMemo<
    Record<'none' | SortDirection, { aria: React.AriaAttributes['aria-sort']; icon: LucideIcon; label: string; handler: (isMulti: boolean) => void }>
  >(
    () => ({
      asc: { aria: 'ascending', icon: ArrowUpIcon, label: '升序', handler: () => header.column.clearSorting() },
      desc: { aria: 'descending', icon: ArrowDownIcon, label: '降序', handler: isMulti => header.column.toggleSorting(false, isMulti) },
      none: { aria: 'none', icon: ChevronsUpDownIcon, label: '默认', handler: isMulti => header.column.toggleSorting(true, isMulti) }
    }),
    [header.column]
  )

  if (!header.column.getCanSort()) {
    return <table.FlexRender header={header} />
  }

  const { aria, handler, icon: Icon, label } = record[header.column.getIsSorted() || 'none']

  const sortIndex = header.column.getSortIndex()

  return (
    <Button
      aria-label={`${label}${sortIndex >= 0 ? `，第 ${sortIndex + 1} 排序条件` : ''}`}
      className="group w-full justify-start"
      title="按住 Shift 点击可添加多列排序"
      variant="ghost"
      onClick={event => {
        handler(event.shiftKey)
      }}
    >
      <table.FlexRender header={header} />
      <div
        className={cn('flex items-center text-muted-foreground transition-opacity group-hover:opacity-100', {
          'opacity-0': aria === 'none'
        })}
      >
        <Icon className="size-3" /> {label}
        {sortIndex >= 0 && <span className="text-xs">{sortIndex + 1}</span>}
      </div>
    </Button>
  )
}
