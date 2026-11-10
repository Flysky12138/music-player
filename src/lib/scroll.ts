import { isNotNil } from 'es-toolkit'

/**
 * 缓动函数
 */
export const easing = {
  easeIn: (t: number) => t * t,
  easeInCubic: (t: number) => t ** 3,
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  easeOut: (t: number) => 1 - (1 - t) ** 2,
  easeOutCubic: (t: number) => 1 - (1 - t) ** 3,
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
  easeOutQuart: (t: number) => 1 - (1 - t) ** 4,
  linear: (t: number) => t
}

/**
 * 当前活动的滚动动画
 */
interface ScrollTask {
  frameId: null | number
}

/**
 * 滚动动画配置
 */
interface SmoothScrollOptions {
  /**
   * 滚动时长（毫秒）
   *
   * @default 500
   */
  duration?: number

  /**
   * 缓动函数模式
   *
   * @default 'easeInOut'
   *
   * @remarks
   * - `linear`：匀速
   * - `easeIn`：由慢到快
   * - `easeOut`：由快到慢
   * - `easeInOut`：慢 → 快 → 慢
   * - `easeInCubic`：三次方加速
   * - `easeOutCubic`：三次方减速
   * - `easeInOutCubic`：三次方加减速
   * - `easeOutQuart`：四次方减速
   * - `easeOutExpo`：指数减速
   */
  easing?: keyof typeof easing
}

/**
 * 管理每个元素的滚动动画
 */
const activeAnimations = new WeakMap<HTMLElement, ScrollTask>()

/**
 * 平滑滚动到指定位置
 *
 * @param element 滚动容器
 * @param target 目标滚动位置
 * @param options 动画配置
 * @returns 取消动画的函数
 */
export function smoothScrollTo(element: HTMLElement, target: number, options: SmoothScrollOptions = {}) {
  const { duration = 500, easing: easingName = 'easeInOut' } = options

  // 取消当前元素已有的动画
  const previous = activeAnimations.get(element)
  if (isNotNil(previous?.frameId)) {
    cancelAnimationFrame(previous.frameId)
  }

  const task: ScrollTask = { frameId: null }

  activeAnimations.set(element, task)

  // 取消当前动画
  const cancel = () => {
    if (activeAnimations.get(element) !== task) return

    if (task.frameId !== null) {
      cancelAnimationFrame(task.frameId)
    }

    activeAnimations.delete(element)
  }

  const start = element.scrollTop
  const distance = target - start
  const startTime = performance.now()
  const ease = easing[easingName]

  // 无需动画时直接滚动
  if (duration <= 0 || distance === 0) {
    element.scrollTop = target
    activeAnimations.delete(element)
    return cancel
  }

  const animate = (currentTime: number) => {
    if (activeAnimations.get(element) !== task) return

    const progress = Math.min((currentTime - startTime) / duration, 1)

    element.scrollTop = start + distance * ease(progress)

    if (progress < 1) {
      task.frameId = requestAnimationFrame(animate)
    } else {
      activeAnimations.delete(element)
      task.frameId = null
    }
  }

  task.frameId = requestAnimationFrame(animate)

  return cancel
}
