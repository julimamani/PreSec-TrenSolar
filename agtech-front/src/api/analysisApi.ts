import { GRAINS } from '../data/marketData'
import {
  BACKEND_API_URL,
  BACKEND_ENDPOINTS,
  createSampleAnalysis,
  ensureBatch,
  estimateFinancialImpact,
  resolveBackendAssetUrl,
  type BackendInferenceResultDetail,
  type BackendSampleAnalysis,
} from './backendApi'
import type {
  AnalysisHistoryItem,
  AnalysisRequest,
  AnalysisResult,
  BatchSummary,
  DefectDetail,
  FinancialImpact,
  GrainType,
  QualityAttribute,
  QualityAxisPoint,
  QualityGrade,
} from '../types/analysis'
import type { MarketVenueId, Quote } from '../types/market'

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false'

export const API_RUNTIME = {
  mock: USE_MOCK,
  backendApiUrl: BACKEND_API_URL,
  sampleAnalysisPath: BACKEND_ENDPOINTS.sampleAnalyses,
}

interface DefectTemplate {
  id: string
  label: string
  base: number
}

interface AttributeTemplate {
  id: string
  label: string
  base: number
  benchmark: number
  unit: string
  better: 'higher' | 'lower'
  decimals: number
}

interface GrainProfile {
  defaultVariety: string
  venue: MarketVenueId
  defects: DefectTemplate[]
  attributes: AttributeTemplate[]
  radar: Array<{ axis: string; base: number; benchmark: number }>
}

const FALLBACK_PRICES: Record<GrainType, number> = {
  soja: 450,
  maiz: 200,
  trigo: 220,
  poroto: 1250,
}

