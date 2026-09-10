import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { PrivacyPolicy } from '@/components/legal/PrivacyPolicy'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card, SectionHeading } from '@/components/ui/Card'
import { Badge, Toggle } from '@/components/ui/Controls'
import { Modal } from '@/components/ui/Modal'
import { shortName } from '@/lib/format'
import { deleteEverything } from '@/lib/storage'
import { useStore } from '@/lib/store'

/**
 * PRODUCT.md §37. Every claim on this page has to be true of the code as
 * written — §3.4 forbids absolute privacy language the implementation doesn't
 * actually guarantee.
 */
export function Privacy() {
  const {
    analytics,
    saveLocally,
    setSaveLocally,
    anonymiseShares,
    setAnonymiseShares,
    aliases,
    setAlias,
    name,
    reset,
  } = useStore()

  const [confirming, setConfirming] = useState(false)
  const [deleted, setDeleted] = useState(false)

  const wipe = async () => {
    await deleteEverything()
    reset()
    setConfirming(false)
    setDeleted(true)
  }

  const participants = analytics?.meta.participants ?? []

  return (
    <div className="min-h-dvh bg-cream">
      <header className="shell flex h-16 items-center justify-between sm:h-20">
        <Logo />
        <nav className="flex items-center gap-2">
          {analytics ? (
            <ButtonLink to="/report" variant="secondary" size="sm">
              Back to the report
            </ButtonLink>
          ) : (
            <ButtonLink to="/upload" size="sm">
              Upload a chat
            </ButtonLink>
          )}
        </nav>
      </header>

      <main className="shell max-w-[46rem] pb-20 pt-8 sm:pt-14">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-clay-600">
          Privacy
        </p>
        <h1 className="font-display text-display-lg text-ink text-balance">
          What happens to your conversation
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted text-pretty">
          A WhatsApp export is one of the most personal files you own. This page describes exactly
          what We Bloom does with it — no more, and no less. The plain-language version comes
          first;{' '}
          <a href="#policy" className="font-medium text-clay-600 underline underline-offset-4">
            the formal policy
          </a>{' '}
          is at the bottom.
        </p>

        <div className="mt-10 space-y-10">
          <Section
            eyebrow="Before you upload"
            title="What's actually in an export"
            badge={<Badge tone="honey">Worth knowing</Badge>}
          >
            <p>
              WhatsApp's “Export chat → Without media” produces a plain text file containing every
              message in the conversation: the date and time, who sent it, and the full text. It
              also names each participant as they appear in your contacts.
            </p>
            <p>
              It is worth remembering that the file describes two people, and only one of you chose
              to open it here.
            </p>
          </Section>

          <Section
            eyebrow="During processing"
            title="The file is read in this browser tab"
            badge={<Badge tone="sage">No upload</Badge>}
          >
            <p>
              The file is read with the browser's own file API and parsed in a Web Worker on this
              device. There is no server call in that path — the conversation is never transmitted
              anywhere, because nothing in the app sends it.
            </p>
            <p>
              Everything you see afterwards — the charts, the streaks, the word counts — is computed
              from that in-memory result. Closing or refreshing this tab discards it.
            </p>
          </Section>

          <Section
            eyebrow="AI processing"
            title="Nothing is sent to an AI service"
            badge={<Badge tone="sage">Local only</Badge>}
          >
            <p>
              The Insights and Ask Your Chat pages read the computed statistics and phrase them in
              words. That phrasing is done by fixed rules in the app's own code, not by a language
              model, and not by any external service.
            </p>
            <p>
              As a result, no part of your conversation — raw or summarised — leaves this device. If
              that ever changes, this page changes with it and the app will ask first.
            </p>
          </Section>

          <Section
            eyebrow="Storage"
            title="Nothing is saved unless you ask"
            badge={saveLocally ? <Badge tone="clay">On</Badge> : <Badge tone="neutral">Off</Badge>}
          >
            <p>
              By default nothing is written to disk. Turn the setting below on and We Bloom stores
              the <strong className="font-semibold text-ink">computed report</strong> in this
              browser's IndexedDB, so it is still there when you come back.
            </p>
            <p>
              The message text is not part of what gets stored. Once a report exists the raw
              conversation has served its purpose, so only the numbers, names and rankings are kept.
              It stays on this device and syncs nowhere.
            </p>

            <Card className="not-prose mt-5">
              <Toggle
                checked={saveLocally}
                onChange={setSaveLocally}
                label="Keep my report on this device"
                description="Stored in this browser only. Turning it off stops future saves; use Delete everything below to remove what's already there."
              />
            </Card>
          </Section>

          {participants.length ? (
            <Section eyebrow="Names" title="Rename anyone, anywhere">
              <p>
                Names come from your contacts, by way of the export. You can change how they appear
                throughout the report — useful before you show it to anyone, or screenshot it.
              </p>

              <Card className="not-prose mt-5 space-y-4">
                {participants.map((author) => (
                  <div key={author}>
                    <label
                      htmlFor={`alias-${author}`}
                      className="block text-sm font-medium text-ink"
                    >
                      {shortName(author, participants)}
                    </label>
                    <input
                      id={`alias-${author}`}
                      type="text"
                      value={aliases[author] ?? name(author)}
                      onChange={(e) => setAlias(author, e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-pill border border-surface-line bg-surface px-4 text-base text-ink focus:border-clay-300"
                    />
                  </div>
                ))}

                <div className="border-t border-surface-line pt-4">
                  <Toggle
                    checked={anonymiseShares}
                    onChange={setAnonymiseShares}
                    label="Use these names when sharing"
                    description="Anything you share out of Wrapped uses the names above rather than the ones in the export."
                  />
                </div>
              </Card>
            </Section>
          ) : null}

          <Section eyebrow="Deletion" title="Remove everything, now">
            <p>
              This clears the saved report, deletes the IndexedDB database We Bloom created, and
              turns the storage setting back off. It also drops the report currently open in this
              tab.
            </p>

            <div className="not-prose mt-5 flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => setConfirming(true)}>
                Delete everything
              </Button>
              {deleted ? (
                <span className="text-sm font-medium text-sage">
                  Done — nothing of yours is left here.
                </span>
              ) : null}
            </div>
          </Section>

          <Section eyebrow="In short" title="The whole thing in five lines">
            <ul className="space-y-2">
              <li>Your chat file is read on this device and never uploaded.</li>
              <li>No AI service, and no server, sees any part of it.</li>
              <li>Nothing is stored unless you switch storage on.</li>
              <li>What gets stored is the computed report, not your messages.</li>
              <li>A downloaded PDF holds headline numbers only — no message text.</li>
              <li>You can delete all of it from this page, in one click.</li>
            </ul>
          </Section>

          <hr className="border-surface-line" />

          <PrivacyPolicy />
        </div>

        <p className="mt-12 text-sm leading-relaxed text-ink-faint text-pretty">
          Questions about a specific number? Every chart in the report names the metric behind it.{' '}
          <Link to="/upload" className="font-medium text-clay-600 underline underline-offset-4">
            Start with your own chat
          </Link>
          .
        </p>
      </main>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Delete everything?"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
            <Button onClick={wipe}>Delete everything</Button>
          </div>
        }
      >
        <p className="text-base leading-relaxed text-ink-muted text-pretty">
          This removes the saved report from this browser and closes the one you're looking at. It
          cannot be undone — you'd need to upload the export again.
        </p>
      </Modal>
    </div>
  )
}

function Section({
  eyebrow,
  title,
  badge,
  children,
}: {
  eyebrow: string
  title: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SectionHeading eyebrow={eyebrow} title={title} className="mb-0" />
        {badge}
      </div>
      <div className="space-y-3 text-base leading-relaxed text-ink-muted text-pretty [&_li]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}
