import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)
dayjs.extend(customParseFormat)

/**
 * 把毫秒时长格式化为 `m:ss`（超过一小时则用 `H:mm:ss`）
 */
export function formatDuration(milliseconds: number) {
  const value = dayjs.duration(milliseconds, 'millisecond')

  return value.asHours() >= 1 ? value.format('H:mm:ss') : value.format('m:ss')
}

/**
 * 把秒数格式化为定宽的 `00:00`（超过一小时则用 `H:mm:ss`）
 */
export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'

  const value = dayjs.duration(seconds, 'second')

  return value.asHours() >= 1 ? value.format('H:mm:ss') : value.format('mm:ss')
}

/**
 * 处理歌词
 */
export function parseLyric(lyric?: string) {
  if (!lyric) return null

  const matcher = lyric.matchAll(/\[([\d:.]+)\]\r*(.*)$/gm)
  let lyrics = Array.from(matcher, ([_, second, lrc]) => ({
    text: lrc.trim(),
    time: (dayjs(second, 'mm:ss.'.padEnd(second.length, 'S')).valueOf() - dayjs('00:00.000', 'mm:ss.SSS').valueOf()) / 1000
  }))

  // 过滤存在错误数据的歌词
  lyrics = lyrics.filter((lyric, index) => {
    if (index === 0) return true
    if (!lyric.text) return false // 存在空行
    const prevLyric = lyrics[index - 1]
    if (lyric.text === prevLyric.text) return false // 前后歌词一样
    if (lyric.time < prevLyric.time) return false // 时间不是单调非递减
    return true
  })

  if (lyrics.length === 0) return null

  return lyrics
}
