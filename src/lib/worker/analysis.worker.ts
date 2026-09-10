/// <reference lib="webworker" />
import { buildAnalytics, type AnalyticsConfig } from '../analytics'
import { parseWhatsAppExport, ParseError } from '../parser'

/**
 * Parsing and analysing a 100k-message export takes seconds. Doing it here
 * keeps the main thread free so the progress UI actually animates —
 * PRODUCT.md §38.
 */

export interface AnalyseRequest {
  type: 'analyse'
  text: string
  config?: Partial<AnalyticsConfig>
}

export type AnalyseResponse =
  | { type: 'progress'; fraction: number; label: string }
  | { type: 'done'; payload: unknown }
  | { type: 'error'; code: string; message: string; hint: string }

const ctx = self as unknown as DedicatedWorkerGlobalScope

ctx.addEventListener('message', (event: MessageEvent<AnalyseRequest>) => {
  const data = event.data
  if (!data || data.type !== 'analyse') return

  const post = (msg: AnalyseResponse) => ctx.postMessage(msg)

  try {
    post({ type: 'progress', fraction: 0.02, label: 'Opening the file…' })

    const parsed = parseWhatsAppExport(data.text, (f) => {
      post({
        type: 'progress',
        fraction: 0.02 + f * 0.35,
        label: 'Following the conversation…',
      })
    })

    const analytics = buildAnalytics(parsed, data.config, (f, label) => {
      post({ type: 'progress', fraction: 0.37 + f * 0.63, label })
    })

    post({
      type: 'done',
      payload: {
        analytics,
        // Messages travel back for the games, the word cloud and the
        // throwback section, which all need real sentences. They are held in
        // memory by the store and never persisted — see lib/storage.ts.
        messages: parsed.messages,
        warnings: parsed.warnings,
        dateOrder: parsed.dateOrder,
        dateOrderAmbiguous: parsed.dateOrderAmbiguous,
        stats: parsed.stats,
      },
    })
  } catch (err) {
    if (err instanceof ParseError) {
      post({ type: 'error', code: err.code, message: err.message, hint: err.hint })
      return
    }
    post({
      type: 'error',
      code: 'analysis-failed',
      message: "Something went wrong while reading that conversation.",
      hint:
        err instanceof Error && err.message
          ? `Details: ${err.message}`
          : 'Try uploading the export again.',
    })
  }
})
