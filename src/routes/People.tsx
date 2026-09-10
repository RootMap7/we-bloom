import { ChartCard } from '@/components/charts/ChartCard'
import { Bars, ShareBar } from '@/components/charts/Charts'
import { SecretTap } from '@/components/easter/SecretTap'
import { Avatar, personColor } from '@/components/ui/Avatar'
import { RevealCard, SectionHeading } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Controls'
import { StatCard } from '@/components/ui/Metric'
import { NotEnoughData } from '@/components/ui/States'
import { WEEKDAY_LABELS } from '@/lib/analytics/time'
import {
  dateShort,
  duration,
  hourLabel,
  hourRange,
  num,
  pct,
  shortName,
  weekdayLabel,
} from '@/lib/format'
import { useAnalytics, useStore } from '@/lib/store'

export function People() {
  const a = useAnalytics()
  const { name } = useStore()
  const raw = a.meta.participants
  const displayAll = raw.map(name)
  const display = (author: string) => shortName(name(author), displayAll)

  return (
    <div className="space-y-12">
      <SectionHeading
        eyebrow="People"
        title="How each of you shows up"
        blurb="Side by side, not scored. Two people can write completely differently and both be doing it right."
      />

      <ChartCard
        title="The split"
        question="Who sends more of the messages?"
        description={a.people.map((p) => `${display(p.author)}: ${pct(p.messageShare)}`).join('. ')}
      >
        <ShareBar
          segments={a.people.map((p) => ({
            label: display(p.author),
            value: p.messages,
            color: personColor(p.author, raw).hex,
          }))}
        />
      </ChartCard>

      <section className="space-y-6">
        {a.people.map((person, i) => (
          <PersonPanel key={person.author} person={person} index={i} display={display} raw={raw} />
        ))}
      </section>

      <Comparison display={display} />
    </div>
  )
}

