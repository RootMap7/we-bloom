import { useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/cn'
import { CHART, SERIES_COLORS, axisProps, gridProps } from './theme'

interface TooltipEntry {
  name?: string | number
  value?: number | string
  color?: string
  dataKey?: string | number
}

function BloomTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
  formatter?: (value: number, name: string) => string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl bg-ink px-3 py-2 text-xs leading-relaxed text-cream shadow-lift">
      {label !== undefined ? <p className="mb-1 font-semibold">{label}</p> : null}
      {payload.map((entry, i) => {
        const value = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0)
        const name = String(entry.name ?? entry.dataKey ?? '')
        return (
          <p key={i} className="flex items-center gap-2 tnum">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 shrink-0 rounded-pill"
              style={{ background: entry.color }}
            />
            {formatter ? formatter(value, name) : `${name}: ${value.toLocaleString('en-GB')}`}
          </p>
        )
      })}
    </div>
  )
}

function Frame({ height, children }: { height: number; children: ReactNode }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  )
}

export function TrendArea({
  data,
  xKey,
  series,
  height = 260,
  valueFormatter,
  yTickFormatter,
}: {
  data: Record<string, unknown>[]
  xKey: string
  series: { key: string; label: string; color?: string }[]
  height?: number
  valueFormatter?: (value: number, name: string) => string
  yTickFormatter?: (value: number) => string
}) {
  const reduced = useReducedMotion()

  return (
    <Frame height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -14 }}>
        <defs>
          {series.map((s, i) => {
            const color = s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]
            return (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            )
          })}
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey={xKey} {...axisProps} minTickGap={28} />
        <YAxis {...axisProps} width={52} tickFormatter={yTickFormatter} />
        <Tooltip
          cursor={{ stroke: CHART.grid }}
          content={<BloomTooltip formatter={valueFormatter} />}
        />
        {series.length > 1 ? (
          <Legend
            verticalAlign="top"
            align="left"
            height={28}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: CHART.axisLabel, paddingBottom: 8 }}
          />
        ) : null}
        {series.map((s, i) => {
          const color = s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              isAnimationActive={!reduced}
              animationDuration={600}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          )
        })}
      </AreaChart>
    </Frame>
  )
}

export function TrendLine({
  data,
  xKey,
  series,
  height = 240,
  valueFormatter,
  yTickFormatter,
}: {
  data: Record<string, unknown>[]
  xKey: string
  series: { key: string; label: string; color?: string }[]
  height?: number
  valueFormatter?: (value: number, name: string) => string
  yTickFormatter?: (value: number) => string
}) {
  const reduced = useReducedMotion()

  return (
    <Frame height={height}>
      <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -14 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey={xKey} {...axisProps} minTickGap={28} />
        <YAxis {...axisProps} width={56} tickFormatter={yTickFormatter} />
        <Tooltip cursor={{ stroke: CHART.grid }} content={<BloomTooltip formatter={valueFormatter} />} />
        {series.length > 1 ? (
          <Legend
            verticalAlign="top"
            align="left"
            height={28}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: CHART.axisLabel, paddingBottom: 8 }}
          />
        ) : null}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={2.5}
            dot={false}
            connectNulls
            isAnimationActive={!reduced}
            animationDuration={600}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </Frame>
  )
}

export function Bars({
  data,
  xKey,
  series,
  height = 240,
  layout = 'vertical',
  valueFormatter,
  highlightIndex,
  stacked,
}: {
  data: Record<string, unknown>[]
  xKey: string
  series: { key: string; label: string; color?: string }[]
  height?: number
  /** 'vertical' = upright bars; 'horizontal' = bars running left to right. */
  layout?: 'vertical' | 'horizontal'
  valueFormatter?: (value: number, name: string) => string
  highlightIndex?: number
  stacked?: boolean
}) {
  const reduced = useReducedMotion()
  const horizontal = layout === 'horizontal'

  return (
    <Frame height={height}>
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 6, right: 12, bottom: 0, left: horizontal ? 8 : -14 }}
        barCategoryGap={horizontal ? '22%' : '18%'}
      >
        <CartesianGrid {...gridProps} vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps} />
            <YAxis type="category" dataKey={xKey} {...axisProps} width={104} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...axisProps} interval="preserveStartEnd" />
            <YAxis {...axisProps} width={52} />
          </>
        )}
        <Tooltip
          cursor={{ fill: 'rgba(232, 225, 216, 0.4)' }}
          content={<BloomTooltip formatter={valueFormatter} />}
        />
        {series.length > 1 ? (
          <Legend
            verticalAlign="top"
            align="left"
            height={28}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: CHART.axisLabel, paddingBottom: 8 }}
          />
        ) : null}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId={stacked ? 'stack' : undefined}
            fill={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
            radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            isAnimationActive={!reduced}
            animationDuration={600}
          >
            {highlightIndex !== undefined && series.length === 1
              ? data.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={idx === highlightIndex ? CHART.primary : CHART.primarySoft}
                  />
                ))
              : null}
          </Bar>
        ))}
      </BarChart>
    </Frame>
  )
}

/** Tiny inline trend, no axes. Used inside word and emoji cards. */
export function Sparkline({
  values,
  color = CHART.primary,
  height = 34,
  className,
}: {
  values: number[]
  color?: string
  height?: number
  className?: string
}) {
  if (values.length < 2) return null

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const width = 100

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('w-full', className)}
      style={{ height }}
      aria-hidden="true"
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * Horizontal share bar with the value printed on it. Used wherever a "who does
 * more" comparison would otherwise be a pie chart — PRODUCT.md §33 rules those
 * out.
 */
export function ShareBar({
  segments,
  height = 44,
  showLabels = true,
}: {
  segments: { label: string; value: number; color: string }[]
  height?: number
  showLabels?: boolean
}) {
  const total = segments.reduce((t, s) => t + s.value, 0) || 1

  return (
    <div>
      <div
        className="flex w-full overflow-hidden rounded-pill bg-surface-sunk"
        style={{ height }}
        role="img"
        aria-label={segments
          .map((s) => `${s.label}: ${Math.round((s.value / total) * 100)}%`)
          .join(', ')}
      >
        {segments.map((s) => {
          const pct = (s.value / total) * 100
          if (pct <= 0) return null
          return (
            <div
              key={s.label}
              className="flex items-center justify-center transition-all duration-600 ease-bloom"
              style={{ width: `${pct}%`, background: s.color }}
            >
              {showLabels && pct > 12 ? (
                <span className="tnum px-2 text-sm font-semibold text-white">
                  {Math.round(pct)}%
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
      {showLabels ? (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {segments.map((s) => (
            <span key={s.label} className="flex items-center gap-2 text-sm text-ink-muted">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-pill"
                style={{ background: s.color }}
              />
              <span className="font-medium text-ink">{s.label}</span>
              <span className="tnum">{Math.round((s.value / total) * 100)}%</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
