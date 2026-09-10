import { ChartCard } from '@/components/charts/ChartCard'
import { Bars, ShareBar, TrendArea } from '@/components/charts/Charts'
import { personColor } from '@/components/ui/Avatar'
import { RevealCard, SectionHeading } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/Metric'
import { EmptyState, NotEnoughData } from '@/components/ui/States'
import { MEDIA_LABELS } from '@/lib/analytics'
import { num, pct, plural, shortName } from '@/lib/format'
import { useAnalytics, useStore } from '@/lib/store'

/** PRODUCT.md §17–§19 — attachments, voice notes and links. */
export function Media() {
  const a = useAnalytics()
  const { name } = useStore()
  const raw = a.meta.participants
  const displayAll = raw.map(name)
  const display = (author: string) => shortName(name(author), displayAll)

  const perPerson = Object.entries(a.media.perPerson)
    .filter(([, n]) => n > 0)
    .sort((x, y) => y[1] - x[1])

  if (!a.media.total && !a.links.total) {
    return (
      <div className="space-y-8">
        <SectionHeading eyebrow="Media" title="Photos, voice notes and links" />
        <EmptyState
          title="Nothing but words in here."
          body="This export contains no attachment placeholders or links. If you exported with media included, try again choosing “Without media” — the placeholders are what we count."
          icon="▣"
        />
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <SectionHeading
        eyebrow="Media"
        title="Everything that wasn't typed"
        blurb="WhatsApp leaves a placeholder line where each attachment used to be. That's what these numbers count — the files themselves are never part of a text export."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Attachments"
          value={num(a.media.total)}
          story={`${pct(a.media.share)} of every message was media rather than text.`}
        />
        <StatCard
          label="Most common"
          value={a.media.byKind[0] ? MEDIA_LABELS[a.media.byKind[0].key] : '—'}
          story={
            a.media.byKind[0]
              ? `${num(a.media.byKind[0].count)} of them — ${pct(a.media.byKind[0].share)} of all attachments.`
              : undefined
          }
          accent="honey"
        />
        <StatCard
          label="Voice notes"
          value={num(a.media.voiceNotes.total)}
          story={
            a.media.voiceNotes.total
              ? 'Counted as a media category of their own.'
              : 'Neither of you sends them.'
          }
          accent="sage"
        />
        <StatCard
          label="Links shared"
          value={num(a.links.total)}
          story={
            a.links.domains[0]
              ? `Most often from ${a.links.domains[0].key}.`
              : 'No links in this conversation.'
          }
          accent="dusk"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="What kind of thing"
          question="The mix of attachments across the conversation."
          description={a.media.byKind
            .map((k) => `${MEDIA_LABELS[k.key]}: ${num(k.count)}`)
            .join('. ')}
        >
          {a.media.byKind.length ? (
            <Bars
              data={a.media.byKind.map((k) => ({
                kind: MEDIA_LABELS[k.key],
                count: k.count,
              }))}
              xKey="kind"
              series={[{ key: 'count', label: 'Attachments' }]}
              layout="horizontal"
              height={Math.max(200, a.media.byKind.length * 38)}
              valueFormatter={(v) => `${num(v)} attachments`}
            />
          ) : (
            <NotEnoughData what="a media breakdown" />
          )}
        </ChartCard>

        <ChartCard
          title="Who sends it"
          question="The split of attachments between you."
          description={perPerson
            .map(([author, n]) => `${display(author)}: ${num(n)}`)
            .join('. ')}
          footnote="Attachment placeholders carry an author, so this split is exact."
        >
          {perPerson.length ? (
            <>
              <ShareBar
                segments={perPerson.map(([author, n]) => ({
                  label: display(author),
                  value: n,
                  color: personColor(author, raw).hex,
                }))}
              />
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {a.people.map((p) => (
                  <div key={p.author} className="rounded-xl bg-surface-sunk/60 p-4">
                    <dt className="text-sm font-medium text-ink">{display(p.author)}</dt>
                    <dd className="mt-1 font-display tnum text-2xl text-ink">
                      {num(p.media.total)}
                    </dd>
                    <dd className="text-xs text-ink-faint">
                      {p.media.byKind[0]
                        ? `mostly ${MEDIA_LABELS[p.media.byKind[0].key].toLowerCase()}`
                        : 'no attachments'}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <NotEnoughData what="a per-person split" />
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Media over time"
        question="When did you start sending things instead of saying them?"
        description={a.media.trend.map((t) => `${t.label}: ${num(t.count)}`).join('. ')}
      >
        {a.media.trend.length >= 2 ? (
          <TrendArea
            data={a.media.trend.map((t) => ({ label: t.label, media: t.count }))}
            xKey="label"
            series={[{ key: 'media', label: 'Attachments', color: '#6C7A9C' }]}
            height={260}
            valueFormatter={(v) => `${num(v)} attachments`}
          />
        ) : (
          <NotEnoughData what="a media trend" need="This chat spans less than two months." />
        )}
      </ChartCard>

      <section>
        <SectionHeading
          eyebrow="Voice notes"
          title="The ones you had to say out loud"
          blurb="Voice notes are counted as a media category. We know how many there were and who sent them — nothing about what's in them."
        />

        {a.media.voiceNotes.total ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Voice notes"
                value={num(a.media.voiceNotes.total)}
                story={`${pct(a.media.voiceNotes.total / (a.media.total || 1))} of all attachments.`}
              />
              <StatCard
                label="Sends the most"
                value={
                  a.media.voiceNotes.shares[0]
                    ? display(a.media.voiceNotes.shares[0].key)
                    : '—'
                }
                story={
                  a.media.voiceNotes.shares[0]
                    ? `${pct(a.media.voiceNotes.shares[0].share)} of them.`
                    : undefined
                }
                accent="honey"
              />
              <StatCard
                label="Roughly"
                value={`${(a.media.voiceNotes.total / Math.max(1, a.meta.activeDays)).toFixed(2)}`}
                story="voice notes on a day you spoke."
                accent="sage"
              />
            </div>

            {a.media.voiceNotes.shares.length > 1 ? (
              <ChartCard
                title="Who talks instead of typing"
                question="The voice-note split."
                description={a.media.voiceNotes.shares
                  .map((s) => `${display(s.key)}: ${pct(s.share)}`)
                  .join('. ')}
              >
                <ShareBar
                  segments={a.media.voiceNotes.shares.map((s) => ({
                    label: display(s.key),
                    value: s.count,
                    color: personColor(s.key, raw).hex,
                  }))}
                />
              </ChartCard>
            ) : null}

            {a.media.voiceNotes.trend.length >= 2 ? (
              <ChartCard
                title="Voice notes over time"
                question="Is this a habit that grew?"
                description={a.media.voiceNotes.trend
                  .map((t) => `${t.label}: ${num(t.count)}`)
                  .join('. ')}
              >
                <TrendArea
                  data={a.media.voiceNotes.trend.map((t) => ({ label: t.label, voice: t.count }))}
                  xKey="label"
                  series={[{ key: 'voice', label: 'Voice notes', color: '#81B29A' }]}
                  height={220}
                  valueFormatter={(v) => `${num(v)} voice notes`}
                />
              </ChartCard>
            ) : null}
          </div>
        ) : (
          <EmptyState
            title="No voice notes here."
            body="Everything in this conversation was typed or attached — nobody sent a recording."
            icon="◴"
          />
        )}
      </section>

      <section>
        <SectionHeading
          eyebrow="Links"
          title="The corners of the internet you send each other"
          blurb="Domains only. We read the host from each URL and count it — the rest of the address is left alone."
        />

        {a.links.total ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Links" value={num(a.links.total)} story="Shared between you." />
              <StatCard
                label="Different domains"
                value={num(a.links.domains.length)}
                story="Distinct hosts, counted at least once."
                accent="honey"
              />
              <StatCard
                label="Most shared"
                value={a.links.domains[0] ? a.links.domains[0].key : '—'}
                story={
                  a.links.domains[0]
                    ? `${plural(a.links.domains[0].count, 'link')} — ${pct(a.links.domains[0].share)} of everything you send.`
                    : undefined
                }
                accent="dusk"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Where they come from"
                question="Which sites end up in this chat?"
                description={a.links.domains
                  .map((d) => `${d.key}: ${num(d.count)}`)
                  .join('. ')}
              >
                <Bars
                  data={a.links.domains.slice(0, 10).map((d) => ({
                    domain: d.key,
                    count: d.count,
                  }))}
                  xKey="domain"
                  series={[{ key: 'count', label: 'Links' }]}
                  layout="horizontal"
                  height={Math.max(200, Math.min(10, a.links.domains.length) * 36)}
                  valueFormatter={(v) => `${num(v)} links`}
                />
              </ChartCard>

              <RevealCard>
                <h3 className="font-display text-display-sm text-ink">Who sends the links</h3>
                <ul className="mt-4 space-y-3">
                  {Object.entries(a.links.perPerson)
                    .sort((x, y) => y[1] - x[1])
                    .map(([author, count]) => (
                      <li key={author} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 truncate text-sm font-medium text-ink">
                          {display(author)}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-sunk">
                          <span
                            className="block h-full rounded-pill"
                            style={{
                              width: `${(count / (a.links.total || 1)) * 100}%`,
                              background: personColor(author, raw).hex,
                            }}
                          />
                        </span>
                        <span className="tnum w-14 shrink-0 text-right text-sm text-ink-muted">
                          {num(count)}
                        </span>
                      </li>
                    ))}
                </ul>

                {a.links.trend.length >= 2 ? (
                  <div className="mt-6">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                      Links over time
                    </h4>
                    <Bars
                      data={a.links.trend.map((t) => ({ label: t.label, links: t.count }))}
                      xKey="label"
                      series={[{ key: 'links', label: 'Links' }]}
                      height={160}
                      valueFormatter={(v) => `${num(v)} links`}
                    />
                  </div>
                ) : null}
              </RevealCard>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No links in here."
            body="Neither of you has sent a URL in this conversation."
            icon="⚯"
          />
        )}
      </section>
    </div>
  )
}
