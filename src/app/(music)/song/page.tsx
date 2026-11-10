'use client'

import { cn } from 'cn'
import { SearchIcon, XIcon } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'
import useSWRInfinite from 'swr/infinite'
import { useImmer } from 'use-immer'

import { SongTable } from '@/components/song-table'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { usePlayerStore } from '@/store/player'
import { listAllSongs, listSongs } from '@/tauri/song'

export default function Page() {
  const setPlaylist = usePlayerStore(state => state.setPlaylist)

  const [state, setState] = useImmer({ keyword: '', search: '' })

  const {
    data = [],
    isLoading,
    setSize
  } = useSWRInfinite(
    (pageIndex, previousPageData) => {
      if (previousPageData && !previousPageData.has_more) return null
      return [pageIndex, state.keyword, '01a1a01b-bf95-761d-93eb-85a52b74a463']
    },
    async ([page, keyword]) => listSongs({ keyword, page: page + 1, pageSize: 30 }),
    {
      fallbackData: [] as Awaited<ReturnType<typeof listSongs>>[]
    }
  )
  const songs = React.useMemo(() => data.flatMap(item => item.items), [data])
  const hasMore = data.at(-1)?.has_more ?? false

  if ((isLoading || !songs.length) && !state.keyword) {
    return <p className="py-16 text-center text-muted-foreground">音乐库还是空的，请先扫描音乐目录。</p>
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <form
        onSubmit={event => {
          event.preventDefault()
          setState(draft => {
            draft.keyword = draft.search.trim()
          })
        }}
      >
        <ButtonGroup className="w-80">
          <InputGroup>
            <InputGroupInput
              autoComplete="off"
              placeholder="Search..."
              value={state.search}
              onChange={event => {
                setState(draft => {
                  draft.search = event.target.value
                })
              }}
            />
            <InputGroupAddon
              align="inline-end"
              className={cn({
                hidden: !state.search
              })}
            >
              <InputGroupButton
                aria-label="清除"
                size="icon-xs"
                onClick={() => {
                  setState({ keyword: '', search: '' })
                }}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <Button aria-label="Search" type="submit" variant="outline">
            <SearchIcon />
          </Button>
        </ButtonGroup>
      </form>

      {songs.length && !state.keyword ? (
        <SongTable
          hasMore={hasMore}
          loadMoreRows={async () => {
            await setSize(size => size + 1)
          }}
          playAll={async () => {
            try {
              const allSongs = await listAllSongs({ keyword: state.keyword })
              if (allSongs.length === 0) return
              setPlaylist(allSongs)
            } catch (error) {
              toast.error(String(error))
            }
          }}
          songs={songs}
        />
      ) : (
        <p className="py-16 text-center text-muted-foreground">没有找到匹配的歌曲</p>
      )}
    </div>
  )
}
