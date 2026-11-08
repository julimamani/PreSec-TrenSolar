import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Download,
  FileText,
  Gauge,
  ScanLine,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { ExportByGrainChart } from '../components/charts/ExportByGrainChart'
import type { ExportByGrainPoint } from '../components/charts/ExportByGrainChart'
import { ChartLegend } from '../components/charts/ChartLegend'
import { Badge } from '../components/ui/Badge'
import { Button, buttonClass } from '../components/ui/Button'
import { Card, PanelHeader } from '../components/ui/Card'
import { Select } from '../components/ui/Field'
import { GRAINS, getMockAnalysisHistory } from '../data/marketData'
import { useStoredAnalysis } from '../hooks/useStoredAnalysis'
import { formatDate, formatNumber, formatUsd } from '../lib/format'
import type { AnalysisHistoryItem, GrainType, QualityGrade } from '../types/analysis'

const GRADES: QualityGrade[] = ['A', 'B', 'C', 'D']

function csvFromHistory(items: AnalysisHistoryItem[]) {
  const rows = [
    [
      'id',
      'fecha',
      'grano',
      'variedad',
      'grado',
      'exportable_pct',
      'descarte_pct',
      'confianza_pct',
      'precio_estimado_usd_t',
      'pizarra_usd_t',
    ],
    ...items.map((item) => [
      item.id,
      item.createdAt,
      item.grainName,
      item.variety,
      item.grade,
      item.exportPercentage.toFixed(1),
      item.discardPercentage.toFixed(1),
      item.confidence.toFixed(1),
      item.estimatedUsd.toFixed(1),
      item.pizarraUsd.toFixed(1),
    ]),
  ]
  return rows.map((row) => row.join(',')).join('\n')
}

