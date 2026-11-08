import type { ReactNode } from 'react'
import { formatNumber } from '../../lib/format'

interface TooltipEntry {
  name?: ReactNode
  value?: number | string
  color?: string
  dataKey?: string | number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
  formatValue?: (value: number) => string
  footer?: (entries: TooltipEntry[]) => ReactNode
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatValue = (value) => formatNumber(value, 1),
  footer,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const entries = payload.filter((entry) => entry.value !== undefined && entry.value !== null)

  return (
    <div className="chart-tooltip">
      {label !== undefined && <div className="chart-tooltip__label">{label}</div>}
      <div className="chart-tooltip__rows">
        {entries.map((entry, index) => (
          <div className="chart-tooltip__row" key={`${String(entry.dataKey)}-${index}`}>
            <span className="chart-tooltip__name">
              <span
                className="chart-tooltip__dot"
                style={{ backgroundColor: entry.color ?? 'var(--accent)' }}
              />
              {entry.name}
            </span>
            <span className="chart-tooltip__value mono">
              {formatValue(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
      {footer && <div className="chart-tooltip__footer">{footer(entries)}</div>}
    </div>
  )
}
