import type { ReactNode } from 'react'
import { cn } from '../../lib/format'

type BadgeTone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'info'

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  dot?: boolean
  className?: string
}

export function Badge({ children, tone = 'neutral', dot = false, className }: BadgeProps) {
  return (
    <span className={cn('badge', `badge--${tone}`, className)}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  )
}

export function DeltaBadge({ value }: { value: number }) {
  const tone: BadgeTone = value >= 0 ? 'success' : 'danger'
  return (
    <Badge tone={tone} className="badge--mono">
      {value >= 0 ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </Badge>
  )
}
