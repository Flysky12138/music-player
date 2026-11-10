'use client'

import { EChartsCoreOption } from 'echarts'
import { EChartsType, init, use as register } from 'echarts/core'
import React from 'react'

interface UseEChartsOptions {
  extensions: Parameters<typeof register>[0]
  option: EChartsCoreOption
}

export function useECharts({ extensions, option }: UseEChartsOptions) {
  const elementRef = React.useRef<HTMLDivElement>(null)
  const chartRef = React.useRef<EChartsType | null>(null)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    register(extensions)

    const instance = (chartRef.current = init(element))
    const resizeObserver = new ResizeObserver(() => instance.resize())
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
      instance.dispose()
      chartRef.current = null
    }
  }, [extensions])

  React.useEffect(() => {
    chartRef.current?.setOption(option, true)
  }, [option])

  return elementRef
}
