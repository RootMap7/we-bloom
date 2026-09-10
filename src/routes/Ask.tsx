import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { RevealCard, SectionHeading } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Controls'
import { Button } from '@/components/ui/Button'
import { type Answer, SUGGESTED_QUESTIONS, askYourChat } from '@/lib/ask'
import { useAnalytics } from '@/lib/store'

interface Exchange {
  id: number
  question: string
  answer: Answer
}

/** PRODUCT.md §24, §25 — questions answered from the analytics, or not at all. */
export function Ask() {
  const a = useAnalytics()
  const [draft, setDraft] = useState('')
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const nextId = useRef(1)

  const ask = (question: string) => {
    const trimmed = question.trim()
    if (!trimmed) return
    const answer = askYourChat(trimmed, a)
    setExchanges((prev) => [{ id: nextId.current++, question: trimmed, answer }, ...prev])
    setDraft('')
  }

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Ask your chat"
        title="Ask a question, get the number behind it"
        blurb="Answers come from the same analytics as every chart on the other pages. Nothing here reads your messages, and nothing leaves this browser."
      />

      <RevealCard>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(draft)
          }}
        >
          <label htmlFor="ask-input" className="block text-sm font-medium text-ink">
            Your question
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="ask-input"
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Who usually starts conversations?"
              autoComplete="off"
              className="h-12 min-w-0 flex-1 rounded-pill border border-surface-line bg-surface px-4 text-base text-ink placeholder:text-ink-faint focus:border-clay-300"
            />
            <Button type="submit" disabled={!draft.trim()}>
              Ask
            </Button>
          </div>
        </form>

        <p className="mt-3 text-xs leading-relaxed text-ink-faint text-pretty">
          If a question can't be answered from the numbers, we say so rather than guess.
        </p>
      </RevealCard>

      <section aria-live="polite" aria-atomic="false">
        {exchanges.length ? (
          <ul className="space-y-4">
            {exchanges.map((x) => (
              <li key={x.id}>
                <RevealCard>
                  <p className="text-sm font-semibold text-ink-muted">{x.question}</p>
                  <p className="mt-2 text-lg leading-relaxed text-ink text-pretty">
                    {x.answer.text}
                  </p>

                  {x.answer.basis || x.answer.evidence ? (
                    <footer className="mt-4 border-t border-surface-line pt-3">
                      {x.answer.basis ? (
                        <p className="text-xs leading-relaxed text-ink-faint text-pretty">
                          <span className="font-semibold uppercase tracking-[0.1em]">From</span>{' '}
                          {x.answer.basis}
                        </p>
                      ) : null}
                      {x.answer.evidence ? (
                        <Link
                          to={x.answer.evidence.to}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-clay-600 underline-offset-4 hover:underline"
                        >
                          {x.answer.evidence.label}
                          <span aria-hidden="true">→</span>
                        </Link>
                      ) : null}
                    </footer>
                  ) : null}

                  {x.answer.unresolved ? (
                    <p className="mt-3">
                      <Badge tone="neutral">No answer</Badge>
                    </p>
                  ) : null}
                </RevealCard>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section>
        <SectionHeading
          eyebrow="Suggestions"
          title="Things worth asking"
          blurb="Pick one to see the answer, or use them as a shape for your own."
        />

        <div className="grid gap-6 sm:grid-cols-2">
          {SUGGESTED_QUESTIONS.map((group) => (
            <RevealCard key={group.group}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-clay-600">
                {group.group}
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.questions.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => {
                        ask(q)
                        inputRef.current?.focus()
                      }}
                      className="rounded-pill bg-surface-sunk px-3.5 py-2 text-left text-sm text-ink-muted transition-colors duration-200 ease-bloom hover:bg-clay-50 hover:text-clay-700"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </RevealCard>
          ))}
        </div>
      </section>

      <p className="text-sm leading-relaxed text-ink-faint text-pretty">
        This answers from counts, medians and shares — the same figures shown on the other pages. It
        has no opinion about your relationship, and it will not invent one.
      </p>
    </div>
  )
}