function PersonPanel({
  person,
  index,
  display,
  raw,
}: {
  person: ReturnType<typeof useAnalytics>['people'][number]
  index: number
  display: (author: string) => string
  raw: string[]
}) {
  const color = personColor(person.author, raw)

  return (
    <RevealCard delay={index * 0.05} className="overflow-hidden">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* Five rapid taps on the avatar reveal the hidden message. */}
        <SecretTap>
          <Avatar name={display(person.author)} participants={raw.map(display)} size="lg" />
        </SecretTap>
        <div className="min-w-0">
          <h3 className="font-display text-display-sm text-ink">{display(person.author)}</h3>
          <p className="mt-0.5 text-sm text-ink-muted">
            {num(person.messages)} messages · {pct(person.messageShare)} of the conversation
          </p>
        </div>
        {person.peakHour !== null ? (
          <Badge tone="clay" className="ml-auto">
            Most active {hourRange(person.peakHour)}
          </Badge>
        ) : null}
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Words per message" value={person.wordsPerMessage.toFixed(1)} />
        <Fact label="Total words" value={num(person.words)} />
        <Fact
          label="Starts conversations"
          value={pct(person.initiationShare)}
          hint={`${num(person.conversationsStarted)} of them`}
        />
        <Fact
          label="Median reply"
          value={duration(person.responseTime?.medianMs ?? null)}
          hint={
            person.responseTime?.samples
              ? `${num(person.responseTime.samples)} replies`
              : 'too few replies'
          }
        />
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Words they reach for
          </h4>
          {person.words_.top.length ? (
            <ul className="flex flex-wrap gap-2">
              {person.words_.top.slice(0, 8).map((w) => (
                <li
                  key={w.key}
                  className="rounded-pill bg-surface-sunk px-3 py-1.5 text-sm text-ink-muted"
                >
                  {w.key}{' '}
                  <span className="tnum text-xs text-ink-faint">{num(w.count)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-faint">Not enough text to rank yet.</p>
          )}

          {person.words_.distinctive.length ? (
            <>
              <h4 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                More theirs than anyone else's
              </h4>
              <ul className="flex flex-wrap gap-2">
                {person.words_.distinctive.slice(0, 6).map((w) => (
                  <li
                    key={w.key}
                    className={`rounded-pill px-3 py-1.5 text-sm font-medium ${color.soft} ${color.ink}`}
                  >
                    {w.key}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                Words they use far more often than the others, adjusted for how much each person
                writes.
              </p>
            </>
          ) : null}
        </div>

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Their emoji
          </h4>
          {person.emoji.top.length ? (
            <>
              <ul className="flex flex-wrap gap-2">
                {person.emoji.top.slice(0, 8).map((e) => (
                  <li
                    key={e.key}
                    className="flex items-center gap-2 rounded-pill bg-surface-sunk px-3 py-1.5"
                  >
                    <span className="text-lg leading-none" aria-hidden="true">
                      {e.key}
                    </span>
                    <span className="tnum text-xs text-ink-faint">{num(e.count)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-ink-muted">
                {person.emoji.perMessage.toFixed(2)} emoji per message.
              </p>
            </>
          ) : (
            <p className="text-sm text-ink-faint">They don't use emoji.</p>
          )}

          {person.longestMessage ? (
            <>
              <h4 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                Their longest message
              </h4>
              <blockquote className="rounded-xl bg-surface-sunk/70 p-4 text-sm leading-relaxed text-ink-muted">
                <p className="text-pretty">{person.longestMessage.preview}</p>
                <footer className="mt-2 text-xs text-ink-faint">
                  {num(person.longestMessage.words)} words · {dateShort(person.longestMessage.at)}
                </footer>
              </blockquote>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
          Their week
        </h4>
        <Bars
          data={person.byWeekday.map((v, i) => ({ day: WEEKDAY_LABELS[i], messages: v }))}
          xKey="day"
          series={[{ key: 'messages', label: display(person.author), color: color.hex }]}
          height={180}
          valueFormatter={(v) => `${num(v)} messages`}
        />
        <p className="mt-2 text-sm text-ink-muted">
          Busiest on {weekdayLabel(person.peakWeekday)}, around {hourLabel(person.peakHour)}.
        </p>
      </div>
    </RevealCard>
  )
}

function Fact({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-surface-sunk/60 p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">{label}</dt>
      <dd className="mt-1.5 font-display tnum text-2xl text-ink">{value}</dd>
      {hint ? <dd className="mt-0.5 text-xs text-ink-faint">{hint}</dd> : null}
    </div>
  )
}

function Comparison({ display }: { display: (author: string) => string }) {
  const a = useAnalytics()
  const eligible = a.people.filter((p) => p.messages >= 20)

  if (eligible.length < 2) {
    return (
      <section>
        <SectionHeading eyebrow="Side by side" title="Comparison" />
        <NotEnoughData
          what="a comparison"
          need="We need at least two people with twenty messages each."
        />
      </section>
    )
  }

  const rows = [
    {
      label: 'Messages sent',
      values: eligible.map((p) => num(p.messages)),
    },
    {
      label: 'Share of the conversation',
      values: eligible.map((p) => pct(p.messageShare)),
    },
    {
      label: 'Words per message',
      values: eligible.map((p) => p.wordsPerMessage.toFixed(1)),
    },
    {
      label: 'Conversations started',
      values: eligible.map((p) => `${num(p.conversationsStarted)} (${pct(p.initiationShare)})`),
    },
    {
      label: 'Median reply time',
      values: eligible.map((p) => duration(p.responseTime?.medianMs ?? null)),
    },
    {
      label: 'Emoji per message',
      values: eligible.map((p) => p.emoji.perMessage.toFixed(2)),
    },
    {
      label: 'Attachments sent',
      values: eligible.map((p) => num(p.media.total)),
    },
    {
      label: 'Links shared',
      values: eligible.map((p) => num(p.links)),
    },
  ]

  return (
    <section>
      <SectionHeading
        eyebrow="Side by side"
        title="The same numbers, next to each other"
        blurb="No winner here — these are habits, not scores."
      />

      <RevealCard className="p-0">
        <div className="scroll-x">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <caption className="sr-only">Participant comparison across key metrics</caption>
            <thead>
              <tr className="border-b border-surface-line">
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  Metric
                </th>
                {eligible.map((p) => (
                  <th
                    key={p.author}
                    scope="col"
                    className="px-5 py-3 text-sm font-semibold text-ink"
                  >
                    {display(p.author)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-surface-line last:border-0">
                  <th
                    scope="row"
                    className="px-5 py-3 text-sm font-normal text-ink-muted"
                  >
                    {row.label}
                  </th>
                  {row.values.map((v, i) => (
                    <td key={i} className="tnum px-5 py-3 text-sm font-medium text-ink">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RevealCard>
    </section>
  )
}

export { StatCard }
