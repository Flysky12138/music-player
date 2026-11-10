'use client'

import { FolderIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'

import { PageContainer } from '@/components/page-container'
import { SongTable } from '@/components/song-table'
import { listSongFolderSongs } from '@/tauri/song-folder'

export default function Page() {
  const searchParams = useSearchParams()

  const path = searchParams.get('path')!
  // 目录路径以分隔符结尾，取最后一段作为标题
  const name = path.split(/[\\/]/).filter(Boolean).at(-1) ?? path

  const { data: songs = [] } = useSWR(['01a1ab2f-dd18-733a-a441-e3c8a1b5c34f', path], ([, path]) => listSongFolderSongs(path))

  return (
    <PageContainer icon={<FolderIcon />} title={name}>
      <SongTable songs={songs} />
    </PageContainer>
  )
}
