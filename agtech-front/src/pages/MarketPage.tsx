import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CircleAlert,
  Download,
  RefreshCw,
  ScanLine,
} from 'lucide-react'
import { GRAINS, MARKET_VENUES } from '../data/marketData'
import { useMarketData } from '../hooks/useMarketData'
import {
  formatNumber,
  formatTime,
  formatTons,
} from '../lib/format'
import type { Currency, GrainId, MarketVenueId, PriceRange } from '../types/market'
import { PriceChart } from '../components/charts/PriceChart'
import { VolumeChart } from '../components/charts/VolumeChart'
import { BasisChart } from '../components/charts/BasisChart'
import { ChartLegend } from '../components/charts/ChartLegend'
import { QuotesTable } from '../components/dashboard/QuotesTable'
import { Badge, DeltaBadge } from '../components/ui/Badge'
import { Button, buttonClass } from '../components/ui/Button'
import { Card, PanelHeader } from '../components/ui/Card'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Select } from '../components/ui/Field'
import { Skeleton } from '../components/ui/Field'

const RANGE_OPTIONS: Array<{ value: PriceRange; label: string }> = [
  { value: '7D', label: '7D' },
  { value: '30D', label: '30D' },
  { value: '90D', label: '90D' },
]

const CURRENCY_OPTIONS = [
  { value: 'USD' as const, label: 'USD' },
  { value: 'ARS' as const, label: 'ARS' },
]

const VENUE_OPTIONS: Array<{ value: 'all' | MarketVenueId; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'rosario', label: 'BCR' },
  { value: 'buenos-aires', label: 'BCBA' },
  { value: 'cbot', label: 'CBOT' },
]

