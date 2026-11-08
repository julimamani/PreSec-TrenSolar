import { MARKET_SNAPSHOT } from '../data/marketData'
import type { MarketSnapshot } from '../types/market'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  await sleep(420)
  return MARKET_SNAPSHOT
}
