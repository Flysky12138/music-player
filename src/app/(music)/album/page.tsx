'use client'

import { convertFileSrc } from '@tauri-apps/api/core'
import { cn } from 'cn'
import { SearchIcon, XIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import useSWR from 'swr'
import { useImmer } from 'use-immer'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { listAlbums } from '@/tauri/album'

export default function Page() {
  const router = useRouter()

  const [state, setState] = useImmer({ keyword: '', search: '' })

  const { data: albums = [], isLoading } = useSWR(['01a1926d-d62f-718c-afe4-d3b0656d6d24', state.keyword], ([, keyword]) => listAlbums(keyword))

  if ((isLoading || !albums.length) && !state.keyword) {
    return <p className="py-16 text-center text-muted-foreground">专辑库还是空的，请先扫描音乐目录。</p>
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
              placeholder="搜索专辑或艺术家..."
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

      {!albums.length && state.keyword ? (
        <p className="py-16 text-center text-muted-foreground">没有找到匹配的专辑</p>
      ) : (
        <div
          className={cn(
            'no-scrollbar grid scroll-fade-y auto-rows-max overflow-y-auto p-px',
            'grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4',
            'xl:grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] xl:gap-6'
          )}
        >
          {albums.map(album => (
            <Card
              key={album.name}
              className="shadow not-xl:[--card-spacing:--spacing(2.5)]"
              role="button"
              onClick={() => {
                router.push(`/album/details?name=${encodeURIComponent(album.name)}`)
              }}
            >
              {album.cover_path ? (
                <Image
                  alt={album.name}
                  className="w-full object-cover dark:brightness-80"
                  height={200}
                  src={convertFileSrc(album.cover_path)}
                  width={200}
                />
              ) : (
                <div className="aspect-square w-full bg-muted" />
              )}
              <CardHeader>
                <CardTitle className="truncate not-xl:text-sm" title={album.name}>
                  {album.name}
                </CardTitle>
                <CardDescription className="truncate not-xl:text-xs">
                  <span>{album.song_count} 首</span>
                  {[...album.artist].reverse().map((artist, index) => (
                    <React.Fragment key={artist}>
                      {index > 0 ? ', ' : ' · '}
                      <Link
                        className="link"
                        href={`/artist/details?name=${encodeURIComponent(artist)}`}
                        onClick={event => {
                          event.stopPropagation()
                        }}
                      >
                        {artist}
                      </Link>
                    </React.Fragment>
                  ))}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
