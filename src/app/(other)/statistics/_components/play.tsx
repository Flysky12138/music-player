'use client'

import { convertFileSrc } from '@tauri-apps/api/core'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayStatistics } from '@/lib/tauri/statistics'

/**
 * 播放统计：概览数字 + 播放次数排行
 */
export function Play({ data }: { data: PlayStatistics }) {
  const overview = [
    { label: '今日', value: data.today },
    { label: '近 7 天', value: data.week },
    { label: '累计', value: data.total }
  ]

  return (
    <div className="flex flex-col gap-inherit">
      <Card>
        <CardHeader>
          <CardTitle>播放概览</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          {overview.map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="font-heading text-2xl font-semibold tabular-nums">{value.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">次播放</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="grow">
        <CardHeader>
          <CardTitle>最常播放</CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          {data.top_songs.length === 0 ? (
            <p className="flex size-full items-center justify-center pb-8 text-muted-foreground">还没有播放记录</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {data.top_songs.map(song => (
                <li key={song.song_id} className="flex items-center gap-3">
                  {song.cover_path ? (
                    <Image
                      alt={song.title}
                      className="size-9 shrink-0 rounded-sm object-cover"
                      height={36}
                      src={convertFileSrc(song.cover_path)}
                      width={36}
                    />
                  ) : (
                    <div className="size-9 shrink-0 rounded-sm bg-muted" />
                  )}
                  <div className="grid grow">
                    <p className="truncate">{song.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
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
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{song.play_count.toLocaleString()} 次</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