const GRAIN_PROFILES: Record<GrainType, GrainProfile> = {
  soja: {
    defaultVariety: 'DM 46R18',
    venue: 'global',
    defects: [
      { id: 'quebrado', label: 'Grano quebrado', base: 2.1 },
      { id: 'danado', label: 'Daño mecánico', base: 1.4 },
      { id: 'materia-extrana', label: 'Materia extraña', base: 1.1 },
      { id: 'manchado', label: 'Manchado / hongos', base: 0.8 },
      { id: 'arvenses', label: 'Arvenses', base: 0.5 },
    ],
    attributes: [
      { id: 'protein', label: 'Proteína', base: 36.4, benchmark: 36, unit: '%', better: 'higher', decimals: 1 },
      { id: 'oil', label: 'Aceite', base: 21.3, benchmark: 20.5, unit: '%', better: 'higher', decimals: 1 },
      { id: 'moisture', label: 'Humedad', base: 12.4, benchmark: 13, unit: '%', better: 'lower', decimals: 1 },
      { id: 'weight', label: 'Peso hectolítrico', base: 78.2, benchmark: 76, unit: 'kg/hl', better: 'higher', decimals: 1 },
      { id: 'foreign', label: 'Materia extraña', base: 1.1, benchmark: 1.5, unit: '%', better: 'lower', decimals: 1 },
    ],
    radar: [
      { axis: 'Exportable', base: 93, benchmark: 90 },
      { axis: 'Proteína', base: 88, benchmark: 85 },
      { axis: 'Aceite', base: 84, benchmark: 80 },
      { axis: 'Peso hect.', base: 91, benchmark: 88 },
      { axis: 'Humedad ópt.', base: 87, benchmark: 88 },
      { axis: 'Limpieza', base: 94, benchmark: 92 },
    ],
  },
  maiz: {
    defaultVariety: 'DK 72-27',
    venue: 'global',
    defects: [
      { id: 'quebrado', label: 'Grano quebrado', base: 3.2 },
      { id: 'danado', label: 'Daño mecánico', base: 1.8 },
      { id: 'materia-extrana', label: 'Materia extraña', base: 1.2 },
      { id: 'hongos', label: 'Hongos / fusarium', base: 0.9 },
      { id: 'arvenses', label: 'Arvenses', base: 0.6 },
    ],
    attributes: [
      { id: 'protein', label: 'Proteína', base: 8.7, benchmark: 8.5, unit: '%', better: 'higher', decimals: 1 },
      { id: 'starch', label: 'Almidón', base: 71.2, benchmark: 70, unit: '%', better: 'higher', decimals: 1 },
      { id: 'moisture', label: 'Humedad', base: 13.6, benchmark: 14, unit: '%', better: 'lower', decimals: 1 },
      { id: 'weight', label: 'Peso hectolítrico', base: 74.6, benchmark: 73, unit: 'kg/hl', better: 'higher', decimals: 1 },
      { id: 'foreign', label: 'Materia extraña', base: 1.2, benchmark: 1.5, unit: '%', better: 'lower', decimals: 1 },
    ],
    radar: [
      { axis: 'Exportable', base: 89, benchmark: 88 },
      { axis: 'Proteína', base: 83, benchmark: 82 },
      { axis: 'Almidón', base: 90, benchmark: 88 },
      { axis: 'Peso hect.', base: 86, benchmark: 84 },
      { axis: 'Humedad ópt.', base: 89, benchmark: 88 },
      { axis: 'Limpieza', base: 91, benchmark: 90 },
    ],
  },
  trigo: {
    defaultVariety: 'Baguette 620',
    venue: 'global',
    defects: [
      { id: 'quebrado', label: 'Grano quebrado', base: 1.5 },
      { id: 'danado', label: 'Daño mecánico', base: 1.0 },
      { id: 'materia-extrana', label: 'Materia extraña', base: 0.9 },
      { id: 'panza-blanca', label: 'Panza blanca', base: 1.3 },
      { id: 'arvenses', label: 'Arvenses', base: 0.7 },
    ],
    attributes: [
      { id: 'protein', label: 'Proteína', base: 12.6, benchmark: 12, unit: '%', better: 'higher', decimals: 1 },
      { id: 'gluten', label: 'Gluten', base: 28.4, benchmark: 27, unit: '%', better: 'higher', decimals: 1 },
      { id: 'moisture', label: 'Humedad', base: 12.8, benchmark: 13.5, unit: '%', better: 'lower', decimals: 1 },
      { id: 'weight', label: 'Peso hectolítrico', base: 79.4, benchmark: 78, unit: 'kg/hl', better: 'higher', decimals: 1 },
      { id: 'foreign', label: 'Materia extraña', base: 0.8, benchmark: 1.2, unit: '%', better: 'lower', decimals: 1 },
    ],
    radar: [
      { axis: 'Exportable', base: 91, benchmark: 90 },
      { axis: 'Proteína', base: 89, benchmark: 86 },
      { axis: 'Gluten', base: 90, benchmark: 87 },
      { axis: 'Peso hect.', base: 92, benchmark: 89 },
      { axis: 'Humedad ópt.', base: 90, benchmark: 88 },
      { axis: 'Limpieza', base: 95, benchmark: 93 },
    ],
  },
  poroto: {
    defaultVariety: 'Alubia Cerrillos',
    venue: 'rosario',
    defects: [
      { id: 'partido', label: 'Grano partido', base: 1.8 },
      { id: 'danado', label: 'Daño mecánico', base: 1.2 },
      { id: 'materia-extrana', label: 'Materia extraña', base: 0.8 },
      { id: 'manchado', label: 'Manchado / hongos', base: 0.9 },
      { id: 'arvenses', label: 'Arvenses', base: 0.4 },
    ],
    attributes: [
      { id: 'protein', label: 'Proteína', base: 23.4, benchmark: 22, unit: '%', better: 'higher', decimals: 1 },
      { id: 'moisture', label: 'Humedad', base: 13.2, benchmark: 14, unit: '%', better: 'lower', decimals: 1 },
      { id: 'weight', label: 'Peso hectolítrico', base: 78.4, benchmark: 76, unit: 'kg/hl', better: 'higher', decimals: 1 },
      { id: 'caliber', label: 'Calibre', base: 7.2, benchmark: 6.8, unit: 'mm', better: 'higher', decimals: 1 },
      { id: 'foreign', label: 'Materia extraña', base: 0.7, benchmark: 1.2, unit: '%', better: 'lower', decimals: 1 },
    ],
    radar: [
      { axis: 'Exportable', base: 92, benchmark: 90 },
      { axis: 'Proteína', base: 88, benchmark: 85 },
      { axis: 'Calibre', base: 91, benchmark: 88 },
      { axis: 'Peso hect.', base: 89, benchmark: 86 },
      { axis: 'Humedad ópt.', base: 93, benchmark: 90 },
      { axis: 'Limpieza', base: 94, benchmark: 92 },
    ],
  },
}

