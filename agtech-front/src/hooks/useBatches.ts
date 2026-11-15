import { useCallback, useEffect, useState } from 'react'
import { API_RUNTIME } from '../api/analysisApi'
import { ensureBatch as ensureBatchRequest, listBatches } from '../api/backendApi'
import type { BatchSummary } from '../types/analysis'

/**
 * Loads the batches persisted by the Spring backend and provisions one on
 * demand. In demo mode no request is made.
 */
export function useBatches() {
  const enabled = !API_RUNTIME.mock
  const [batches, setBatches] = useState<BatchSummary[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setError(null)
    try {
      setBatches(await listBatches())
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron cargar los lotes del backend.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void load()
  }, [load])

  const ensureBatch = useCallback(
    async (variety: string): Promise<BatchSummary> => {
      const batch = await ensureBatchRequest(variety)
      setBatches((current) =>
        current.some((item) => item.id === batch.id) ? current : [...current, batch],
      )
      return batch
    },
    [],
  )

  return {
    batches,
    isLoading,
    error,
    refetch: load,
    ensureBatch,
  }
}
