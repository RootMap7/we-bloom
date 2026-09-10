import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, ProgressBar } from '@/components/ui/Controls'
import { burst } from '@/lib/celebrate'
import type { ModeSpec, Question } from '@/lib/games'
import { PASS_MARK } from '@/lib/games'
import { transition } from '@/lib/motion'
import { sound } from '@/lib/sound'

export interface RoundResult {
  correct: number
  total: number
  share: number
  passed: boolean
}

/**
 * One player for all four modes — they differ only in framing, timing and how
 * the prompt is set. Answers lock on selection, and the real answer is always
 * revealed with the date it came from, so a round doubles as a way of reading
 * the conversation back.
 */
export function GamePlayer({
  spec,
  questions,
  onFinish,
  onQuit,
}: {
  spec: ModeSpec
  questions: Question[]
  onFinish: (result: RoundResult) => void
  onQuit: () => void
}) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [remaining, setRemaining] = useState(spec.seconds ?? 0)

  const question = questions[index]
  const isLast = index === questions.length - 1
  const answered = chosen !== null

  const finish = useCallback(
    (finalCorrect: number) => {
      const share = questions.length ? finalCorrect / questions.length : 0
      onFinish({
        correct: finalCorrect,
        total: questions.length,
        share,
        passed: share >= PASS_MARK,
      })
    },
    [onFinish, questions.length],
  )

  const answer = useCallback(
    (choiceId: string | null) => {
      if (chosen !== null || !question) return
      const right = choiceId === question.answerId
      setChosen(choiceId ?? '__timeout__')
      if (right) {
        setCorrect((c) => c + 1)
        sound.correct()
        void burst()
      } else {
        sound.wrong()
      }
    },
    [chosen, question],
  )

  // Countdown for the timed modes. Running out counts as a wrong answer, which
  // is the whole point of a rapid-fire round.
  const answerRef = useRef(answer)
  answerRef.current = answer

  useEffect(() => {
    if (spec.seconds === null || chosen !== null) return
    setRemaining(spec.seconds)

    const started = Date.now()
    const id = window.setInterval(() => {
      const left = spec.seconds! - (Date.now() - started) / 1000
      if (left <= 0) {
        window.clearInterval(id)
        setRemaining(0)
        answerRef.current(null)
      } else {
        setRemaining(left)
      }
    }, 100)

    return () => window.clearInterval(id)
  }, [index, spec.seconds, chosen])

  const next = () => {
    if (isLast) {
      finish(correct)
      return
    }
    setChosen(null)
    setIndex((i) => i + 1)
  }

  if (!question) return null

  const timerShare = spec.seconds ? remaining / spec.seconds : 0

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <Badge tone="clay">{spec.title}</Badge>
        <span className="tnum text-sm text-ink-muted">
          Question {index + 1} of {questions.length}
        </span>
        <span className="tnum ml-auto text-sm font-semibold text-ink">
          {correct} right
        </span>
        <Button variant="quiet" size="sm" onClick={onQuit}>
          Stop
        </Button>
      </header>

      <ProgressBar
        value={(index + (answered ? 1 : 0)) / questions.length}
        label="Round progress"
      />

      {spec.seconds !== null ? (
        <div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-pill bg-surface-sunk"
            role="timer"
            aria-label={`${Math.ceil(remaining)} seconds left`}
          >
            <div
              className="h-full rounded-pill bg-clay-500 transition-[width] duration-100 ease-linear"
              style={{ width: `${Math.max(0, timerShare) * 100}%` }}
            />
          </div>
          <p className="mt-1.5 tnum text-xs text-ink-faint">
            {answered ? 'Answer locked.' : `${Math.ceil(remaining)}s`}
          </p>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={transition.base}
        >
          <Card className="bg-surface-sunk/40">
            {question.eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay-600">
                {question.eyebrow}
              </p>
            ) : null}
            <blockquote
              className={
                question.mode === 'emoji-decryption'
                  ? 'mt-3 text-center text-5xl leading-tight sm:text-6xl'
                  : 'mt-3 font-display text-2xl leading-snug text-ink text-pretty sm:text-3xl'
              }
            >
              {question.prompt}
            </blockquote>
          </Card>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {question.choices.map((choice) => {
              const isAnswer = choice.id === question.answerId
              const isChosen = choice.id === chosen

              const tone = !answered
                ? 'border-surface-line bg-surface hover:border-clay-200 hover:bg-clay-50'
                : isAnswer
                  ? 'border-sage bg-[#E4EFE9] text-[#2F5843]'
                  : isChosen
                    ? 'border-clay-300 bg-clay-50 text-clay-700'
                    : 'border-surface-line bg-surface opacity-55'

              return (
                <li key={choice.id}>
                  <button
                    type="button"
                    disabled={answered}
                    onClick={() => {
                      sound.tap()
                      answer(choice.id)
                    }}
                    aria-pressed={isChosen}
                    className={`touch-target w-full rounded-card border px-4 py-3.5 text-left text-base leading-relaxed transition-all duration-200 ease-bloom disabled:cursor-default ${tone}`}
                  >
                    {choice.label}
                    {answered && isAnswer ? (
                      <span className="ml-2 font-semibold" aria-label="correct answer">
                        ✓
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>

          {answered ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transition.fast}
              className="mt-4 flex flex-wrap items-center gap-4"
            >
              <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink-muted text-pretty">
                <span className="font-semibold text-ink">
                  {chosen === question.answerId
                    ? 'Right.'
                    : chosen === '__timeout__'
                      ? "Time's up."
                      : 'Not that one.'}
                </span>{' '}
                {question.reveal}
              </p>
              <Button
                onClick={() => {
                  sound.tap()
                  next()
                }}
              >
                {isLast ? 'See the score' : 'Next'}
              </Button>
            </motion.div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
