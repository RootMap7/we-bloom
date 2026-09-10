import { useMemo, useState } from 'react'
import { ChartCard } from '@/components/charts/ChartCard'
import { Bars, Sparkline } from '@/components/charts/Charts'
import { personColor } from '@/components/ui/Avatar'
import { RevealCard, SectionHeading } from '@/components/ui/Card'
import { Badge, SegmentedControl } from '@/components/ui/Controls'
import { StatCard } from '@/components/ui/Metric'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, NotEnoughData } from '@/components/ui/States'
import type { WordUsage } from '@/lib/analytics'
import { dateShort, num, pct, shortName } from '@/lib/format'
import { useAnalytics, useStore } from '@/lib/store'

type Ranking = 'meaningful' | 'all'

/** PRODUCT.md §15 — language patterns, plus the word explorer. */
export function Words() {
  const a = useAnalytics()
  const { name } = useStore()
  const raw = a.meta.participants
  const displayAll = raw.map(name)
  const display = (author: string) => shortName(name(author), displayAll)

  const [ranking, setRanking] = useState<Ranking>('meaningful')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const ranked = ranking === 'meaningful' ? a.words.topMeaningful : a.words.top

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return Object.values(a.words.index)
      .filter((w) => w.word.includes(q))
      .sort((x, y) => y.count - x.count)
      .slice(0, 12)
  }, [query, a.words.index])

  const entry = selected ? (a.words.index[selected] ?? null) : null

  return (
    <div className="space-y-12">
      <SectionHeading
        eyebrow="Words"
        title="The things you keep saying"
        blurb="Counted from message text only — attachments and deleted messages contribute nothing here."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Words in total"
          value={num(a.words.totalTokens)}
          story={`${num(a.meta.totalWords)} counted across every message.`}
        />
        <StatCard
          label="Different words"
          value={num(a.words.uniqueWords)}
          story="Distinct forms, before any filtering."
          accent="honey"
        />
        <StatCard
          label="Words per message"
          value={(a.meta.totalWords / (a.meta.totalMessages || 1)).toFixed(1)}
          story="Averaged across the whole conversation."
          accent="sage"
        />
        <StatCard
          label="Repeated pairing"
          value={a.words.topPhrases[0] ? `"${a.words.topPhrases[0].key}"` : '—'}
          story={
            a.words.topPhrases[0]
              ? `Said ${num(a.words.topPhrases[0].count)} times.`
              : 'No two-word pairing repeats often enough to rank.'
          }
          accent="dusk"
        />
      </div>

      <ChartCard
        title="Most-used words"
        question="Which words carry this conversation?"
        description={ranked
          .slice(0, 12)
          .map((w) => `${w.key}: ${num(w.count)}`)
          .join('. ')}
        action={
          <SegmentedControl<Ranking>
            label="Word ranking"
            value={ranking}
            onChange={setRanking}
            options={[
              { value: 'meaningful', label: 'Meaningful' },
              { value: 'all', label: 'Everything' },
            ]}
          />
        }
        footnote={
          ranking === 'meaningful'
            ? 'Common words — the, and, you — are filtered out of this ranking. They are still counted in the totals above.'
            : 'Unfiltered. The top of this list is mostly grammar, which is why the other view exists.'
        }
      >
        {ranked.length ? (
          <>
            <Bars
              data={ranked.slice(0, 12).map((w) => ({ word: w.key, count: w.count }))}
              xKey="word"
              series={[{ key: 'count', label: 'Uses' }]}
              layout="horizontal"
              height={Math.max(220, Math.min(12, ranked.length) * 34)}
              valueFormatter={(v) => `${num(v)} uses`}
            />
            <ul className="mt-5 flex flex-wrap gap-2">
              {ranked.slice(0, 24).map((w) => (
                <li key={w.key}>
                  <button
                    type="button"
                    onClick={() => setSelected(w.key)}
                    className="rounded-pill bg-surface-sunk px-3 py-1.5 text-sm text-ink-muted transition-colors duration-200 ease-bloom hover:bg-clay-50 hover:text-clay-700"
                  >
                    {w.key} <span className="tnum text-xs text-ink-faint">{num(w.count)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-faint">Pick any word to open it.</p>
          </>
        ) : (
          <NotEnoughData what="a word ranking" need="There is very little message text in this export." />
        )}
      </ChartCard>

      <section>
        <SectionHeading
          eyebrow="Word explorer"
          title="Look up a word"
          blurb="Search anything either of you has said. You get the count, who says it, and when it peaked."
        />

        <RevealCard>
          <label htmlFor="word-search" className="block text-sm font-medium text-ink">
            Search your words
          </label>
          <input
            id="word-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="love, sorry, tomorrow…"
            autoComplete="off"
            className="mt-2 h-12 w-full rounded-pill border border-surface-line bg-surface px-4 text-base text-ink placeholder:text-ink-faint focus:border-clay-300"
          />

          {query.trim().length >= 2 ? (
            matches.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {matches.map((w) => (
                  <li key={w.word}>
                    <button
                      type="button"
                      onClick={() => setSelected(w.word)}
                      className="rounded-pill bg-clay-50 px-3 py-1.5 text-sm font-medium text-clay-700 transition-colors duration-200 hover:bg-clay-100"
                    >
                      {w.word} <span className="tnum text-xs">{num(w.count)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-ink-muted">
                Nothing for “{query.trim()}”. Only words used more than once make it into the index.
              </p>
            )
          ) : (
            <p className="mt-3 text-sm text-ink-faint">Two letters or more to search.</p>
          )}
        </RevealCard>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="How you open"
          question="The first words of a conversation."
          description={a.words.openers.map((w) => `${w.key}: ${num(w.count)}`).join('. ')}
          footnote="Taken from the first message after each gap of four hours or more."
        >
          {a.words.openers.length ? (
            <WordList items={a.words.openers} onPick={setSelected} />
          ) : (
            <NotEnoughData what="opening words" />
          )}
        </ChartCard>

        <ChartCard
          title="How you sign off"
          question="The last words before it goes quiet."
          description={a.words.closers.map((w) => `${w.key}: ${num(w.count)}`).join('. ')}
        >
          {a.words.closers.length ? (
            <WordList items={a.words.closers} onPick={setSelected} />
          ) : (
            <NotEnoughData what="closing words" />
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Pairings that keep coming back"
        question="Which two-word combinations repeat?"
        description={a.words.topPhrases.map((p) => `${p.key}: ${num(p.count)}`).join('. ')}
        footnote="Pairs made entirely of common words are excluded, or the list would be nothing but 'in the'."
      >
        {a.words.topPhrases.length ? (
          <Bars
            data={a.words.topPhrases.slice(0, 10).map((p) => ({ phrase: p.key, count: p.count }))}
            xKey="phrase"
            series={[{ key: 'count', label: 'Uses' }]}
            layout="horizontal"
            height={Math.max(200, Math.min(10, a.words.topPhrases.length) * 34)}
            valueFormatter={(v) => `${num(v)} uses`}
          />
        ) : (
          <NotEnoughData what="repeated phrases" />
        )}
      </ChartCard>

      <section>
        <SectionHeading
          eyebrow="Each of you"
          title="Words that belong to one person"
          blurb="Ranked by how much more one person uses a word than everyone else, adjusted for how much each of you writes."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {a.people.map((p) => {
            const color = personColor(p.author, raw)
            return (
              <RevealCard key={p.author}>
                <h3 className="font-display text-display-sm text-ink">{display(p.author)}</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {num(p.words)} words · {num(p.words_.unique)} of them different ·{' '}
                  {p.wordsPerMessage.toFixed(1)} per message
                </p>

                {p.words_.distinctive.length ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {p.words_.distinctive.slice(0, 8).map((w) => (
                      <li key={w.key}>
                        <button
                          type="button"
                          onClick={() => setSelected(w.key)}
                          className={`rounded-pill px-3 py-1.5 text-sm font-medium ${color.soft} ${color.ink}`}
                        >
                          {w.key}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-ink-faint">
                    Nothing stands out as theirs — you two use much the same vocabulary.
                  </p>
                )}
              </RevealCard>
            )
          })}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="The long ones"
          title="Messages that went on a bit"
          blurb="The longest single messages in the conversation, by word count."
        />

        {a.words.longestMessages.length ? (
          <RevealCard className="p-0">
            <ol className="divide-y divide-surface-line">
              {a.words.longestMessages.slice(0, 5).map((m, i) => (
                <li key={i} className="px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-display tnum text-xl text-ink">{num(m.words)} words</span>
                    <span className="text-sm font-medium text-ink-muted">{display(m.author)}</span>
                    <span className="ml-auto text-sm text-ink-faint">{dateShort(m.at)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted text-pretty">
                    {m.preview}
                  </p>
                </li>
              ))}
            </ol>
          </RevealCard>
        ) : (
          <EmptyState
            title="Your vocabulary is waiting."
            body="There isn't enough message text in this export to rank anything yet."
          />
        )}
      </section>

      <WordExplorer entry={entry} onClose={() => setSelected(null)} display={display} raw={raw} />
    </div>
  )
}

function WordList({
  items,
  onPick,
}: {
  items: { key: string; count: number; share: number }[]
  onPick: (word: string) => void
}) {
  return (
    <ul className="space-y-2">
      {items.slice(0, 8).map((w) => (
        <li key={w.key}>
          <button
            type="button"
            onClick={() => onPick(w.key)}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-200 hover:bg-surface-sunk"
          >
            <span className="w-24 shrink-0 truncate text-sm font-medium text-ink">{w.key}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-sunk">
              <span
                className="block h-full rounded-pill bg-clay-400"
                style={{ width: `${Math.max(4, w.share * 100)}%` }}
              />
            </span>
            <span className="tnum w-12 shrink-0 text-right text-sm text-ink-muted">
              {num(w.count)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/** PRODUCT.md §15 word explorer. Opens over whatever you were reading. */
function WordExplorer({
  entry,
  onClose,
  display,
  raw,
}: {
  entry: WordUsage | null
  onClose: () => void
  display: (author: string) => string
  raw: string[]
}) {
  const byAuthor = entry
    ? Object.entries(entry.byAuthor)
        .filter(([, n]) => n > 0)
        .sort((x, y) => y[1] - x[1])
    : []

  return (
    <Modal open={Boolean(entry)} onClose={onClose} title={entry ? `“${entry.word}”` : ''} size="lg">
      {entry ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-surface-sunk/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                Times used
              </p>
              <p className="mt-1.5 font-display tnum text-2xl text-ink">{num(entry.count)}</p>
              <p className="mt-0.5 text-xs text-ink-faint">{pct(entry.share, 2)} of all words</p>
            </div>
            <div className="rounded-xl bg-surface-sunk/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                Mostly
              </p>
              <p className="mt-1.5 font-display text-2xl text-ink">{display(entry.topAuthor)}</p>
              {entry.peakPeriod ? (
                <p className="mt-0.5 text-xs text-ink-faint">Peaked in {entry.peakPeriod}</p>
              ) : null}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Who says it
            </h4>
            <ul className="space-y-2">
              {byAuthor.map(([author, count]) => (
                <li key={author} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm font-medium text-ink">
                    {display(author)}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-sunk">
                    <span
                      className="block h-full rounded-pill"
                      style={{
                        width: `${(count / entry.count) * 100}%`,
                        background: personColor(author, raw).hex,
                      }}
                    />
                  </span>
                  <span className="tnum w-16 shrink-0 text-right text-sm text-ink-muted">
                    {num(count)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {entry.overTime.length >= 2 ? (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                Over time
              </h4>
              <Sparkline values={entry.overTime.map((p) => p.count)} height={44} />
              <div className="mt-1 flex justify-between text-xs text-ink-faint">
                <span>{entry.overTime[0].label}</span>
                <span>{entry.overTime[entry.overTime.length - 1].label}</span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-surface-line pt-4 text-sm text-ink-muted">
            <span>
              First said <span className="font-medium text-ink">{dateShort(entry.firstAt)}</span>
            </span>
            <span>
              Last said <span className="font-medium text-ink">{dateShort(entry.lastAt)}</span>
            </span>
          </div>

          <p className="text-xs leading-relaxed text-ink-faint">
            <Badge tone="neutral">In memory only</Badge>{' '}
            This panel shows counts. To read the lines a word appears in, open the word cloud on
            the Memories page — it quotes from the copy of the conversation held in this tab, which
            is never written to disk or sent anywhere.
          </p>
        </div>
      ) : null}
    </Modal>
  )
}
