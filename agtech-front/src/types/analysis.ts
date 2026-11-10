import type { GrainId, MarketVenueId } from './market'

export type GrainType = Extract<GrainId, 'soja' | 'maiz' | 'trigo' | 'poroto'>

export type AnalysisStatus =
  | 'idle'
  | 'validating'
  | 'processing'
  | 'matching'
  | 'completed'
  | 'error'

export type QualityGrade = 'A' | 'B' | 'C' | 'D'

export type DefectSeverity = 'low' | 'medium' | 'high'

export interface DefectDetail {
  id: string
  label: string
  percentage: number
  severity: DefectSeverity
}

export interface QualityAttribute {
  id: string
  label: string
  value: number
  benchmark: number
  unit: string
  better: 'higher' | 'lower'
  status: 'optimal' | 'watch' | 'alert'
}

export interface QualityAxisPoint {
  axis: string
  sample: number
  benchmark: number
}

export interface MarketValuation {
  venue: MarketVenueId
  venueName: string
  pizarraUsd: number
  estimatedUsd: number
  premiumUsd: number
  premiumPct: number
  referenceDate: string
}

export interface FinancialImpact {
  priceUsdTon: number
  exchangeRateUsed: number
  defectPercentage: number
  penaltyFactor: number
  lossUsd: number
  lossArs: number
  source: string
  calculatedAt: string
}

export interface AnalysisResult {
  id: string
  createdAt: string
  grain: GrainType
  grainName: string
  variety: string
  grade: QualityGrade
  /** The backend does not persist a confidence score; absent for live analyses. */
  confidence?: number
  exportPercentage: number
  discardPercentage: number
  defects: DefectDetail[]
  attributes: QualityAttribute[]
  qualityAxes: QualityAxisPoint[]
  valuation: MarketValuation
  processingMs: number
  /** Result of POST /api/financial/impact for the batch tonnage. */
  financialImpact?: FinancialImpact
  /** Only present when the inference service reports it. */
  modelVersion?: string
  /** True when the backend already persisted the sample analysis. */
  persisted?: boolean
  sampleAnalysisId?: string
  batchId?: string
  originalImageUrl?: string
  heatmapImageUrl?: string
}

export interface BatchSummary {
  id: string
  customerId: string
  variety: string
  estimatedTons: number
  createdAt?: string
  updatedAt?: string
}

export interface AnalysisRequest {
  file: File
  grain: GrainType
  variety?: string
  batch?: BatchSummary | null
}

export interface AnalysisHistoryItem {
  id: string
  createdAt: string
  grain: GrainType | null
  grainName: string
  variety: string
  grade: QualityGrade
  exportPercentage: number
  discardPercentage: number
  confidence: number | null
  estimatedUsd: number | null
  pizarraUsd: number | null
  defectCount: number
  /** Where the record came from: local storage or GET /api/inference-results. */
  source?: 'local' | 'backend'
  heatmapImageUrl?: string
}

export interface AnalysisUiState {
  status: AnalysisStatus
  stage: string
  progress: number
  result: AnalysisResult | null
  error: string | null
  previewUrl: string | null
  isSaving: boolean
  saved: boolean
  saveError: string | null
}
