import type { ReactNode } from 'react'
import { cn } from '../../lib/format'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('empty-state', className)}>
      <div className="empty-state__icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}

interface GrainChipProps {
  name: string
  color: string
  code?: string
  className?: string
}

export function GrainChip({ name, color, code, className }: GrainChipProps) {
  return (
    <span className={cn('grain-chip', className)}>
      <span className="grain-chip__dot" style={{ backgroundColor: color }} />
      <span>{name}</span>
      {code && <span className="grain-chip__code">{code}</span>}
    </span>
  )
}
