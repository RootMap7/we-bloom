import { ChartCard } from '@/components/charts/ChartCard'
import { Bars, ShareBar, Sparkline, TrendArea } from '@/components/charts/Charts'
import { personColor } from '@/components/ui/Avatar'
import { RevealCard, SectionHeading } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Controls'
import { StatCard } from '@/components/ui/Metric'
import { EmptyState, NotEnoughData } from '@/components/ui/States'
import { hourLabel, num, pct, shortName } from '@/lib/format'
import { useAnalytics, useStore } from '@/lib/store'

/** PRODUCT.md §16 — emoji, kept playful and lightweight. */
export function Emojis() {
  const a = useAnalytics()
  const { name } = useStore()
  const raw = a.meta.participants
  const displayAll = raw.map(name)
  const display = (author: string) => shortName(name(author), displayAll)

  if (!a.emojis.total) {
    return (
      <div className="space-y-8">
        <SectionHeading eyebrow="Emojis" title="Emoji" />
        <EmptyState
          title="We haven't counted the 😂 yet."
          body="There isn't a single emoji in this export. Some conversations are all words, and that's a finding of its own."
          icon="🙂"
        />
      </div>
    )
  }

  const sig = a.emojis.signature
  const peakHour = a.emojis.byHour.indexOf(Math.max(...a.emojis.byHour))

  return (
    <div className="space-y-12">
      <SectionHeading
        eyebrow="Emojis"
        title="The shorthand you've built"
        blurb="Counted from message text, duplicates included — three 😂 in one message count three times."
      />

      {sig ? (
        <RevealCard className="overflow-hidden bg-honey-50">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-6xl leading-none sm:text-7xl" aria-hidden="true">
              {sig.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay-600">
                Your signature emoji
              </p>
              <h2 className="mt-1 font-display text-display-md text-ink text-balance">
                {sig.emoji} is basically part of the vocabulary
              </h2>
              <p className="mt-2 max-w-[52ch] text-base leading-relaxed text-ink-muted text-pretty">
                Used {num(sig.count)} times — {pct(sig.share)} of every emoji in the chat.{' '}
                {display(sig.topAuthor)} reaches for it most.
              </p>
            </div>
          </div>
        </RevealCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Emoji sent" value={num(a.emojis.total)} story="Across the whole conversation." />
        <StatCard
          label="Different emoji"
          value={num(a.emojis.unique)}
          story="Distinct characters used at least once."
          accent="honey"
        />
        <StatCard
          label="Per message"
          value={a.emojis.perMessage.toFixed(2)}
          story="Averaged over every message, emoji or not."
          accent="sage"
        />
        <StatCard
          label="Emoji hour"
          value={hourLabel(peakHour)}
          story="When emoji land most often."
          accent="dusk"
        />
      </div>

      <section>
        <SectionHeading eyebrow="The top of the list" title="Your most-used emoji" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {a.emojis.top.slice(0, 9).map((e, i) => (
            <RevealCard key={e.emoji} delay={i * 0.03}>
              <div className="flex items-start gap-4">
                <span className="text-4xl leading-none" aria-hidden="true">
                  {e.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display tnum text-2xl text-ink">{num(e.count)}</p>
                  <p className="text-sm text-ink-muted">{pct(e.share)} of all emoji</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Mostly <span className="font-medium text-ink">{display(e.topAuthor)}</span>
                  </p>
                </div>
              </div>
              {e.overTime.length >= 2 ? (
                <div className="mt-3">
                  <Sparkline
                    values={e.overTime.map((p) => p.count)}
                    color={personColor(e.topAuthor, raw).hex}
                  />
                </div>
              ) : null}
            </RevealCard>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Who leans on emoji"
          question="Emoji per message, person by person."
          description={a.people
            .map((p) => `${display(p.author)}: ${p.emoji.perMessage.toFixed(2)} per message`)
            .join('. ')}
          footnote="Per message rather than in total, so whoever sends more messages doesn't automatically win."
        >
          <ShareBar
            segments={a.people.map((p) => ({
              label: display(p.author),
              value: p.emoji.total,
              color: personColor(p.author, raw).hex,
            }))}
          />
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {a.people.map((p) => (
              <div key={p.author} className="rounded-xl bg-surface-sunk/60 p-4">
                <dt className="text-sm font-medium text-ink">{display(p.author)}</dt>
                <dd className="mt-1 font-display tnum text-2xl text-ink">
                  {p.emoji.perMessage.toFixed(2)}
                </dd>
                <dd className="text-xs text-ink-faint">
                  per message · {num(p.emoji.total)} in total
                </dd>
                {p.emoji.top.length ? (
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    {p.emoji.top.slice(0, 6).map((e) => (
                      <span
                        key={e.key}
                        className="rounded-pill bg-surface px-2 py-1 text-base leading-none"
                        title={`${e.key} — ${num(e.count)}`}
                      >
                        <span aria-hidden="true">{e.key}</span>
                      </span>
                    ))}
                  </dd>
                ) : null}
              </div>
            ))}
          </dl>
        </ChartCard>

        <ChartCard
          title="Emoji by hour"
          question="Do emoji arrive at a different time from words?"
          description={a.emojis.byHour.map((v, i) => `${hourLabel(i)}: ${num(v)}`).join('. ')}
        >
          <Bars
            data={a.emojis.byHour.map((v, i) => ({ hour: String(i), emoji: v }))}
            xKey="hour"
            series={[{ key: 'emoji', label: 'Emoji' }]}
            highlightIndex={peakHour}
            height={240}
            valueFormatter={(v) => `${num(v)} emoji`}
          />
        </ChartCard>
      </div>

      {a.people.some((p) => p.emoji.distinctive.length) ? (
        <section>
          <SectionHeading
            eyebrow="Personal favourites"
            title="Emoji that belong to one of you"
            blurb="Used far more by one person than the others, relative to how much emoji each of you sends."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {a.people
              .filter((p) => p.emoji.distinctive.length)
              .map((p) => {
                const color = personColor(p.author, raw)
                return (
                  <RevealCard key={p.author}>
                    <h3 className="font-display text-display-sm text-ink">{display(p.author)}</h3>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {p.emoji.distinctive.slice(0, 8).map((e) => (
                        <li
                          key={e.key}
                          className={`flex items-center gap-2 rounded-pill px-3 py-1.5 ${color.soft}`}
                        >
                          <span className="text-xl leading-none" aria-hidden="true">
                            {e.key}
                          </span>
                          <span className={`tnum text-xs font-semibold ${color.ink}`}>
                            {num(e.count)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </RevealCard>
                )
              })}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Emoji that travel together"
          question="Which combinations do you send as a unit?"
          description={
            a.emojis.combos.length
              ? a.emojis.combos.map((c) => `${c.key}: ${num(c.count)}`).join('. ')
              : 'No repeated emoji combinations.'
          }
          footnote="A combination is two or more emoji sent side by side in the same message."
        >
          {a.emojis.combos.length ? (
            <ul className="space-y-2">
              {a.emojis.combos.slice(0, 8).map((c) => (
                <li
                  key={c.key}
                  className="flex items-center gap-3 rounded-xl bg-surface-sunk/60 px-4 py-3"
                >
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {c.key}
                  </span>
                  <span className="tnum ml-auto text-sm font-medium text-ink">
                    {num(c.count)}×
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <NotEnoughData what="emoji combinations" need="You send emoji one at a time." />
          )}
        </ChartCard>

        <ChartCard
          title="Emoji over time"
          question="Are you getting more or less expressive?"
          description={a.emojis.trend.map((t) => `${t.label}: ${num(t.count)}`).join('. ')}
        >
          {a.emojis.trend.length >= 2 ? (
            <TrendArea
              data={a.emojis.trend.map((t) => ({ label: t.label, emoji: t.count }))}
              xKey="label"
              series={[{ key: 'emoji', label: 'Emoji', color: '#DFA85B' }]}
              height={240}
              valueFormatter={(v) => `${num(v)} emoji`}
            />
          ) : (
            <NotEnoughData what="an emoji trend" need="This chat spans less than two months." />
          )}
        </ChartCard>
      </div>

      <p className="text-sm leading-relaxed text-ink-faint text-pretty">
        <Badge tone="neutral">Counts only</Badge> Emoji get read as characters, not as feelings. We
        can tell you 😂 appears a lot; we can't tell you what either of you meant by it.
      </p>
    </div>
  )
}
