'use client'

import { mergeProps, useRender } from '@base-ui/react'
import { cn } from 'cn'
import React from 'react'

import { parseLyric } from '@/lib/format'
import { usePlayerProgress } from '@/provider/audio-provider'

interface LyricsProps {
  lyrics?: ReturnType<typeof parseLyric>
  render?: useRender.RenderProp
}

/**
 * 歌词列表：根据播放进度高亮并滚动到当前歌词
 */
export function Lyrics({ lyrics, render }: LyricsProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const activeLineRef = React.useRef<HTMLParagraphElement>(null)

  // 鼠标是否停在歌词上：停住阅读时不打断用户
  const hoveringRef = React.useRef(false)
  // 用户手动滚动后，延迟恢复自动跟随的计时器
  const resumeTimerRef = React.useRef<null | ReturnType<typeof setTimeout>>(null)
  // 是否已完成首次定位：首次用瞬时滚动，之后才用平滑滚动
  const locatedRef = React.useRef(false)

  const [paused, setPaused] = React.useState(false)

  const { currentTime } = usePlayerProgress()

  // 歌词按时间升序排列，取最后一条时间不超过当前进度的歌词；返回 -1 表示还没到第一条
  const activeIndex = React.useMemo(() => {
    if (!lyrics) return -1
    return lyrics.findLastIndex(line => line.time <= currentTime)
  }, [currentTime, lyrics])

  /**
   * 把当前歌词滚动到容器垂直中间。
   *
   * 用容器与行的位置差自己算 `scrollTop`，避免 `scrollIntoView` 连带滚动外层容器；
   * 弹窗刚打开、内容还是 `hidden` 时容器高度为 0，此时返回 `false` 交给 ResizeObserver 重试。
   */
  const scrollToActive = React.useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = scrollRef.current
    const line = activeLineRef.current

    if (!container || !line || container.clientHeight === 0) return false

    const containerRect = container.getBoundingClientRect()
    const lineRect = line.getBoundingClientRect()
    const offset = lineRect.top - containerRect.top - (container.clientHeight - lineRect.height) / 2

    container.scrollTo({ behavior, top: container.scrollTop + offset })

    return true
  }, [])

  // 清理计时器
  const cancelResume = React.useCallback(() => {
    if (resumeTimerRef.current === null) return

    clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = null
  }, [])

  // 用户滚动/触摸时暂停跟随，停止操作 3 秒后再定位一次
  const pauseFollowing = React.useCallback(() => {
    setPaused(true)
    cancelResume()

    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null

      // 鼠标还在歌词上就只定位一次，避免持续跟随打断阅读
      if (hoveringRef.current) {
        scrollToActive()
        return
      }

      setPaused(false)
    }, 3000)
  }, [cancelResume, scrollToActive])

  // 卸载时清理未触发的计时器
  React.useEffect(() => cancelResume, [cancelResume])

  // 在首帧绘制前完成定位，避免先看到开头再跳过去
  React.useLayoutEffect(() => {
    if (paused || activeIndex < 0) return

    if (scrollToActive(locatedRef.current ? 'smooth' : 'auto')) {
      locatedRef.current = true
    }
  }, [activeIndex, paused, scrollToActive])

  /**
   * 容器尺寸变化后重新居中当前歌词，覆盖三种情况：
   *
   * - 弹窗刚打开时内容还是 `hidden`，容器高度为 0，等真正有尺寸后再补一次定位；
   * - 窗口缩放导致容器高度变化，原来的居中位置失效；
   * - 歌词异步加载完成后列表高度变化。
   */
  React.useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    let frame: null | number = null

    // 连续缩放时合并到下一帧，避免每帧都重算
    const reposition = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
      }

      frame = requestAnimationFrame(() => {
        frame = null

        if (scrollToActive('auto')) {
          locatedRef.current = true
        }
      })
    }

    const observer = new ResizeObserver(reposition)
    observer.observe(container)

    // 窗口宽度变化会让歌词重新折行，容器高度却可能不变，所以单独监听窗口尺寸
    window.addEventListener('resize', reposition)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', reposition)

      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
    }
  }, [scrollToActive])

  const defaultsProps = React.useMemo<useRender.ElementProps<'div'>>(
    () => ({
      className: cn('no-scrollbar grid h-full scroll-fade-y gap-4 overflow-y-auto py-[50cqh] text-lg 2xl:gap-6 2xl:text-2xl'),
      children: lyrics?.map((line, index) => (
        <p
          key={index}
          ref={index === activeIndex ? activeLineRef : null}
          className={cn('transition-colors', {
            'text-[1.4em] font-bold text-foreground': index === activeIndex,
            'text-muted-foreground': index !== activeIndex
          })}
        >
          {line.text}
        </p>
      )),
      onTouchMove: pauseFollowing,
      onWheel: pauseFollowing,
      onPointerEnter: () => {
        hoveringRef.current = true
        cancelResume()
        setPaused(true)
      },
      onPointerLeave: () => {
        hoveringRef.current = false
        cancelResume()
        setPaused(false)
      }
    }),
    [activeIndex, cancelResume, lyrics, pauseFollowing]
  )

  return useRender({
    defaultTagName: 'div',
    // eslint-disable-next-line react-hooks/refs
    props: mergeProps<'div'>(defaultsProps, {}),
    ref: scrollRef,
    render
  })
}
