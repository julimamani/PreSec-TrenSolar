/**
 * AnalysisProcessing.tsx
 *
 * Componente que muestra el estado de procesamiento de la imagen de granos.
 * Muestra un indicador de progreso, el estado actual y los pasos del pipeline de visión.
 */

import { Loader2, ScanLine } from 'lucide-react'
import { cn } from '../../lib/format'
import { Progress } from '../ui/Field'

const STEPS = [
  { threshold: 16, label: 'Validando imagen' },
  { threshold: 38, label: 'Segmentando granos' },
  { threshold: 62, label: 'Detectando defectos' },
  { threshold: 82, label: 'Calculando rendimiento' },
  { threshold: 100, label: 'Comparando con pizarras' },
]

export function AnalysisProcessing({
  progress,
  stage,
  compact = false,
}: {
  progress: number
  stage: string
  compact?: boolean
}) {
  return (
    <div className={cn('analysis-processing', compact && 'analysis-processing--compact')}>
      <div className="analysis-processing__orb" aria-hidden="true">
        <span className="analysis-processing__pulse" />
        <ScanLine size={34} />
      </div>
      <span className="eyebrow">
        <Loader2 size={13} className="spin" /> Procesando muestra
      </span>
      <h3>{stage}</h3>
      <p>La imagen se analiza en el navegador demo y se contrasta con la pizarra vigente.</p>

      <div className="analysis-processing__progress">
        <div className="analysis-processing__progress-head">
          <span>Pipeline de visión</span>
          <span className="mono">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <ul className="analysis-processing__steps">
        {STEPS.map((step, index) => {
          const previous = index === 0 ? 0 : STEPS[index - 1].threshold
          const active = progress >= previous && progress < step.threshold
          const done = progress >= step.threshold
          return (
            <li key={step.label} className={cn(done && 'is-done', active && 'is-active')}>
              <span className="analysis-processing__step-dot">
                {done ? '✓' : String(index + 1).padStart(2, '0')}
              </span>
              {step.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
