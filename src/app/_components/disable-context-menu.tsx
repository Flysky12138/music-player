'use client'

import React from 'react'

/**
 * 打包后禁用 WebView 默认右键菜单，开发环境保留以便刷新和调试
 */
export function DisableContextMenu() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault()
    }

    window.addEventListener('contextmenu', handleContextMenu)

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  return null
}
