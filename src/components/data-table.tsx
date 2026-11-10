'use client'

import {
  ColumnDef,
  createSortedRowModel,
  Header,
  metaHelper,
  ReactTable,
  RowData,
  rowSortingFeature,
  SortDirection,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable
} from '@tanstack/react-table'
import { cn } from 'cn'
import { asyncNoop } from 'es-toolkit'
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, LucideIcon } from 'lucide-react'
import React from 'react'
import { useVirtualizer } from 'react-window'
import { useInfiniteLoader } from 'react-window-infinite-loader'

import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

/**
 * 行高。虚拟列表按固定行高估算行偏移，需要与行的实际高度保持一致
 */
const ROW_HEIGHT = 60

/**
 * 列定义上的通用元信息
 */
interface DataTableColumnMeta {
  /**
   * 单元格与表头的额外类名
   */
  className?: string
  /**
   * 是否允许排序
   *
   * 由于列配置不能覆盖全局配置，因此额外添加这个属性，实现控制某列是否允许排序
   */
  enableSorting?: boolean
}

/**
 * 通用表格能力
 */
export const dataTableFeatures = tableFeatures({
  columnMeta: metaHelper<DataTableColumnMeta>(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    datetime: sortFn_datetime,
    text: sortFn_text
  }
})

interface DataTableContextValue {
  /**
   * 当前行模型（已排序）的数据
   *
   * 表头里同样可能需要全部行。但表头上下文里的 `table` 是 table-core 内部的稳定实例，
   * 直接调用 `table.getRowModel()` 会被 React Compiler 按引用缓存成首次渲染的结果，
   * 因此改由 `DataTable` 通过 context 下发。
   */
  rows: readonly unknown[]
}

export const DataTableContext = React.createContext<DataTableContextValue>({ rows: [] })

interface DataTableProps<TData extends RowData> {
  /**
   * 列定义
   */
  columns: readonly ColumnDef<typeof dataTableFeatures, TData, any>[]
  /**
   * 原始数据，排序由表格内部处理
   */
  data: TData[]
  /**
   * 是否还有未加载的数据
   */
  hasMore?: boolean
  /**
   * 滚动到底部附近时触发加载下一页；不传则只渲染已有数据
   */
  loadMoreRows?: () => Promise<void>
}

/**
 * 通用表格模板：滚动容器 + 虚拟列表 + 无限加载，列定义与数据由调用方提供
 */
export function DataTable<TData extends RowData>({ columns, data, hasMore = false, loadMoreRows = asyncNoop }: DataTableProps<TData>) {
  const [scrollElement, setScrollElement] = React.useState<HTMLDivElement | null>(null)
  const [tbody, setTbody] = React.useState<HTMLTableSectionElement | null>(null)

  const table = useTable({
    columns,
    data,
    enableMultiSort: true,
    features: dataTableFeatures
  })

  const rows = table.getRowModel().rows

  const contextValue = React.useMemo<DataTableContextValue>(() => ({ rows: rows.map(row => row.original) }), [rows])

  const onItemsRendered = useInfiniteLoader({
    loadMoreRows,
    rowCount: rows.length + (hasMore ? 1 : 0),
    isRowLoaded: index => index < rows.length || !hasMore
  })

  const { items, totalSize } = useVirtualizer({
    count: rows.length,
    element: tbody,
    itemSize: ROW_HEIGHT,
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
      className="no-scrollbar size-full scroll-fade-b overflow-y-auto"
      data-slot="data-table"
      style={{ scrollPaddingTop: ROW_HEIGHT }}
    >
      <Table aria-rowcount={rows.length + 1} className="w-full table-fixed">
        <TableHeader className="sticky top-0 bg-background">
          <DataTableContext value={contextValue}>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} aria-rowindex={1} className="group/row">
                {headerGroup.headers.map(header => {
                  const meta = columnMeta(header.column.columnDef.meta)

                  return (
                    <TableHead key={header.id} className={meta.className} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : meta.enableSorting ? (
                        <DataTableSortHeader header={header} table={table} />
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </DataTableContext>
        </TableHeader>

        <TableBody ref={setTbody}>
          {spaceBefore > 0 && <tr aria-hidden style={{ height: spaceBefore }} />}

          {items.map(({ index, size }) => {
            const row = rows[index]

            return (
              <TableRow key={row.id} aria-rowindex={index + 2} className="group/row" style={{ height: size }}>
                {row.getAllCells().map(cell => {
                  const meta = columnMeta(cell.column.columnDef.meta)

                  return (
                    <TableCell key={cell.id} className={cn(meta.className, { 'pl-5': meta.enableSorting })}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}

          {spaceAfter > 0 && <tr aria-hidden style={{ height: spaceAfter }} />}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * 读取列定义上的通用元信息
 */
function columnMeta(meta: unknown): DataTableColumnMeta {
  return meta ?? {}
}

/**
 * 可排序的表头按钮：升序 → 降序 → 默认循环，按住 Shift 点击可叠加多列排序
 */
function DataTableSortHeader<TData extends RowData>({
  header,
  table
}: {
  header: Header<typeof dataTableFeatures, TData>
  table: ReactTable<typeof dataTableFeatures, TData>
}) {
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
