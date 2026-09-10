import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { RevealCard, SectionHeading } from '@/components/ui/Card'
import { Badge, ProgressRing, Tooltip } from '@/components/ui/Controls'
import { StatCard } from '@/components/ui/Metric'
import { EmptyState } from '@/components/ui/States'
import type { Insight } from '@/lib/analytics'
import { changePhrase } from '@/lib/format'
import { CATEGORY_COPY, CONFIDENCE_COPY } from '@/lib/insights'
import { fadeRise, stagger } from '@/lib/motion'
import { useAnalytics, useStore } from '@/lib/store'

const CATEGORY_ORDER: Insight['category'][] = [
  'communication-style',
  'conversation-rhythm',
  'shared-language',
  'changes-over-time',
  'interesting-patterns',
]

const CONFIDENCE_TONE: Record<Insight['confidence'], 'sage' | 'honey' | 'neutral'> = {
  observation: 'sage',
  pattern: 'honey',
  interpretation: 'neutral',
}

/** PRODUCT.md §22, §23, §26, §27 — insights and Relationship DNA. */
export function Insights() {
  const a = useAnalytics()
  const { insights } = useStore()

  return (
    <div className="space-y-12">
      <SectionHeading
        eyebrow="What we noticed"
        title="Patterns in the numbers"
        blurb="Everything here is computed from your export in this browser, and every card names the metric it came from. Nothing is inferred about anyone's feelings."
      />

      <Dna />

      {insights.length ? (
        <>
          <RevealCard className="bg-surface-sunk/50">
            <h3 className="font-display text-display-sm text-ink">How to read these</h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              {(Object.keys(CONFIDENCE_COPY) as Insight['confidence'][]).map((c) => (
                <div key={c}>
                  <dt className="mb-1.5">
                    <Badge tone={CONFIDENCE_TONE[c]}>{CONFIDENCE_COPY[c].label}</Badge>
                  </dt>
                  <dd className="text-sm leading-relaxed text-ink-muted text-pretty">
                    {CONFIDENCE_COPY[c].tooltip}
                  </dd>
                </div>
              ))}
            </dl>
          </RevealCard>

          {CATEGORY_ORDER.map((category) => {
            const items = insights.filter((i) => i.category === category)
            if (!items.length) return null

            return (
              <section key={category}>
                <SectionHeading
                  eyebrow={CATEGORY_COPY[category].label}
                  title={CATEGORY_COPY[category].blurb}
                />

                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={stagger(0.05)}
                  className="grid gap-4 lg:grid-cols-2"
                >
                  {items.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </motion.div>
              </section>
            )
          })}
        </>
      ) : (
        <EmptyState
          title="Once we have enough data, we'll start noticing things."
          body="This conversation is too short for any pattern to mean much. The charts still work — there just isn't enough here to draw a line through."
          icon="✧"
        />
      )}

      <section>
        <SectionHeading
          eyebrow="The comparison behind it"
          title="First half against second"
          blurb="Several insights above come from splitting the conversation down the middle by date. These are the raw movements."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Daily volume"
            value={changePhrase(a.trends.volumeChange)}
            story="Messages per day, later half against earlier."
          />
          <StatCard
            label="Message length"
            value={changePhrase(a.trends.messageLengthChange)}
            story="Average words per message."
            accent="honey"
          />
          <StatCard
            label="Reply time"
            value={changePhrase(a.trends.responseTimeChange)}
            story="Median response time. Up means slower."
            accent="sage"
          />
          <StatCard
            label="Who opens"
            value={
              Object.keys(a.trends.initiationChange).length
                ? `${Math.round(
                    Math.max(...Object.values(a.trends.initiationChange).map(Math.abs)) * 100,
                  )} pts`
                : '—'
            }
            story="Largest shift in anyone's share of conversation openings."
            accent="dusk"
          />
        </div>
      </section>
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const copy = CONFIDENCE_COPY[insight.confidence]

  return (
    <motion.article variants={fadeRise} className="card-base flex flex-col p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <Badge tone={CONFIDENCE_TONE[insight.confidence]}>{copy.label}</Badge>
        <Tooltip content={copy.tooltip} />
      </div>

      <h3 className="font-display text-display-sm text-ink text-balance">{insight.headline}</h3>
      <p className="mt-2 flex-1 text-base leading-relaxed text-ink-muted text-pretty">
        {insight.body}
      </p>

      <footer className="mt-4 border-t border-surface-line pt-3">
        <p className="text-xs leading-relaxed text-ink-faint text-pretty">
          <span className="font-semibold uppercase tracking-[0.1em]">From</span> {insight.basis}
        </p>
        {insight.evidence ? (
          <Link
            to={insight.evidence.to}
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-clay-600 underline-offset-4 hover:underline"
          >
            {insight.evidence.label}
            <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </footer>
    </motion.article>
  )
}

/** PRODUCT.md §26, §27 — playful, deterministic, and labelled as such. */
function Dna() {
  const a = useAnalytics()

  return (
    <section>
      <RevealCard className="overflow-hidden bg-clay-50">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay-600">
          Relationship DNA
        </p>
        <h2 className="mt-2 font-display text-display-lg text-ink text-balance">
          {a.dna.archetype}
        </h2>
        <p className="mt-3 max-w-[52ch] text-lg leading-relaxed text-ink-muted text-pretty">
          {a.dna.blurb}
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {a.dna.dimensions.map((d) => (
            <div key={d.key} className="flex items-start gap-4">
              <ProgressRing value={d.score / 100} size={72} stroke={7} label={d.label}>
                <span className="font-display tnum text-lg text-ink">{d.score}</span>
              </ProgressRing>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{d.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted text-pretty">{d.basis}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 border-t border-clay-100 pt-4 text-sm leading-relaxed text-ink-muted text-pretty">
          <span className="font-semibold text-ink">
            For fun and reflection — not a psychological assessment.
          </span>{' '}
          Each score is a fixed formula over the numbers on the other pages. Run the same export
          twice and you get the same result, which is exactly as much as it means.
        </p>
      </RevealCard>
    </section>
  )
}
