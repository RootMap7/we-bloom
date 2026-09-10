export function sum(xs: number[]): number {
  let t = 0
  for (const x of xs) t += x
  return t
}

export function mean(xs: number[]): number | null {
  return xs.length ? sum(xs) / xs.length : null
}

/** Expects an already-sorted ascending array. */
export function percentileSorted(sorted: number[], p: number): number | null {
  if (!sorted.length) return null
  if (sorted.length === 1) return sorted[0]
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null
  return percentileSorted([...xs].sort((a, b) => a - b), 0.5)
}

export function stdev(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = sum(xs) / xs.length
  return Math.sqrt(sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1))
}

export function argmax(xs: number[]): number | null {
  let best = -1
  let bestI: number | null = null
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] > best) {
      best = xs[i]
      bestI = i
    }
  }
  return best > 0 ? bestI : null
}

/** Counting map → sorted [key, count] pairs, descending. */
export function rank<T>(counts: Map<T, number>, limit?: number): Array<[T, number]> {
  const arr = [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
  return limit === undefined ? arr : arr.slice(0, limit)
}

export function bump<T>(map: Map<T, number>, key: T, by = 1): void {
  map.set(key, (map.get(key) ?? 0) + by)
}

export function share(part: number, whole: number): number {
  return whole > 0 ? part / whole : 0
}

/**
 * How much bigger is the second half than the first? Returns a signed fraction,
 * or null when either half has nothing to compare.
 */
export function changeRatio(first: number | null, second: number | null): number | null {
  if (first === null || second === null) return null
  if (first === 0) return second === 0 ? 0 : null
  return (second - first) / first
}
