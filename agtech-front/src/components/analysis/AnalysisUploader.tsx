import { useEffect, useId, useRef, useState } from 'react'
import {
  CircleAlert,
  CircleCheck,
  ImagePlus,
  Loader2,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react'
import { API_RUNTIME, validateImage } from '../../api/analysisApi'
import { GRAINS, ANALYSIS_GRAINS } from '../../data/marketData'
import { useMarketData } from '../../hooks/useMarketData'
import { cn, formatUsd } from '../../lib/format'
import type { GrainType } from '../../types/analysis'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Progress } from '../ui/Field'
import { Input } from '../ui/Input'

interface AnalysisUploaderProps {
  isBusy: boolean
  progress: number
  stage: string
  error: string | null
  previewUrl: string | null
  hasResult: boolean
  onAnalyze: (file: File, grain: GrainType, variety?: string) => void
  onReset: () => void
  compact?: boolean
}

export function AnalysisUploader({
  isBusy,
  progress,
  stage,
  error,
  previewUrl,
  hasResult,
  onAnalyze,
  onReset,
  compact = false,
}: AnalysisUploaderProps) {
  const { data: market } = useMarketData()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [grain, setGrain] = useState<GrainType>('soja')
  const [variety, setVariety] = useState('')
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setLocalPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setLocalPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const resetLocal = () => {
    setFile(null)
    setLocalError(null)
    setVariety('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const selectFile = (nextFile: File | undefined) => {
    if (!nextFile) return
    const validation = validateImage(nextFile)
    if (validation) {
      setLocalError(validation)
      return
    }
    setLocalError(null)
    setFile(nextFile)
  }

  const handleReset = () => {
    resetLocal()
    onReset()
  }

  const displayError = localError ?? error
  const displayPreview = previewUrl ?? localPreview
  const selectedGrain = GRAINS[grain]
  const pizarra = market?.quotes.find((quote) => quote.grain === grain)?.priceUsd

  return (
    <div className={cn('uploader', compact && 'uploader--compact')}>
      <input
        ref={inputRef}
        id={inputId}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => selectFile(event.target.files?.[0])}
      />

      {displayPreview && file ? (
        <div className={cn('upload-preview', isBusy && 'is-scanning')}>
          <img src={displayPreview} alt={`Muestra de ${selectedGrain.name} para analizar`} />
          <span className="upload-preview__grid" aria-hidden="true" />
          {isBusy && <span className="upload-preview__scan" aria-hidden="true" />}
          <span className="upload-preview__badge">
            <ScanLine size={13} aria-hidden="true" />
            {isBusy ? 'Procesando muestra' : hasResult ? 'Muestra analizada' : 'Muestra cargada'}
          </span>
          <div className="upload-preview__footer">
            <span className="upload-preview__name" title={file.name}>
              {file.name}
            </span>
            <button
              type="button"
              className="upload-preview__remove"
              aria-label="Quitar imagen"
              disabled={isBusy}
              onClick={resetLocal}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={cn('dropzone', dragging && 'is-dragging')}
          onDragEnter={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            setDragging(false)
          }}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            selectFile(event.dataTransfer.files?.[0])
          }}
        >
          <span className="dropzone__icon">
            <UploadCloud size={24} aria-hidden="true" />
          </span>
          <strong>Arrastrá la foto de tu grano</strong>
          <span className="dropzone__hint">
            JPG, PNG o WEBP · máximo 10 MB · fondo uniforme
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={<ImagePlus size={15} />}
            onClick={() => inputRef.current?.click()}
          >
            Seleccionar archivo
          </Button>
          <span className="dropzone__sample">
            <span style={{ background: selectedGrain.color }} /> {selectedGrain.name} seleccionada
          </span>
        </div>
      )}

      <div className="uploader__form">
        <div className="field">
          <span className="field__label" id={`${inputId}-grain-label`}>
            Tipo de grano
          </span>
          <div
            className="grain-selector"
            role="radiogroup"
            aria-labelledby={`${inputId}-grain-label`}
          >
            {ANALYSIS_GRAINS.map((grainId) => {
              const meta = GRAINS[grainId]
              return (
                <button
                  key={grainId}
                  type="button"
                  className={cn('grain-option', grain === grainId && 'is-active')}
                  role="radio"
                  aria-checked={grain === grainId}
                  disabled={isBusy}
                  onClick={() => setGrain(grainId)}
                >
                  <span className="grain-option__dot" style={{ backgroundColor: meta.color }} />
                  <span>{meta.name}</span>
                  <span className="grain-option__code">{meta.short}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="uploader__row">
          <Input
            label="Variedad / híbrido"
            placeholder="Ej. DM 46R18"
            value={variety}
            disabled={isBusy}
            onChange={(event) => setVariety(event.target.value)}
          />
          <div className="uploader__reference">
            <span className="field__label">Pizarra actual</span>
            <span className="uploader__reference-value mono">
              {pizarra ? formatUsd(pizarra, 1) : '—'}
              <small>/t</small>
            </span>
          </div>
        </div>
      </div>

      {isBusy && (
        <div className="uploader__progress" aria-live="polite">
          <div className="uploader__progress-head">
            <span>
              <Loader2 size={14} className="spin" aria-hidden="true" />
              {stage}
            </span>
            <span className="mono">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
          <span className="uploader__progress-hint">
            Segmentación · detección de defectos · valuación con pizarra
          </span>
        </div>
      )}

      {displayError && (
        <div className="alert alert--danger" role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          <span>{displayError}</span>
        </div>
      )}

      <div className="uploader__actions">
        <Button
          className="uploader__submit"
          size={compact ? 'md' : 'lg'}
          loading={isBusy}
          icon={!isBusy ? <ScanLine size={16} /> : undefined}
          disabled={!file || isBusy}
          onClick={() => file && onAnalyze(file, grain, variety)}
        >
          {hasResult ? 'Volver a analizar' : 'Analizar con IA'}
        </Button>
        {(file || hasResult) && (
          <Button
            variant="ghost"
            size={compact ? 'md' : 'lg'}
            icon={<RotateCcw size={15} />}
            disabled={isBusy}
            onClick={handleReset}
          >
            Limpiar
          </Button>
        )}
      </div>

      <div className="uploader__trust">
        <ShieldCheck size={14} aria-hidden="true" />
        <span>
          {API_RUNTIME.mock
            ? 'Modo demo: la inferencia se simula localmente. Desactivá VITE_USE_MOCK para conectar FastAPI.'
            : `Conectado a ${API_RUNTIME.analysisApiUrl} · imagen procesada sin almacenamiento público.`}
        </span>
        {!API_RUNTIME.mock && <Badge tone="success">live</Badge>}
      </div>

      {hasResult && !isBusy && (
        <span className="uploader__result-hint">
          <CircleCheck size={14} aria-hidden="true" />
          Resultado listo para revisar
        </span>
      )}
    </div>
  )
}
