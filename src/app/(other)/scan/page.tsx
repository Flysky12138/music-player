'use client'

import { PlusIcon, XIcon } from 'lucide-react'
import React from 'react'
import { useAsyncFn } from 'react-use'
import { toast } from 'sonner'
import useSWR from 'swr'

import { PageContainer } from '@/components/page-container'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Spinner } from '@/components/ui/spinner'
import { pickDirectory } from '@/tauri/dialog'
import { scanLibrary } from '@/tauri/library'
import { addMusicFolder, listMusicFolders, removeMusicFolder } from '@/tauri/music-folder'
import { openDirectory } from '@/tauri/system'

const TOAST_ID = '01a19104-6ba2-760a-81cc-938a76e13f91'

export default function Page() {
  const { data: folders = [], isLoading, mutate } = useSWR('01a190db-72ff-7786-8e44-5f3613d9cefc', listMusicFolders)

  const handleAddFolder = async () => {
    try {
      const path = await pickDirectory('选择音乐目录')

      if (!path) return

      await addMusicFolder(path)
      await mutate()
    } catch (error) {
      toast.error(String(error))
    }
  }

  const handleRemoveFolder = async (id: number) => {
    try {
      await removeMusicFolder(id)
      await mutate()
    } catch (error) {
      toast.error(String(error))
    }
  }

  const [state, handleScan] = useAsyncFn(async () => {
    await toast
      .promise(scanLibrary(), {
        duration: 8000,
        error: String,
        id: TOAST_ID,
        loading: '正在扫描',
        success: data => (
          <div className="space-y-2">
            <p>
              扫描了 <span className="font-bold">{data.folder_count}</span> 个目录，发现 <span className="font-bold">{data.discovered}</span>{' '}
              个音乐文件；
            </p>
            <p>
              其中 <span className="font-bold text-green-500">{data.indexed}</span> 个成功入库，
              <span className="font-bold text-blue-500">{data.unchanged}</span> 个未变化，
              <span className="font-bold text-amber-500">{data.removed}</span> 个被清理，
              <span className="font-bold text-red-500">{data.failed}</span> 个处理失败。
            </p>
          </div>
        )
      })
      .unwrap()
  })

  React.useEffect(() => {
    return () => {
      toast.dismiss(TOAST_ID)
    }
  }, [])

  return (
    <PageContainer title="扫描">
      <div className="grid gap-6">
        <div className="grid gap-1">
          {folders.map((folder, index) => (
            <ButtonGroup key={folder.id} className="grid grid-cols-[3ch_1fr_auto]">
              <Button className="pointer-events-none" variant="secondary">
                {index + 1}
              </Button>
              <Button
                aria-label="打开目录"
                className="block truncate"
                variant="secondary"
                onClick={() => {
                  void openDirectory(folder.path)
                }}
              >
                {folder.path}
              </Button>
              <Button
                aria-label="删除"
                variant="destructive"
                onClick={() => {
                  void handleRemoveFolder(folder.id)
                }}
              >
                <XIcon />
              </Button>
            </ButtonGroup>
          ))}
          <Button
            className="w-40 transition-none not-first:mt-1"
            disabled={isLoading}
            variant="outline"
            onClick={() => {
              void handleAddFolder()
            }}
          >
            {isLoading && folders.length === 0 ? (
              <>
                <Spinner /> 加载中
              </>
            ) : (
              <>
                <PlusIcon /> 添加文件夹
              </>
            )}
          </Button>
        </div>

        <Button
          disabled={folders.length === 0 || state.loading}
          size="lg"
          onClick={() => {
            void handleScan()
          }}
        >
          {state.loading ? (
            <>
              <Spinner /> 正在扫描
            </>
          ) : (
            '开始扫描'
          )}
        </Button>
      </div>
    </PageContainer>
  )
}
