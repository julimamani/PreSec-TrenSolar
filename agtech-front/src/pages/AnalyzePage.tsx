import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera,
  Check,
  FileText,
  ScanLine,
  Sparkles,
  Sun,
  UploadCloud,
} from 'lucide-react'
import { AnalysisPlaceholder } from '../components/analysis/AnalysisSummaryCard'
import { AnalysisProcessing } from '../components/analysis/AnalysisProcessing'
import { AnalysisResultView } from '../components/analysis/AnalysisResultView'
import { AnalysisUploader } from '../components/analysis/AnalysisUploader'
import { Badge } from '../components/ui/Badge'
import { Card, PanelHeader } from '../components/ui/Card'
import { useAnalysis } from '../hooks/useAnalysis'
import { buttonClass } from '../components/ui/Button'

const TIPS = [
  {
    icon: Sun,
    title: 'Luz natural y difusa',
    text: 'Evitá sombras duras o reflejos directos sobre la muestra.',
  },
  {
    icon: Camera,
    title: 'Fondo uniforme',
    text: 'Usá una superficie clara y lisa para que el modelo segmente mejor.',
  },
  {
    icon: UploadCloud,
    title: 'Muestra completa',
    text: 'Encuadrá el recipiente entero y mantené la cámara perpendicular.',
  },
]

export function AnalyzePage() {
  const analysis = useAnalysis()
  const [uploaderKey, setUploaderKey] = useState(0)

  const handleReset = () => {
    analysis.reset()
    setUploaderKey((key) => key + 1)
  }

  if (analysis.result) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <span className="eyebrow">
              <Sparkles size={13} /> Resultado listo
            </span>
            <h2>Informe de calidad y valuación</h2>
            <p>Revisá el score, los defectos y la prima estimada contra la pizarra.</p>
          </div>
          <div className="page-head__actions">
            <Link to="/informes" className={buttonClass('ghost', 'md')}>
              <FileText size={15} />
              Ver informes
            </Link>
          </div>
        </div>

        <AnalysisResultView
          result={analysis.result}
          isSaving={analysis.isSaving}
          saved={analysis.saved}
          saveError={analysis.saveError}
          onSave={() => void analysis.save()}
          onReset={handleReset}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">
            <ScanLine size={13} /> Laboratorio de calidad
          </span>
          <h2>Subí una muestra de grano</h2>
          <p>
            El modelo detecta defectos, estima el rendimiento exportable y calcula su valor con
            la pizarra del día.
          </p>
        </div>
        <div className="page-head__actions">
          <Badge tone="accent">Paso 1 de 2</Badge>
          <Link to="/informes" className={buttonClass('ghost', 'md')}>
            <FileText size={15} />
            Historial
          </Link>
        </div>
      </div>

      <div className="analyze-grid">
        <Card className="analyze-upload">
          <PanelHeader
            eyebrow="Nueva muestra"
            title="Imagen del lote"
            subtitle="JPG · PNG · WEBP"
          />
          <AnalysisUploader
            key={uploaderKey}
            isBusy={analysis.isBusy}
            progress={analysis.progress}
            stage={analysis.stage}
            error={analysis.error}
            previewUrl={analysis.previewUrl}
            hasResult={Boolean(analysis.result)}
            onAnalyze={(file, grain, variety, batch) => {
              void analysis.analyze(file, grain, variety, batch)
            }}
            onReset={handleReset}
          />
        </Card>

        <div className="analyze-side">
          {analysis.isBusy ? (
            <AnalysisProcessing progress={analysis.progress} stage={analysis.stage} />
          ) : (
            <AnalysisPlaceholder />
          )}

          <Card className="analyze-tips flex-1" >
            <PanelHeader
              eyebrow="Buenas prácticas"
              title="Para una inferencia precisa"
              action={<Badge tone="neutral">3 tips</Badge>}
            />
            <div className="analyze-tips__list">
              {TIPS.map((tip) => (
                <div className="analyze-tip" key={tip.title}>
                  <span className="analyze-tip__icon">
                    <tip.icon size={16} />
                  </span>
                  <div>
                    <strong>{tip.title}</strong>
                    <p>{tip.text}</p>
                  </div>
                  <Check size={14} className="analyze-tip__check" aria-hidden="true" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
