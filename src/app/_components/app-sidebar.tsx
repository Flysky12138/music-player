'use client'

import { cn } from 'cn'
import { ChartPieIcon, Disc2Icon, EighthNotesIcon, FolderIcon, MicVocalIcon, ScanSearchIcon, SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar'

/**
 * 侧边栏导航配置
 */
const NAV_GROUPS = [
  {
    title: '音乐',
    items: [
      { icon: <EighthNotesIcon />, title: '歌曲', url: '/song' },
      { icon: <Disc2Icon />, title: '专辑', url: '/album' },
      { icon: <MicVocalIcon />, title: '艺术家', url: '/artist' },
      { icon: <FolderIcon />, title: '文件夹', url: '/folder' }
      // { icon: <ListMusicIcon />, title: '歌单', url: '/playlist' }
    ]
  },
  {
    title: '其他',
    items: [
      { icon: <ChartPieIcon />, title: '统计', url: '/statistics' },
      { icon: <ScanSearchIcon />, title: '扫描', url: '/scan' },
      { icon: <SettingsIcon />, title: '设置', url: '/setting' }
    ]
  }
]

export function AppSidebar() {
  const pathname = usePathname()
  const { open } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="mt-2">
        {NAV_GROUPS.map(group => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map(item => (
                  <SidebarMenuItem key={item.title} className="has-focus-visible:z-10">
                    <SidebarMenuButton isActive={pathname === item.url} render={<Link href={item.url} />} tooltip={item.title}>
                      {item.icon}
                      <span
                        className={cn('text-clip!', 'transition-all transition-discrete duration-300', {
                          'hidden opacity-0': !open
                        })}
                      >
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

export function AppSidebarProvider({ children }: React.PropsWithChildren) {
  return (
    <SidebarProvider
      className="w-auto"
      style={
        {
          '--sidebar-width': '10rem'
        } as React.CSSProperties
      }
    >
      {children}
    </SidebarProvider>
  )
}
