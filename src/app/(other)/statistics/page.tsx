'use client'

import useSwr from 'swr'

import { PageContainer } from '@/components/page-container'
import { getLibraryStatistics } from '@/tauri/statistics'

import { Play } from './_components/play'
import { Quality } from './_components/quality'

export default function Page() {
  const { data } = useSwr('01a19620-1d51-7288-8428-66cb4c746c8f', getLibraryStatistics, {
    refreshInterval: 5_000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    fallbackData: {
      play: {
        today: 0,
        top_songs: [],
        total: 0,
        week: 0
      },
      quality: {
        hq: 0,
        hr: 0,
        sq: 0,
        unknown: 0
      }
    }
  })

  return (
    <PageContainer title="统计">
      <div className="grid grid-cols-2 gap-4">
        <Play data={data.play} />
        <Quality data={data.quality} />
      </div>
    </PageContainer>
  )
}
