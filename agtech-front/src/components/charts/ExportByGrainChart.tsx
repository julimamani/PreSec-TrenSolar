import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber } from '../../lib/format'
import { ChartTooltip } from './ChartTooltip'

export interface ExportByGrainPoint {
  grain: string
  exportable: number
  benchmark: number
}

export function ExportByGrainChart({
  data,
  height = 250,
}: {
  data: ExportByGrainPoint[]
  height?: number
}) {
  return (
    <div className="chart-wrapper" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          barGap={4}
          barCategoryGap="32%"
        >
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
          <XAxis
            dataKey="grain"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            tickMargin={12}
            dy={4}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--faint)', fontSize: 10.5 }}
            width={42}
            domain={[60, 100]}
            tickFormatter={(value: number) => `${value}%`}
          />
          <Tooltip
            content={<ChartTooltip formatValue={(value) => formatNumber(value, 1) + '%'} />}
            cursor={{ fill: 'rgba(255,255,255,0.025)' }}
          />
          <Bar
            dataKey="exportable"
            name="Exportable"
            fill="var(--accent)"
            fillOpacity={0.85}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="benchmark"
            name="Referencia"
            fill="var(--chart-muted)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
