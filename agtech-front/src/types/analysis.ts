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

export interface AnalysisResult {
  id: string
  createdAt: string
  grain: GrainType
  grainName: string
  variety: string
  grade: QualityGrade
  confidence: number
  exportPercentage: number
  discardPercentage: number
  defects: DefectDetail[]
  attributes: QualityAttribute[]
  qualityAxes: QualityAxisPoint[]
  valuation: MarketValuation
  processingMs: number
  modelVersion: string
}

export interface AnalysisRequest {
  file: File
  grain: GrainType
  variety?: string
}

export interface AnalysisHistoryItem {
  id: string
  createdAt: string
  grain: GrainType
  grainName: string
  variety: string
  grade: QualityGrade
  exportPercentage: number
  discardPercentage: number
  confidence: number
  estimatedUsd: number
  pizarraUsd: number
  defectCount: number
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
