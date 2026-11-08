export type GrainId = 'soja' | 'maiz' | 'trigo' | 'poroto' | 'sorgo' | 'cebada'

export type MarketVenueId = 'rosario' | 'buenos-aires' | 'cbot'

export type Currency = 'USD' | 'ARS'

export type PriceRange = '7D' | '30D' | '90D'

export interface GrainMeta {
  id: GrainId
  name: string
  short: string
  color: string
  softColor: string
}

export interface MarketVenue {
  id: MarketVenueId
  name: string
  code: string
  country: string
}

export type PricePoint = {
  date: string
  label: string
} & Record<GrainId, number>

export interface Quote {
  id: string
  grain: GrainId
  venue: MarketVenueId
  priceUsd: number
  changePct: number
  volumeTons: number
  basisUsd: number
  updatedAt: string
}

export interface QualityAxis {
  axis: string
  sample: number
  benchmark: number
}

export interface QualityVsMarketPoint {
  grain: string
  pizarra: number
  calidad: number
  premium: number
}

export interface VolumePoint {
  label: string
  soja: number
  maiz: number
  trigo: number
  poroto: number
}

export interface RegionBasis {
  region: string
  basisUsd: number
  volumeTons: number
}

export interface MarketSnapshot {
  updatedAt: string
  usdArs: number
  index: number
  indexChangePct: number
  volumeTons: number
  operations: number
  openInterestTons: number
  quotes: Quote[]
  series: PricePoint[]
  volumeSeries: VolumePoint[]
  regions: RegionBasis[]
  qualityProfile: QualityAxis[]
  qualityVsMarket: QualityVsMarketPoint[]
}
