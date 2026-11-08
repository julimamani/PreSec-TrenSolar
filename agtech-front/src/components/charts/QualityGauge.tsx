import { useId } from 'react'
import { cn } from '../../lib/format'

interface QualityGaugeProps {
  value: number
  label?: string
  sublabel?: string
  size?: number
  strokeWidth?: number
  tone?: 'accent' | 'warning' | 'danger'
  className?: string
}

export function QualityGauge({
  value,
  label = 'Exportable',
  sublabel,
  size = 148,
  strokeWidth = 9,
  tone = 'accent',
  className,
}: QualityGaugeProps) {
  const gradientId = `gauge-${useId().replace(/:/g, '')}`
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const safeValue = Math.min(Math.max(value, 0), 100)
  const offset = circumference - (safeValue / 100) * circumference
  const color =
    tone === 'danger' ? 'var(--danger)' : tone === 'warning' ? 'var(--warning)' : 'var(--accent)'

  return (
    <div className={cn('gauge', className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--chart-grid)"
          strokeWidth={strokeWidth}
        />
        <circle
          className="gauge__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="gauge__content">
        <span className="gauge__value mono">
          {safeValue.toFixed(1)}
          <small>%</small>
        </span>
        <span className="gauge__label">{label}</span>
        {sublabel && <span className="gauge__sub">{sublabel}</span>}
      </div>
    </div>
  )
}
