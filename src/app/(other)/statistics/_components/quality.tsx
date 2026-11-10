'use client'

import { EChartsCoreOption } from 'echarts'
import { PieChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useTheme } from 'next-themes'
import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useECharts } from '@/hooks/use-echarts'
import { QualityStatistics } from '@/tauri/statistics'

const CHART_EXTENSIONS = [PieChart, TooltipComponent, CanvasRenderer, LegendComponent]

interface QualityProps {
  data: QualityStatistics
}

export function Quality({ data }: QualityProps) {
  const { resolvedTheme } = useTheme()

  const total = data.hq + data.sq + data.hr + data.unknown

  const items = React.useMemo(
    () =>
      [
        { color: '#FF6900', name: 'HQ 有损', value: data.hq },
        { color: '#2B7FFF', name: 'SQ 无损', value: data.sq },
        { color: '#F0B100', name: 'HR 高解析', value: data.hr },
        { color: '#71717B', name: '未知', value: data.unknown }
      ].filter(item => item.value),
    [data.hq, data.hr, data.sq, data.unknown]
  )

  const option = React.useMemo<EChartsCoreOption>(
    () => ({
      color: items.map(item => item.color),
      legend: {
        left: 'center',
        top: '0'
      },
      series: [
        {
          center: ['50%', '55%'],
          data: items.map(({ name, value }) => ({ name, value })),
          padAngle: 2,
          radius: ['50%', '80%'],
          roundCap: true,
          type: 'pie',
          emphasis: {
            scale: true,
            scaleSize: 5
          },
          itemStyle: {
            borderRadius: 8
          },
          label: {
            formatter: `{total|${total.toLocaleString()}}\n{unit|首歌曲}`,
            position: 'center',
            show: true,
            rich: {
              total: {
                color: resolvedTheme === 'dark' ? '#FAFAFA' : '#18181B',
                fontSize: 32,
                fontWeight: 600,
                lineHeight: 32,
                textBorderWidth: 0
              },
              unit: {
                color: resolvedTheme === 'dark' ? '#A1A1AA' : '#71717A',
                fontSize: 12,
                lineHeight: 18,
                textBorderWidth: 0
              }
            }
          }
        }
      ],
      tooltip: {
        formatter: '{b}: {c} 首 ({d}%)',
        trigger: 'item'
      }
    }),
    [items, resolvedTheme, total]
  )

  const chartElementRef = useECharts({ extensions: CHART_EXTENSIONS, option })

  return (
    <Card className="self-start">
      <CardHeader>
        <CardTitle>音质等级</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <div ref={chartElementRef} aria-label={`歌曲音质等级分布，共 ${total} 首歌曲`} className="size-full" role="img" />
      </CardContent>
    </Card>
  )
}
