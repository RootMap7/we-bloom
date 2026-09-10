import { useMemo, useState } from 'react'
import { personColor } from '@/components/ui/Avatar'
import { Button, ButtonLink } from '@/components/ui/Button'
import { RevealCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Controls'
import { EmptyState } from '@/components/ui/States'
import { dateLong, dateTime, shortName } from '@/lib/format'
import { nearestMemoryDay, pickSome, rng } from '@/lib/messages'
import { useAnalytics, useStore } from '@/lib/store'

const SHOW = 4

/**
 * "On this day" — messages from the same calendar date in an earlier year.
 *
 * When today has nothing, it falls back to the nearest date that does and says
 * so, rather than quietly presenting a different day as today's memory.
 */
export function OnThisDay() {
  const a = useAnalytics()
  const { messages, name } = useStore()
  const [nonce, setNonce] = useState(0)

  const raw = a.meta.participants
  const displayAll = raw.map(name)
  const display = (author: string) => shortName(name(author), displayAll)

  const { items, exact } = useMemo(
    () =>
      messages.length
        ? nearestMemoryDay(messages)
        : { items: [], exact: true, daysOff: 0 },
    [messages],
  )

  const shown = useMemo(
    () => pickSome(items, SHOW, rng(nonce + 1)),
    [items, nonce],
  )

  if (!messages.length) {
    return (
      <EmptyState
        title="Throwbacks need the conversation itself."
        body="A saved report keeps the numbers but not the messages. Upload the export again to read what you said on this day."
        icon="◷"
        action={
          <ButtonLink to="/upload" variant="secondary" size="sm">
            Upload the export
          </ButtonLink>
        }
      />
    )
  }

  if (!items.length) {
    return (
      <EmptyState
        title="Nothing from this date yet."
        body="This conversation doesn't reach back to today's date in an earlier year. Come back when it does — or when the chat is a year older."
        icon="◷"
      />
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge tone={exact ? 'clay' : 'neutral'}>
          {dateLong(shown[0]?.message.at ?? Date.now()).replace(/ \d{4}$/, '')}
        </Badge>
        {items.length > SHOW ? (
          <Button
            variant="quiet"
            size="sm"
            onClick={() => setNonce((n) => n + 1)}
            className="ml-auto"
          >
            Show me others
          </Button>
        ) : null}
      </div>

      {!exact ? (
        <p className="mb-4 text-sm leading-relaxed text-ink-muted text-pretty">
          Nothing was said on today's date, so these come from the closest date in the calendar
          that has messages — {dateLong(shown[0]?.message.at ?? Date.now())}.
        </p>
      ) : null}

      <ul className="space-y-4">
        {shown.map(({ message, yearsAgo }) => (
          <li key={message.i}>
            <RevealCard
              className="overflow-hidden"
              // A left rule in the sender's colour, matching the rest of the app.
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-pill"
                  aria-hidden="true"
                  style={{ background: personColor(message.author, raw).hex }}
                />
                <span className="text-sm font-semibold text-ink">
                  {display(message.author)}
                </span>
                <span className="text-sm text-ink-faint">{dateTime(message.at)}</span>
                {yearsAgo > 0 ? (
                  <span className="ml-auto">
                    <Badge tone="honey">
                      {yearsAgo === 1 ? 'a year ago' : `${yearsAgo} years ago`}
                    </Badge>
                  </span>
                ) : null}
              </div>

              <blockquote className="mt-3 font-display text-xl leading-snug text-ink text-pretty">
                {message.text.trim()}
              </blockquote>
            </RevealCard>
          </li>
        ))}
      </ul>
    </div>
  )
}
