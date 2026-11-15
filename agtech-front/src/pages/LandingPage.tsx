/**
 * Landing page with hero, analysis uploader, flow steps, features, market chart, and footer.
 * Uses hooks for analysis and market data, and renders various components for UI.
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  ChartNoAxesCombined,
  Code2,
  Cpu,
  FlaskConical,
  LayoutDashboard,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
} from 'lucide-react'
import { AnalysisPlaceholder, AnalysisSummaryCard } from '../components/analysis/AnalysisSummaryCard'
import { AnalysisProcessing } from '../components/analysis/AnalysisProcessing'
import { AnalysisUploader } from '../components/analysis/AnalysisUploader'
import { PriceChart } from '../components/charts/PriceChart'
import { Sparkline } from '../components/charts/Sparkline'
import { GrainFlowScene } from '../components/landing/GrainFlowScene'
import { MarketTicker } from '../components/landing/MarketTicker'
import { PublicHeader } from '../components/layout/PublicHeader'
import { Logo } from '../components/brand/Logo'
import { Badge } from '../components/ui/Badge'
import { buttonClass } from '../components/ui/Button'
import { Card, PanelHeader } from '../components/ui/Card'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { GRAINS } from '../data/marketData'
import { useAnalysis } from '../hooks/useAnalysis'
import { useMarketData } from '../hooks/useMarketData'
import { formatNumber, formatTons, formatUsd } from '../lib/format'
import type { PriceRange } from '../types/market'

/**
 * Flow steps for the landing page,  iteractive image 3d, each with a number, title, description, metric, and icon.
 */
const FLOW_STEPS = [
  {
    number: '01',
    title: 'Recepción',
    description: 'El lote ingresa con su trazabilidad: variedad, origen y toneladas estimadas.',
    metric: 'Trazabilidad',
    icon: Truck,
  },
  {
    number: '02',
    title: 'Muestreo',
    description: 'La muestra se fotografía con una guía simple para lograr una imagen comparable.',
    metric: '340 g',
    icon: ScanLine,
  },
  {
    number: '03',
    title: 'Visión IA',
    description: 'El modelo segmenta granos, detecta defectos y calcula el porcentaje exportable.',
    metric: '96,8% conf.',
    icon: Cpu,
  },
  {
    number: '04',
    title: 'Valuación y empaque',
    description: 'La calidad se convierte en una prima contra la pizarra y en un informe listo.',
    metric: 'Grado A',
    icon: Boxes,
  },
]

const FEATURES = [
  {
    icon: ScanLine,
    eyebrow: 'Computer vision',
    title: 'Calidad objetiva, no estimada a ojo',
    description:
      'Detección de granos quebrados, dañados, materia extraña y atributos cualitativos sobre una foto del lote.',
  },
  {
    icon: ChartNoAxesCombined,
    eyebrow: 'Market intelligence',
    title: 'Pizarras conectadas al resultado',
    description:
      'Cada muestra se compara con Matba Rofex y el spot regional de poroto para estimar una prima de calidad actualizada.',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Traceability',
    title: 'Trazabilidad de punta a punta',
    description:
      'Imagen original, heatmap, JSON de inferencia y precio estimado en un informe reproducible por lote.',
  },
  {
    icon: Code2,
    eyebrow: 'API-first',
    title: 'Arquitectura lista para escalar',
    description:
      'FastAPI para inferencia, Spring Boot para persistencia y un frontend tipado que se conecta en segundos.',
  },
]

const PREVIEW_GRAINS = ['soja', 'maiz', 'trigo'] as const

