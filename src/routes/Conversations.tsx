import { ChartCard } from '@/components/charts/ChartCard'
import { Bars, ShareBar, TrendLine } from '@/components/charts/Charts'
import { personColor } from '@/components/ui/Avatar'
import { RevealCard, SectionHeading } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Controls'
import { StatCard } from '@/components/ui/Metric'
import { NotEnoughData } from '@/components/ui/States'
import { WEEKDAY_LABELS } from '@/lib/analytics/time'
import { dateShort, dateTime, duration, hourLabel, num, pct, plural, shortName } from '@/lib/format'
import { useAnalytics, useStore } from '@/lib/store'

/**
 * PRODUCT.md §9, §10, §21 — where conversations begin, how quickly you reply,
 * and the timeline that falls out of both.
 */
export function Conversations() {
  const a = useAnalytics()
  const { name } = useStore()
  const raw = a.meta.participants
  const displayAll = raw.map(name)
  const display = (author: string) => shortName(name(author), displayAll)

  // Recharts resolves dataKey through a path lookup, so a participant name with
  // a dot in it would break as a key. Index the series instead.
  const seriesKeys = raw.map((author, i) => ({
    key: `p${i}`,
    author,
    label: display(author),
    color: personColor(author, raw).hex,
  }))

  const gap = duration(a.config.conversationGapMs)

  return (
    <div className="space-y-12">
      <SectionHeading
        eyebrow="Conversations"
        title="Where it starts, and how fast it moves"
        blurb={`A conversation ends when nobody speaks for ${gap}. Everything on this page is built on that one rule.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Conversations"
          value={num(a.conversations.total)}
          story={`Separated by gaps of ${gap} or more.`}
        />
        <StatCard
          label="Messages in one"
          value={a.conversations.averageMessages.toFixed(0)}
          story="On average, start to finish."
          accent="honey"
        />
        <StatCard
          label="Typical length"
          value={duration(a.conversations.averageDurationMs)}
          story="From the first message to the last."
          accent="sage"
        />
        <StatCard
          label="The longest one"
          value={duration(a.conversations.longestByDuration?.durationMs ?? null)}
          story={
            a.conversations.longestByDuration
              ? `${dateShort(a.conversations.longestByDuration.startAt)} — ${plural(a.conversations.longestByDuration.messages, 'message')}.`
              : 'Not enough back-and-forth yet.'
          }
          accent="dusk"
        />
      </div>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Who says hello first"
          title="Conversation initiation"
          blurb="The opening message of each conversation, counted per person. Someone has to go first; it doesn't mean more than that."
        />

        {a.conversations.total >= 5 ? (
          <>
            <ChartCard
              title="The split"
              question="Who opens the conversation more often?"
              description={a.conversations.initiation.shares
                .map((s) => `${display(s.key)}: ${pct(s.share)}`)
                .join('. ')}
            >
              <ShareBar
                segments={a.conversations.initiation.shares.map((s) => ({
                  label: display(s.key),
                  value: s.count,
                  color: personColor(s.key, raw).hex,
                }))}
              />

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                {a.conversations.initiation.shares.map((s) => (
                  <div key={s.key} className="rounded-xl bg-surface-sunk/60 p-4">
                    <dt className="text-sm font-medium text-ink">{display(s.key)}</dt>
                    <dd className="mt-1 font-display tnum text-2xl text-ink">{pct(s.share)}</dd>
                    <dd className="text-xs text-ink-faint">
                      {plural(s.count, 'conversation')} opened
                    </dd>
                  </div>
                ))}
              </dl>
            </ChartCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Openings by weekday"
                question="Does one of you own a particular day?"
                description={seriesKeys
                  .map(
                    (s) =>
                      `${s.label}: ${(a.conversations.initiation.byWeekday[s.author] ?? [])
                        .map((v, i) => `${WEEKDAY_LABELS[i]} ${num(v)}`)
                        .join(', ')}`,
                  )
                  .join('. ')}
              >
                <Bars
                  data={WEEKDAY_LABELS.map((label, i) => {
                    const row: Record<string, unknown> = { day: label }
                    for (const s of seriesKeys) {
                      row[s.key] = a.conversations.initiation.byWeekday[s.author]?.[i] ?? 0
                    }
                    return row
                  })}
                  xKey="day"
                  series={seriesKeys.map((s) => ({ key: s.key, label: s.label, color: s.color }))}
                  stacked
                  height={240}
                  valueFormatter={(v, n) => `${n}: ${num(v)} openings`}
                />
              </ChartCard>

              <ChartCard
                title="Openings by hour"
                question="What time of day does someone break the silence?"
                description={seriesKeys
                  .map(
                    (s) =>
                      `${s.label} opens most around ${hourLabel(
                        peakIndex(a.conversations.initiation.byHour[s.author] ?? []),
                      )}`,
                  )
                  .join('. ')}
              >
                <Bars
                  data={Array.from({ length: 24 }, (_, hour) => {
                    const row: Record<string, unknown> = { hour: String(hour) }
                    for (const s of seriesKeys) {
                      row[s.key] = a.conversations.initiation.byHour[s.author]?.[hour] ?? 0
                    }
                    return row
                  })}
                  xKey="hour"
                  series={seriesKeys.map((s) => ({ key: s.key, label: s.label, color: s.color }))}
                  stacked
                  height={240}
                  valueFormatter={(v, n) => `${n}: ${num(v)} openings`}
                />
              </ChartCard>
            </div>

            {a.conversations.initiation.trend.length >= 3 ? (
              <ChartCard
                title="Has that changed?"
                question="Each person's share of openings, month by month."
                description={a.conversations.initiation.trend
                  .map(
                    (t) =>
                      `${t.label}: ${seriesKeys
                        .map((s) => `${s.label} ${pct(t.perPerson[s.author] ?? 0)}`)
                        .join(', ')}`,
                  )
                  .join('. ')}
                footnote="Shares, not counts — a quiet month with two conversations can swing wildly."
              >
                <TrendLine
                  data={a.conversations.initiation.trend.map((t) => {
                    const row: Record<string, unknown> = { label: t.label }
                    for (const s of seriesKeys) {
                      row[s.key] = Math.round((t.perPerson[s.author] ?? 0) * 100)
                    }
                    return row
                  })}
                  xKey="label"
                  series={seriesKeys.map((s) => ({ key: s.key, label: s.label, color: s.color }))}
                  height={260}
                  yTickFormatter={(v) => `${v}%`}
                  valueFormatter={(v, n) => `${n}: ${v}% of openings`}
                />
              </ChartCard>
            ) : null}

            {a.conversations.initiation.commonOpeners.length ? (
              <ChartCard
                title="How you begin"
                question="The phrases that start a conversation."
                description={a.conversations.initiation.commonOpeners
                  .map((o) => `${o.key}: ${num(o.count)}`)
                  .join('. ')}
              >
                <ul className="flex flex-wrap gap-2">
                  {a.conversations.initiation.commonOpeners.slice(0, 12).map((o) => (
                    <li
                      key={o.key}
                      className="rounded-pill bg-surface-sunk px-3 py-1.5 text-sm text-ink-muted"
                    >
                      {o.key} <span className="tnum text-xs text-ink-faint">{num(o.count)}</span>
                    </li>
                  ))}
                </ul>
              </ChartCard>
            ) : null}
          </>
        ) : (
          <NotEnoughData
            what="conversation initiation"
            need="We need at least five separate conversations."
          />
        )}
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Response time"
          title="How long a reply takes"
          blurb="Measured as the gap before someone else answers. Phones die, people work, and time zones exist — this is a measure of availability, not of interest."
        />

        {a.responseTimes.overall.samples >= 10 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Half of replies within"
                value={duration(a.responseTimes.overall.medianMs)}
                story={`The median across ${num(a.responseTimes.overall.samples)} replies.`}
              />
              <StatCard
                label="Nine in ten within"
                value={duration(a.responseTimes.overall.p90Ms)}
                story="The slow tail, without the outliers."
                accent="honey"
              />
              <StatCard
                label="Fastest"
                value={duration(a.responseTimes.overall.fastestMs)}
                story="Someone was clearly holding their phone."
                accent="sage"
              />
              <StatCard
                label="Slowest counted"
                value={duration(a.responseTimes.overall.slowestMs)}
                story={`Gaps over ${duration(a.config.responseCapMs)} are treated as a new conversation, not a slow reply.`}
                accent="dusk"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="The distribution"
                question="Are replies usually instant, or usually a while?"
                description={a.responseTimes.overall.distribution
                  .map((b) => `${b.label}: ${num(b.count)}`)
                  .join('. ')}
              >
                <Bars
                  data={a.responseTimes.overall.distribution.map((b) => ({
                    bucket: b.label,
                    replies: b.count,
                  }))}
                  xKey="bucket"
                  series={[{ key: 'replies', label: 'Replies' }]}
                  height={240}
                  valueFormatter={(v) => `${num(v)} replies`}
                />
              </ChartCard>

              <ChartCard
                title="By hour of the day"
                question="When is a reply quickest?"
                description={a.responseTimes.overall.byHour
                  .map((v, i) => `${hourLabel(i)}: ${duration(v)}`)
                  .join('. ')}
                footnote="Median per hour. Hours with no replies are left out of the line."
              >
                <TrendLine
                  data={a.responseTimes.overall.byHour.map((v, i) => ({
                    hour: hourLabel(i),
                    minutes: v === null ? null : Math.round(v / 60_000),
                  }))}
                  xKey="hour"
                  series={[{ key: 'minutes', label: 'Median reply' }]}
                  height={240}
                  yTickFormatter={(v) => `${v}m`}
                  valueFormatter={(v) => `${num(v)} minutes`}
                />
              </ChartCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="By day of the week"
                question="Does the weekend slow things down?"
                description={a.responseTimes.overall.byWeekday
                  .map((v, i) => `${WEEKDAY_LABELS[i]}: ${duration(v)}`)
                  .join('. ')}
              >
                <Bars
                  data={a.responseTimes.overall.byWeekday.map((v, i) => ({
                    day: WEEKDAY_LABELS[i],
                    minutes: v === null ? 0 : Math.round(v / 60_000),
                  }))}
                  xKey="day"
                  series={[{ key: 'minutes', label: 'Median reply' }]}
                  height={240}
                  valueFormatter={(v) => `${num(v)} minutes`}
                />
              </ChartCard>

              <RevealCard>
                <h3 className="font-display text-display-sm text-ink">Person by person</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted text-pretty">
                  Medians rather than averages, so one forgotten notification doesn't decide the
                  number.
                </p>

                <div className="scroll-x mt-5">
                  <table className="w-full min-w-[420px] border-collapse text-left">
                    <caption className="sr-only">Response time per participant</caption>
                    <thead>
                      <tr className="border-b border-surface-line">
                        <th
                          scope="col"
                          className="py-2 pr-4 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint"
                        >
                          Person
                        </th>
                        <th
                          scope="col"
                          className="py-2 pr-4 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint"
                        >
                          Median
                        </th>
                        <th
                          scope="col"
                          className="py-2 pr-4 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint"
                        >
                          Nine in ten
                        </th>
                        <th
                          scope="col"
                          className="py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint"
                        >
                          Replies
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.people.map((p) => (
                        <tr key={p.author} className="border-b border-surface-line last:border-0">
                          <th
                            scope="row"
                            className="py-3 pr-4 text-sm font-medium text-ink"
                          >
                            {display(p.author)}
                          </th>
                          <td className="tnum py-3 pr-4 text-sm text-ink">
                            {duration(p.responseTime?.medianMs ?? null)}
                          </td>
                          <td className="tnum py-3 pr-4 text-sm text-ink-muted">
                            {duration(p.responseTime?.p90Ms ?? null)}
                          </td>
                          <td className="tnum py-3 text-sm text-ink-muted">
                            {num(p.responseTime?.samples ?? 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </RevealCard>
            </div>

            {a.responseTimes.trend.filter((t) => t.medianMs !== null).length >= 3 ? (
              <ChartCard
                title="Response time over time"
                question="Has replying got slower or faster?"
                description={a.responseTimes.trend
                  .map((t) => `${t.label}: ${duration(t.medianMs)}`)
                  .join('. ')}
                footnote="A rising line means longer gaps. It says nothing about how anyone feels."
              >
                <TrendLine
                  data={a.responseTimes.trend.map((t) => ({
                    label: t.label,
                    minutes: t.medianMs === null ? null : Math.round(t.medianMs / 60_000),
                  }))}
                  xKey="label"
                  series={[{ key: 'minutes', label: 'Median reply' }]}
                  height={260}
                  yTickFormatter={(v) => `${v}m`}
                  valueFormatter={(v) => `${num(v)} minutes`}
                />
              </ChartCard>
            ) : null}
          </>
        ) : (
          <NotEnoughData
            what="response times"
            need="We need at least ten replies between two people."
          />
        )}
      </section>

      <section>
        <SectionHeading
          eyebrow="The long ones"
          title="Conversations that went somewhere"
          blurb="Ranked by how long they ran, uninterrupted."
        />

        {a.conversations.list.length ? (
          <RevealCard className="p-0">
            <ol className="divide-y divide-surface-line">
              {[...a.conversations.list]
                .sort((x, y) => y.durationMs - x.durationMs)
                .slice(0, 6)
                .map((c) => (
                  <li key={c.index} className="px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="font-display tnum text-xl text-ink">
                        {duration(c.durationMs)}
                      </span>
                      <span className="tnum text-sm text-ink-muted">
                        {plural(c.messages, 'message')}
                      </span>
                      <span className="ml-auto text-sm text-ink-faint">{dateTime(c.startAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-muted">
                      Started by <span className="font-medium text-ink">{display(c.starter)}</span>,
                      last word from <span className="font-medium text-ink">{display(c.ender)}</span>
                      {c.opener ? ` · opened with “${c.opener}”` : ''}
                    </p>
                  </li>
                ))}
            </ol>
          </RevealCard>
        ) : (
          <NotEnoughData what="a conversation ranking" />
        )}
      </section>

      <section>
        <SectionHeading
          eyebrow="The last word"
          title="Who tends to close it out"
          blurb="The final message before each gap. Often it just means someone fell asleep."
        />

        {Object.keys(a.conversations.endings).length ? (
          <ChartCard
            title="Endings"
            question="Who sends the final message?"
            description={Object.entries(a.conversations.endings)
              .map(([author, n]) => `${display(author)}: ${num(n)}`)
              .join('. ')}
          >
            <ShareBar
              segments={Object.entries(a.conversations.endings)
                .sort((x, y) => y[1] - x[1])
                .map(([author, n]) => ({
                  label: display(author),
                  value: n,
                  color: personColor(author, raw).hex,
                }))}
            />
          </ChartCard>
        ) : (
          <NotEnoughData what="conversation endings" />
        )}
      </section>

      <Timeline />
    </div>
  )
}

/** PRODUCT.md §21 — the chronological view of what changed. */
function Timeline() {
  const a = useAnalytics()
  if (!a.timeline.length) return null

  return (
    <section>
      <SectionHeading
        eyebrow="Timeline"
        title="The conversation, in order"
        blurb="Each point is a measured event, not an interpretation of one."
      />

      <ol className="relative space-y-4 border-l border-surface-line pl-6">
        {a.timeline.map((m, i) => (
          <li key={m.id} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[1.9rem] top-2 h-3 w-3 rounded-pill border-2 border-cream bg-clay-400"
            />
            <RevealCard delay={i * 0.03}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay-600">
                  {dateShort(m.at)}
                </p>
                <Badge tone="neutral" className="ml-auto">
                  {m.source}
                </Badge>
              </div>
              <h3 className="mt-2 font-display text-xl text-ink text-balance">{m.title}</h3>
              {m.stat ? (
                <p className="mt-1 font-display tnum text-2xl text-clay-600">{m.stat}</p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-ink-muted text-pretty">
                {m.detail}
              </p>
            </RevealCard>
          </li>
        ))}
      </ol>
    </section>
  )
}

function peakIndex(values: number[]): number | null {
  if (!values.length) return null
  let best = 0
  for (let i = 1; i < values.length; i++) if (values[i] > values[best]) best = i
  return values[best] > 0 ? best : null
}
