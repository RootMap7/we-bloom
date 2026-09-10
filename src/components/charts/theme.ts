/**
 * Shared chart theme. Charts read from here so a change lands everywhere at
 * once — CLAUDE.md's design-token rule applied to data viz.
 *
 * Series colours are also distinguishable by position in every chart's legend
 * and by direct labels, because PRODUCT.md §41 forbids colour as the only
 * carrier of meaning.
 */
export const CHART = {
  grid: '#E8E1D8',
  axis: '#9A8A84',
  axisLabel: '#6B5C57',
  tooltipBg: '#2B2220',
  tooltipText: '#FAF8F5',
  primary: '#E07A5F',
  primarySoft: '#F4BFAE',
  secondary: '#F2CC8F',
  sage: '#81B29A',
  dusk: '#6C7A9C',
  ink: '#2B2220',
} as const

export const SERIES_COLORS = [CHART.primary, CHART.dusk, CHART.sage, '#DFA85B', CHART.ink, '#A24A2E']

export const axisProps = {
  stroke: CHART.axis,
  tickLine: false,
  axisLine: false,
  tick: { fill: CHART.axisLabel, fontSize: 12, fontFamily: 'Outfit, sans-serif' },
} as const

export const gridProps = {
  stroke: CHART.grid,
  strokeDasharray: '0',
  vertical: false,
} as const

/** Heatmap ramp: cream → clay. Low values stay legible against the card. */
export function heatColor(intensity: number): string {
  if (intensity <= 0) return '#F4F0EA'
  const t = Math.min(1, Math.max(0, intensity))
  // Interpolate in sRGB between honey-100 and clay-600. Good enough at this
  // size, and it keeps the ramp inside the brand palette.
  const from = [252, 240, 216]
  const to = [201, 96, 63]
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * Math.pow(t, 0.75)))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

/** Text colour that stays readable on top of `heatColor(intensity)`. */
export function heatTextColor(intensity: number): string {
  return intensity > 0.55 ? '#FFFFFF' : '#6B5C57'
}
