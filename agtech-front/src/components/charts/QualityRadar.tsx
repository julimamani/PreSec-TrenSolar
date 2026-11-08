import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { QualityAxisPoint } from '../../types/analysis'
import { ChartTooltip } from './ChartTooltip'

export function QualityRadar({
  data,
  height = 250,
  sampleLabel = 'Muestra',
  benchmarkLabel = 'Referencia',
}: {
  data: QualityAxisPoint[]
  height?: number
  sampleLabel?: string
  benchmarkLabel?: string
}) {
  return (
    <div className="chart-wrapper" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%" margin={{ top: 12, right: 20, bottom: 4, left: 20 }}>
          <PolarGrid stroke="var(--chart-grid)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: 'var(--muted)', fontSize: 10.5 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip content={<ChartTooltip formatValue={(value) => `${value.toFixed(1)} pts`} />} />
          <Radar
            name={sampleLabel}
            dataKey="sample"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="var(--accent)"
            fillOpacity={0.16}
            animationDuration={600}
          />
          <Radar
            name={benchmarkLabel}
            dataKey="benchmark"
            stroke="var(--muted)"
            strokeWidth={1.2}
            strokeDasharray="4 4"
            fill="transparent"
            fillOpacity={0}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
