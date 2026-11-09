import type { AnalysisHistoryItem } from '../types/analysis'
import type { GrainId, GrainMeta, MarketVenue, MarketVenueId } from '../types/market'

export const GRAINS: Record<GrainId, GrainMeta> = {
  soja: {
    id: 'soja',
    name: 'Soja',
    short: 'SOJ',
    color: '#9ff06a',
    softColor: 'rgba(159, 240, 106, 0.14)',
  },
  maiz: {
    id: 'maiz',
    name: 'Maíz',
    short: 'MAI',
    color: '#f4c95d',
    softColor: 'rgba(244, 201, 93, 0.14)',
  },
  trigo: {
    id: 'trigo',
    name: 'Trigo',
    short: 'TRI',
    color: '#5eead4',
    softColor: 'rgba(94, 234, 212, 0.14)',
  },
  poroto: {
    id: 'poroto',
    name: 'Poroto',
    short: 'POR',
    color: '#f59e8b',
    softColor: 'rgba(245, 158, 139, 0.14)',
  },
}

export const ANALYSIS_GRAINS: GrainId[] = ['soja', 'maiz', 'trigo', 'poroto']

export const MARKET_VENUES: Record<MarketVenueId, MarketVenue> = {
  rosario: {
    id: 'rosario',
    name: 'Spot regional',
    code: 'SPOT',
    country: 'Argentina',
  },
  global: {
    id: 'global',
    name: 'Matba Rofex',
    code: 'ROFX',
    country: 'Argentina',
  },
}

export function getGrainName(grain: GrainId): string {
  return GRAINS[grain].name
}

/**
 * Demo history for the reports page. Live market data always comes from
 * GET /api/market-snapshot; this list only fills the sample analysis table
 * when the browser has no saved analyses yet.
 */
export function getMockAnalysisHistory(): AnalysisHistoryItem[] {
  const base = Date.now()
  const daysAgo = (days: number) => new Date(base - days * 86_400_000).toISOString()

  return [
    {
      id: 'PG-2481',
      createdAt: daysAgo(0.2),
      grain: 'soja',
      grainName: 'Soja',
      variety: 'DM 46R18',
      grade: 'A',
      exportPercentage: 94.2,
      discardPercentage: 5.8,
      confidence: 96.8,
      estimatedUsd: 468,
      pizarraUsd: 450,
      defectCount: 4,
    },
    {
      id: 'PG-2479',
      createdAt: daysAgo(1.1),
      grain: 'maiz',
      grainName: 'Maíz',
      variety: 'DK 72-27',
      grade: 'B',
      exportPercentage: 89.6,
      discardPercentage: 10.4,
      confidence: 95.4,
      estimatedUsd: 208,
      pizarraUsd: 200,
      defectCount: 5,
    },
    {
      id: 'PG-2474',
      createdAt: daysAgo(2.4),
      grain: 'poroto',
      grainName: 'Poroto',
      variety: 'Paraíso 1600',
      grade: 'A',
      exportPercentage: 92.8,
      discardPercentage: 7.2,
      confidence: 97.2,
      estimatedUsd: 1300,
      pizarraUsd: 1250,
      defectCount: 4,
    },
    {
      id: 'PG-2468',
      createdAt: daysAgo(4.2),
      grain: 'trigo',
      grainName: 'Trigo',
      variety: 'Baguette 620',
      grade: 'B',
      exportPercentage: 87.1,
      discardPercentage: 12.9,
      confidence: 94.9,
      estimatedUsd: 228.8,
      pizarraUsd: 220,
      defectCount: 5,
    },
  ]
}
