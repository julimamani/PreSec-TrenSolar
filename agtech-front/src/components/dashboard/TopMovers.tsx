import { Link } from 'react-router-dom'
import { Activity, ArrowUpRight } from 'lucide-react'
import { GRAINS } from '../../data/marketData'
import { formatNumber, formatTons, formatUsd } from '../../lib/format'
import type { Quote } from '../../types/market'
import { PanelHeader } from '../ui/Card'

export function TopMovers({ quotes }: { quotes: Quote[] }) {
  const movers = [...quotes]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 4)

  return (
    <div className="movers">
      <PanelHeader
        eyebrow="Intradiario"
        title="Top movers"
        action={
          <Link to="/mercado" className="link-arrow" aria-label="Ver mercado completo">
            <ArrowUpRight size={16} />
          </Link>
        }
      />
      <div className="movers__list">
        {movers.map((quote) => {
          const grain = GRAINS[quote.grain]
          const positive = quote.changePct >= 0
          return (
            <div className="mover" key={quote.id}>
              <span className="mover__dot" style={{ backgroundColor: grain.color }} />
              <div className="mover__main">
                <div className="mover__row">
                  <strong>{grain.name}</strong>
                  <span className={`mono ${positive ? 'text-up' : 'text-down'}`}>
                    {positive ? '+' : ''}
                    {formatNumber(quote.changePct, 2)}%
                  </span>
                </div>
                <div className="mover__row mover__row--muted">
                  <span className="mono">{formatUsd(quote.priceUsd, 1)}/t</span>
                  <span>{formatTons(quote.volumeTons)}</span>
                </div>
                <span className="mover__track">
                  <span
                    className={positive ? 'is-up' : 'is-down'}
                    style={{
                      width: `${Math.min(Math.abs(quote.changePct) * 32, 100)}%`,
                    }}
                  />
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="movers__footer">
        <Activity size={14} aria-hidden="true" />
        <span>Mayor volatilidad de la rueda</span>
      </div>
    </div>
  )
}
