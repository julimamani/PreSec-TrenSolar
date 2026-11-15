import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  CircleCheck,
  Download,
  FlaskConical,
  Save,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { API_RUNTIME } from '../../api/analysisApi'
import { formatDateTime, formatNumber, formatSignedUsd, formatUsd } from '../../lib/format'
import type { AnalysisResult, QualityAttribute } from '../../types/analysis'
import { QualityGauge } from '../charts/QualityGauge'
import { QualityRadar } from '../charts/QualityRadar'
import { Badge } from '../ui/Badge'
import { Button, buttonClass } from '../ui/Button'
import { Card, PanelHeader } from '../ui/Card'
import { Progress } from '../ui/Field'

function statusTone(status: QualityAttribute['status']) {
  if (status === 'optimal') return 'success' as const
  if (status === 'watch') return 'warning' as const
  return 'danger' as const
}

function statusLabel(status: QualityAttribute['status']) {
  if (status === 'optimal') return 'Óptimo'
  if (status === 'watch') return 'Atención'
  return 'Fuera de rango'
}

function attributeValue(attribute: QualityAttribute) {
  const separator = attribute.unit === '%' ? '' : ' '
  return `${formatNumber(attribute.value, 1)}${separator}${attribute.unit}`
}

function downloadJson(result: AnalysisResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${result.id}-${result.grain}.json`
  link.click()
  URL.revokeObjectURL(url)
}

interface AnalysisResultViewProps {
  result: AnalysisResult
  isSaving: boolean
  saved: boolean
  saveError: string | null
  onSave: () => void
  onReset: () => void
}

export function AnalysisResultView({
  result,
  isSaving,
  saved,
  saveError,
  onSave,
  onReset,
}: AnalysisResultViewProps) {
  const tone = result.grade === 'A' ? 'accent' : result.grade === 'B' ? 'warning' : 'danger'
  const maxValuation = Math.max(result.valuation.pizarraUsd, result.valuation.estimatedUsd)
  const premiumPositive = result.valuation.premiumUsd >= 0

  return (
    <div className="result-view">
      <Card className="result-view__head">
        <div className="result-view__identity">
          <span className="eyebrow">Informe de análisis · {result.id}</span>
          <h2>
            {result.grainName} <span>·</span> {result.variety}
          </h2>
          <div className="result-view__meta">
            <Badge tone={result.grade === 'A' ? 'success' : 'warning'} dot>
              Grado {result.grade}
            </Badge>
            <span>{formatDateTime(result.createdAt)}</span>
            {result.modelVersion && <span>{result.modelVersion}</span>}
            <span>{formatNumber(result.processingMs / 1000, 1)} s de proceso</span>
          </div>
        </div>
        <div className="result-view__actions">
          <Button
            variant="outline"
            icon={<Download size={15} />}
            onClick={() => downloadJson(result)}
          >
            JSON
          </Button>
          <Button
            variant={saved ? 'secondary' : 'primary'}
            loading={isSaving}
            disabled={saved}
            icon={saved ? <Check size={15} /> : <Save size={15} />}
            onClick={onSave}
          >
            {saved ? 'Guardado' : 'Guardar en Spring'}
          </Button>
          <Link to="/dashboard" className={buttonClass('ghost', 'md')}>
            Dashboard
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </Card>

      {saveError && (
        <div className="alert alert--danger" role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          <span>{saveError}</span>
        </div>
      )}

      {saved && (
        <div className="alert alert--success" role="status">
          <CircleCheck size={16} aria-hidden="true" />
          <span>
            Análisis guardado{API_RUNTIME.mock ? ' en modo demo' : ' en Spring Boot'}. Ya
            aparece en informes y en el panel.
          </span>
        </div>
      )}

      <div className="result-view__grid">
        <Card className="result-view__quality">
          <PanelHeader eyebrow="Calidad del lote" title="Rendimiento exportable" />
          <div className="quality-summary">
            <QualityGauge
              value={result.exportPercentage}
              label="Exportable"
              sublabel={`Grado ${result.grade}`}
              size={172}
              tone={tone}
            />
            <div className="quality-summary__stats">
              <div>
                <span>Descarte</span>
                <strong className="mono">{formatNumber(result.discardPercentage, 1)}%</strong>
              </div>
              <div>
                <span>Confianza del modelo</span>
                <strong className="mono">
                  {result.confidence !== undefined
                    ? `${formatNumber(result.confidence, 1)}%`
                    : '—'}
                </strong>
              </div>
              <div>
                <span>Atributos fuera de rango</span>
                <strong className="mono">
                  {result.attributes.filter((attribute) => attribute.status === 'alert').length}
                </strong>
              </div>
            </div>
          </div>
          <div className="quality-summary__badge-row">
            <Badge tone="success" dot>
              Lote apto para exportación
            </Badge>
            <span className="muted">Score calculado sobre 100 puntos</span>
          </div>
        </Card>

        <Card className="result-view__valuation">
          <PanelHeader
            eyebrow="Valuación de mercado"
            title="Precio con prima de calidad"
            action={<Badge tone="info">{result.valuation.venueName}</Badge>}
          />
          <div className="valuation-hero">
            <div>
              <span>Precio estimado</span>
              <strong className="mono">{formatUsd(result.valuation.estimatedUsd, 1)}</strong>
              <small>por tonelada</small>
            </div>
            <div className={`valuation-premium ${premiumPositive ? 'is-positive' : 'is-negative'}`}>
              <TrendingUp size={16} aria-hidden="true" />
              <span className="mono">{formatSignedUsd(result.valuation.premiumUsd, 1)}</span>
              <small>{formatNumber(result.valuation.premiumPct, 2)}% vs. pizarra</small>
            </div>
          </div>
          <div className="valuation-bars">
            <div className="valuation-bar">
              <span>Pizarra</span>
              <span className="valuation-bar__track">
                <span
                  className="is-muted"
                  style={{ width: `${(result.valuation.pizarraUsd / maxValuation) * 100}%` }}
                />
              </span>
              <span className="mono">{formatUsd(result.valuation.pizarraUsd, 1)}</span>
            </div>
            <div className="valuation-bar">
              <span>Con calidad</span>
              <span className="valuation-bar__track">
                <span
                  style={{ width: `${(result.valuation.estimatedUsd / maxValuation) * 100}%` }}
                />
              </span>
              <span className="mono">{formatUsd(result.valuation.estimatedUsd, 1)}</span>
            </div>
          </div>
          {result.financialImpact && (
            <div className="valuation-impact">
              <div>
                <span>Pérdida estimada por descarte</span>
                <small>
                  factor {formatNumber(result.financialImpact.penaltyFactor, 2)} ·{' '}
                  {formatNumber(result.financialImpact.defectPercentage, 1)}% defectuoso
                </small>
              </div>
              <div className="valuation-impact__values">
                <strong className="mono">
                  {formatUsd(result.financialImpact.lossUsd, 1)}
                </strong>
                <small className="mono">
                  $ {formatNumber(result.financialImpact.lossArs, 0)} ARS
                </small>
              </div>
            </div>
          )}
          <div className="valuation-formula">
            <FlaskConical size={15} aria-hidden="true" />
            <span>
              Pizarra × ajuste por exportable + prima por atributos. Referencia actualizada al{' '}
              {formatDateTime(result.valuation.referenceDate)}.
            </span>
          </div>
        </Card>

        <Card className="result-view__radar">
          <PanelHeader
            eyebrow="Perfil de calidad"
            title="Muestra vs. referencia"
            action={
              <span className="chart-legend">
                <span className="chart-legend__item">
                  <span className="chart-legend__mark" style={{ backgroundColor: 'var(--accent)' }} />
                  Muestra
                </span>
                <span className="chart-legend__item">
                  <span
                    className="chart-legend__mark is-dashed"
                    style={{ backgroundColor: 'var(--muted)' }}
                  />
                  Referencia
                </span>
              </span>
            }
          />
          {result.qualityAxes.length > 0 ? (
            <QualityRadar data={result.qualityAxes} height={270} />
          ) : (
            <div className="table-empty">
              <span>El backend no devolvió el perfil de calidad por ejes.</span>
            </div>
          )}
        </Card>

        <Card className="result-view__defects">
          <PanelHeader
            eyebrow="Defectos detectados"
            title="Composición del descarte"
            subtitle={`${result.defects.length} categorías`}
          />
          <div className="defect-list">
            {result.defects.map((defect) => {
              const tone =
                defect.severity === 'high'
                  ? 'danger'
                  : defect.severity === 'medium'
                    ? 'warning'
                    : 'accent'
              return (
                <div className="defect-item" key={defect.id}>
                  <div className="defect-item__head">
                    <span>{defect.label}</span>
                    <span className="mono">{formatNumber(defect.percentage, 1)}%</span>
                  </div>
                  <Progress value={defect.percentage * 8} tone={tone} />
                </div>
              )
            })}
            {result.defects.length === 0 && (
              <div className="table-empty">
                <span>El backend no devolvió el detalle de defectos.</span>
              </div>
            )}
          </div>
          <div className="defect-total">
            <span>Descarte total</span>
            <strong className="mono">{formatNumber(result.discardPercentage, 1)}%</strong>
          </div>       
           </Card>
      

        <Card className="result-view__attributes">

          {/* Atributos del grano fisioquimicos, desabilitado debido a queno hay una carga de  resultadosd de laboratorio
          <PanelHeader
            eyebrow="Análisis fisicoquímico "
            title="Atributos del grano"
            action={
              <span className="attribute-legend">
                <span><i className="dot dot--ok" /> Óptimo</span>
                <span><i className="dot dot--warn" /> Atención</span>
              </span>
            }
          />
          {result.attributes.length > 0 ? (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Atributo</th>
                    <th>Muestra</th>
                    <th>Referencia</th>
                    <th>Estado</th>
                  </tr>
<<<<<<< HEAD
                ))}
              </tbody>
            </table>
          </div>
          */}
          
=======
                </thead>
                <tbody>
                  {result.attributes.map((attribute) => (
                    <tr key={attribute.id}>
                      <td>{attribute.label}</td>
                      <td className="mono">{attributeValue(attribute)}</td>
                      <td className="mono muted">
                        {formatNumber(attribute.benchmark, 1)}
                        {attribute.unit === '%' ? '%' : ` ${attribute.unit}`}
                      </td>
                      <td>
                        <Badge tone={statusTone(attribute.status)}>
                          {statusLabel(attribute.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-empty">
              <span>
                El backend no persiste atributos fisicoquímicos; solo devuelve el
                rendimiento exportable y los defectos detectados.
              </span>
            </div>
          )}
>>>>>>> 0e670ae8c78af3b0456731605cc63b129ccf786f
          <div className="result-view__attributes-footer">
            <span>
              <ShieldCheck size={14} aria-hidden="true" />
              Trazabilidad completa: imagen original, heatmap y JSON de inferencia.
            </span>
            <Button variant="ghost" size="sm" onClick={onReset}>
              Nuevo análisis
            </Button>
          </div>
        </Card>

        {result.heatmapImageUrl && (
          <Card className="result-view__heatmap">
            <PanelHeader eyebrow="Trazabilidad" title="Heatmap de defectos" />
            <div className="result-heatmap">
              <img
                src={result.heatmapImageUrl}
                alt={`Heatmap del análisis ${result.id}`}
                loading="lazy"
              />
            </div>
            {result.originalImageUrl && (
              <a
                href={result.originalImageUrl}
                target="_blank"
                rel="noreferrer"
                className="link-arrow"
              >
                Ver imagen original
                <ArrowUpRight size={13} />
              </a>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
