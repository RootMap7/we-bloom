import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type { Analytics, AnalyticsConfig, Insight, WrappedSlideData } from './analytics/types'
import type { ParseWarning } from './parser/types'
import { buildInsights } from './insights'
import { buildWrapped } from './wrapped'
import { generateMockExport } from './mock'
import { hasConsent, loadReport, saveReport, setConsent } from './storage'
import type { AnalyseResponse } from './worker/analysis.worker'

export type Phase =
  | 'empty'
  | 'reading'
  | 'parsing'
  | 'analyzing'
  | 'ready'
  | 'error'

export interface AppError {
  code: string
  message: string
  hint: string
}

interface State {
  phase: Phase
  progress: number
  progressLabel: string
  analytics: Analytics | null
  warnings: ParseWarning[]
  error: AppError | null
  /** Real name → display name. Defaults to identity. */
  aliases: Record<string, string>
  /** Share images use aliases by default — PRODUCT.md §30. */
  anonymiseShares: boolean
  saveLocally: boolean
  isDemo: boolean
  sourceLabel: string
}

type Action =
  | { type: 'reset' }
  | { type: 'start'; label: string; isDemo: boolean }
  | { type: 'progress'; fraction: number; label: string }
  | { type: 'phase'; phase: Phase }
  | { type: 'ready'; analytics: Analytics; warnings: ParseWarning[] }
  | { type: 'error'; error: AppError }
  | { type: 'alias'; from: string; to: string }
  | { type: 'restore'; analytics: Analytics; aliases: Record<string, string>; label: string }
  | { type: 'set-anonymise'; value: boolean }
  | { type: 'set-save'; value: boolean }

const initialState: State = {
  phase: 'empty',
  progress: 0,
  progressLabel: '',
  analytics: null,
  warnings: [],
  error: null,
  aliases: {},
  anonymiseShares: true,
  saveLocally: false,
  isDemo: false,
  sourceLabel: '',
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'reset':
      return { ...initialState, saveLocally: state.saveLocally }
    case 'start':
      return {
        ...state,
        phase: 'reading',
        progress: 0,
        progressLabel: 'Opening the file…',
        analytics: null,
        warnings: [],
        error: null,
        aliases: {},
        isDemo: action.isDemo,
        sourceLabel: action.label,
      }
    case 'progress': {
      // Progress only ever moves forward; a lower number from a late worker
      // message would read as the bar going backwards.
      const progress = Math.max(state.progress, action.fraction)
      const phase: Phase = progress < 0.37 ? 'parsing' : 'analyzing'
      return { ...state, progress, progressLabel: action.label, phase }
    }
    case 'phase':
      return { ...state, phase: action.phase }
    case 'ready':
      return {
        ...state,
        phase: 'ready',
        progress: 1,
        progressLabel: '',
        analytics: action.analytics,
        warnings: action.warnings,
        error: null,
        aliases: identityAliases(action.analytics.meta.participants),
      }
    case 'error':
      return { ...state, phase: 'error', error: action.error, progress: 0 }
    case 'alias':
      return { ...state, aliases: { ...state.aliases, [action.from]: action.to } }
    case 'restore':
      return {
        ...state,
        phase: 'ready',
        progress: 1,
        analytics: action.analytics,
        aliases: {
          ...identityAliases(action.analytics.meta.participants),
          ...action.aliases,
        },
        sourceLabel: action.label,
        isDemo: false,
      }
    case 'set-anonymise':
      return { ...state, anonymiseShares: action.value }
    case 'set-save':
      return { ...state, saveLocally: action.value }
    default:
      return state
  }
}

function identityAliases(participants: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const p of participants) out[p] = p
  return out
}

