import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn, clamp } from '../../lib/format'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
}

export function Select({ label, hint, className, children, id, ...props }: SelectProps) {
  const selectId = id ?? `select-${label?.toLowerCase().replace(/\s+/g, '-') ?? 'field'}`

  return (
    <label className="field" htmlFor={selectId}>
      {label && <span className="field__label">{label}</span>}
      <span className="select-wrap">
        <select id={selectId} className={cn('select', className)} {...props}>
          {children}
        </select>
        <ChevronDown size={15} className="select-wrap__icon" aria-hidden="true" />
      </span>
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

interface ProgressProps {
  value: number
  tone?: 'accent' | 'warning' | 'danger' | 'info'
  label?: string
  className?: string
}

export function Progress({ value, tone = 'accent', label, className }: ProgressProps) {
  const safeValue = clamp(value, 0, 100)

  return (
    <div className={cn('progress-group', className)}>
      {label && (
        <div className="progress-group__head">
          <span>{label}</span>
          <span className="mono">{Math.round(safeValue)}%</span>
        </div>
      )}
      <div
        className={cn('progress', `progress--${tone}`)}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(safeValue)}
        aria-label={label ?? 'Progreso'}
      >
        <span className="progress__bar" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn('skeleton', className)} aria-hidden="true" />
}
