'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import React from 'react'

export function ThemeProvider({ children }: React.PropsWithChildren) {
  return (
    <NextThemesProvider disableTransitionOnChange enableSystem attribute="class" defaultTheme="system">
      {children}
    </NextThemesProvider>
  )
}
