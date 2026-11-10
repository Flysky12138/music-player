'use client'

import { convertFileSrc } from '@tauri-apps/api/core'
import { cn } from 'cn'
import { FolderIcon, SearchIcon, XIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import { useImmer } from 'use-immer'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { listSongFolders } from '@/tauri/song-folder'

export default function Page() {
  const [state, setState] = useImmer({ keyword: '', search: '' })

  const { data: folders = [], isLoading } = useSWR(['01a1ab30-a454-72c1-bbba-1111b58f93f7', state.keyword], ([, keyword]) => listSongFolders(keyword))

  if ((isLoading || !folders.length) && !state.keyword) {
    return <p className="py-16 text-center text-muted-foreground">文件夹还是空的，请先扫描音乐目录。</p>
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
              placeholder="搜索文件夹..."
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

      {!folders.length && state.keyword ? (
        <p className="py-16 text-center text-muted-foreground">没有找到匹配的文件夹</p>
      ) : (
        <div
          className={cn(
            'no-scrollbar grid scroll-fade-y auto-rows-max overflow-y-auto p-px',
            'grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4',
            'xl:grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] xl:gap-6'
          )}
        >
          {folders.map(folder => (
            <Link key={folder.path} href={`/folder/details?path=${encodeURIComponent(folder.path)}`}>
              <Card className="shadow not-xl:[--card-spacing:--spacing(2.5)]">
                {folder.cover_path ? (
                  <Image
                    alt={folder.name}
                    className="aspect-square w-full object-cover dark:brightness-80"
                    height={200}
                    src={convertFileSrc(folder.cover_path)}
                    width={200}
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-muted text-muted-foreground">
                    <FolderIcon className="size-1/3" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="truncate not-xl:text-sm" title={folder.path}>
                    {folder.name}
                  </CardTitle>
                  <CardDescription className="truncate not-xl:text-xs">{folder.song_count} 首歌曲</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
