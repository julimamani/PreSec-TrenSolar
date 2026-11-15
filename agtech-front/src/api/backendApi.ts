import type { BatchSummary } from '../types/analysis'

const DEFAULT_BACKEND_API_URL = 'http://localhost:8081'

export const BACKEND_API_URL = (
  import.meta.env.VITE_BACKEND_API_URL ?? DEFAULT_BACKEND_API_URL
).replace(/\/+$/, '')

export const BACKEND_ENDPOINTS = {
  customers: '/api/customers',
  batches: '/api/batches',
  sampleAnalyses:
    import.meta.env.VITE_SAMPLE_ANALYSIS_PATH ?? '/api/sample-analyses',
  inferenceResults: '/api/inference-results',
  financialImpact: '/api/financial/impact',
  marketSnapshot: '/api/market-snapshot',
} as const

export interface BackendCustomer {
  id: string
  businessName: string
  taxId: string
  subscriptionPlan: 'BASIC' | 'PRO' | 'ENTERPRISE'
  createdAt: string
  updatedAt: string
}

export interface BackendBatch {
  id: string
  customerId: string
  variety: string
  estimatedTons: number
  createdAt: string
  updatedAt: string
}

export interface BackendInferenceResult {
  id: string
  exportPercentage: number | null
  discardPercentage: number | null
  defectDetails: Record<string, unknown> | null
  heatmapImageUrl: string | null
}

export interface BackendInferenceResultDetail extends BackendInferenceResult {
  sampleAnalysisId: string
  createdAt: string
  updatedAt: string
}

export interface BackendSampleAnalysis {
  id: string
  batchId: string
  originalImageUrl: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'
  createdAt: string
  inferenceResult: BackendInferenceResult | null
}

export interface BackendFinancialImpact {
  grain: string
  venue: string
  priceUsdTon: number
  exchangeRateUsed: number
  defectPercentage: number
  penaltyFactor: number
  lossUsd: number
  lossArs: number
  source: string
  calculatedAt: string
}

interface ProblemDetail {
  detail?: string
  title?: string
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const problem = (await response.json()) as ProblemDetail
    if (problem.detail) return `${problem.detail} (${response.status})`
    if (problem.title) return `${problem.title} (${response.status})`
  } catch {
    // The body is not JSON; fall back to the generic message.
  }
  return `${fallback} (${response.status})`
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${BACKEND_API_URL}${path}`, init)

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'El backend rechazó la solicitud'))
  }

  return (await response.json()) as T
}

export function resolveBackendAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${BACKEND_API_URL}${url}`
  return url
}

export async function listCustomers(signal?: AbortSignal): Promise<BackendCustomer[]> {
  return requestJson<BackendCustomer[]>(BACKEND_ENDPOINTS.customers, { signal })
}

export async function createCustomer(
  payload: { businessName: string; taxId: string; subscriptionPlan: 'BASIC' | 'PRO' | 'ENTERPRISE' },
  signal?: AbortSignal,
): Promise<BackendCustomer> {
  return requestJson<BackendCustomer>(BACKEND_ENDPOINTS.customers, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
}

export async function listBatches(
  customerId?: string,
  signal?: AbortSignal,
): Promise<BatchSummary[]> {
  const query = customerId ? `?customerId=${encodeURIComponent(customerId)}` : ''
  const batches = await requestJson<BackendBatch[]>(
    `${BACKEND_ENDPOINTS.batches}${query}`,
    { signal },
  )
  return batches.map(toBatchSummary)
}

export async function createBatch(
  payload: { customerId: string; variety: string; estimatedTons: number },
  signal?: AbortSignal,
): Promise<BatchSummary> {
  const batch = await requestJson<BackendBatch>(BACKEND_ENDPOINTS.batches, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  return toBatchSummary(batch)
}

function toBatchSummary(batch: BackendBatch): BatchSummary {
  return {
    id: batch.id,
    customerId: batch.customerId,
    variety: batch.variety,
    estimatedTons: batch.estimatedTons,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
  }
}

/**
 * Returns an existing batch or provisions a demo customer + batch so that
 * POST /api/sample-analyses always has a valid batchId.
 */
export async function ensureBatch(
  variety: string,
  signal?: AbortSignal,
): Promise<BatchSummary> {
  const batches = await listBatches(undefined, signal)
  if (batches.length > 0) return batches[0]

  const customers = await listCustomers(signal)
  const customer =
    customers[0] ??
    (await createCustomer(
      {
        businessName: 'Agro Demo',
        taxId: '20-00000000-1',
        subscriptionPlan: 'BASIC',
      },
      signal,
    ))

  return createBatch(
    {
      customerId: customer.id,
      variety: variety.trim() || 'Lote demo',
      estimatedTons: 100,
    },
    signal,
  )
}

export async function createSampleAnalysis(
  batchId: string,
  file: File,
  signal?: AbortSignal,
): Promise<BackendSampleAnalysis> {
  const body = new FormData()
  body.append('batchId', batchId)
  body.append('file', file)

  const response = await fetch(
    `${BACKEND_API_URL}${BACKEND_ENDPOINTS.sampleAnalyses}`,
    {
      method: 'POST',
      body,
      signal,
    },
  )

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'No se pudo analizar la muestra'))
  }

  return (await response.json()) as BackendSampleAnalysis
}

export async function listInferenceResults(
  signal?: AbortSignal,
): Promise<BackendInferenceResultDetail[]> {
  return requestJson<BackendInferenceResultDetail[]>(
    BACKEND_ENDPOINTS.inferenceResults,
    { signal },
  )
}

export async function estimateFinancialImpact(
  payload: {
    grain: string
    tons: number
    defectPercentage: number
    venue: string
  },
  signal?: AbortSignal,
): Promise<BackendFinancialImpact> {
  return requestJson<BackendFinancialImpact>(BACKEND_ENDPOINTS.financialImpact, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
}
