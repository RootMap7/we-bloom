import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

/**
 * The formal policy, kept deliberately close to the implementation — every
 * claim below is checkable against the code, per PRODUCT.md §3.4 and §37.
 *
 * OPERATOR: fill these in before publishing. The policy is materially
 * incomplete without a real contact route.
 */
const POLICY = {
  operator: 'the We Bloom project',
  contact: 'hello@example.com',
  effective: '10 September 2026',
  updated: '10 September 2026',
  /** Where the built files are served from. Update if you move hosts. */
  host: 'a static web host',
}

export function PrivacyPolicy() {
  return (
    <section aria-labelledby="policy" className="scroll-mt-8">
      <header className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-clay-600">
          The formal version
        </p>
        <h2 id="policy" className="font-display text-display-md text-ink text-balance">
          Privacy policy
        </h2>
        <p className="mt-2 text-sm text-ink-faint">
          Effective {POLICY.effective} · Last updated {POLICY.updated}
        </p>
      </header>

      <Card className="bg-surface-sunk/40">
        <p className="text-base leading-relaxed text-ink-muted text-pretty">
          <strong className="font-semibold text-ink">The short version.</strong> We Bloom runs
          entirely in your web browser. Your chat export is never sent to us or to anyone else,
          because the application has no server to send it to. We operate no accounts, no
          analytics, no advertising and no tracking. Nothing is stored on your device unless you
          switch storage on, and you can erase it from this page at any time.
        </p>
      </Card>

      <div className="mt-8 space-y-8">
        <Clause n="1" title="Who this policy is from">
          <p>
            We Bloom is a tool operated by {POLICY.operator}. It analyses a WhatsApp chat export
            that you choose to open, and presents the result back to you. This policy explains
            what happens to that file and to any information derived from it.
          </p>
          <p>
            Because processing happens on your own device, for most of what follows you — not
            us — are the one holding the data. We have designed it that way deliberately.
          </p>
        </Clause>

        <Clause n="2" title="What we process, and where">
          <p>
            When you select a chat export, the file is read using your browser's own file API and
            parsed inside a Web Worker on your device. The computed report — counts, medians,
            rankings, dates and participant names — is held in your browser's memory for as long
            as the page is open.
          </p>
          <p>
            No part of that process involves a network request. We do not receive your file, your
            messages, your contacts' names, or the statistics derived from them. Closing or
            reloading the tab discards everything unless you have turned storage on.
          </p>
        </Clause>

        <Clause n="3" title="What is stored on your device">
          <p>Two things, and only if you ask for them:</p>
          <ul>
            <li>
              <strong className="font-semibold text-ink">A preference flag</strong> in{' '}
              <code className="rounded bg-surface px-1.5 py-0.5 text-sm">localStorage</code>, under
              the key <code className="rounded bg-surface px-1.5 py-0.5 text-sm">we-bloom:save-locally</code>,
              recording whether you opted in to saving.
            </li>
            <li>
              <strong className="font-semibold text-ink">The computed report</strong> in an
              IndexedDB database named{' '}
              <code className="rounded bg-surface px-1.5 py-0.5 text-sm">we-bloom</code>. This
              contains the statistics, the participant names as they appeared in the export, and
              any names you have changed. It does not contain your message text; the raw
              conversation is discarded once the report exists.
            </li>
          </ul>
          <p>
            Both live only in the browser profile you used. They are not synchronised, backed up
            by us, or readable by us. They persist until you delete them, clear your browser data,
            or the browser evicts them.
          </p>
        </Clause>

        <Clause n="4" title="What we do not do">
          <ul>
            <li>We do not upload your conversation, or any statistic drawn from it.</li>
            <li>We do not operate accounts, logins, or email lists.</li>
            <li>We do not use analytics, advertising, cookies for tracking, or fingerprinting.</li>
            <li>We do not sell, rent, or share personal information. There is none to share.</li>
            <li>
              We do not send your data to an AI service. The wording you see on the Insights and
              Ask pages is produced by fixed rules in the application's own code.
            </li>
            <li>We do not attempt to infer sensitive characteristics about anyone.</li>
          </ul>
        </Clause>

        <Clause n="5" title="Third parties that see a request">
          <p>
            Two unavoidable exceptions to "nothing leaves your device", both of which involve
            loading the page itself rather than your data:
          </p>
          <ul>
            <li>
              <strong className="font-semibold text-ink">Our host.</strong> The application's files
              are served from {POLICY.host}. Like any web server, it can see your IP address, the
              time of the request and your browser's user agent, in the ordinary course of
              delivering the page.
            </li>
            <li>
              <strong className="font-semibold text-ink">Google Fonts.</strong> The typefaces
              Fraunces and Outfit are requested from{' '}
              <code className="rounded bg-surface px-1.5 py-0.5 text-sm">fonts.googleapis.com</code>{' '}
              and{' '}
              <code className="rounded bg-surface px-1.5 py-0.5 text-sm">fonts.gstatic.com</code>.
              That request discloses your IP address and user agent to Google, and is governed by
              Google's privacy policy rather than this one. It carries none of your chat data.
            </li>
          </ul>
          <p>
            Beyond those, the application makes no network requests once loaded. You can confirm
            that in your browser's network inspector.
          </p>
        </Clause>

        <Clause n="6" title="The other people in your chat">
          <p>
            A conversation is not only yours. An export describes everyone in it, and they have not
            agreed to be analysed. Because the file never leaves your device, this remains a private
            matter between you and them — but if you share a report, a screenshot or a downloaded
            PDF, you are sharing information about another person.
          </p>
          <p>
            The rename controls above exist for exactly that reason. Please use your judgement, and
            consider asking them.
          </p>
        </Clause>

        <Clause n="7" title="Downloads and sharing">
          <p>
            The PDF download is generated on your device and saved by your browser. It contains
            headline figures only — no message text — and we never receive a copy. Anything you
            then do with that file is outside our reach and outside this policy.
          </p>
          <p>
            Where the application offers to share a Wrapped slide, it hands the text to your
            operating system's own share sheet or clipboard. It does not post anywhere on your
            behalf.
          </p>
        </Clause>

        <Clause n="8" title="Your choices and your rights">
          <p>
            Everything is under your direct control, on this page: storage is off by default and
            can be switched off again at any time, names can be changed, and "Delete everything"
            clears the stored report, deletes the database and resets the preference flag.
          </p>
          <p>
            Data-protection law — including the UK GDPR, the EU GDPR and the California Consumer
            Privacy Act — gives you rights to access, correct, port, restrict and erase personal
            information that an organisation holds about you. We hold none: there is no database on
            our side, no profile, and no record that you ever used We Bloom. There is accordingly
            nothing for us to disclose or erase on request, and the controls on this page are the
            complete and immediate means of exercising those rights over your own copy.
          </p>
        </Clause>

        <Clause n="9" title="Children">
          <p>
            We Bloom is not directed at children, and we do not knowingly collect information from
            anyone — of any age — because we collect none at all. If a child uses the tool, the
            same guarantee applies: their conversation stays on their device.
          </p>
        </Clause>

        <Clause n="10" title="Security">
          <p>
            Keeping your data on your device removes the risk of a breach on our side, since there
            is nothing on our side to breach. It does move the responsibility to you: a saved report
            is readable by anyone with access to your browser profile. On a shared or public
            computer, leave storage off, or use "Delete everything" before you walk away.
          </p>
        </Clause>

        <Clause n="11" title="Changes to this policy">
          <p>
            If the way the application handles data changes, this policy changes in the same
            release, and the "last updated" date above moves with it. We will not quietly weaken
            what it promises: if a future version ever needed to send data anywhere, it would ask
            you first, and say so here.
          </p>
        </Clause>

        <Clause n="12" title="Contact">
          <p>
            Questions, corrections, or a claim in here you think is wrong:{' '}
            <a
              href={`mailto:${POLICY.contact}`}
              className="font-medium text-clay-600 underline underline-offset-4"
            >
              {POLICY.contact}
            </a>
            . Reports that the policy overstates the implementation are especially welcome.
          </p>
        </Clause>
      </div>
    </section>
  )
}

function Clause({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <article>
      <h3 className="font-display text-xl text-ink text-balance">
        <span className="tnum mr-2 text-clay-400">{n}</span>
        {title}
      </h3>
      <div className="mt-2 space-y-3 text-base leading-relaxed text-ink-muted text-pretty [&_li]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  )
}
