'use client'

import { Disc2Icon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'

import { PageContainer } from '@/components/page-container'
import { SongTable } from '@/components/song-table'
import { listAlbumSongs } from '@/lib/tauri/album'

export default function Page() {
  const searchParams = useSearchParams()

  const name = searchParams.get('name')!

  const { data: songs = [] } = useSWR(['01a192c1-7923-7728-9ace-91676a146d02', name], ([, name]) => listAlbumSongs(name))

  return (
    <PageContainer icon={<Disc2Icon />} title={name}>
      <SongTable songs={songs} />
    </PageContainer>
  )
}
