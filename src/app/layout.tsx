import '@/globals.css'

import { cn } from 'cn'
import { Geist_Mono, Inter } from 'next/font/google'
import { SWRConfig } from 'swr'

import { StatusBar, StatusBarPlaceholder } from '@/components/status-bar'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AudioProvider } from '@/provider/audio-provider'
import { PlaylistPersistence } from '@/provider/playlist-persistence'

import { AppSidebar, AppSidebarProvider } from './_components/app-sidebar'
import { AppTitlebar } from './_components/app-titlebar'
import { DisableContextMenu } from './_components/disable-context-menu'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans'
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono'
})

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html suppressHydrationWarning className={cn('h-full antialiased', geistMono.variable, inter.variable)} lang="zh-CN">
      <body className="flex h-full">
        <DisableContextMenu />
        <PlaylistPersistence />
        <ThemeProvider>
          <Toaster position="top-center" />
          <SWRConfig
            value={{
              revalidateOnFocus: false,
              revalidateOnReconnect: false
            }}
          >
            <TooltipProvider>
              <AppSidebarProvider>
                <AppSidebar />
              </AppSidebarProvider>
              <div className="flex w-full flex-col">
                <AppTitlebar />
                <div className="size-full overflow-hidden px-4 py-6">{children}</div>
                <StatusBarPlaceholder offset={-24} />
              </div>
              <AudioProvider>
                <StatusBar />
              </AudioProvider>
            </TooltipProvider>
          </SWRConfig>
        </ThemeProvider>
      </body>
    </html>
  )
}