export function ReportsPage() {
  const { history } = useStoredAnalysis()
  const [grainFilter, setGrainFilter] = useState<'all' | GrainType>('all')

  const combined = useMemo(() => {
    const storedIds = new Set(history.map((item) => item.id))
    const demo = getMockAnalysisHistory().filter((item) => !storedIds.has(item.id))
    return [...history, ...demo].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [history])

  const filtered = useMemo(
    () =>
      combined.filter((item) => grainFilter === 'all' || item.grain === grainFilter),
    [combined, grainFilter],
  )

  const averageExport = combined.length
    ? combined.reduce((total, item) => total + item.exportPercentage, 0) / combined.length
    : 0
  const averageConfidence = combined.length
    ? combined.reduce((total, item) => total + item.confidence, 0) / combined.length
    : 0
  const averagePremium = combined.length
    ? combined.reduce((total, item) => total + (item.estimatedUsd - item.pizarraUsd), 0) /
      combined.length
    : 0

  const byGrain: ExportByGrainPoint[] = (Object.keys(GRAINS) as Array<keyof typeof GRAINS>)
    .map((grain) => {
      const entries = combined.filter((item) => item.grain === grain)
      if (entries.length === 0) return null
      return {
        grain: GRAINS[grain].name,
        exportable:
          entries.reduce((total, item) => total + item.exportPercentage, 0) / entries.length,
        benchmark: 90,
      }
    })
    .filter((item): item is ExportByGrainPoint => item !== null)

  const gradeCounts = GRADES.map((grade) => ({
    grade,
    count: combined.filter((item) => item.grade === grade).length,
  }))
  const maxGrade = Math.max(...gradeCounts.map((item) => item.count), 1)

  const exportCsv = () => {
    const blob = new Blob([csvFromHistory(filtered)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'purograno-informes.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <FileText size={13} /> Datos y trazabilidad
          </span>
          <h2>Historial de análisis</h2>
          <p>Resultados de laboratorio, calidad promedio y primas estimadas por lote.</p>
        </div>
        <div className="page-head__actions">
          <Button variant="outline" icon={<Download size={15} />} onClick={exportCsv}>
            Exportar CSV
          </Button>
          <Link to="/analizar" className={buttonClass('primary', 'md')}>
            <ScanLine size={16} />
            Nuevo análisis
          </Link>
        </div>
      </div>

      <div className="report-metrics">
        <div className="report-metric">
          <span className="report-metric__icon"><FileText size={18} /></span>
          <span>Análisis registrados</span>
          <strong className="mono">{formatNumber(combined.length)}</strong>
          <small>
            {history.length} {history.length === 1 ? 'guardado' : 'guardados'} en este navegador
          </small>
        </div>
        <div className="report-metric">
          <span className="report-metric__icon"><Gauge size={18} /></span>
          <span>Exportable promedio</span>
          <strong className="mono">{formatNumber(averageExport, 1)}%</strong>
          <small>Referencia de mercado 90%</small>
        </div>
        <div className="report-metric">
          <span className="report-metric__icon"><Sparkles size={18} /></span>
          <span>Confianza promedio</span>
          <strong className="mono">{formatNumber(averageConfidence, 1)}%</strong>
          <small>Modelo grain-vision v1.4</small>
        </div>
        <div className="report-metric">
          <span className="report-metric__icon"><TrendingUp size={18} /></span>
          <span>Prima media</span>
          <strong className="mono">{formatUsd(averagePremium, 1)}</strong>
          <small>por tonelada vs. pizarra</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <Card className="span-8 dash-panel">
          <PanelHeader
            eyebrow="Calidad por grano"
            title="Exportable promedio"
            subtitle="Últimos lotes"
            action={<Badge tone="accent" dot>histórico</Badge>}
          />
          <ExportByGrainChart data={byGrain} height={270} />
          <ChartLegend
            items={[
              { label: 'Exportable', color: 'var(--accent)' },
              { label: 'Referencia 90%', color: 'var(--chart-muted)' },
            ]}
          />
        </Card>

        <Card className="span-4 dash-panel">
          <PanelHeader
            eyebrow="Distribución"
            title="Grados de calidad"
            action={<Badge tone="neutral">{combined.length} lotes</Badge>}
          />
          <div className="grade-distribution">
            {gradeCounts.map((item) => (
              <div className="grade-row" key={item.grade}>
                <span className={`grade-pill grade-pill--${item.grade.toLowerCase()}`}>
                  {item.grade}
                </span>
                <span className="grade-row__track">
                  <span
                    className={`grade-row__fill grade-row__fill--${item.grade.toLowerCase()}`}
                    style={{ width: `${(item.count / maxGrade) * 100}%` }}
                  />
                </span>
                <span className="mono">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="grade-distribution__foot">
            <span>
              <ArrowUpRight size={13} />
              {combined.filter((item) => item.grade === 'A').length} lotes grado A listos para
              exportación
            </span>
          </div>
        </Card>
      </div>

      <Card className="dash-panel report-table-panel">
        <PanelHeader
          eyebrow="Registro"
          title="Análisis recientes"
          subtitle={`${filtered.length} resultados`}
          action={
            <Select
              aria-label="Filtrar por grano"
              value={grainFilter}
              onChange={(event) => setGrainFilter(event.target.value as 'all' | GrainType)}
            >
              <option value="all">Todos los granos</option>
              {(Object.keys(GRAINS) as GrainType[]).map((grain) => (
                <option key={grain} value={grain}>
                  {GRAINS[grain].name}
                </option>
              ))}
            </Select>
          }
        />
        <div className="data-table-wrap">
          <table className="data-table reports-table">
            <thead>
              <tr>
                <th>Muestra</th>
                <th>Fecha</th>
                <th>Grano</th>
                <th>Grado</th>
                <th className="is-right">Exportable</th>
                <th className="is-right">Confianza</th>
                <th className="is-right">Precio est.</th>
                <th className="is-right">Prima</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const grain = GRAINS[item.grain]
                const premium = item.estimatedUsd - item.pizarraUsd
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="report-id">
                        <span className="report-id__dot" style={{ backgroundColor: grain.color }} />
                        <span>
                          <strong className="mono">{item.id}</strong>
                          <small>{item.variety}</small>
                        </span>
                      </span>
                    </td>
                    <td className="muted">{formatDate(item.createdAt)}</td>
                    <td>{grain.name}</td>
                    <td>
                      <span className={`grade-pill grade-pill--${item.grade.toLowerCase()}`}>
                        {item.grade}
                      </span>
                    </td>
                    <td className="is-right mono">{formatNumber(item.exportPercentage, 1)}%</td>
                    <td className="is-right mono muted">{formatNumber(item.confidence, 1)}%</td>
                    <td className="is-right mono">{formatUsd(item.estimatedUsd, 1)}</td>
                    <td className={`is-right mono ${premium >= 0 ? 'text-up' : 'text-down'}`}>
                      {premium >= 0 ? '+' : '−'}
                      {formatNumber(Math.abs(premium), 1)}
                    </td>
                    <td>
                      <Badge tone="success" dot>Procesado</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="table-empty">
            <span>No hay análisis para el grano seleccionado.</span>
            <Button size="sm" variant="ghost" onClick={() => setGrainFilter('all')}>
              Ver todos
            </Button>
          </div>
        )}
        <div className="table-footnote">
          <span>
            <Sparkles size={13} /> {combined.length} informes · datos demo + análisis locales
          </span>
          <span>Exportable calculado por visión artificial</span>
        </div>
      </Card>
    </div>
  )
}
