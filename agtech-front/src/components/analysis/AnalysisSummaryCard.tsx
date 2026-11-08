import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CircleCheck,
  Gauge,
  ScanSearch,
  Sparkles,
  TrendingUp,
  WandSparkles,
} from 'lucide-react'
import { MARKET_SNAPSHOT } from '../../data/marketData'
import { formatDate, formatNumber, formatSignedUsd, formatUsd } from '../../lib/format'
import type { AnalysisResult } from '../../types/analysis'
import { QualityGauge } from '../charts/QualityGauge'
import { Badge } from '../ui/Badge'
import { buttonClass } from '../ui/Button'

export function AnalysisSummaryCard({
  result,
  onReset,
}: {
  result: AnalysisResult
  onReset: () => void
}) {
  const premiumPositive = result.valuation.premiumUsd >= 0
  const topDefects = [...result.defects]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3)
  const maxDefect = Math.max(...topDefects.map((defect) => defect.percentage), 1)
  const tone = result.grade === 'A' ? 'accent' : result.grade === 'B' ? 'warning' : 'danger'

  return (
    <div className="result-card">
      <div className="result-card__head">
        <div>
          <span className="eyebrow">Resultado de la muestra</span>
          <h3>
            {result.grainName} <span>·</span> {result.variety}
          </h3>
        </div>
        <Badge tone={result.grade === 'A' ? 'success' : 'warning'} dot>
          Grado {result.grade}
        </Badge>
      </div>

      <div className="result-card__main">
        <QualityGauge
          value={result.exportPercentage}
          label="Exportable"
          sublabel={`Descarte ${formatNumber(result.discardPercentage, 1)}%`}
          size={142}
          tone={tone}
        />

        <div className="result-card__valuation">
          <span className="eyebrow">Precio estimado por calidad</span>
          <strong className="result-card__price mono">
            {formatUsd(result.valuation.estimatedUsd, 1)}
            <small>/t</small>
          </strong>
          <span
            className={`result-card__premium ${premiumPositive ? 'is-positive' : 'is-negative'}`}
          >
            <TrendingUp size={14} aria-hidden="true" />
            {formatSignedUsd(result.valuation.premiumUsd, 1)} vs. pizarra
          </span>
          <div className="result-card__reference">
            <span>{result.valuation.venueName}</span>
            <span className="mono">{formatUsd(result.valuation.pizarraUsd, 1)}</span>
          </div>
        </div>
      </div>

      <div className="result-card__stats">
        <div>
          <span>Exportable</span>
          <strong className="mono">{formatNumber(result.exportPercentage, 1)}%</strong>
        </div>
        <div>
          <span>Descarte</span>
          <strong className="mono">{formatNumber(result.discardPercentage, 1)}%</strong>
        </div>
        <div>
          <span>Confianza IA</span>
          <strong className="mono">{formatNumber(result.confidence, 1)}%</strong>
        </div>
      </div>

      <div className="result-card__defects">
        <div className="result-card__defects-head">
          <span>
            <Gauge size={14} aria-hidden="true" /> Defectos detectados
          </span>
          <span className="mono">{result.defects.length}</span>
        </div>
        {topDefects.map((defect) => (
          <div className="defect-row defect-row--compact" key={defect.id}>
            <span>{defect.label}</span>
            <span className="defect-row__track">
              <span
                style={{ width: `${Math.max((defect.percentage / maxDefect) * 100, 6)}%` }}
              />
            </span>
            <span className="mono">{formatNumber(defect.percentage, 1)}%</span>
          </div>
        ))}
      </div>

      <div className="result-card__market">
        <Sparkles size={15} aria-hidden="true" />
        <span>
          El valor de esta muestra ya está disponible en el panel de mercado y en tus
          informes.
        </span>
      </div>

      <div className="result-card__footer">
        <Link to="/dashboard" className={buttonClass('primary', 'md')}>
          Usar en el dashboard
          <ArrowUpRight size={16} />
        </Link>
        <button type="button" className={buttonClass('ghost', 'md')} onClick={onReset}>
          Nuevo análisis
        </button>
      </div>

      <div className="result-card__stamp">
        <span className="mono">{result.id}</span>
        <span>·</span>
        <span>{formatDate(result.createdAt)}</span>
        <span>·</span>
        <span>{result.modelVersion}</span>
        <span className="result-card__stamp-icon">
          <CircleCheck size={13} aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

export function AnalysisPlaceholder() {
  const soja = MARKET_SNAPSHOT.quotes[0]

  return (
    <div className="analysis-placeholder">
      <div className="analysis-placeholder__visual" aria-hidden="true">
        <span className="analysis-placeholder__ring analysis-placeholder__ring--one" />
        <span className="analysis-placeholder__ring analysis-placeholder__ring--two" />
        <span className="analysis-placeholder__core">
          <ScanSearch size={30} />
        </span>
        <span className="analysis-placeholder__grain analysis-placeholder__grain--one" />
        <span className="analysis-placeholder__grain analysis-placeholder__grain--two" />
        <span className="analysis-placeholder__grain analysis-placeholder__grain--three" />
      </div>

      <span className="eyebrow">Salida del modelo</span>
      <h3>Tu resultado aparecerá acá</h3>
      <p>
        Subí una foto nítida del lote. El modelo detecta granos quebrados, daño, materia
        extraña y calcula la prima de calidad contra la pizarra del día.
      </p>

      <ol className="analysis-placeholder__pipeline">
        <li>
          <span>01</span>
          <div>
            <strong>Visión artificial</strong>
            <small>Segmentación de granos y defectos en segundos.</small>
          </div>
        </li>
        <li>
          <span>02</span>
          <div>
            <strong>Score de calidad</strong>
            <small>Exportable, descarte, humedad y atributos por grano.</small>
          </div>
        </li>
        <li>
          <span>03</span>
          <div>
            <strong>Valuación de mercado</strong>
            <small>Precio estimado con pizarra actualizada de la bolsa.</small>
          </div>
        </li>
      </ol>

      <div className="analysis-placeholder__market">
        <span className="analysis-placeholder__market-icon">
          <WandSparkles size={15} />
        </span>
        <div>
          <span>Ejemplo · Soja Rosario</span>
          <strong className="mono">{formatUsd(soja.priceUsd, 1)}/t</strong>
        </div>
        <Badge tone="success">+{soja.changePct.toFixed(2)}%</Badge>
      </div>
    </div>
  )
}
