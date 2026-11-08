import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CircleAlert,
  Clock3,
  RefreshCw,
  ScanLine,
  Sparkles,
} from 'lucide-react'
import { GRAINS } from '../data/marketData'
import { formatNumber, formatTime, formatTons } from '../lib/format'
import { useMarketData } from '../hooks/useMarketData'
import { useStoredAnalysis } from '../hooks/useStoredAnalysis'
import type { GrainId, PriceRange } from '../types/market'
import { PriceChart } from '../components/charts/PriceChart'
import { VolumeChart } from '../components/charts/VolumeChart'
import { ComparisonBars } from '../components/charts/ComparisonBars'
import { QualityRadar } from '../components/charts/QualityRadar'
import { ChartLegend } from '../components/charts/ChartLegend'
import { KpiCard } from '../components/dashboard/KpiCard'
import { QuotesTable } from '../components/dashboard/QuotesTable'
import { TopMovers } from '../components/dashboard/TopMovers'
import { LastSampleCard } from '../components/dashboard/LastSampleCard'
import { Badge, DeltaBadge } from '../components/ui/Badge'
import { Button, buttonClass } from '../components/ui/Button'
import { Card, PanelHeader } from '../components/ui/Card'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Skeleton } from '../components/ui/Field'
import { BasisChart } from '../components/charts/BasisChart'

const DEFAULT_GRAINS: GrainId[] = ['soja', 'maiz', 'trigo']
const RANGE_OPTIONS: Array<{ value: PriceRange; label: string }> = [
  { value: '7D', label: '7D' },
  { value: '30D', label: '30D' },
  { value: '90D', label: '90D' },
]
const CURRENCY_OPTIONS = [
  { value: 'USD' as const, label: 'USD' },
  { value: 'ARS' as const, label: 'ARS' },
]

