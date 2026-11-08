import { useEffect, useState } from 'react'
import {
  ANALYSIS_UPDATED_EVENT,
  getAnalysisHistory,
  getLastAnalysis,
} from '../lib/storage'
import type { AnalysisHistoryItem, AnalysisResult } from '../types/analysis'

export function useStoredAnalysis() {
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(() =>
    getLastAnalysis(),
  )
  const [history, setHistory] = useState<AnalysisHistoryItem[]>(() =>
    getAnalysisHistory(),
  )

  useEffect(() => {
    const sync = () => {
      setLastAnalysis(getLastAnalysis())
      setHistory(getAnalysisHistory())
    }

    window.addEventListener(ANALYSIS_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(ANALYSIS_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return { lastAnalysis, history }
}
