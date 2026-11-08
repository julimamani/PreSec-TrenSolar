export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

const decimal = (decimals: number) =>
  new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

export function formatNumber(value: number, decimals = 0): string {
  return decimal(decimals).format(value)
}

export function formatUsd(value: number, decimals = 1): string {
  return `US$ ${decimal(decimals).format(value)}`
}

export function formatCompactUsd(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `US$ ${decimal(1).format(value / 1_000_000)} M`
  }
  if (Math.abs(value) >= 1_000) {
    return `US$ ${decimal(1).format(value / 1_000)} k`
  }
  return formatUsd(value)
}

export function formatTons(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${decimal(2).format(value / 1_000_000)} Mt`
  }
  if (Math.abs(value) >= 1_000) {
    return `${decimal(1).format(value / 1_000)} kt`
  }
  return `${decimal(0).format(value)} t`
}

export function formatPercent(value: number, decimals = 2): string {
  return `${decimal(decimals).format(value)}%`
}

export function formatSignedPercent(value: number, decimals = 2): string {
  return `${value > 0 ? '+' : ''}${decimal(decimals).format(value)}%`
}

export function formatSignedUsd(value: number, decimals = 1): string {
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}US$ ${decimal(decimals).format(Math.abs(value))}`
}

export function formatDate(value: string | Date, style: 'short' | 'long' = 'short'): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: style === 'long' ? 'long' : 'short',
    year: style === 'long' ? 'numeric' : undefined,
  })
}

export function formatTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(value: string | Date): string {
  return `${formatDate(value)} · ${formatTime(value)}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
