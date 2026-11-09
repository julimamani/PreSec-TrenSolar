import type { CSSProperties } from 'react'
import { GRAINS, MARKET_VENUES } from '../../data/marketData'
import { formatPercent, formatTons, formatUsd } from '../../lib/format'
import type { PricePoint, Quote } from '../../types/market'
import { Sparkline } from '../charts/Sparkline'
import { Badge, DeltaBadge } from '../ui/Badge'

export function KpiCard({
  quote,
  series,
}: {
  quote: Quote
  series: PricePoint[]
}) {
  const grain = GRAINS[quote.grain]
  const venue = MARKET_VENUES[quote.venue]
  const sparkData = series.slice(-16).map((point) => point[quote.grain])
  const color = quote.changePct >= 0 ? grain.color : 'var(--danger)'

  return (
    <article className="kpi-card" style={{ '--grain-color': grain.color } as CSSProperties}>
      <div className="kpi-card__head">
        <span className="kpi-card__grain">
          <span className="kpi-card__dot" style={{ backgroundColor: grain.color }} />
          <span>
            <strong>{grain.name}</strong>
            <small>{grain.short} · {venue.name}</small>
          </span>
        </span>
        <Badge tone="neutral" className="kpi-card__venue">{venue.code}</Badge>
      </div>

      <div className="kpi-card__value mono">
        {formatUsd(quote.priceUsd, 1)}
        <small>/t</small>
      </div>

      <div className="kpi-card__foot">
        <DeltaBadge value={quote.changePct} />
        <span className="kpi-card__volume">
          Vol. {formatTons(quote.volumeTons)}
        </span>
      </div>

      <Sparkline
        data={sparkData}
        color={color}
        className="kpi-card__spark"
        width={140}
        height={38}
      />
      <span className="kpi-card__basis">
        Basis{' '}
        {quote.basisUsd === 0 ? (
          <strong className="mono muted">—</strong>
        ) : (
          <strong className="mono">
            {quote.basisUsd >= 0 ? '+' : '−'}
            {formatPercent(Math.abs(quote.basisUsd), 1).replace('%', '')} US$
          </strong>
        )}
      </span>
    </article>
  )
}
