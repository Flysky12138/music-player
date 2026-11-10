'use client'

import { MicVocalIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'

import { PageContainer } from '@/components/page-container'
import { SongTable } from '@/components/song-table'
import { listArtistSongs } from '@/tauri/artist'

export default function Page() {
  const searchParams = useSearchParams()

  const name = searchParams.get('name')!

  const { data: songs = [] } = useSWR(['01a192cd-3697-7047-9531-dbd6503a0c30', name], ([, name]) => listArtistSongs(name))

  return (
    <PageContainer icon={<MicVocalIcon />} title={name}>
      <SongTable songs={songs} />
    </PageContainer>
  )
}
