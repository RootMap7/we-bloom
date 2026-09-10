import { useMemo, useState } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Controls'
import { personColor } from '@/components/ui/Avatar'
import { dateTime, num, pct, shortName } from '@/lib/format'
import { snippetsForWord } from '@/lib/messages'
import { useAnalytics, useStore } from '@/lib/store'

/**
 * A tag cloud rather than a packed one: it reflows at any width, never
 * overflows horizontally (PRODUCT.md §32), and every word stays a real button
 * a keyboard can reach. Size and weight carry frequency; colour is decorative.
 */
export function WordCloud({ limit = 44 }: { limit?: number }) {
  const a = useAnalytics()
  const { messages, name } = useStore()
  const [selected, setSelected] = useState<string | null>(null)

  const raw = a.meta.participants
  const displayAll = raw.map(name)
  const display = (author: string) => shortName(name(author), displayAll)

  const words = useMemo(() => {
    const source = a.words.topMeaningful.slice(0, limit)
    if (!source.length) return []
    const counts = source.map((w) => w.count)
    const max = Math.max(...counts)
    const min = Math.min(...counts)
    const range = max - min || 1

    return source.map((w) => ({
      ...w,
      // Square root keeps one runaway word from dwarfing everything else.
      scale: Math.sqrt((w.count - min) / range),
    }))
  }, [a.words.topMeaningful, limit])

  const entry = selected ? a.words.index[selected] : undefined
  const snippets = useMemo(
    () => (selected && messages.length ? snippetsForWord(messages, selected) : []),
    [selected, messages],
  )

  if (!words.length) {
    return (
      <p className="text-base leading-relaxed text-ink-muted text-pretty">
        There isn't enough text in this export to build a word cloud from.
      </p>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2 rounded-card border border-surface-line bg-surface px-5 py-8 shadow-soft sm:px-8 sm:py-10">
        {words.map((w, i) => {
          const size = 0.95 + w.scale * 2.1
          const tone =
            w.scale > 0.66
              ? 'text-clay-600'
              : w.scale > 0.33
                ? 'text-ink'
                : 'text-ink-muted'

          return (
            <button
              key={w.key}
              type="button"
              onClick={() => setSelected(w.key)}
              title={`${w.key} — used ${num(w.count)} times`}
              className={`rounded-lg px-1 font-display leading-none transition-colors duration-200 ease-bloom hover:text-clay-500 ${tone}`}
              style={{
                fontSize: `${size}rem`,
                fontWeight: w.scale > 0.5 ? 600 : 500,
                opacity: 0.55 + w.scale * 0.45,
                // A touch of variety so the block does not read as a list.
                transform: i % 7 === 3 ? 'rotate(-2deg)' : undefined,
              }}
            >
              {w.key}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-center text-sm text-ink-faint">
        Sized by how often each word appears. Pick any of them.
      </p>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `“${selected}”` : ''}
        size="lg"
      >
        {selected ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-surface-sunk/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  Times used
                </p>
                <p className="mt-1.5 font-display tnum text-2xl text-ink">
                  {entry ? num(entry.count) : '—'}
                </p>
                {entry ? (
                  <p className="mt-0.5 text-xs text-ink-faint">{pct(entry.share, 2)} of all words</p>
                ) : null}
              </div>
              <div className="rounded-xl bg-surface-sunk/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  Mostly
                </p>
                <p className="mt-1.5 font-display text-2xl text-ink">
                  {entry ? display(entry.topAuthor) : '—'}
                </p>
                {entry?.peakPeriod ? (
                  <p className="mt-0.5 text-xs text-ink-faint">Peaked in {entry.peakPeriod}</p>
                ) : null}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                Where it was said
              </h4>

              {messages.length ? (
                snippets.length ? (
                  <ul className="space-y-3">
                    {snippets.map((s, i) => (
                      <li
                        key={i}
                        className="rounded-xl bg-surface-sunk/60 p-4"
                        style={{ borderLeft: `3px solid ${personColor(s.author, raw).hex}` }}
                      >
                        <p className="text-sm leading-relaxed text-ink text-pretty">{s.text}</p>
                        <p className="mt-2 text-xs text-ink-faint">
                          {display(s.author)} · {dateTime(s.at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-muted">
                    The word is in the counts but no whole-word match turned up in the message
                    text — usually because it appears inside a longer word.
                  </p>
                )
              ) : (
                <div className="rounded-card border border-dashed border-surface-line bg-surface-sunk/50 p-5">
                  <p className="text-sm leading-relaxed text-ink-muted text-pretty">
                    This report was restored from storage, which holds the counts but not the
                    messages. Upload the export again to read the lines this word appears in.
                  </p>
                  <div className="mt-4">
                    <ButtonLink to="/upload" variant="secondary" size="sm">
                      Upload the export
                    </ButtonLink>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs leading-relaxed text-ink-faint text-pretty">
              <Badge tone="neutral">In memory only</Badge> Quotes are read from the copy of the
              conversation held in this tab. Nothing here is written to disk or sent anywhere.
            </p>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
