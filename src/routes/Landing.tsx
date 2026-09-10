import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { Button, ButtonLink } from '@/components/ui/Button'
import { fadeRise, revealOnScroll, stagger, transition } from '@/lib/motion'
import { useStore } from '@/lib/store'

export function Landing() {
  const { loadDemo, phase, analytics } = useStore()
  const navigate = useNavigate()

  // Loading the sample kicks off the worker; jump to the report when it lands.
  useEffect(() => {
    if (phase === 'ready' && analytics) navigate('/report')
  }, [phase, analytics, navigate])

  return (
    <div className="min-h-dvh bg-cream">
      <header className="shell flex h-16 items-center justify-between sm:h-20">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/privacy"
            className="rounded-pill px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink"
          >
            Privacy
          </Link>
          <ButtonLink to="/upload" size="sm">
            Upload a chat
          </ButtonLink>
        </nav>
      </header>

      <main>
        <section className="shell pb-16 pt-10 sm:pb-24 sm:pt-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger(0.08)}
            className="max-w-[22ch] sm:max-w-[16ch]"
          >
            <motion.p
              variants={fadeRise}
              className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-clay-600"
            >
              Your conversation, as a story
            </motion.p>
            <motion.h1
              variants={fadeRise}
              className="font-display text-display-xl text-ink text-balance"
            >
              You've said a lot to each other.
            </motion.h1>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeRise}
            transition={{ ...transition.base, delay: 0.24 }}
            className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-muted text-pretty sm:text-xl"
          >
            We Bloom reads an exported WhatsApp chat and turns it into something worth looking
            at — the rhythm, the habits, the words you keep coming back to, and the moments that
            stand out.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeRise}
            transition={{ ...transition.base, delay: 0.32 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <ButtonLink to="/upload" size="lg">
              Upload your chat
            </ButtonLink>
            <Button variant="secondary" size="lg" onClick={loadDemo}>
              {phase === 'parsing' || phase === 'analyzing' || phase === 'reading'
                ? 'Building the sample…'
                : 'See a sample report first'}
            </Button>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeRise}
            transition={{ ...transition.base, delay: 0.4 }}
            className="mt-5 max-w-[46ch] text-sm leading-relaxed text-ink-muted"
          >
            Your chat is read in your browser and never uploaded to a server.{' '}
            <Link to="/privacy" className="font-medium text-clay-600 underline underline-offset-4">
              Here's exactly what that means.
            </Link>
          </motion.p>
        </section>

        <Preview />
        <HowItWorks />
        <WhatYouGet />
        <ClosingCta />
      </main>

      <footer className="border-t border-surface-line py-8">
        <div className="shell flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="text-sm text-ink-faint">
            Built for reflection, not judgement.{' '}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-ink-muted">
              Privacy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

/** A static, honest picture of what the report looks like. Not live data. */
function Preview() {
  return (
    <section className="shell pb-16 sm:pb-24">
      <motion.div
        {...revealOnScroll}
        className="overflow-hidden rounded-card border border-surface-line bg-surface shadow-lift"
      >
        <div className="border-b border-surface-line bg-surface-sunk/60 px-5 py-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-pill bg-clay-200" />
            <span className="h-2.5 w-2.5 rounded-pill bg-honey-200" />
            <span className="h-2.5 w-2.5 rounded-pill bg-surface-line" />
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-8">
          <PreviewStat label="Messages" value="18,492" note="across 247 days" />
          <PreviewStat label="You usually reply in" value="8m 42s" note="half the time, faster" />
          <PreviewStat label="Longest streak" value="17 days" note="without missing one" />
          <div className="sm:col-span-3">
            <p className="font-display text-display-sm text-ink text-balance">
              You're most alive at night.
            </p>
            <p className="mt-1.5 text-sm text-ink-muted">
              10 PM–11 PM is the busiest hour in this conversation.
            </p>
            <div className="mt-4 flex h-24 items-end gap-1" aria-hidden="true">
              {[3, 2, 1, 1, 1, 2, 4, 7, 9, 7, 6, 6, 7, 6, 6, 6, 7, 9, 12, 15, 19, 24, 22, 12].map(
                (v, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t-[4px] bg-clay-200"
                    style={{ height: `${(v / 24) * 100}%` }}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </motion.div>
      <p className="mt-3 text-center text-xs text-ink-faint">
        An illustration of the report, using the sample conversation.
      </p>
    </section>
  )
}

function PreviewStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl bg-surface-sunk/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className="mt-1.5 font-display tnum text-2xl text-ink">{value}</p>
      <p className="mt-0.5 text-sm text-ink-muted">{note}</p>
    </div>
  )
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Export the chat',
      body: 'In WhatsApp, open the conversation, tap the name at the top, and choose Export chat → Without media. You get a .txt file.',
    },
    {
      n: '02',
      title: 'Drop it in',
      body: 'The file is read here, in this browser tab. Nothing is sent anywhere, and nothing is stored unless you ask for it.',
    },
    {
      n: '03',
      title: 'Read the story',
      body: 'A full report, and a Wrapped you can page through. Both built from the same numbers.',
    },
  ]

  return (
    <section className="border-y border-surface-line bg-surface/50 py-16 sm:py-24">
      <div className="shell">
        <motion.h2
          {...revealOnScroll}
          className="max-w-[18ch] font-display text-display-lg text-ink text-balance"
        >
          Three steps, about a minute.
        </motion.h2>

        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger(0.1)}
          className="mt-10 grid gap-6 sm:grid-cols-3"
        >
          {steps.map((s) => (
            <motion.li key={s.n} variants={fadeRise}>
              <p className="font-display tnum text-3xl text-clay-300">{s.n}</p>
              <h3 className="mt-2 font-display text-display-sm text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted text-pretty">{s.body}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}

function WhatYouGet() {
  const items = [
    ['The rhythm', 'When you talk, how often, and the hours the conversation belongs to.'],
    ['The balance', 'Who says more, who starts it, who tends to have the last word.'],
    ['The language', 'The words and emoji that only make sense inside this chat.'],
    ['The moments', 'The longest conversation, the biggest day, the longest quiet spell.'],
    ['The changes', 'What looks different now compared to when it started.'],
    ['Chat Wrapped', 'The whole thing as a story you can page through and share.'],
  ]

  return (
    <section className="shell py-16 sm:py-24">
      <motion.h2
        {...revealOnScroll}
        className="max-w-[20ch] font-display text-display-lg text-ink text-balance"
      >
        Not a dashboard. A read on the conversation.
      </motion.h2>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={stagger(0.06)}
        className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map(([title, body]) => (
          <motion.div key={title} variants={fadeRise}>
            <h3 className="font-display text-xl text-ink">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted text-pretty">{body}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function ClosingCta() {
  return (
    <section className="shell pb-20 sm:pb-28">
      <motion.div
        {...revealOnScroll}
        className="rounded-card bg-ink px-6 py-12 text-center sm:px-12 sm:py-16"
      >
        <h2 className="mx-auto max-w-[20ch] font-display text-display-lg text-cream text-balance">
          Some conversations are just numbers.
        </h2>
        <p className="mx-auto mt-3 max-w-[36ch] text-lg text-cream/70 text-pretty">
          Let's see what yours turns into.
        </p>
        <div className="mt-8">
          <ButtonLink to="/upload" size="lg" className="bg-clay-500 hover:bg-clay-400">
            Upload your chat
          </ButtonLink>
        </div>
      </motion.div>
    </section>
  )
}