export function MarketPage() {
  const { data, isLoading, error, refetch } = useMarketData()
  const [range, setRange] = useState<PriceRange>('30D')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [grains, setGrains] = useState<GrainId[]>(['soja', 'maiz', 'trigo'])
  const [venue, setVenue] = useState<'all' | MarketVenueId>('all')
  const [grainFilter, setGrainFilter] = useState<'all' | GrainId>('all')

  const chartData = useMemo(() => {
    if (!data) return []
    const count = range === '7D' ? 7 : range === '30D' ? 30 : 90
    return data.series.slice(-count)
  }, [data, range])

  const filteredQuotes = useMemo(() => {
    if (!data) return []
    return data.quotes.filter((quote) => {
      const venueMatch = venue === 'all' || quote.venue === venue
      const grainMatch = grainFilter === 'all' || quote.grain === grainFilter
      return venueMatch && grainMatch
    })
  }, [data, venue, grainFilter])

  if (!data) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <span className="eyebrow">Mercado</span>
            <h2>Pizarras y posiciones</h2>
            <p>Compará granos, plazas y primas de calidad.</p>
          </div>
        </div>
        {error && (
          <div className="alert alert--danger">
            <CircleAlert size={16} />
            <span>{error}</span>
          </div>
        )}
        <div className="market-strip market-strip--skeleton">
          {[0, 1, 2, 3].map((item) => (
            <div key={item}>
              <Skeleton className="skeleton--line" />
              <Skeleton className="skeleton--value" />
            </div>
          ))}
        </div>
        <Card>
          <Skeleton className="skeleton--panel" />
        </Card>
      </div>
    )
  }

  const toggleGrain = (grain: GrainId) => {
    setGrains((current) => {
      if (current.includes(grain)) {
        return current.length === 1 ? current : current.filter((item) => item !== grain)
      }
      return [...current, grain]
    })
  }

  const exportCsv = () => {
    const rows = [
      ['grano', 'bolsa', 'pizarra_usd_t', 'variacion_24h_pct', 'basis_usd_t', 'volumen_t'],
      ...filteredQuotes.map((quote) => [
        GRAINS[quote.grain].name,
        MARKET_VENUES[quote.venue].name,
        quote.priceUsd.toFixed(1),
        quote.changePct.toFixed(2),
        quote.basisUsd.toFixed(1),
        quote.volumeTons.toString(),
      ]),
    ]
    const csv = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'purograno-pizarras.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Mercado</span>
          <h2>Pizarras y posiciones</h2>
          <p>Compará granos, plazas y primas de calidad con datos de referencia.</p>
        </div>
        <div className="page-head__actions">
          <span className="updated-at">Actualizado {formatTime(data.updatedAt)}</span>
          <Button
            variant="outline"
            icon={<RefreshCw size={15} className={isLoading ? 'spin' : undefined} />}
            onClick={() => void refetch()}
          >
            Actualizar
          </Button>
          <Link to="/analizar" className={buttonClass('primary', 'md')}>
            <ScanLine size={16} />
            Analizar
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert--danger" role="alert">
          <CircleAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="market-strip">
        <div className="market-strip__item">
          <span>Índice granos</span>
          <strong className="mono">{formatNumber(data.index, 2)}</strong>
          <DeltaBadge value={data.indexChangePct} />
        </div>
        <div className="market-strip__item">
          <span>Volumen</span>
          <strong className="mono">{formatTons(data.volumeTons)}</strong>
          <span className="market-strip__muted">{formatNumber(data.operations)} operaciones</span>
        </div>
        <div className="market-strip__item">
          <span>Open interest</span>
          <strong className="mono">{formatTons(data.openInterestTons)}</strong>
          <span className="market-strip__muted">posiciones abiertas</span>
        </div>
        <div className="market-strip__item">
          <span>Dólar BNA</span>
          <strong className="mono">$ {formatNumber(data.usdArs, 2)}</strong>
          <span className="market-strip__muted">referencia minorista</span>
        </div>
        <span className="market-strip__live">
          <span className="status-dot status-dot--ok" />
          Mercado abierto
        </span>
      </div>

      <Card className="dash-panel market-chart-panel">
        <PanelHeader
          eyebrow="Series comparadas"
          title="Evolución de pizarras"
          subtitle="US$/t · ARS/t"
          action={
            <div className="panel-head__actions">
              <SegmentedControl
                options={RANGE_OPTIONS}
                value={range}
                onChange={setRange}
                ariaLabel="Rango de tiempo"
              />
              <SegmentedControl
                options={CURRENCY_OPTIONS}
                value={currency}
                onChange={setCurrency}
                ariaLabel="Moneda"
              />
            </div>
          }
        />
        <div className="chart-toolbar">
          <div className="series-toggle" aria-label="Granos visibles">
            {(Object.keys(GRAINS) as GrainId[]).map((grain) => (
              <button
                key={grain}
                type="button"
                className={`series-toggle__item${grains.includes(grain) ? ' is-active' : ''}`}
                aria-pressed={grains.includes(grain)}
                onClick={() => toggleGrain(grain)}
              >
                <span style={{ backgroundColor: GRAINS[grain].color }} />
                {GRAINS[grain].name}
              </button>
            ))}
          </div>
        </div>
        <PriceChart
          data={chartData}
          grains={grains}
          currency={currency}
          usdArs={data.usdArs}
          height={360}
        />
        <div className="chart-foot">
          <span>{formatNumber(chartData.length)} ruedas · precios de referencia</span>
          <span className="mono">USD/ARS {formatNumber(data.usdArs, 2)}</span>
        </div>
      </Card>

      <div className="dashboard-grid market-lower-grid">
        <Card className="span-7 dash-panel">
          <PanelHeader
            eyebrow="Liquidez"
            title="Volumen operado"
            subtitle="Últimas 9 ruedas"
            action={<Badge tone="neutral">toneladas</Badge>}
          />
          <VolumeChart data={data.volumeSeries} height={260} />
          <ChartLegend
            items={[
              { label: 'Soja', color: GRAINS.soja.color },
              { label: 'Maíz', color: GRAINS.maiz.color },
              { label: 'Trigo', color: GRAINS.trigo.color },
              { label: 'Poroto', color: GRAINS.poroto.color },
            ]}
          />
        </Card>

        <Card className="span-5 dash-panel">
          <PanelHeader
            eyebrow="Logística"
            title="Basis por región"
            subtitle="vs. Rosario"
            action={<Badge tone="neutral">US$/t</Badge>}
          />
          <BasisChart data={data.regions} height={260} />
        </Card>
      </div>

      <Card className="dash-panel market-table-panel">
        <PanelHeader
          eyebrow="Pizarras"
          title="Tabla de cotizaciones"
          subtitle={`${filteredQuotes.length} referencias`}
          action={
            <div className="market-table-actions">
              <Select
                aria-label="Filtrar por grano"
                value={grainFilter}
                onChange={(event) =>
                  setGrainFilter(event.target.value as 'all' | GrainId)
                }
              >
                <option value="all">Todos los granos</option>
                {(Object.keys(GRAINS) as GrainId[]).map((grain) => (
                  <option key={grain} value={grain}>
                    {GRAINS[grain].name}
                  </option>
                ))}
              </Select>
              <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportCsv}>
                CSV
              </Button>
            </div>
          }
        />
        <div className="market-filter-row">
          <SegmentedControl
            options={VENUE_OPTIONS}
            value={venue}
            onChange={setVenue}
            ariaLabel="Filtrar por bolsa"
          />
        </div>
        <QuotesTable quotes={filteredQuotes} series={data.series} />
        {filteredQuotes.length === 0 && (
          <div className="table-empty">
            <span>No hay cotizaciones para los filtros seleccionados.</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setVenue('all')
                setGrainFilter('all')
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
        <div className="market-table-panel__foot">
          <span>
            <ArrowUpRight size={13} />
            {MARKET_VENUES.rosario.name} · {MARKET_VENUES['buenos-aires'].name} ·{' '}
            {MARKET_VENUES.cbot.name}
          </span>
          <span>Datos demo en tiempo real simulado</span>
        </div>
      </Card>
    </div>
  )
}
