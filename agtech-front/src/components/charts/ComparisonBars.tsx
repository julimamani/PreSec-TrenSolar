import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatUsd } from '../../lib/format'
import type { QualityVsMarketPoint } from '../../types/market'
import { ChartTooltip } from './ChartTooltip'

export function ComparisonBars({
  data,
  height = 236,
}: {
  data: QualityVsMarketPoint[]
  height?: number
}) {
  return (
    <div className="chart-wrapper" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
          <XAxis
            dataKey="grain"
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
            width={44}
            domain={['auto', 'auto']}
          />
          <Tooltip
            content={<ChartTooltip formatValue={(value) => formatUsd(value, 1)} />}
            cursor={{ fill: 'rgba(255,255,255,0.025)' }}
          />
          <Bar
            dataKey="pizarra"
            name="Pizarra"
            fill="var(--chart-muted)"
            radius={[3, 3, 0, 0]}
            animationDuration={550}
          />
          <Bar
            dataKey="calidad"
            name="Con calidad"
            fill="var(--accent)"
            fillOpacity={0.88}
            radius={[3, 3, 0, 0]}
            animationDuration={650}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
