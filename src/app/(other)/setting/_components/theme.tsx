'use client'

import { MoonStarIcon, SunIcon, SunMoonIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Field, FieldLabel } from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useMounted } from '@/hooks/use-mounted'

export function Theme() {
  const { setTheme, theme = 'system' } = useTheme()

  const isMounted = useMounted()

  if (!isMounted) {
    return (
      <Field key={1} aria-disabled>
        <FieldLabel>主题</FieldLabel>
        <ToggleGroup size="sm" spacing={2} variant="outline">
          <ToggleGroupItem aria-label="亮色" size="lg" value="light">
            <SunIcon /> 亮色
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="暗色" size="lg" value="dark">
            <MoonStarIcon /> 暗色
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="跟随主题" size="lg" value="system">
            <SunMoonIcon /> 跟随系统
          </ToggleGroupItem>
        </ToggleGroup>
      </Field>
    )
  }

  return (
    <Field key={2}>
      <FieldLabel>主题</FieldLabel>
      <ToggleGroup size="sm" spacing={2} value={[theme]} variant="outline" onValueChange={value => setTheme(value[0])}>
        <ToggleGroupItem aria-label="亮色" size="lg" value="light">
          <SunIcon /> 亮色
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="暗色" size="lg" value="dark">
          <MoonStarIcon /> 暗色
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="跟随主题" size="lg" value="system">
          <SunMoonIcon /> 跟随系统
        </ToggleGroupItem>
      </ToggleGroup>
    </Field>
  )
}
