import { useCallback, useEffect, useRef, useState } from 'react'
import {
  analyzeSample,
  saveAnalysisResult as saveAnalysisToBackend,
  validateImage,
} from '../api/analysisApi'
import { useMarketData } from './useMarketData'
import { saveAnalysisResult as persistAnalysisResult } from '../lib/storage'
import type {
  AnalysisResult,
  AnalysisStatus,
  AnalysisUiState,
  GrainType,
} from '../types/analysis'

const initialState: AnalysisUiState = {
  status: 'idle',
  stage: 'Listo para analizar',
  progress: 0,
  result: null,
  error: null,
  previewUrl: null,
  isSaving: false,
  saved: false,
  saveError: null,
}

function stageForProgress(progress: number): { status: AnalysisStatus; stage: string } {
  if (progress < 16) return { status: 'validating', stage: 'Validando imagen' }
  if (progress < 38) return { status: 'processing', stage: 'Segmentando granos' }
  if (progress < 62) return { status: 'processing', stage: 'Detectando defectos' }
  if (progress < 82) return { status: 'processing', stage: 'Calculando rendimiento' }
  return { status: 'matching', stage: 'Comparando con pizarras' }
}

export function useAnalysis() {
  const { data: market } = useMarketData()
  const [state, setState] = useState<AnalysisUiState>(initialState)
  const previewRef = useRef<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  const revokePreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    revokePreview()
    if (mountedRef.current) setState(initialState)
  }, [revokePreview])

  const analyze = useCallback(
    async (file: File, grain: GrainType, variety?: string) => {
      const validationError = validateImage(file)
      if (validationError) {
        setState({ ...initialState, status: 'error', error: validationError })
        return null
      }

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      revokePreview()

      const previewUrl = URL.createObjectURL(file)
      previewRef.current = previewUrl

      setState({
        ...initialState,
        status: 'validating',
        stage: 'Validando imagen',
        progress: 5,
        previewUrl,
      })

      const timer = window.setInterval(() => {
        if (!mountedRef.current) return
        setState((previous) => {
          if (previous.status === 'completed' || previous.status === 'error') {
            return previous
          }
          const progress = Math.min(previous.progress + 1.5 + Math.random() * 2.8, 92)
          const nextStage = stageForProgress(progress)
          return {
            ...previous,
            progress,
            status: nextStage.status,
            stage: nextStage.stage,
          }
        })
      }, 170)

      try {
        const result = await analyzeSample(
          { file, grain, variety },
          controller.signal,
          market?.quotes ?? [],
        )
        window.clearInterval(timer)

        if (!mountedRef.current || controller.signal.aborted) return null

        persistAnalysisResult(result)
        setState({
          status: 'completed',
          stage: 'Análisis completado',
          progress: 100,
          result,
          error: null,
          previewUrl,
          isSaving: false,
          saved: false,
          saveError: null,
        })
        return result
      } catch (error) {
        window.clearInterval(timer)
        if (!mountedRef.current || controller.signal.aborted) return null

        const message =
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado durante el análisis.'
        setState((previous) => ({
          ...previous,
          status: 'error',
          stage: 'No se pudo completar',
          error: message,
        }))
        return null
      }
    },
    [market, revokePreview],
  )

  const save = useCallback(async () => {
    if (!state.result || state.isSaving || state.saved) return

    setState((previous) => ({ ...previous, isSaving: true, saveError: null }))
    try {
      await saveAnalysisToBackend(state.result)
      if (mountedRef.current) {
        setState((previous) => ({
          ...previous,
          isSaving: false,
          saved: true,
          saveError: null,
        }))
      }
    } catch (error) {
      if (mountedRef.current) {
        setState((previous) => ({
          ...previous,
          isSaving: false,
          saveError:
            error instanceof Error
              ? error.message
              : 'No se pudo guardar el análisis en Spring Boot.',
        }))
      }
    }
  }, [state.result, state.isSaving, state.saved])

  const isBusy =
    state.status === 'validating' ||
    state.status === 'processing' ||
    state.status === 'matching'

  return {
    ...state,
    isBusy,
    analyze,
    save,
    reset,
  }
}

export function toAnalysisSummary(result: AnalysisResult) {
  return {
    id: result.id,
    grain: result.grainName,
    grade: result.grade,
    exportPercentage: result.exportPercentage,
    estimatedUsd: result.valuation.estimatedUsd,
  }
}
