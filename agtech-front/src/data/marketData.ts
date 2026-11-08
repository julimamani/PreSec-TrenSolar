import type { AnalysisHistoryItem, GrainType } from '../types/analysis'
import type {
  GrainId,
  GrainMeta,
  MarketSnapshot,
  MarketVenue,
  MarketVenueId,
  PricePoint,
  QualityAxis,
  Quote,
  RegionBasis,
  VolumePoint,
} from '../types/market'

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
  sorgo: {
    id: 'sorgo',
    name: 'Sorgo',
    short: 'SOR',
    color: '#c4a7f7',
    softColor: 'rgba(196, 167, 247, 0.14)',
  },
  cebada: {
    id: 'cebada',
    name: 'Cebada',
    short: 'CEB',
    color: '#8fb8ff',
    softColor: 'rgba(143, 184, 255, 0.14)',
  },
}

export const ANALYSIS_GRAINS: GrainType[] = ['soja', 'maiz', 'trigo', 'poroto']

export const MARKET_VENUES: Record<MarketVenueId, MarketVenue> = {
  rosario: { id: 'rosario', name: 'Bolsa de Rosario', code: 'BCR', country: 'Argentina' },
  'buenos-aires': {
    id: 'buenos-aires',
    name: 'Bolsa de Buenos Aires',
    code: 'BCBA',
    country: 'Argentina',
  },
  cbot: { id: 'cbot', name: 'Chicago Board of Trade', code: 'CBOT', country: 'EE. UU.' },
}

const BASE_PRICES: Record<GrainId, number> = {
  soja: 318.5,
  maiz: 202.4,
  trigo: 228.9,
  poroto: 408.2,
  sorgo: 186,
  cebada: 197.5,
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

function getWeekdaySessions(count: number): Date[] {
  const dates: Date[] = []
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)

  while (dates.length < count) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) {
      dates.unshift(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() - 1)
  }

  return dates
}

const SESSIONS = getWeekdaySessions(90)

function buildPriceSeries(): PricePoint[] {
  const series: PricePoint[] = SESSIONS.map((date) => ({
    date: date.toISOString().slice(0, 10),
    label: date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).replace('.', ''),
    soja: 0,
    maiz: 0,
    trigo: 0,
    poroto: 0,
    sorgo: 0,
    cebada: 0,
  }))

  const grainIds: GrainId[] = ['soja', 'maiz', 'trigo', 'poroto', 'sorgo', 'cebada']

  grainIds.forEach((grain, grainIndex) => {
    const random = mulberry32(9281 + grainIndex * 137)
    const base = BASE_PRICES[grain]
    const values: number[] = []
    let value = base * 0.89

    for (let index = 0; index < SESSIONS.length; index += 1) {
      const trend = (base * 0.11) / SESSIONS.length
      const volatility = base * (0.006 + random() * 0.012)
      const wave = Math.sin(index / 8 + grainIndex) * base * 0.004
      value = Math.max(base * 0.76, value + trend + (random() - 0.5) * volatility + wave)
      values.push(value)
    }

    const correction = base / values[values.length - 1]
    values.forEach((raw, index) => {
      series[index][grain] = round(raw * correction, 1)
    })
  })

  return series
}

const PRICE_SERIES = buildPriceSeries()

function buildVolumeSeries(): VolumePoint[] {
  const random = mulberry32(7319)
  const sessions = SESSIONS.slice(-9)

  return sessions.map((date) => {
    const label = date
      .toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit' })
      .replace('.', '')
      .replace(/^\w/, (letter) => letter.toUpperCase())

    return {
      label,
      soja: Math.round(18_000 + random() * 29_000),
      maiz: Math.round(12_000 + random() * 24_000),
      trigo: Math.round(5_000 + random() * 17_000),
      poroto: Math.round(2_500 + random() * 10_000),
    }
  })
}

const now = new Date()
const updatedAt = new Date(now.getTime() - 4 * 60 * 1000).toISOString()

