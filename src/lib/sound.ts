/**
 * Sound effects, synthesised rather than shipped.
 *
 * A handful of short tones through the Web Audio API costs nothing to download
 * and needs no asset pipeline. Sounds are confined to the games and badge
 * unlocks — the rest of the app stays silent, because a click noise on every
 * button in an app about someone's private conversation would be wrong.
 *
 * The AudioContext is created on the first play, which is always inside a tap
 * handler, so browser autoplay policies are satisfied by construction.
 */

const KEY = 'we-bloom:sound'

let ctx: AudioContext | null = null

export function isSoundOn(): boolean {
  try {
    // Default on: the games are the only thing that make noise, and a player
    // who dislikes it has the toggle right there.
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSoundOn(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    // Storage disabled. The setting simply won't survive a reload.
  }
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    ctx = new Ctor()
  } catch {
    return null
  }
  return ctx
}

interface ToneSpec {
  /** Hertz, in order. More than one plays as a short arpeggio. */
  notes: number[]
  /** Seconds per note. */
  length?: number
  type?: OscillatorType
  gain?: number
}

function play({ notes, length = 0.09, type = 'sine', gain = 0.06 }: ToneSpec): void {
  if (!isSoundOn()) return
  const context = audio()
  if (!context) return

  if (context.state === 'suspended') void context.resume()

  notes.forEach((frequency, i) => {
    const start = context.currentTime + i * length
    const osc = context.createOscillator()
    const envelope = context.createGain()

    osc.type = type
    osc.frequency.value = frequency

    // A quick attack and a smooth decay: without the ramp every tone clicks.
    envelope.gain.setValueAtTime(0, start)
    envelope.gain.linearRampToValueAtTime(gain, start + 0.008)
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + length)

    osc.connect(envelope)
    envelope.connect(context.destination)
    osc.start(start)
    osc.stop(start + length + 0.02)
  })
}

export const sound = {
  tap: () => play({ notes: [520], length: 0.05, gain: 0.035 }),
  correct: () => play({ notes: [660, 880], length: 0.085 }),
  wrong: () => play({ notes: [300, 220], length: 0.11, type: 'triangle', gain: 0.05 }),
  /** Round finished, but under the pass mark. */
  finish: () => play({ notes: [520, 620], length: 0.1, type: 'triangle' }),
  unlock: () => play({ notes: [523, 659, 784, 1047], length: 0.11, gain: 0.07 }),
  badge: () => play({ notes: [784, 1047], length: 0.1 }),
}
