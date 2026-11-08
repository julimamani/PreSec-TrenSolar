import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatSignedUsd } from '../../lib/format'
import type { RegionBasis } from '../../types/market'
import { ChartTooltip } from './ChartTooltip'

export function BasisChart({
  data,
  height = 248,
}: {
  data: RegionBasis[]
  height?: number
}) {
  return (
    <div className="chart-wrapper" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 2, right: 18, left: 0, bottom: 0 }}
          barCategoryGap="28%"
        >
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--faint)', fontSize: 10.5 }}
            tickFormatter={(value: number) => `${value > 0 ? '+' : ''}${value}`}
          />
          <YAxis
            type="category"
            dataKey="region"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            width={92}
          />
          <ReferenceLine x={0} stroke="var(--border-strong)" />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.025)' }}
            content={<ChartTooltip formatValue={(value) => formatSignedUsd(value, 1)} />}
          />
          <Bar dataKey="basisUsd" name="Basis" radius={[0, 3, 3, 0]} animationDuration={550}>
            {data.map((region) => (
              <Cell
                key={region.region}
                fill={region.basisUsd >= 0 ? 'var(--accent)' : 'var(--danger)'}
                fillOpacity={0.82}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
