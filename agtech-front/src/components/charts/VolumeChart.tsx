import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GRAINS } from '../../data/marketData'
import { formatTons } from '../../lib/format'
import type { VolumePoint } from '../../types/market'
import { ChartTooltip } from './ChartTooltip'

const SERIES = ['poroto', 'trigo', 'maiz', 'soja'] as const

export function VolumeChart({ data, height = 236 }: { data: VolumePoint[]; height?: number }) {
  return (
    <div className="chart-wrapper" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="34%">
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--faint)', fontSize: 10.5 }}
            tickMargin={12}
            dy={4}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--faint)', fontSize: 10.5 }}
            width={48}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
          />
          <Tooltip
            content={<ChartTooltip formatValue={(value) => formatTons(value)} />}
            cursor={{ fill: 'rgba(255,255,255,0.025)' }}
          />
          {SERIES.map((grain, index) => (
            <Bar
              key={grain}
              dataKey={grain}
              name={GRAINS[grain].name}
              stackId="volume"
              fill={GRAINS[grain].color}
              fillOpacity={index === SERIES.length - 1 ? 0.95 : 0.72}
              radius={index === SERIES.length - 1 ? [3, 3, 0, 0] : 0}
              animationDuration={550}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
