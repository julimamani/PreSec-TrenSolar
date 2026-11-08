import { Link } from 'react-router-dom'
import { ArrowUpRight, ScanLine, Sparkles, TrendingUp } from 'lucide-react'
import { GRAINS } from '../../data/marketData'
import { formatDate, formatNumber, formatSignedUsd, formatUsd } from '../../lib/format'
import type { AnalysisResult } from '../../types/analysis'
import { QualityGauge } from '../charts/QualityGauge'
import { Badge } from '../ui/Badge'
import { PanelHeader } from '../ui/Card'
import { buttonClass } from '../ui/Button'

export function LastSampleCard({ analysis }: { analysis: AnalysisResult | null }) {
  if (!analysis) {
    return (
      <div className="last-sample last-sample--empty">
        <PanelHeader eyebrow="Tu laboratorio" title="Última muestra" />
        <div className="last-sample__empty-body">
          <span className="last-sample__empty-icon">
            <ScanLine size={22} />
          </span>
          <strong>Todavía no analizaste una muestra</strong>
          <p>Subí una foto y el resultado impacta acá y en cada valuación del panel.</p>
          <Link to="/analizar" className={buttonClass('primary', 'sm')}>
            Analizar grano
          </Link>
        </div>
      </div>
    )
  }

  const grain = GRAINS[analysis.grain]
  const tone = analysis.grade === 'A' ? 'accent' : analysis.grade === 'B' ? 'warning' : 'danger'

  return (
    <div className="last-sample">
      <PanelHeader
        eyebrow="Tu laboratorio"
        title="Última muestra"
        action={
          <Badge tone={analysis.grade === 'A' ? 'success' : 'warning'} dot>
            Grado {analysis.grade}
          </Badge>
        }
      />
      <div className="last-sample__body">
        <QualityGauge
          value={analysis.exportPercentage}
          label="Exportable"
          size={112}
          strokeWidth={8}
          tone={tone}
        />
        <div className="last-sample__copy">
          <span className="last-sample__grain">
            <span style={{ backgroundColor: grain.color }} />
            {analysis.grainName} · {analysis.variety}
          </span>
          <strong className="mono">{formatUsd(analysis.valuation.estimatedUsd, 1)}/t</strong>
          <span className="last-sample__premium">
            <TrendingUp size={13} aria-hidden="true" />
            {formatSignedUsd(analysis.valuation.premiumUsd, 1)} por calidad
          </span>
        </div>
      </div>
      <div className="last-sample__stats">
        <div>
          <span>Descarte</span>
          <strong className="mono">{formatNumber(analysis.discardPercentage, 1)}%</strong>
        </div>
        <div>
          <span>Confianza</span>
          <strong className="mono">{formatNumber(analysis.confidence, 1)}%</strong>
        </div>
        <div>
          <span>Pizarra</span>
          <strong className="mono">{formatUsd(analysis.valuation.pizarraUsd, 1)}</strong>
        </div>
      </div>
      <div className="last-sample__footer">
        <span>
          {analysis.id} · {formatDate(analysis.createdAt)}
        </span>
        <Link to="/informes" className="link-arrow">
          <Sparkles size={13} />
          Ver informe
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  )
}