export function DashboardPage() {
  const { data, isLoading, error, refetch } = useMarketData()
  const { lastAnalysis } = useStoredAnalysis()
  const [range, setRange] = useState<PriceRange>('30D')
  const [currency, setCurrency] = useState<'USD' | 'ARS'>('USD')
  const [grains, setGrains] = useState<GrainId[]>(DEFAULT_GRAINS)

  const chartData = useMemo(() => {
    if (!data) return []
    const count = range === '7D' ? 7 : range === '30D' ? 30 : 90
    return data.series.slice(-count)
  }, [data, range])

  if (!data) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <span className="eyebrow">
              <Sparkles size={13} /> Inteligencia de mercado
            </span>
            <h2>Pulso del mercado de granos</h2>
            <p>Pizarras, liquidez y primas de calidad en una sola vista.</p>
          </div>
        </div>
        {error && (
          <div className="alert alert--danger" role="alert">
            <CircleAlert size={16} />
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </div>
        )}
        <div className="kpi-grid">
          {[0, 1, 2, 3].map((item) => (
            <div className="kpi-card kpi-card--skeleton" key={item}>
              <Skeleton className="skeleton--title" />
              <Skeleton className="skeleton--value" />
              <Skeleton className="skeleton--line" />
            </div>
          ))}
        </div>
        <div className="dashboard-grid">
          <Card className="span-8">
            <Skeleton className="skeleton--panel" />
          </Card>
          <Card className="span-4">
            <Skeleton className="skeleton--panel" />
          </Card>
        </div>
      </div>
    )
  }

  const localQuotes = data.quotes.filter((quote) => quote.venue !== 'cbot')
  const kpiQuotes = data.quotes.slice(0, 4)
  const qualityData = lastAnalysis?.qualityAxes ?? data.qualityProfile

  const toggleGrain = (grain: GrainId) => {
    setGrains((current) => {
      if (current.includes(grain)) {
        return current.length === 1 ? current : current.filter((item) => item !== grain)
      }
      return [...current, grain]
    })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <Sparkles size={13} /> Inteligencia de mercado
          </span>
          <h2>Pulso del mercado de granos</h2>
          <p>Pizarras, liquidez y primas de calidad en una sola vista.</p>
        </div>
        <div className="page-head__actions">
          <span className="updated-at">
            <Clock3 size={13} />
            Actualizado {formatTime(data.updatedAt)}
          </span>
          <Button
            variant="outline"
            icon={<RefreshCw size={15} className={isLoading ? 'spin' : undefined} />}
            onClick={() => void refetch()}
          >
            Actualizar
          </Button>
          <Link to="/analizar" className={buttonClass('primary', 'md')}>
            <ScanLine size={16} />
            Analizar muestra
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
          <span>Dólar BNA</span>
          <strong className="mono">$ {formatNumber(data.usdArs, 2)}</strong>
          <span className="market-strip__muted">ref. minorista</span>
        </div>
        <div className="market-strip__item">
          <span>Volumen rueda</span>
          <strong className="mono">{formatTons(data.volumeTons)}</strong>
          <span className="market-strip__muted">{formatNumber(data.operations)} operaciones</span>
        </div>
        <div className="market-strip__item">
          <span>Open interest</span>
          <strong className="mono">{formatTons(data.openInterestTons)}</strong>
          <span className="market-strip__muted">posiciones abiertas</span>
        </div>
        <span className="market-strip__live">
          <span className="status-dot status-dot--ok" />
          Mercado abierto
        </span>
      </div>

      <div className="kpi-grid">
        {kpiQuotes.map((quote) => (
          <KpiCard key={quote.id} quote={quote} series={data.series} />
        ))}
      </div>

      <div className="dashboard-grid">
        <Card className="span-8 dash-panel dash-panel--prices">
          <PanelHeader
            eyebrow="Serie histórica"
            title="Evolución de precios"
            subtitle="US$/t"
            action={
              <SegmentedControl
                options={RANGE_OPTIONS}
                value={range}
                onChange={setRange}
                ariaLabel="Rango de tiempo"
              />
            }
          />
          <div className="chart-toolbar">
            <div className="series-toggle" aria-label="Granos visibles">
              {(Object.keys(GRAINS) as GrainId[])
                .filter((grain) => ['soja', 'maiz', 'trigo', 'poroto'].includes(grain))
                .map((grain) => (
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
            <SegmentedControl
              options={CURRENCY_OPTIONS}
              value={currency}
              onChange={setCurrency}
              ariaLabel="Moneda"
            />
          </div>
          <PriceChart
            data={chartData}
            grains={grains}
            currency={currency}
            usdArs={data.usdArs}
            height={312}
          />
          <div className="chart-foot">
            <span>
              <Clock3 size={13} />
              Cierre de referencia · {formatTime(data.updatedAt)}
            </span>
            <Link to="/mercado" className="link-arrow">
              Explorar pizarras
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </Card>

        <Card className="span-4 dash-panel">
          <PanelHeader
            eyebrow="Calidad"
            title={lastAnalysis ? 'Perfil de tu muestra' : 'Calidad promedio'}
            action={
              lastAnalysis ? (
                <Badge tone={lastAnalysis.grade === 'A' ? 'success' : 'warning'} dot>
                  Grado {lastAnalysis.grade}
                </Badge>
              ) : (
                <Badge tone="neutral">Benchmark</Badge>
              )
            }
          />
          <QualityRadar
            data={qualityData}
            height={256}
            sampleLabel={lastAnalysis ? 'Tu lote' : 'Promedio'}
          />
          <div className="quality-panel__legend">
            <ChartLegend
              items={[
                { label: lastAnalysis ? 'Tu lote' : 'Promedio', color: 'var(--accent)' },
                { label: 'Referencia', color: 'var(--muted)', dashed: true },
              ]}
            />
          </div>
          <div className="quality-panel__foot">
            <div>
              <span>Exportable</span>
              <strong className="mono">
                {lastAnalysis
                  ? `${formatNumber(lastAnalysis.exportPercentage, 1)}%`
                  : '88,6%'}
              </strong>
            </div>
            <div>
              <span>Muestras</span>
              <strong className="mono">{lastAnalysis ? '1 lote' : '128'}</strong>
            </div>
            <Link to="/analizar" className="link-arrow">
              Analizar
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </Card>

        <Card className="span-5 dash-panel">
          <PanelHeader
            eyebrow="Liquidez"
            title="Volumen operado"
            subtitle="Últimas 9 ruedas"
            action={<Badge tone="neutral">toneladas</Badge>}
          />
          <VolumeChart data={data.volumeSeries} height={238} />
          <ChartLegend
            items={[
              { label: 'Soja', color: GRAINS.soja.color },
              { label: 'Maíz', color: GRAINS.maiz.color },
              { label: 'Trigo', color: GRAINS.trigo.color },
              { label: 'Poroto', color: GRAINS.poroto.color },
            ]}
          />
        </Card>

        <Card className="span-4 dash-panel">
          <PanelHeader
            eyebrow="Prima de calidad"
            title="Pizarra vs. calidad"
            subtitle="US$/t"
          />
          <ComparisonBars data={data.qualityVsMarket} height={238} />
          <ChartLegend
            items={[
              { label: 'Pizarra', color: 'var(--chart-muted)' },
              { label: 'Con calidad', color: 'var(--accent)' },
            ]}
          />
        </Card>

        <Card className="span-3 dash-panel dash-panel--movers">
          <TopMovers quotes={localQuotes} />
        </Card>

        <Card className="span-8 dash-panel dash-panel--table">
          <PanelHeader
            eyebrow="Pizarras argentinas"
            title="Mercado de referencia"
            action={<Badge tone="accent" dot>6 granos</Badge>}
          />
          <QuotesTable quotes={localQuotes} series={data.series} />
        </Card>

        <div className="span-4 dash-stack">
          <LastSampleCard analysis={lastAnalysis} />
          <Card className="dash-panel">
            <PanelHeader
              eyebrow="Logística"
              title="Basis por región"
              subtitle="vs. Rosario"
              action={<Badge tone="neutral">US$/t</Badge>}
            />
            <BasisChart data={data.regions} height={236} />
          </Card>
        </div>
      </div>
    </div>
  )
}
