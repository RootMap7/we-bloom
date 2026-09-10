import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ActivityHeatmap } from '@/components/charts/ActivityHeatmap'
import { ChartCard } from '@/components/charts/ChartCard'
import { ShareBar, TrendArea } from '@/components/charts/Charts'
import { PersonChip, personColor } from '@/components/ui/Avatar'
import { ButtonLink } from '@/components/ui/Button'
import { RevealCard, SectionHeading } from '@/components/ui/Card'
import { CountUp, StatCard } from '@/components/ui/Metric'
import { NotEnoughData } from '@/components/ui/States'
import { rhythmPhrase } from '@/lib/analytics'
import {
  dateShort,
  duration,
  hourRange,
  num,
  pct,
  plural,
  shortName,
  weekdayLabel,
} from '@/lib/format'
import { fadeRise, stagger } from '@/lib/motion'
import { useAnalytics, useStore } from '@/lib/store'

export function Overview() {
  const a = useAnalytics()
  const { name } = useStore()
  const names = a.meta.participants
  const display = (author: string) => shortName(name(author), names.map(name))

  return (
    <div className="space-y-12 sm:space-y-16">
      <Hero />

      <section>
        <SectionHeading
          eyebrow="The shape of it"
          title="The numbers, with a little context"
          blurb="Every figure here is counted straight from your export. Tap through to any section for the chart behind it."
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger(0.05)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <StatCard
            label="Messages"
            value={<CountUp value={a.meta.totalMessages} />}
            story={`${num(a.meta.totalWords)} words, give or take.`}
          />
          <StatCard
            label="Days you spoke"
            value={<CountUp value={a.meta.activeDays} />}
            story={`Out of ${num(a.meta.spanDays)} days between the first message and the last.`}
            accent="honey"
          />
          <StatCard
            label="On a day you talk"
            value={<CountUp value={a.meta.messagesPerActiveDay} format={(n) => n.toFixed(0)} />}
            story="messages, on average."
            accent="sage"
          />
          <StatCard
            label="You usually reply in"
            value={duration(a.responseTimes.overall.medianMs)}
            story={
              a.responseTimes.overall.samples
                ? `Half the time it's faster than that. Measured across ${num(a.responseTimes.overall.samples)} replies.`
                : 'Not enough back-and-forth to measure yet.'
            }
            accent="dusk"
          />
          <StatCard
            label="Longest streak"
            value={a.streaks.longest ? `${a.streaks.longest.days} days` : '—'}
            story={
              a.streaks.longest
                ? `${dateShort(a.streaks.longest.startAt)} — ${dateShort(a.streaks.longest.endAt)}, without missing one.`
                : 'No multi-day run yet.'
            }
          />
          <StatCard
            label="Longest quiet spell"
            value={duration(a.silences.longest?.durationMs ?? null)}
            story={
              a.silences.longest
                ? `Broken by ${display(a.silences.longest.brokenBy)}.`
                : 'You have never gone a full day without talking.'
            }
            accent="plain"
          />
        </motion.div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Who says more"
          question="The message split, and how even it actually is."
          description={a.people
            .map((p) => `${display(p.author)}: ${pct(p.messageShare)} of messages`)
            .join('. ')}
          footnote="Counted per message, not per word — a long message and a 'k' count the same here."
        >
          <ShareBar
            segments={a.people.map((p) => ({
              label: display(p.author),
              value: p.messages,
              color: personColor(p.author, names).hex,
            }))}
          />

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {a.people.slice(0, 4).map((p) => (
              <div key={p.author} className="rounded-xl bg-surface-sunk/60 p-4">
                <dt className="mb-2">
                  <PersonChip name={display(p.author)} participants={names.map(display)} />
                </dt>
                <dd className="space-y-1 text-sm text-ink-muted">
                  <p>
                    <span className="tnum font-medium text-ink">{num(p.messages)}</span> messages
                  </p>
                  <p>
                    <span className="tnum font-medium text-ink">
                      {p.wordsPerMessage.toFixed(1)}
                    </span>{' '}
                    words each, on average
                  </p>
                  <p>
                    Starts{' '}
                    <span className="tnum font-medium text-ink">{pct(p.initiationShare)}</span> of
                    conversations
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </ChartCard>

        <ChartCard
          title="When it happens"
          question="Your busiest hours, and the days they land on."
          description={`Peak activity is ${hourRange(a.activity.peakHour)} on ${weekdayLabel(a.activity.peakWeekday)}.`}
          footnote="Times are read from the export in your device's local timezone — WhatsApp exports don't record one."
        >
          <ActivityHeatmap
            grid={a.activity.heatmap}
            max={a.activity.heatmapMax}
            total={a.meta.totalMessages}
            byHour={a.activity.byHour}
          />
        </ChartCard>
      </section>

      <section>
        <ChartCard
          title="The whole conversation, month by month"
          question="Where it picked up, and where it went quiet."
          description={`Monthly message volume from ${dateShort(a.meta.firstAt)} to ${dateShort(a.meta.lastAt)}.`}
          action={
            <ButtonLink to="/report/activity" variant="secondary" size="sm">
              All the timeframes
            </ButtonLink>
          }
        >
          {a.activity.byMonth.length >= 2 ? (
            <TrendArea
              data={a.activity.byMonth.map((m) => ({ label: m.label, messages: m.messages }))}
              xKey="label"
              series={[{ key: 'messages', label: 'Messages' }]}
              height={280}
              valueFormatter={(v) => `${num(v)} messages`}
            />
          ) : (
            <NotEnoughData what="a month-by-month view" need="This chat spans less than two months." />
          )}
        </ChartCard>
      </section>

      <Moments />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NextCard
          to="/report/wrapped"
          eyebrow="The story version"
          title="Chat Wrapped"
          body="Twelve slides, one idea each. The same numbers, told properly."
        />
        <NextCard
          to="/report/insights"
          eyebrow="What we noticed"
          title="Insights"
          body="Patterns across the whole conversation, each one traceable to a chart."
        />
        <NextCard
          to="/report/ask"
          eyebrow="Your questions"
          title="Ask your chat"
          body="Who talks more? When are we most active? Ask, and get the number behind it."
        />
      </section>
    </div>
  )
}

function Hero() {
  const a = useAnalytics()
  const { name } = useStore()
  const names = a.meta.participants.map(name)

  return (
    <motion.section initial="hidden" animate="visible" variants={stagger(0.07)}>
      <motion.p
        variants={fadeRise}
        className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-clay-600"
      >
        {names.length === 2 ? names.join(' and ') : `${names.length} people`}
      </motion.p>

      <motion.h1
        variants={fadeRise}
        className="max-w-[16ch] font-display text-display-lg text-ink text-balance"
      >
        {headline(a.meta.totalMessages)}
      </motion.h1>

      <motion.p
        variants={fadeRise}
        className="mt-4 max-w-[52ch] text-lg leading-relaxed text-ink-muted text-pretty sm:text-xl"
      >
        <span className="font-semibold text-ink">{num(a.meta.totalMessages)} messages</span> across{' '}
        {plural(a.meta.activeDays, 'day')} of talking, from {dateShort(a.meta.firstAt)} to{' '}
        {dateShort(a.meta.lastAt)}.
      </motion.p>

      <motion.p
        variants={fadeRise}
        className="mt-2 max-w-[52ch] text-lg leading-relaxed text-ink-muted text-pretty sm:text-xl"
      >
        {rhythmPhrase(a.activity.peakHour)}
      </motion.p>
    </motion.section>
  )
}

function headline(total: number): string {
  if (total > 20_000) return "You two have said an enormous amount."
  if (total > 5_000) return 'You two have said a lot.'
  if (total > 800) return "There's a real conversation in here."
  return "It's a short story, but it's a story."
}

function Moments() {
  const a = useAnalytics()
  const moments = a.milestones.slice(0, 6)

  return (
    <section>
      <SectionHeading
        eyebrow="The scrapbook"
        title="Moments worth keeping"
        blurb="Found by looking for the extremes — the longest, the busiest, the first of something that turned out to matter."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {moments.map((m, i) => (
          <RevealCard key={m.id} delay={i * 0.04} className="flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay-600">
              {dateShort(m.at)}
            </p>
            <h3 className="mt-2 font-display text-xl text-ink text-balance">{m.title}</h3>
            {m.stat ? (
              <p className="mt-2 font-display tnum text-2xl text-clay-600">{m.stat}</p>
            ) : null}
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted text-pretty">
              {m.detail}
            </p>
          </RevealCard>
        ))}
      </div>
    </section>
  )
}

function NextCard({
  to,
  eyebrow,
  title,
  body,
}: {
  to: string
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <Link
      to={to}
      className="group card-base flex flex-col p-5 transition-all duration-250 ease-bloom hover:-translate-y-0.5 hover:shadow-lift"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay-600">{eyebrow}</p>
      <h3 className="mt-2 font-display text-display-sm text-ink">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted text-pretty">{body}</p>
      <span className="mt-4 text-sm font-semibold text-clay-600">
        Open
        <span
          aria-hidden="true"
          className="ml-1 inline-block transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </span>
    </Link>
  )
}
