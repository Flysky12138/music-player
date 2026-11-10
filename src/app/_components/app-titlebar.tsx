'use client'

import { ChevronLeftIcon, MaximizeIcon, MinimizeIcon, MinusIcon, XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

import { Button } from '@/components/ui/button'
import { appWindow, isMacOS } from '@/lib/window'

export function AppTitlebar() {
  const router = useRouter()

  const [isMaximized, setIsMaximized] = React.useState(false)

  React.useEffect(() => {
    if (isMacOS) return

    let ignore = false

    const updateMaximized = async () => {
      try {
        const value = await appWindow.isMaximized()

        if (!ignore) {
          setIsMaximized(value)
        }
      } catch (error) {
        console.error('Failed to get window maximized state:', error)
      }
    }

    void updateMaximized()

    const unlistenPromise = appWindow.onResized(() => {
      void updateMaximized()
    })

    return () => {
      ignore = true
      void unlistenPromise.then(unlisten => unlisten())
    }
  }, [])

  const toggleMaximize = async () => {
    await appWindow.toggleMaximize()
    setIsMaximized(await appWindow.isMaximized())
  }

  return (
    <div data-tauri-drag-region className="flex h-titlebar shrink-0 items-center px-4" data-slot="app-titlebar">
      <Button
        aria-label="返回"
        size="icon-sm"
        variant="secondary"
        onClick={() => {
          router.back()
        }}
      >
        <ChevronLeftIcon />
      </Button>

      <div className="z-50 ml-auto flex gap-2 transition-opacity macos:hidden">
        <Button
          aria-label="最小化"
          className="bg-transparent! not-hover:opacity-50"
          size="icon"
          variant="ghost"
          onClick={() => {
            void appWindow.minimize()
          }}
        >
          <MinusIcon />
        </Button>
        <Button
          aria-label={isMaximized ? '恢复' : '最大化'}
          className="bg-transparent! not-hover:opacity-50"
          size="icon"
          variant="ghost"
          onClick={() => {
            void toggleMaximize()
          }}
        >
          {isMaximized ? <MinimizeIcon /> : <MaximizeIcon />}
        </Button>
        <Button
          aria-label="关闭"
          className="bg-transparent! not-hover:opacity-50"
          size="icon"
          variant="ghost"
          onClick={() => {
            void appWindow.close()
          }}
        >
          <XIcon />
        </Button>
      </div>
    </div>
  )
}