export function LandingPage() {
  const analysis = useAnalysis()
  const { data: market } = useMarketData()
  const [uploaderKey, setUploaderKey] = useState(0)
  const [previewRange, setPreviewRange] = useState<PriceRange>('30D')
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (
      analysis.status === 'completed' &&
      window.matchMedia('(max-width: 940px)').matches
    ) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [analysis.status])

  const handleNewAnalysis = () => {
    analysis.reset()
    setUploaderKey((key) => key + 1)
  }

  const previewCount = previewRange === '7D' ? 7 : previewRange === '30D' ? 30 : 90
  const previewData = market?.series.slice(-previewCount) ?? []
  const previewQuotes = market?.quotes.slice(0, 4) ?? []
  const heroQuote = market?.quotes.find((quote) => quote.grain === 'soja')
  const heroVenue =
    heroQuote?.venue === 'rosario' ? 'Spot regional' : 'Matba Rofex'

  return (
    <div className="landing">
      <PublicHeader />

      <main>
        <section className="hero">
          <span className="hero__grid-bg" aria-hidden="true" />
          <span className="hero__glow hero__glow--one" aria-hidden="true" />
          <span className="hero__glow hero__glow--two" aria-hidden="true" />

          <div className="container hero__inner">
            <div className="hero__copy">
              <span className="hero__badge">
                <Sparkles size={14} />
                MVP AgTech · visión artificial + mercado
              </span>
              <h1>
                De una foto del grano a un <span>precio de mercado.</span>
              </h1>
              <p className="hero__lede">
                PuroGrano analiza la calidad del lote con machine learning, detecta defectos y
                estima cuánto vale contra las pizarras de granos del día.
              </p>

              <div className="hero__actions">
                <a href="#analisis" className={buttonClass('primary', 'lg')}>
                  Analizar mi grano
                  <ArrowRight size={17} />
                </a>
                <Link to="/dashboard" className={buttonClass('ghost', 'lg')}>
                  <LayoutDashboard size={16} />
                  Ver dashboard
                </Link>
              </div>

              <div className="hero__stats">
                <div>
                  <strong>96,8%</strong>
                  <span>confianza del modelo</span>
                </div>
                <div>
                  <strong>8 s</strong>
                  <span>por muestra</span>
                </div>
                <div>
                  <strong>4</strong>
                  <span>granos soportados</span>
                </div>
              </div>

              <div className="hero__stack">
                <span>Pipeline</span>
                <Badge tone="neutral">FastAPI</Badge>
                <Badge tone="neutral">Spring Boot</Badge>
                <Badge tone="neutral">PostgreSQL</Badge>
              </div>
            </div>

            <div className="hero__visual">
              <GrainFlowScene />
              <span className="hero__float hero__float--price">
                <span className="hero__float-label">Soja {heroVenue}</span>
                <strong className="mono">
                  {heroQuote ? formatUsd(heroQuote.priceUsd, 1) : '—'}
                </strong>
                <span className={heroQuote && heroQuote.changePct < 0 ? 'text-down' : 'text-up'}>
                  {heroQuote
                    ? `${heroQuote.changePct >= 0 ? '▲' : '▼'} ${formatNumber(
                        Math.abs(heroQuote.changePct),
                        2,
                      )}%`
                    : 'sin datos'}
                </span>
              </span>
              <span className="hero__float hero__float--quality">
                <span className="status-dot status-dot--ok" />
                <span>
                  <strong>Exportable 94,2%</strong>
                  <small>última muestra · Grado A</small>
                </span>
              </span>
            </div>
          </div>
        </section>

        <MarketTicker />

        <section className="section section--analysis" id="analisis">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">
                <Zap size={13} /> De la imagen al precio
              </span>
              <h2>Subí tu grano. El modelo hace el resto.</h2>
              <p>
                La foto se procesa con visión artificial, se calcula el rendimiento exportable y
                el resultado se transforma en una valuación contra la pizarra vigente.
              </p>
            </div>

            <div className="landing-analysis-grid">
              <Card className="landing-upload-card">
                <AnalysisUploader
                  key={uploaderKey}
                  compact
                  isBusy={analysis.isBusy}
                  progress={analysis.progress}
                  stage={analysis.stage}
                  error={analysis.error}
                  previewUrl={analysis.previewUrl}
                  hasResult={Boolean(analysis.result)}
                  onAnalyze={(file, grain, variety, batch) => {
                    void analysis.analyze(file, grain, variety, batch)
                  }}
                  onReset={handleNewAnalysis}
                />
              </Card>

              <div className="landing-result" ref={resultRef}>
                {analysis.result ? (
                  <AnalysisSummaryCard result={analysis.result} onReset={handleNewAnalysis} />
                ) : analysis.isBusy ? (
                  <AnalysisProcessing
                    compact
                    progress={analysis.progress}
                    stage={analysis.stage}
                  />
                ) : (
                  <AnalysisPlaceholder />
                )}
                <p className="landing-result__note">
                  <ShieldCheck size={13} />
                  El resultado queda guardado en este navegador y se reutiliza en el dashboard y
                  los informes.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--flow" id="como-funciona">
          <div className="container">
            <div className="section-heading section-heading--center">
              <span className="eyebrow">
                <Boxes size={13} /> Del camión al empaque
              </span>
              <h2>Un solo flujo, cuatro estaciones.</h2>
              <p>
                La misma escena isométrica que ves arriba representa el recorrido del grano. Cada
                estación genera datos que alimentan el informe y la valuación.
              </p>
            </div>

            <div className="flow-grid">
              {FLOW_STEPS.map((step) => (
                <article className="flow-card" key={step.number}>
                  <span className="flow-card__number mono">{step.number}</span>
                  <span className="flow-card__icon">
                    <step.icon size={20} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <span className="flow-card__metric mono">{step.metric}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--features" id="producto">
          <div className="container">
            <div className="section-heading section-heading--split">
              <div>
                <span className="eyebrow">
                  <FlaskConical size={13} /> Producto
                </span>
                <h2>Menos intuición. Más evidencia.</h2>
              </div>
              <p>
                Una capa de inteligencia para compradores, acopios y productores que necesitan
                decidir con el mismo dato: calidad + precio.
              </p>
            </div>

            <div className="feature-grid">
              {FEATURES.map((feature) => (
                <article className="feature-card" key={feature.title}>
                  <span className="feature-card__icon">
                    <feature.icon size={20} />
                  </span>
                  <span className="eyebrow">{feature.eyebrow}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <span className="feature-card__link">
                    Incluido en el MVP
                    <ArrowUpRight size={13} />
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--market" id="mercado">
          <div className="container">
            <div className="section-heading section-heading--split">
              <div>
                <span className="eyebrow">
                  <ChartNoAxesCombined size={13} /> Mercado conectado
                </span>
                <h2>Tu calidad, valuada contra la pizarra de hoy.</h2>
              </div>
              <p>
                El panel cruza el porcentaje exportable del lote con las pizarras de referencia
                para mostrar el precio estimado y la prima de calidad.
              </p>
            </div>

            <div className="landing-market-grid">
              <Card className="landing-market-chart">
                <PanelHeader
                  eyebrow="Soja · Maíz · Trigo"
                  title="Evolución de pizarras"
                  subtitle="US$/t"
                  action={
                    <SegmentedControl
                      options={[
                        { value: '7D' as const, label: '7D' },
                        { value: '30D' as const, label: '30D' },
                        { value: '90D' as const, label: '90D' },
                      ]}
                      value={previewRange}
                      onChange={setPreviewRange}
                      ariaLabel="Rango del gráfico de mercado"
                    />
                  }
                />
                <PriceChart
                  data={previewData}
                  grains={[...PREVIEW_GRAINS]}
                  currency="USD"
                  usdArs={market?.usdArs ?? 0}
                  height={300}
                />
                <div className="chart-foot">
                  <span>Matba Rofex · DolarAPI · Spot regional</span>
                  <Link to="/dashboard" className="link-arrow">
                    Abrir dashboard
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </Card>

              <div className="landing-quotes">
                {previewQuotes.map((quote) => {
                  const grain = GRAINS[quote.grain]
                  const spark = (market?.series ?? [])
                    .slice(-14)
                    .map((point) => point[quote.grain])
                  return (
                    <article className="landing-quote" key={quote.id}>
                      <span className="landing-quote__dot" style={{ backgroundColor: grain.color }} />
                      <div className="landing-quote__main">
                        <span>
                          <strong>{grain.name}</strong>
                          <small>{quote.venue === 'rosario' ? 'Spot regional' : 'Matba Rofex'}</small>
                        </span>
                        <strong className="mono">{formatUsd(quote.priceUsd, 1)}</strong>
                      </div>
                      <div className="landing-quote__foot">
                        <span className={quote.changePct >= 0 ? 'text-up' : 'text-down'}>
                          {quote.changePct >= 0 ? '▲' : '▼'}{' '}
                          {formatNumber(Math.abs(quote.changePct), 2)}%
                        </span>
                        <span>{formatTons(quote.volumeTons)}</span>
                      </div>
                      <Sparkline
                        data={spark}
                        color={quote.changePct >= 0 ? grain.color : 'var(--danger)'}
                        width={92}
                        height={26}
                      />
                    </article>
                  )
                })}
                <div className="landing-quotes__footer">
                  <span>
                    <span className="status-dot status-dot--ok" />
                    Pizarras actualizadas
                  </span>
                  <Link to="/mercado" className="link-arrow">
                    Ver mercado
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--cta">
          <div className="container">
            <div className="landing-cta">
              <span className="landing-cta__glow" aria-hidden="true" />
              <div>
                <span className="eyebrow">
                  <Sparkles size={13} /> Demo lista
                </span>
                <h2>Probá el flujo completo con una foto.</h2>
                <p>
                  Sin instalar nada. Subí una muestra, mirá el score de calidad y abrí el
                  dashboard con la valuación actualizada.
                </p>
              </div>
              <div className="landing-cta__actions">
                <a href="#analisis" className={buttonClass('primary', 'lg')}>
                  Analizar una muestra
                  <ArrowRight size={17} />
                </a>
                <Link to="/dashboard" className={buttonClass('outline', 'lg')}>
                  Explorar dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="container landing-footer__inner">
          <div className="landing-footer__brand">
            <Logo />
            <p>Grain intelligence para la cadena agroindustrial argentina.</p>
            <span className="landing-footer__badge">
              <span className="status-dot status-dot--ok" />
              MVP demo · mercado conectado
            </span>
          </div>
          <div className="landing-footer__col">
            <strong>Producto</strong>
            <a href="#analisis">Análisis de calidad</a>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/mercado">Mercado</Link>
            <Link to="/informes">Informes</Link>
          </div>
          <div className="landing-footer__col">
            <strong>Stack</strong>
            <span>FastAPI · visión artificial</span>
            <span>Spring Boot · PostgreSQL</span>
            <span>React · TypeScript</span>
            <span>Spline · escena 3D</span>
          </div>
          <div className="landing-footer__col">
            <strong>Escena 3D</strong>
            <p>
              El componente acepta una escena de Spline mediante{' '}
              <code>VITE_SPLINE_SCENE_URL</code>. Sin URL, corre la escena isométrica local.
            </p>
            <span className="landing-footer__tech">
              <Code2 size={13} /> Spline-ready
            </span>
          </div>
        </div>
        <div className="container landing-footer__bottom">
          <span>© 2026 PuroGrano · PreSec AgTech</span>
          <span>Precios de referencia de Matba Rofex y DolarAPI; no constituyen asesoramiento financiero.</span>
        </div>
      </footer>
    </div>
  )
}