interface StoreValue extends State {
  insights: Insight[]
  wrapped: WrappedSlideData[]
  /** Display name for a participant, honouring aliases. */
  name: (author: string) => string
  analyseText: (text: string, label: string, opts?: { isDemo?: boolean }) => void
  analyseFile: (file: File) => Promise<void>
  loadDemo: () => void
  reanalyse: (config: Partial<AnalyticsConfig>) => void
  setAlias: (from: string, to: string) => void
  setAnonymiseShares: (value: boolean) => void
  setSaveLocally: (value: boolean) => void
  reset: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    saveLocally: hasConsent(),
  })

  const workerRef = useRef<Worker | null>(null)
  const lastTextRef = useRef<string | null>(null)

  const ensureWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current
    const worker = new Worker(new URL('./worker/analysis.worker.ts', import.meta.url), {
      type: 'module',
    })

    worker.onmessage = (event: MessageEvent<AnalyseResponse>) => {
      const msg = event.data
      if (msg.type === 'progress') {
        dispatch({ type: 'progress', fraction: msg.fraction, label: msg.label })
        return
      }
      if (msg.type === 'error') {
        dispatch({ type: 'error', error: { code: msg.code, message: msg.message, hint: msg.hint } })
        return
      }
      const payload = msg.payload as { analytics: Analytics; warnings: ParseWarning[] }
      dispatch({ type: 'ready', analytics: payload.analytics, warnings: payload.warnings })
    }

    worker.onerror = () => {
      dispatch({
        type: 'error',
        error: {
          code: 'worker-failed',
          message: "We couldn't finish reading that conversation.",
          hint: 'Refresh the page and try the upload again.',
        },
      })
    }

    workerRef.current = worker
    return worker
  }, [])

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  const analyseText = useCallback(
    (text: string, label: string, opts?: { isDemo?: boolean }) => {
      lastTextRef.current = text
      dispatch({ type: 'start', label, isDemo: Boolean(opts?.isDemo) })
      ensureWorker().postMessage({ type: 'analyse', text })
    },
    [ensureWorker],
  )

  const analyseFile = useCallback(
    async (file: File) => {
      dispatch({ type: 'start', label: file.name, isDemo: false })

      if (file.name.toLowerCase().endsWith('.zip')) {
        dispatch({
          type: 'error',
          error: {
            code: 'zip-not-supported',
            message: 'That looks like a zipped export.',
            hint: 'Unzip it first and upload the _chat.txt file inside — or export again choosing "Without media".',
          },
        })
        return
      }

      try {
        const text = await file.text()
        lastTextRef.current = text
        ensureWorker().postMessage({ type: 'analyse', text })
      } catch {
        dispatch({
          type: 'error',
          error: {
            code: 'unreadable-file',
            message: "We couldn't open that file.",
            hint: 'Make sure it is the .txt file WhatsApp produced, and that it finished downloading.',
          },
        })
      }
    },
    [ensureWorker],
  )

  const loadDemo = useCallback(() => {
    analyseText(generateMockExport(), 'Alex and Jamie (sample)', { isDemo: true })
  }, [analyseText])

  const reanalyse = useCallback(
    (config: Partial<AnalyticsConfig>) => {
      const text = lastTextRef.current
      if (!text) return
      dispatch({ type: 'start', label: state.sourceLabel, isDemo: state.isDemo })
      ensureWorker().postMessage({ type: 'analyse', text, config })
    },
    [ensureWorker, state.sourceLabel, state.isDemo],
  )

  // Restore a saved report on first load, but only if the user opted in.
  useEffect(() => {
    let cancelled = false
    if (!hasConsent()) return
    void loadReport().then((report) => {
      if (cancelled || !report) return
      dispatch({
        type: 'restore',
        analytics: report.analytics,
        aliases: report.aliases,
        label: report.label,
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Persist whenever a real (non-demo) report is ready and consent is on.
  useEffect(() => {
    if (!state.saveLocally || state.phase !== 'ready' || !state.analytics || state.isDemo) return
    void saveReport({
      label: state.sourceLabel,
      analytics: state.analytics,
      aliases: state.aliases,
    })
  }, [state.saveLocally, state.phase, state.analytics, state.aliases, state.sourceLabel, state.isDemo])

  const insights = useMemo(
    () => (state.analytics ? buildInsights(state.analytics) : []),
    [state.analytics],
  )

  const wrapped = useMemo(
    () => (state.analytics ? buildWrapped(state.analytics, insights) : []),
    [state.analytics, insights],
  )

  const name = useCallback(
    (author: string) => state.aliases[author] ?? author,
    [state.aliases],
  )

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      insights,
      wrapped,
      name,
      analyseText,
      analyseFile,
      loadDemo,
      reanalyse,
      setAlias: (from, to) => dispatch({ type: 'alias', from, to }),
      setAnonymiseShares: (v) => dispatch({ type: 'set-anonymise', value: v }),
      setSaveLocally: (v) => {
        setConsent(v)
        dispatch({ type: 'set-save', value: v })
      },
      reset: () => {
        lastTextRef.current = null
        dispatch({ type: 'reset' })
      },
    }),
    [state, insights, wrapped, name, analyseText, analyseFile, loadDemo, reanalyse],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

/**
 * For screens that only make sense with a report loaded. Routes guard on
 * `phase` before rendering these, so a throw here is a programming error.
 */
export function useAnalytics(): Analytics {
  const { analytics } = useStore()
  if (!analytics) throw new Error('useAnalytics called with no report loaded')
  return analytics
}
