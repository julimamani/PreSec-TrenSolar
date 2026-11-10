import { useCallback, useEffect, useState } from 'react'
import { API_RUNTIME, toHistoryItemFromInferenceResult } from '../api/analysisApi'
import { listInferenceResults } from '../api/backendApi'
import type { AnalysisHistoryItem } from '../types/analysis'

/**
 * Reads the analyses already persisted by Spring Boot through
 * GET /api/inference-results. In demo mode it stays empty.
 */
export function useInferenceResults() {
  const enabled = !API_RUNTIME.mock
  const [items, setItems] = useState<AnalysisHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)
    try {
      const results = await listInferenceResults()
      setItems(results.map(toHistoryItemFromInferenceResult))
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo leer el historial del backend.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void load()
  }, [load])

  return { items, isLoading, error, refetch: load }
}
