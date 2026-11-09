import axios from 'axios'
import type { MarketSnapshot } from '../types/market'

const MARKET_API_URL =
  import.meta.env.VITE_MARKET_API_URL ?? 'http://localhost:8081/api/market-snapshot'
const CLIENT_CACHE_TTL_MS = 30_000

let cachedSnapshot: { data: MarketSnapshot; fetchedAt: number } | null = null

export async function fetchMarketSnapshot(force = false): Promise<MarketSnapshot> {
  if (
    !force &&
    cachedSnapshot &&
    Date.now() - cachedSnapshot.fetchedAt < CLIENT_CACHE_TTL_MS
  ) {
    return cachedSnapshot.data
  }

  const { data } = await axios.get<MarketSnapshot>(MARKET_API_URL, {
    timeout: 20_000,
  })
  cachedSnapshot = { data, fetchedAt: Date.now() }
  return data
}

export function invalidateMarketSnapshot() {
  cachedSnapshot = null
}
