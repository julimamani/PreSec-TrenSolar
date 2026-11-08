import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { GRAINS, MARKET_VENUES } from '../../data/marketData'
import { formatNumber, formatTons, formatUsd } from '../../lib/format'
import type { PricePoint, Quote } from '../../types/market'
import { Sparkline } from '../charts/Sparkline'

interface QuotesTableProps {
  quotes: Quote[]
  series: PricePoint[]
  showVenue?: boolean
}

export function QuotesTable({ quotes, series, showVenue = true }: QuotesTableProps) {
  return (
    <div className="data-table-wrap">
      <table className="data-table quotes-table">
        <thead>
          <tr>
            <th>Grano</th>
            {showVenue && <th>Bolsa</th>}
            <th className="is-right">Pizarra</th>
            <th className="is-right">Var. 24h</th>
            <th className="is-right">Basis</th>
            <th className="is-right">Volumen</th>
            <th className="is-right">Tendencia</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => {
            const grain = GRAINS[quote.grain]
            const venue = MARKET_VENUES[quote.venue]
            const spark = series.slice(-12).map((point) => point[quote.grain])

            return (
              <tr key={quote.id}>
                <td>
                  <span className="table-grain">
                    <span className="table-grain__dot" style={{ backgroundColor: grain.color }} />
                    <span>
                      <strong>{grain.name}</strong>
                      <small>{grain.short}</small>
                    </span>
                  </span>
                </td>
                {showVenue && (
                  <td>
                    <span className="table-venue">
                      <strong>{venue.code}</strong>
                      <small>{venue.name.replace('Bolsa de ', '')}</small>
                    </span>
                  </td>
                )}
                <td className="is-right mono table-price">{formatUsd(quote.priceUsd, 1)}</td>
                <td className={`is-right mono ${quote.changePct >= 0 ? 'text-up' : 'text-down'}`}>
                  {quote.changePct >= 0 ? '▲' : '▼'} {formatNumber(Math.abs(quote.changePct), 2)}%
                </td>
                <td className="is-right mono">
                  {quote.venue === 'cbot' ? (
                    <span className="muted">—</span>
                  ) : (
                    <span className={quote.basisUsd >= 0 ? 'text-up' : 'text-down'}>
                      {quote.basisUsd >= 0 ? '+' : '−'}
                      {formatNumber(Math.abs(quote.basisUsd), 1)}
                    </span>
                  )}
                </td>
                <td className="is-right mono muted">{formatTons(quote.volumeTons)}</td>
                <td className="is-right">
                  <Sparkline
                    data={spark}
                    color={quote.changePct >= 0 ? grain.color : 'var(--danger)'}
                    className="table-spark"
                    width={68}
                    height={24}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="table-footnote">
        <span>Pizarras en US$/t · actualización cada 5 minutos</span>
        <Link to="/mercado">
          Ver mercado completo
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  )
}
