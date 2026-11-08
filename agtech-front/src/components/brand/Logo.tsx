import { cn } from '../../lib/format'

interface LogoProps {
  compact?: boolean
  className?: string
}

export function Logo({ compact = false, className }: LogoProps) {
  return (
    <span className={cn('logo', compact && 'logo--compact', className)}>
      <span className="logo__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path
            d="M7.5 21.6c0-7.7 5.6-13.2 13.8-13.2 1.1 0 2.1.1 3.2.4-.4 8.1-5.9 13.3-13.6 13.3-1.2 0-2.3-.2-3.4-.5Z"
            fill="currentColor"
            fillOpacity=".9"
          />
          <path
            d="M6.5 26c2.7-5.9 7.1-10.1 13.6-12.7"
            stroke="#07100b"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M15.8 7.2c2.3 1.9 4 4.2 5.1 6.7M22.4 5.4c1.1 2.7 1.5 5.4 1.3 8.1"
            stroke="#07100b"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeOpacity=".65"
          />
        </svg>
      </span>
      {!compact && (
        <span className="logo__copy">
          <span className="logo__word">PuroGrano</span>
          <span className="logo__tag">Grain Intelligence</span>
        </span>
      )}
    </span>
  )
}
