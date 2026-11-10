'use client'

import { convertFileSrc } from '@tauri-apps/api/core'
import { cn } from 'cn'
import { MicVocalIcon, SearchIcon, XIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import { useImmer } from 'use-immer'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { listArtists } from '@/tauri/artist'

export default function Page() {
  const [state, setState] = useImmer({ keyword: '', search: '' })

  const { data: artists = [], isLoading } = useSWR(['01a192bf-1a32-76f1-90f1-3d3dc85c06fa', state.keyword], ([, keyword]) => listArtists(keyword))

  if ((isLoading || !artists.length) && !state.keyword) {
    return <p className="py-16 text-center text-muted-foreground">艺术家库还是空的，请先扫描音乐目录。</p>
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
              placeholder="搜索艺术家..."
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
          <Button aria-label="搜索" type="submit" variant="outline">
            <SearchIcon />
          </Button>
        </ButtonGroup>
      </form>

      {!artists.length && state.keyword ? (
        <p className="py-16 text-center text-muted-foreground">没有找到匹配的艺术家</p>
      ) : (
        <div
          className={cn(
            'no-scrollbar grid scroll-fade-y auto-rows-max overflow-y-auto p-px',
            'grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4',
            'xl:grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] xl:gap-6'
          )}
        >
          {artists.map(artist => (
            <Link key={artist.name} href={`/artist/details?name=${encodeURIComponent(artist.name)}`}>
              <Card className="shadow not-xl:[--card-spacing:--spacing(2.5)]">
                {artist.cover_path ? (
                  <Image
                    alt={artist.name}
                    className="aspect-square w-full object-cover dark:brightness-80"
                    height={200}
                    src={convertFileSrc(artist.cover_path)}
                    width={200}
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-muted text-muted-foreground">
                    <MicVocalIcon className="size-1/3" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="truncate not-xl:text-sm" title={artist.name}>
                    {artist.name}
                  </CardTitle>
                  <CardDescription className="truncate not-xl:text-xs">
                    {artist.album_count} 张专辑 · {artist.song_count} 首歌曲
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
