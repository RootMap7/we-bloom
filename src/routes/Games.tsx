import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GamePlayer, type RoundResult } from '@/components/games/GamePlayer'
import { UnlockModal } from '@/components/games/UnlockModal'
import { Button, ButtonLink } from '@/components/ui/Button'
import { RevealCard, SectionHeading } from '@/components/ui/Card'
import { Badge, Toggle } from '@/components/ui/Controls'
import { EmptyState } from '@/components/ui/States'
import { celebrate } from '@/lib/celebrate'
import {
  MODES,
  PASS_MARK,
  type GameMode,
  type ModeSpec,
  type Question,
  buildRound,
  roundAvailability,
} from '@/lib/games'
import { pct, shortName } from '@/lib/format'
import { fadeRise, stagger } from '@/lib/motion'
import { isSoundOn, setSoundOn, sound } from '@/lib/sound'
import { useAnalytics, useStore } from '@/lib/store'

/** A round shorter than this is not worth starting. */
const MIN_QUESTIONS = 4

export function Games() {
  const a = useAnalytics()
  const { messages, name } = useStore()

  const displayAll = a.meta.participants.map(name)
  const display = (author: string) => shortName(name(author), displayAll)

  const [active, setActive] = useState<ModeSpec | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [result, setResult] = useState<RoundResult | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [soundOn, setSound] = useState(isSoundOn)

  const availability = useMemo(
    () =>
      messages.length
        ? roundAvailability({ messages, analytics: a, display })
        : ({} as Record<GameMode, number>),
    // display is derived from aliases; rebuilding on every render would be
    // wasteful and the labels only matter when a round is built.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, a],
  )

  // A report restored from storage has no message text, by design.
  if (!messages.length) {
    return (
      <div className="space-y-8">
        <SectionHeading eyebrow="Games" title="Trivia about your own conversation" />
        <EmptyState
          title="The games need the conversation itself."
          body="Your saved report holds the numbers, not the messages — that's deliberate, and it's what the privacy page promises. Upload the export again and the games will have something to quote."
          icon="◐"
          action={
            <ButtonLink to="/upload" size="sm">
              Upload the export again
            </ButtonLink>
          }
        />
        <p className="text-sm leading-relaxed text-ink-faint text-pretty">
          Quotes are held in memory for this tab only. Nothing about them is written to disk, and a
          reload clears them.
        </p>
      </div>
    )
  }

  if (active && questions.length && !result) {
    return (
      <GamePlayer
        spec={active}
        questions={questions}
        onFinish={(r) => {
          setResult(r)
          if (r.passed) {
            void celebrate()
            setUnlocked(true)
          } else {
            sound.finish()
          }
        }}
        onQuit={() => {
          setActive(null)
          setQuestions([])
        }}
      />
    )
  }

  if (active && result) {
    return (
      <>
        <ScoreCard
          spec={active}
          result={result}
          onReplay={() => {
            const round = buildRound(active.mode, { messages, analytics: a, display })
            setQuestions(round)
            setResult(null)
          }}
          onBack={() => {
            setActive(null)
            setQuestions([])
            setResult(null)
          }}
          onOpenReward={() => setUnlocked(true)}
        />
        <UnlockModal open={unlocked} onClose={() => setUnlocked(false)} />
      </>
    )
  }

  const start = (spec: ModeSpec) => {
    const round = buildRound(spec.mode, { messages, analytics: a, display })
    if (!round.length) return
    sound.tap()
    setQuestions(round)
    setResult(null)
    setActive(spec)
  }

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Games"
        title="How well do you know your own conversation?"
        blurb="Four rounds, built from real messages in this export. Score 80% or more and something unlocks."
      />

      <RevealCard className="flex flex-wrap items-center justify-between gap-4">
        <Toggle
          checked={soundOn}
          onChange={(v) => {
            setSoundOn(v)
            setSound(v)
            if (v) sound.tap()
          }}
          label="Sound effects"
          description="Short tones for taps, right answers and unlocks. Games only — the rest of the app stays quiet."
        />
      </RevealCard>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger(0.06)}
        className="grid gap-4 sm:grid-cols-2"
      >
        {MODES.map((spec) => {
          const material = availability[spec.mode] ?? 0
          const playable = material >= MIN_QUESTIONS

          return (
            <motion.article
              key={spec.mode}
              variants={fadeRise}
              className="card-base flex flex-col p-5 sm:p-6"
            >
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="text-2xl text-clay-500">
                  {spec.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-display-sm text-ink">{spec.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted text-pretty">
                    {spec.blurb}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {spec.seconds ? <Badge tone="honey">{spec.seconds}s per question</Badge> : null}
                <Badge tone="neutral">
                  {playable ? `${material} questions` : 'not enough material'}
                </Badge>
              </div>

              <div className="mt-5">
                {playable ? (
                  <Button onClick={() => start(spec)} full>
                    Play
                  </Button>
                ) : (
                  <p className="text-sm leading-relaxed text-ink-faint text-pretty">
                    This chat yields only {material} usable{' '}
                    {material === 1 ? 'question' : 'questions'} here, and a round needs{' '}
                    {MIN_QUESTIONS}. Nothing is invented to fill the gap.
                  </p>
                )}
              </div>
            </motion.article>
          )
        })}
      </motion.div>

      <p className="text-sm leading-relaxed text-ink-faint text-pretty">
        Every question comes from a real message, and every answer is revealed with the date it was
        sent. Quotes stay in this tab's memory — they are never saved or sent anywhere. See{' '}
        <Link to="/privacy" className="font-medium text-clay-600 underline underline-offset-4">
          the privacy page
        </Link>
        .
      </p>
    </div>
  )
}

function ScoreCard({
  spec,
  result,
  onReplay,
  onBack,
  onOpenReward,
}: {
  spec: ModeSpec
  result: RoundResult
  onReplay: () => void
  onBack: () => void
  onOpenReward: () => void
}) {
  return (
    <div className="space-y-8">
      <RevealCard
        className={result.passed ? 'bg-[#E4EFE9] text-center' : 'bg-surface-sunk/60 text-center'}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay-600">
          {spec.title}
        </p>
        <p className="mt-3 font-display tnum text-display-xl text-ink">
          {result.correct}/{result.total}
        </p>
        <p className="mt-1 font-display text-display-sm text-ink">{pct(result.share)}</p>

        <p className="mx-auto mt-4 max-w-[44ch] text-base leading-relaxed text-ink-muted text-pretty">
          {result.passed
            ? 'That clears the mark. You know this conversation by its fragments, which is the whole idea.'
            : `${pct(PASS_MARK)} unlocks the reward. Close — the quotes get easier once you have seen a few.`}
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {result.passed ? (
            <Button onClick={onOpenReward}>Open what you unlocked</Button>
          ) : null}
          <Button variant="secondary" onClick={onReplay}>
            Play again
          </Button>
          <Button variant="quiet" onClick={onBack}>
            Other modes
          </Button>
        </div>
      </RevealCard>
    </div>
  )
}