function mulberry32(seed: number) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timeout)
        reject(new DOMException('La operación fue cancelada.', 'AbortError'))
      },
      { once: true },
    )
  })
}

function gradeFromExport(exportPercentage: number): QualityGrade {
  if (exportPercentage >= 93) return 'A'
  if (exportPercentage >= 86) return 'B'
  if (exportPercentage >= 78) return 'C'
  return 'D'
}

function defectSeverity(percentage: number): DefectDetail['severity'] {
  if (percentage >= 2.8) return 'high'
  if (percentage >= 1.4) return 'medium'
  return 'low'
}

const DEFECT_LABELS: Record<string, string> = {
  broken: 'Grano quebrado',
  broken_grains: 'Grano quebrado',
  damaged: 'Daño mecánico',
  discolored: 'Manchado / decolorado',
  wrinkled: 'Grano arrugado',
  foreign_matter: 'Materia extraña',
  foreign: 'Materia extraña',
  split: 'Grano partido',
  mold: 'Hongos',
}

const DEFECT_METADATA_KEYS = new Set([
  'total_grains',
  'healthy_grains',
  'defective_grains',
  'defective_area_pct',
  'confidence',
  'confidence_pct',
  'model_version',
  'processing_ms',
])

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function humanizeKey(key: string): string {
  const normalized = key.replace(/[_-]+/g, ' ').trim()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

/**
 * Converts the backend `defect_details` map (counts from the vision service or
 * percentages) into the typed defect list used by the UI.
 */
export function parseDefectDetails(
  details: Record<string, unknown> | null | undefined,
): DefectDetail[] {
  if (!details) return []

  const totalGrains = toNumber(details.total_grains)

  return Object.entries(details)
    .filter(([key, value]) => {
      if (DEFECT_METADATA_KEYS.has(key)) return false
      if (typeof value === 'object' && value !== null) return false
      return toNumber(value) !== null
    })
    .map(([key, value]) => {
      const raw = toNumber(value) ?? 0
      const isPercentage = /(?:^|_)(?:pct|percent|percentage)$/i.test(key)
      const percentage = isPercentage
        ? raw
        : totalGrains && totalGrains > 0
          ? (raw / totalGrains) * 100
          : raw

      return {
        id: key,
        label: DEFECT_LABELS[key] ?? humanizeKey(key),
        percentage: round(clamp(percentage, 0, 100), 1),
        severity: defectSeverity(percentage),
      }
    })
    .sort((first, second) => second.percentage - first.percentage)
}

function extractConfidence(
  details: Record<string, unknown> | null | undefined,
): number | undefined {
  const raw = toNumber(details?.confidence ?? details?.confidence_pct)
  if (raw === null) return undefined
  return round(raw > 0 && raw <= 1 ? raw * 100 : raw, 1)
}

function extractModelVersion(
  details: Record<string, unknown> | null | undefined,
): string | undefined {
  const raw = details?.model_version
  return typeof raw === 'string' && raw.trim() !== '' ? raw : undefined
}

function attributeStatus(
  value: number,
  benchmark: number,
  better: 'higher' | 'lower',
): QualityAttribute['status'] {
  const difference = better === 'higher' ? value - benchmark : benchmark - value
  const tolerance = Math.abs(benchmark) * 0.035

  if (difference >= 0) return 'optimal'
  if (difference >= -tolerance) return 'watch'
  return 'alert'
}

function venueName(venue: MarketVenueId): string {
  return venue === 'rosario' ? 'Spot regional' : 'Matba Rofex'
}

function buildMockResult(request: AnalysisRequest, quotes: Quote[] = []): AnalysisResult {
  const profile = GRAIN_PROFILES[request.grain]
  const seedSource = `${request.file.name}-${request.file.size}-${request.grain}`
  let seed = 2166136261
  for (let index = 0; index < seedSource.length; index += 1) {
    seed ^= seedSource.charCodeAt(index)
    seed = Math.imul(seed, 16777619)
  }
  const random = mulberry32(seed >>> 0)

  const qualityBias = 0.72 + random() * 0.62
  const defects: DefectDetail[] = profile.defects.map((defect) => {
    const percentage = round(defect.base * qualityBias * (0.72 + random() * 0.58), 1)
    return {
      id: defect.id,
      label: defect.label,
      percentage,
      severity: defectSeverity(percentage),
    }
  })

  const discardPercentage = round(
    clamp(
      defects.reduce((total, defect) => total + defect.percentage, 0),
      2.8,
      17.4,
    ),
    1,
  )
  const exportPercentage = round(100 - discardPercentage, 1)
  const grade = gradeFromExport(exportPercentage)
  const confidence = round(95.2 + random() * 3.4, 1)
  const createdAt = new Date()
  const quote = quotes.find((item) => item.grain === request.grain)
  const pizarraUsd =
    quote && quote.priceUsd > 0 ? quote.priceUsd : FALLBACK_PRICES[request.grain]
  const venue = quote?.venue ?? profile.venue
  const referenceDate = quote?.updatedAt ?? createdAt.toISOString()

  const valuationFactor = 0.75 + (exportPercentage / 100) * 0.32
  const estimatedUsd = round(pizarraUsd * valuationFactor, 1)
  const premiumUsd = round(estimatedUsd - pizarraUsd, 1)
  const premiumPct = round((premiumUsd / pizarraUsd) * 100, 2)

  const attributes: QualityAttribute[] = profile.attributes.map((attribute) => {
    const value = round(
      attribute.base * (0.985 + random() * 0.03),
      attribute.decimals,
    )
    return {
      id: attribute.id,
      label: attribute.label,
      value,
      benchmark: attribute.benchmark,
      unit: attribute.unit,
      better: attribute.better,
      status: attributeStatus(value, attribute.benchmark, attribute.better),
    }
  })

  const qualityAxes: QualityAxisPoint[] = profile.radar.map((axis) => ({
    axis: axis.axis,
    sample: round(clamp(axis.base * (0.94 + random() * 0.1), 48, 100), 1),
    benchmark: axis.benchmark,
  }))

  const sequence = Math.floor(2400 + random() * 800)

  return {
    id: `PG-${sequence}`,
    createdAt: createdAt.toISOString(),
    grain: request.grain,
    grainName: GRAINS[request.grain].name,
    variety: request.variety?.trim() || profile.defaultVariety,
    grade,
    confidence,
    exportPercentage,
    discardPercentage,
    defects,
    attributes,
    qualityAxes,
    valuation: {
      venue,
      venueName: venueName(venue),
      pizarraUsd,
      estimatedUsd,
      premiumUsd,
      premiumPct,
      referenceDate,
    },
    processingMs: Math.round(2400 + random() * 1100),
    modelVersion: 'grain-vision v1.4',
  }
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function buildBackendResult(
  request: AnalysisRequest,
  quotes: Quote[],
  batch: BatchSummary,
  response: BackendSampleAnalysis,
  processingMs: number,
): AnalysisResult {
  const inference = response.inferenceResult
  if (
    response.status !== 'COMPLETED' ||
    !inference ||
    inference.exportPercentage === null ||
    inference.discardPercentage === null
  ) {
    throw new Error(
      `El backend no devolvió un resultado completo (estado ${response.status}).`,
    )
  }

  const profile = GRAIN_PROFILES[request.grain]
  const exportPercentage = round(clamp(inference.exportPercentage, 0, 100), 1)
  const discardPercentage = round(clamp(inference.discardPercentage, 0, 100), 1)
  const grade = gradeFromExport(exportPercentage)
  const defects = parseDefectDetails(inference.defectDetails)

  const quote = quotes.find((item) => item.grain === request.grain)
  const pizarraUsd =
    quote && quote.priceUsd > 0 ? quote.priceUsd : FALLBACK_PRICES[request.grain]
  const venue = quote?.venue ?? profile.venue
  const referenceDate = quote?.updatedAt ?? response.createdAt

  const valuationFactor = 0.75 + (exportPercentage / 100) * 0.32
  const estimatedUsd = round(pizarraUsd * valuationFactor, 1)
  const premiumUsd = round(estimatedUsd - pizarraUsd, 1)
  const premiumPct = round((premiumUsd / pizarraUsd) * 100, 2)

  return {
    id: response.id,
    createdAt: response.createdAt,
    grain: request.grain,
    grainName: GRAINS[request.grain].name,
    variety: request.variety?.trim() || batch.variety || profile.defaultVariety,
    grade,
    confidence: extractConfidence(inference.defectDetails),
    exportPercentage,
    discardPercentage,
    defects,
    attributes: [],
    qualityAxes: [],
    valuation: {
      venue,
      venueName: venueName(venue),
      pizarraUsd,
      estimatedUsd,
      premiumUsd,
      premiumPct,
      referenceDate,
    },
    processingMs,
    modelVersion: extractModelVersion(inference.defectDetails),
    persisted: true,
    sampleAnalysisId: response.id,
    batchId: batch.id,
    originalImageUrl: resolveBackendAssetUrl(response.originalImageUrl),
    heatmapImageUrl: resolveBackendAssetUrl(inference.heatmapImageUrl),
  }
}

async function attachFinancialImpact(
  result: AnalysisResult,
  batch: BatchSummary,
  signal?: AbortSignal,
): Promise<AnalysisResult> {
  try {
    const impact = await estimateFinancialImpact(
      {
        grain: result.grain,
        tons: batch.estimatedTons > 0 ? batch.estimatedTons : 100,
        defectPercentage: result.discardPercentage,
        venue: result.valuation.venue,
      },
      signal,
    )
    result.financialImpact = {
      priceUsdTon: impact.priceUsdTon,
      exchangeRateUsed: impact.exchangeRateUsed,
      defectPercentage: impact.defectPercentage,
      penaltyFactor: impact.penaltyFactor,
      lossUsd: impact.lossUsd,
      lossArs: impact.lossArs,
      source: impact.source,
      calculatedAt: impact.calculatedAt,
    } satisfies FinancialImpact
  } catch {
    // The loss estimate is complementary; the valuation stays valid without it.
  }
  return result
}

export async function analyzeSample(
  request: AnalysisRequest,
  signal?: AbortSignal,
  quotes: Quote[] = [],
): Promise<AnalysisResult> {
  if (USE_MOCK) {
    await sleep(2600, signal)
    return buildMockResult(request, quotes)
  }

  const batch =
    request.batch ??
    (await ensureBatch(
      request.variety?.trim() || GRAIN_PROFILES[request.grain].defaultVariety,
      signal,
    ))

  const startedAt = nowMs()
  const response = await createSampleAnalysis(batch.id, request.file, signal)
  const processingMs = Math.max(1, Math.round(nowMs() - startedAt))

  const result = buildBackendResult(request, quotes, batch, response, processingMs)
  return attachFinancialImpact(result, batch, signal)
}

/**
 * Live analyses are persisted by POST /api/sample-analyses, so there is no
 * second write. In demo mode this only simulates the old local save step.
 */
export async function saveAnalysisResult(
  result: AnalysisResult,
  _signal?: AbortSignal,
): Promise<{ id: string }> {
  if (USE_MOCK) {
    await sleep(850, _signal)
    return { id: result.id }
  }

  return { id: result.sampleAnalysisId ?? result.id }
}

/**
 * Maps GET /api/inference-results into the local history shape. The backend
 * does not persist grain or prices, so those fields stay empty.
 */
export function toHistoryItemFromInferenceResult(
  result: BackendInferenceResultDetail,
): AnalysisHistoryItem {
  const exportPercentage =
    result.exportPercentage !== null && result.exportPercentage !== undefined
      ? round(clamp(result.exportPercentage, 0, 100), 1)
      : result.discardPercentage !== null && result.discardPercentage !== undefined
        ? round(clamp(100 - result.discardPercentage, 0, 100), 1)
        : 0

  const discardPercentage =
    result.discardPercentage !== null && result.discardPercentage !== undefined
      ? round(clamp(result.discardPercentage, 0, 100), 1)
      : round(100 - exportPercentage, 1)

  return {
    id: result.sampleAnalysisId || result.id,
    createdAt: result.createdAt,
    grain: null,
    grainName: 'Sin clasificar',
    variety: '',
    grade: gradeFromExport(exportPercentage),
    exportPercentage,
    discardPercentage,
    confidence: null,
    estimatedUsd: null,
    pizarraUsd: null,
    defectCount: parseDefectDetails(result.defectDetails).length,
    source: 'backend',
    heatmapImageUrl: resolveBackendAssetUrl(result.heatmapImageUrl),
  }
}

export function validateImage(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'El archivo debe ser una imagen JPG, PNG o WEBP.'
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'La imagen supera el límite de 10 MB.'
  }
  return null
}
