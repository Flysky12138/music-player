'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import useSWR from 'swr'

import { listSongs } from '@/tauri/song'

export default function Page() {
  const router = useRouter()

  useSWR('01a1a0f5-e22d-7449-aa86-3dc07218ac6f', () => listSongs({ page: 1, pageSize: 1 }), {
    onSuccess({ total }) {
      if (total) {
        router.replace('/song')
      } else {
        router.replace('/scan')
        toast.warning('没有歌曲，请添加目录后扫描！', {
          richColors: true
        })
      }
    }
  })

  return null
}
