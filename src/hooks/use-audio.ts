import { clamp, noop } from 'es-toolkit'
import React from 'react'

interface UseAudioOptions {
  /**
   * 播放结束后自动重播当前歌曲，此时不会触发 `onEnded`
   */
  loop?: boolean
  /**
   * 音量，取值 0 ~ 1
   */
  volume?: number
  /**
   * 播放结束回调
   */
  onEnded?: () => void
  /**
   * 音频加载或解码失败（例如文件已被删除）
   */
  onError?: () => void
}

export function useAudio(src?: null | string, { loop = false, volume = 1, onEnded, onError }: UseAudioOptions = {}) {
  /**
   * 用户是否希望播放，切换歌曲时据此决定是否续播。
   * 与 `playing`（元素真实状态）分开，避免暂停事件覆盖用户意图。
   */
  const shouldPlayRef = React.useRef(false)
  const volumeRef = React.useRef(clamp(volume, 0, 1))
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const [playing, setPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)

  const onEndedEvent = React.useEffectEvent(onEnded ?? noop)
  const onErrorEvent = React.useEffectEvent(onError ?? noop)

  React.useEffect(() => {
    const audio = new Audio()

    audio.volume = volumeRef.current
    audioRef.current = audio

    const handlePlay = () => setPlaying(true)
    const handlePause = () => setPlaying(false)
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration || 0)
    const handleEnded = () => {
      setPlaying(false)
      setCurrentTime(0)
      onEndedEvent()
    }
    // 上一次播放可能在重新加载时被中断，资源就绪后补播一次
    const handleCanPlay = () => {
      if (shouldPlayRef.current && audio.paused) {
        void audio.play().catch(() => setPlaying(false))
      }
    }
    // 文件被删除、格式不支持等加载失败，此时不会触发 ended，需要单独上报
    const handleError = () => {
      // 清空 src（播放列表为空）也会触发 error，这里不算播放失败
      if (!audio.getAttribute('src')) return

      setPlaying(false)
      onErrorEvent()
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.pause()
      audio.removeAttribute('src')

      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)

      audioRef.current = null
    }
  }, [])

  const play = React.useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return false

    shouldPlayRef.current = true

    try {
      await audio.play()
      return true
    } catch {
      setPlaying(false)
      return false
    }
  }, [])

  const pause = React.useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    shouldPlayRef.current = false
    audio.pause()
    // 元素已暂停时不会再触发 pause 事件，这里同步一次状态
    setPlaying(false)
  }, [])

  const toggle = React.useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return false

    if (audio.paused) {
      return play()
    }

    pause()
    return true
  }, [pause, play])

  const seek = React.useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) return

    const nextTime = Math.max(0, Math.min(time, audio.duration))

    audio.currentTime = nextTime
    // 同步一次进度，避免等 timeupdate 时界面回跳
    setCurrentTime(nextTime)
  }, [])

  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.loop = loop
  }, [loop])

  React.useEffect(() => {
    const nextVolume = clamp(volume, 0, 1)

    volumeRef.current = nextVolume

    if (audioRef.current) {
      audioRef.current.volume = nextVolume
    }
  }, [volume])

  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.pause()

    if (src) {
      // 赋值 src 会自动开始加载，额外调用 load() 会中断这次加载
      audio.src = src
    } else {
      audio.removeAttribute('src')
      audio.load()
    }

    setCurrentTime(0)
    setDuration(0)

    if (shouldPlayRef.current && Boolean(src)) {
      void play()
    }
  }, [play, src])

  return {
    audioRef,

    currentTime,
    duration,
    playing,

    pause,
    play,
    seek,
    toggle
  }
}
