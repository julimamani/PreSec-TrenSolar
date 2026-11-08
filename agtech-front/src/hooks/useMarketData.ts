import { useCallback, useEffect, useState } from 'react'
import { fetchMarketSnapshot } from '../api/marketApi'
import type { MarketSnapshot } from '../types/market'

export function useMarketData() {
  const [data, setData] = useState<MarketSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (showSkeleton = false) => {
    if (showSkeleton) setIsLoading(true)
    setError(null)
    try {
      const snapshot = await fetchMarketSnapshot()
      setData(snapshot)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron cargar los datos de mercado.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return {
    data,
    isLoading,
    error,
    refetch: () => load(true),
  }
}
