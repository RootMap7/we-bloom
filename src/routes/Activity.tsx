import { useMemo, useState } from 'react'
import { ActivityHeatmap } from '@/components/charts/ActivityHeatmap'
import { ChartCard } from '@/components/charts/ChartCard'
import { Bars, TrendArea } from '@/components/charts/Charts'
import { RevealCard, SectionHeading } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/Controls'
import { StatCard } from '@/components/ui/Metric'
import { NotEnoughData } from '@/components/ui/States'
import { WEEKDAY_LABELS } from '@/lib/analytics/time'
import { dateShort, duration, hourLabel, hourRange, num, plural, shortName, weekdayLabel } from '@/lib/format'
import { useAnalytics, useStore } from '@/lib/store'

type Scale = 'day' | 'week' | 'month' | 'year'

export function Activity() {
  const a = useAnalytics()
  const { name } = useStore()
  const names = a.meta.participants
  const display = (author: string) => shortName(name(author), names.map(name))

  // Only offer a timeframe that has enough buckets to be a chart rather than
  // a single bar — PRODUCT.md §11's "where enough data exists".
  const available = useMemo(() => {
    const opts: { value: Scale; label: string }[] = []
    if (a.activity.byDay.length >= 2) opts.push({ value: 'day', label: 'Day' })
    if (a.activity.byWeek.length >= 3) opts.push({ value: 'week', label: 'Week' })
    if (a.activity.byMonth.length >= 3) opts.push({ value: 'month', label: 'Month' })
    if (a.activity.byYear.length >= 2) opts.push({ value: 'year', label: 'Year' })
    return opts
  }, [a.activity])

  const [scale, setScale] = useState<Scale>(
    available.find((o) => o.value === 'month')?.value ?? available[0]?.value ?? 'day',
  )

  const series = useMemo(() => {
    const source =
      scale === 'day'
        ? a.activity.byDay.map((d) => ({ label: dateShort(d.at), messages: d.messages }))
        : scale === 'week'
          ? a.activity.byWeek.map((d) => ({ label: d.label, messages: d.messages }))
          : scale === 'month'
            ? a.activity.byMonth.map((d) => ({ label: d.label, messages: d.messages }))
            : a.activity.byYear.map((d) => ({ label: d.label, messages: d.messages }))
    return source
  }, [scale, a.activity])

  return (
    <div className="space-y-12">
      <SectionHeading
        eyebrow="Activity"
        title="When this conversation happens"
        blurb="The same messages, at four different zoom levels. The shape usually says more than the total."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Busiest day"
          value={a.activity.busiestDay ? num(a.activity.busiestDay.messages) : '—'}
          story={a.activity.busiestDay ? dateShort(a.activity.busiestDay.at) : undefined}
        />
        <StatCard
          label="Busiest hour"
          value={hourLabel(a.activity.peakHour)}
          story={`${hourRange(a.activity.peakHour)} carries more than any other hour.`}
          accent="honey"
        />
        <StatCard
          label="Busiest weekday"
          value={weekdayLabel(a.activity.peakWeekday)}
          story="Across the whole conversation."
          accent="sage"
        />
        <StatCard
          label="Active days"
          value={num(a.meta.activeDays)}
          story={`Of ${num(a.meta.spanDays)} days in total.`}
          accent="dusk"
        />
      </div>

      <ChartCard
        title="Messages over time"
        question="Where the conversation picked up, and where it went quiet."
        description={`Message volume by ${scale}, from ${dateShort(a.meta.firstAt)} to ${dateShort(a.meta.lastAt)}.`}
        action={
          available.length > 1 ? (
            <SegmentedControl<Scale>
              label="Timeframe"
              value={scale}
              onChange={setScale}
              options={available}
            />
          ) : null
        }
        footnote={
          scale === 'day' && a.activity.byDay.length > 120
            ? 'At day level the line is dense by design — the peaks and the gaps are the point, not the individual days.'
            : undefined
        }
      >
        {series.length >= 2 ? (
          <TrendArea
            data={series}
            xKey="label"
            series={[{ key: 'messages', label: 'Messages' }]}
            height={300}
            valueFormatter={(v) => `${num(v)} messages`}
          />
        ) : (
          <NotEnoughData what="a trend over time" />
        )}
      </ChartCard>

      <ChartCard
        title="The week, hour by hour"
        question="Which hours of which days this conversation belongs to."
        description={`Peak activity is ${hourRange(a.activity.peakHour)} on ${weekdayLabel(a.activity.peakWeekday)}.`}
      >
        <ActivityHeatmap
          grid={a.activity.heatmap}
          max={a.activity.heatmapMax}
          total={a.meta.totalMessages}
          byHour={a.activity.byHour}
        />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="By day of the week"
          question="Is this a weekday conversation or a weekend one?"
          description={a.activity.byWeekday
            .map((v, i) => `${WEEKDAY_LABELS[i]}: ${num(v)}`)
            .join('. ')}
        >
          <Bars
            data={a.activity.byWeekday.map((v, i) => ({ day: WEEKDAY_LABELS[i], messages: v }))}
            xKey="day"
            series={[{ key: 'messages', label: 'Messages' }]}
            highlightIndex={a.activity.peakWeekday ?? undefined}
            height={240}
            valueFormatter={(v) => `${num(v)} messages`}
          />
        </ChartCard>

        <ChartCard
          title="By hour of the day"
          question="When does this conversation wake up?"
          description={a.activity.byHour
            .map((v, i) => `${hourLabel(i)}: ${num(v)}`)
            .join('. ')}
        >
          <Bars
            data={a.activity.byHour.map((v, i) => ({ hour: String(i), messages: v }))}
            xKey="hour"
            series={[{ key: 'messages', label: 'Messages' }]}
            highlightIndex={a.activity.peakHour ?? undefined}
            height={240}
            valueFormatter={(v) => `${num(v)} messages`}
          />
        </ChartCard>
      </div>

      <Streaks />
      <Silences display={display} />
      <Spikes />
    </div>
  )
}

