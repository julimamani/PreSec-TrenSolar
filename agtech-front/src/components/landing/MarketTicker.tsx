import { MARKET_SNAPSHOT } from '../../data/marketData'
import { formatNumber } from '../../lib/format'

export function MarketTicker() {
  const quotes = MARKET_SNAPSHOT.quotes.filter((quote) => quote.venue !== 'cbot')

  const items = [...quotes, ...quotes]

  return (
    <div className="ticker" aria-label="Pizarras de granos">
      <span className="ticker__label">
        <span className="status-dot status-dot--ok" />
        Pizarras
      </span>
      <div className="ticker__viewport">
        <div className="ticker__track">
          {items.map((quote, index) => (
            <span
              className="ticker__item"
              key={`${quote.id}-${index}`}
              aria-hidden={index >= quotes.length}
            >
              <span className="ticker__grain">{quote.grain.toUpperCase()}</span>
              <span className="ticker__price mono">US$ {formatNumber(quote.priceUsd, 1)}</span>
              <span className={quote.changePct >= 0 ? 'text-up' : 'text-down'}>
                {quote.changePct >= 0 ? '▲' : '▼'} {formatNumber(Math.abs(quote.changePct), 2)}%
              </span>
            </span>
          ))}
        </div>
      </div>
      <span className="ticker__source">BCR · BCBA</span>
    </div>
  )
}
