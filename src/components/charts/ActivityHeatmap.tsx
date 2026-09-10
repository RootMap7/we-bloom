import { useState } from 'react'
import { WEEKDAY_FULL, WEEKDAY_LABELS } from '@/lib/analytics/time'
import { cn } from '@/lib/cn'
import { hourLabel, num, pct } from '@/lib/format'
import { SegmentedControl } from '../ui/Controls'
import { heatColor, heatTextColor } from './theme'

type View = 'grid' | 'hours'

/**
 * Day × hour heatmap — PRODUCT.md §12.
 *
 * On narrow screens a 7×24 grid either scrolls or becomes unreadable. Both are
 * offered: the grid scrolls horizontally, and a compact hours-only view is one
 * tap away for people who just want the shape of the day.
 */
export function ActivityHeatmap({
  grid,
  max,
  total,
  byHour,
}: {
  grid: number[][]
  max: number
  total: number
  byHour: number[]
}) {
  const [view, setView] = useState<View>('grid')

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<View>
          label="Heatmap view"
          value={view}
          onChange={setView}
          options={[
            { value: 'grid', label: 'Day × hour' },
            { value: 'hours', label: 'Hours only' },
          ]}
        />
        <Scale />
      </div>

      {view === 'grid' ? (
        <HeatGrid grid={grid} max={max} total={total} />
      ) : (
        <HourStrip byHour={byHour} total={total} />
      )}
    </div>
  )
}

function Scale() {
  return (
    <div className="flex items-center gap-2 text-xs text-ink-faint">
      <span>Quiet</span>
      <div className="flex overflow-hidden rounded-pill" aria-hidden="true">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <span key={t} className="h-3 w-5" style={{ background: heatColor(t) }} />
        ))}
      </div>
      <span>Busy</span>
    </div>
  )
}

function HeatGrid({ grid, max, total }: { grid: number[][]; max: number; total: number }) {
  const [hovered, setHovered] = useState<{ w: number; h: number } | null>(null)

  return (
    <div>
      <div className="scroll-x -mx-1 px-1 pb-2">
        <div className="min-w-[560px]">
          <div className="mb-1 flex pl-9">
            {Array.from({ length: 24 }).map((_, h) => (
              <span
                key={h}
                className="flex-1 text-center text-[10px] tabular-nums text-ink-faint"
                aria-hidden="true"
              >
                {h % 3 === 0 ? h : ''}
              </span>
            ))}
          </div>

          {grid.map((row, w) => (
            <div key={w} className="mb-1 flex items-center gap-1">
              <span className="w-8 shrink-0 text-[11px] font-medium text-ink-faint">
                {WEEKDAY_LABELS[w]}
              </span>
              <div className="flex flex-1 gap-1">
                {row.map((count, h) => {
                  const intensity = max ? count / max : 0
                  const active = hovered?.w === w && hovered?.h === h
                  return (
                    <button
                      key={h}
                      type="button"
                      onMouseEnter={() => setHovered({ w, h })}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered({ w, h })}
                      onBlur={() => setHovered(null)}
                      className={cn(
                        'h-6 flex-1 rounded-[4px] transition-transform duration-200 ease-bloom',
                        active && 'scale-110 ring-2 ring-ink/20',
                      )}
                      style={{ background: heatColor(intensity) }}
                      aria-label={`${WEEKDAY_FULL[w]} at ${hourLabel(h)}: ${num(count)} messages`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p
        className="mt-3 min-h-[1.5rem] text-sm text-ink-muted"
        aria-live="polite"
      >
        {hovered ? (
          <>
            <span className="font-medium text-ink">
              {WEEKDAY_FULL[hovered.w]}, {hourLabel(hovered.h)}
            </span>{' '}
            — {num(grid[hovered.w][hovered.h])} messages
            {total ? ` (${pct(grid[hovered.w][hovered.h] / total, 1)} of everything)` : ''}
          </>
        ) : (
          <span className="text-ink-faint">Hover or focus a square to see the hour behind it.</span>
        )}
      </p>
    </div>
  )
}

function HourStrip({ byHour, total }: { byHour: number[]; total: number }) {
  const max = Math.max(...byHour, 1)

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: 148 }}>
        {byHour.map((count, h) => {
          const intensity = count / max
          return (
            <div key={h} className="group flex flex-1 flex-col items-center justify-end">
              <div
                className="w-full rounded-t-[5px] transition-all duration-400 ease-bloom"
                style={{
                  height: `${Math.max(3, intensity * 100)}%`,
                  background: heatColor(intensity),
                }}
                title={`${hourLabel(h)}: ${num(count)} messages`}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-1">
        {byHour.map((_, h) => (
          <span
            key={h}
            className="flex-1 text-center text-[10px] tabular-nums text-ink-faint"
            aria-hidden="true"
          >
            {h % 4 === 0 ? h : ''}
          </span>
        ))}
      </div>
      <p className="sr-only">
        {byHour
          .map(
            (count, h) =>
              `${hourLabel(h)}: ${count} messages${total ? `, ${pct(count / total, 1)}` : ''}`,
          )
          .join('. ')}
      </p>
      <p className="mt-2 text-xs text-ink-faint">Hours run from midnight on the left.</p>
    </div>
  )
}

export { heatColor, heatTextColor }