const quotes: Quote[] = [
  {
    id: 'soja-rosario',
    grain: 'soja',
    venue: 'rosario',
    priceUsd: 318.5,
    changePct: 1.82,
    volumeTons: 128_400,
    basisUsd: 7.4,
    updatedAt,
  },
  {
    id: 'maiz-rosario',
    grain: 'maiz',
    venue: 'rosario',
    priceUsd: 202.4,
    changePct: 0.64,
    volumeTons: 96_500,
    basisUsd: 3.1,
    updatedAt,
  },
  {
    id: 'trigo-ba',
    grain: 'trigo',
    venue: 'buenos-aires',
    priceUsd: 228.9,
    changePct: -0.41,
    volumeTons: 54_200,
    basisUsd: -2.6,
    updatedAt,
  },
  {
    id: 'poroto-rosario',
    grain: 'poroto',
    venue: 'rosario',
    priceUsd: 408.2,
    changePct: 2.13,
    volumeTons: 31_900,
    basisUsd: 11.2,
    updatedAt,
  },
  {
    id: 'sorgo-rosario',
    grain: 'sorgo',
    venue: 'rosario',
    priceUsd: 186,
    changePct: 0.35,
    volumeTons: 12_400,
    basisUsd: -4.8,
    updatedAt,
  },
  {
    id: 'cebada-ba',
    grain: 'cebada',
    venue: 'buenos-aires',
    priceUsd: 197.5,
    changePct: -0.82,
    volumeTons: 8_900,
    basisUsd: -1.9,
    updatedAt,
  },
  {
    id: 'soja-cbot',
    grain: 'soja',
    venue: 'cbot',
    priceUsd: 329.1,
    changePct: 1.25,
    volumeTons: 364_000,
    basisUsd: 0,
    updatedAt,
  },
  {
    id: 'maiz-cbot',
    grain: 'maiz',
    venue: 'cbot',
    priceUsd: 214.8,
    changePct: 0.48,
    volumeTons: 291_000,
    basisUsd: 0,
    updatedAt,
  },
  {
    id: 'trigo-cbot',
    grain: 'trigo',
    venue: 'cbot',
    priceUsd: 241.3,
    changePct: -0.65,
    volumeTons: 178_000,
    basisUsd: 0,
    updatedAt,
  },
]

const qualityProfile: QualityAxis[] = [
  { axis: 'Exportable', sample: 88.6, benchmark: 90 },
  { axis: 'Proteína', sample: 82.4, benchmark: 85 },
  { axis: 'Aceite', sample: 79.1, benchmark: 80 },
  { axis: 'Peso hect.', sample: 91.2, benchmark: 88 },
  { axis: 'Humedad ópt.', sample: 86.4, benchmark: 88 },
  { axis: 'Limpieza', sample: 94.1, benchmark: 92 },
]

const qualityVsMarket = [
  { grain: 'Soja', pizarra: 318.5, calidad: 334.2, premium: 15.7 },
  { grain: 'Maíz', pizarra: 202.4, calidad: 208.6, premium: 6.2 },
  { grain: 'Trigo', pizarra: 228.9, calidad: 231.4, premium: 2.5 },
  { grain: 'Poroto', pizarra: 408.2, calidad: 431.8, premium: 23.6 },
]

const regions: RegionBasis[] = [
  { region: 'Rosario', basisUsd: 7.4, volumeTons: 128_400 },
  { region: 'Bahía Blanca', basisUsd: 4.8, volumeTons: 74_200 },
  { region: 'Córdoba', basisUsd: 2.1, volumeTons: 91_600 },
  { region: 'Quequén', basisUsd: -1.3, volumeTons: 43_800 },
  { region: 'Necochea', basisUsd: -2.1, volumeTons: 31_500 },
]

export const MARKET_SNAPSHOT: MarketSnapshot = {
  updatedAt,
  usdArs: 1_485.5,
  index: 1_284.62,
  indexChangePct: 0.92,
  volumeTons: 248_600,
  operations: 1_842,
  openInterestTons: 1_247_000,
  quotes,
  series: PRICE_SERIES,
  volumeSeries: buildVolumeSeries(),
  regions,
  qualityProfile,
  qualityVsMarket,
}

export function getQuote(grain: GrainId, venue: MarketVenueId = 'rosario'): Quote | undefined {
  return quotes.find((quote) => quote.grain === grain && quote.venue === venue)
}

export function getGrainName(grain: GrainId): string {
  return GRAINS[grain].name
}

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
      estimatedUsd: 334.2,
      pizarraUsd: 318.5,
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
      estimatedUsd: 208.6,
      pizarraUsd: 202.4,
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
      estimatedUsd: 431.8,
      pizarraUsd: 408.2,
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
      estimatedUsd: 231.4,
      pizarraUsd: 228.9,
      defectCount: 5,
    },
  ]
}
