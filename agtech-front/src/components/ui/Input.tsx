import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'
import { cn } from '../../lib/format'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <label className="field" htmlFor={inputId}>
      {label && <span className="field__label">{label}</span>}
      <input
        id={inputId}
        className={cn('input', error && 'input--error', className)}
        {...props}
      />
      {error ? (
        <span className="field__error">{error}</span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </label>
  )
}
