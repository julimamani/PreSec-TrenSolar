import type { AnalysisHistoryItem, AnalysisResult } from '../types/analysis'

const LAST_ANALYSIS_KEY = 'purograno:last-analysis:v1'
const HISTORY_KEY = 'purograno:analysis-history:v1'
const LEGACY_LAST_ANALYSIS_KEY = 'trensolar:last-analysis:v1'
const LEGACY_HISTORY_KEY = 'trensolar:analysis-history:v1'
const MAX_HISTORY = 24

export const ANALYSIS_UPDATED_EVENT = 'purograno:analysis-updated'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function migrateLegacyKeys(): void {
  if (!isBrowser()) return

  try {
    if (!window.localStorage.getItem(LAST_ANALYSIS_KEY)) {
      const legacy = window.localStorage.getItem(LEGACY_LAST_ANALYSIS_KEY)
      if (legacy) window.localStorage.setItem(LAST_ANALYSIS_KEY, legacy)
    }

    if (!window.localStorage.getItem(HISTORY_KEY)) {
      const legacy = window.localStorage.getItem(LEGACY_HISTORY_KEY)
      if (legacy) window.localStorage.setItem(HISTORY_KEY, legacy)
    }
  } catch {
    // Storage can be unavailable in private mode.
  }
}

export function saveAnalysisResult(result: AnalysisResult): void {
  if (!isBrowser()) return
  migrateLegacyKeys()

  try {
    window.localStorage.setItem(LAST_ANALYSIS_KEY, JSON.stringify(result))

    const entry: AnalysisHistoryItem = {
      id: result.id,
      createdAt: result.createdAt,
      grain: result.grain,
      grainName: result.grainName,
      variety: result.variety,
      grade: result.grade,
      exportPercentage: result.exportPercentage,
      discardPercentage: result.discardPercentage,
      confidence: result.confidence,
      estimatedUsd: result.valuation.estimatedUsd,
      pizarraUsd: result.valuation.pizarraUsd,
      defectCount: result.defects.length,
    }

    const history = getAnalysisHistory()
    const next = [entry, ...history.filter((item) => item.id !== entry.id)].slice(0, MAX_HISTORY)
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(ANALYSIS_UPDATED_EVENT))
  } catch {
    // Storage can be unavailable in private mode. The demo still works in memory.
  }
}

export function getLastAnalysis(): AnalysisResult | null {
  if (!isBrowser()) return null
  migrateLegacyKeys()

  try {
    const raw = window.localStorage.getItem(LAST_ANALYSIS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AnalysisResult
  } catch {
    return null
  }
}

export function getAnalysisHistory(): AnalysisHistoryItem[] {
  if (!isBrowser()) return []
  migrateLegacyKeys()

  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AnalysisHistoryItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function clearAnalysisHistory(): void {
  if (!isBrowser()) return

  try {
    window.localStorage.removeItem(HISTORY_KEY)
    window.localStorage.removeItem(LAST_ANALYSIS_KEY)
    window.localStorage.removeItem(LEGACY_HISTORY_KEY)
    window.localStorage.removeItem(LEGACY_LAST_ANALYSIS_KEY)
    window.dispatchEvent(new CustomEvent(ANALYSIS_UPDATED_EVENT))
  } catch {
    // noop
  }
}