function Streaks() {
  const a = useAnalytics()

  return (
    <section>
      <SectionHeading
        eyebrow="Streaks"
        title="The stretches you didn't miss a day"
        blurb="A streak is consecutive calendar days with at least one message in each."
      />

      {a.streaks.longest ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Longest streak"
            value={`${a.streaks.longest.days} days`}
            story={`${dateShort(a.streaks.longest.startAt)} — ${dateShort(a.streaks.longest.endAt)}`}
          />
          <StatCard
            label="Messages in it"
            value={num(a.streaks.longest.messages)}
            story="Across that run."
            accent="honey"
          />
          <StatCard
            label="Streaks in total"
            value={num(a.streaks.count)}
            story={`Averaging ${a.streaks.averageDays.toFixed(1)} days each.`}
            accent="sage"
          />
          <StatCard
            label="Running at the end"
            value={a.streaks.current ? `${a.streaks.current.days} days` : 'None'}
            story={
              a.streaks.current
                ? 'Still going when this export was taken.'
                : 'The export ends on a quiet day.'
            }
            accent="dusk"
          />
        </div>
      ) : (
        <NotEnoughData what="streaks" need="We need at least two consecutive days of messages." />
      )}
    </section>
  )
}

function Silences({ display }: { display: (author: string) => string }) {
  const a = useAnalytics()

  if (!a.silences.top.length) {
    return (
      <section>
        <SectionHeading eyebrow="Quiet periods" title="You have barely stopped" />
        <RevealCard>
          <p className="text-base leading-relaxed text-ink-muted text-pretty">
            There is no gap longer than a day anywhere in this conversation. That is unusual, and
            worth noticing on its own.
          </p>
        </RevealCard>
      </section>
    )
  }

  return (
    <section>
      <SectionHeading
        eyebrow="Quiet periods"
        title="The gaps between"
        blurb="Every conversation has them. These are the longest, with who spoke first afterwards."
      />

      <RevealCard className="p-0">
        <ul className="divide-y divide-surface-line">
          {a.silences.top.map((s, i) => (
            <li key={i} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-4 sm:px-6">
              <span className="font-display tnum text-xl text-ink">
                {duration(s.durationMs, { long: true })}
              </span>
              <span className="text-sm text-ink-muted">
                {dateShort(s.startAt)} — {dateShort(s.endAt)}
              </span>
              <span className="ml-auto text-sm text-ink-muted">
                Broken by <span className="font-medium text-ink">{display(s.brokenBy)}</span>
              </span>
            </li>
          ))}
        </ul>
      </RevealCard>

      <p className="mt-3 text-sm leading-relaxed text-ink-faint text-pretty">
        A gap is a gap. People are busy, phones die, and life happens off WhatsApp — none of which
        shows up in an export.
      </p>
    </section>
  )
}

function Spikes() {
  const a = useAnalytics()
  if (!a.activity.spikes.length) return null

  return (
    <section>
      <SectionHeading
        eyebrow="Spikes"
        title="Days that stood out"
        blurb="Days more than two standard deviations above the surrounding month. Something happened; the data can't say what."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {a.activity.spikes.slice(0, 4).map((s) => (
          <StatCard
            key={s.date}
            label={dateShort(s.at)}
            value={num(s.messages)}
            story={`About ${s.ratio.toFixed(1)}× a normal day — ${plural(s.messages, 'message')}.`}
            accent="honey"
          />
        ))}
      </div>
    </section>
  )
}
