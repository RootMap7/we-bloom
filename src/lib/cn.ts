type ClassValue = string | number | null | undefined | false | ClassValue[]

/** Minimal class joiner. No conflict resolution — we don't need it here. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = []
  const walk = (v: ClassValue) => {
    if (!v && v !== 0) return
    if (Array.isArray(v)) {
      v.forEach(walk)
      return
    }
    out.push(String(v))
  }
  values.forEach(walk)
  return out.join(' ')
}
