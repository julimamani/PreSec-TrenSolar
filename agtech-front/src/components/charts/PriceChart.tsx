import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GRAINS } from '../../data/marketData'
import { formatNumber, formatUsd } from '../../lib/format'
import type { Currency, GrainId, PricePoint } from '../../types/market'
import { ChartTooltip } from './ChartTooltip'

interface PriceChartProps {
  data: PricePoint[]
  grains: GrainId[]
  currency: Currency
  usdArs: number
  height?: number
}

export function PriceChart({
  data,
  grains,
  currency,
  usdArs,
  height = 300,
}: PriceChartProps) {
  const prefix = useId().replace(/:/g, '')
  const displayData = data.map((point) => {
    const converted = { ...point }
    if (currency === 'ARS') {
      grains.forEach((grain) => {
        converted[grain] = Math.round(point[grain] * usdArs)
      })
    }
    return converted
  })

  const formatValue = (value: number) =>
    currency === 'USD' ? formatUsd(value, 1) : `$ ${formatNumber(value, 0)}`

  return (
    <div className="chart-wrapper" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={displayData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {grains.map((grain) => (
              <linearGradient
                id={`${prefix}-${grain}`}
                key={grain}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={GRAINS[grain].color} stopOpacity={0.24} />
                <stop offset="95%" stopColor={GRAINS[grain].color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--chart-grid)"
            strokeDasharray="3 6"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--faint)', fontSize: 10.5 }}
            minTickGap={42}
            tickMargin={12}
            dy={4}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--faint)', fontSize: 10.5 }}
            width={54}
            tickMargin={8}
            tickFormatter={(value: number) => formatNumber(value, 0)}
            domain={['auto', 'auto']}
          />
          <Tooltip
            content={
              <ChartTooltip
                formatValue={formatValue}
                footer={() => (
                  <span className="chart-tooltip__hint">
                    {currency === 'USD' ? 'US$ por tonelada' : 'ARS por tonelada'}
                  </span>
                )}
              />
            }
            cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '4 4' }}
          />
          {grains.map((grain) => (
            <Area
              key={grain}
              type="monotone"
              dataKey={grain}
              name={GRAINS[grain].name}
              stroke={GRAINS[grain].color}
              strokeWidth={2}
              fill={`url(#${prefix}-${grain})`}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0 }}
              animationDuration={650}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
