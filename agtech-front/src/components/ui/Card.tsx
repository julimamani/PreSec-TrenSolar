import type { ReactNode } from 'react'
import { cn } from '../../lib/format'

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}

export function Card({ children, className, as: Element = 'div' }: CardProps) {
  return <Element className={cn('card', className)}>{children}</Element>
}

interface PanelHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function PanelHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: PanelHeaderProps) {
  return (
    <div className={cn('panel-head', className)}>
      <div className="panel-head__copy">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <div className="panel-head__title-row">
          <h2 className="panel-head__title">{title}</h2>
          {subtitle && <span className="panel-head__subtitle">{subtitle}</span>}
        </div>
      </div>
      {action && <div className="panel-head__action">{action}</div>}
    </div>
  )
}
