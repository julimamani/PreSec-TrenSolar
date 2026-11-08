import { useId } from 'react'
import { cn } from '../../lib/format'

interface SparklineProps {
  data: number[]
  color?: string
  className?: string
  width?: number
  height?: number
}

export function Sparkline({
  data,
  color = 'var(--accent)',
  className,
  width = 104,
  height = 34,
}: SparklineProps) {
  const gradientId = `spark-${useId().replace(/:/g, '')}`

  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / span) * (height - 5) - 2.5
    return [x, y] as const
  })

  const line = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const last = points[points.length - 1]

  return (
    <svg
      className={cn('sparkline', className)}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="2.3" fill={color} />
    </svg>
  )
}
