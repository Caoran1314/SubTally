import * as React from 'react'
import { motion } from 'motion/react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { fmtMoney } from '@/lib/money'

export interface TrendPoint {
  label: string
  value: number
}

/**
 * 月均趋势：纯 SVG 折线 + 面积，不引图表库（首屏不为它付费）。
 * 点少于 2 个时给出可操作的提示，而不是画一条假线。
 */
export function TrendLine({
  points,
  onRecord,
}: {
  points: TrendPoint[]
  onRecord?: () => void
}) {
  const has = points.length >= 2

  if (!has) {
    return (
      <div className="flex flex-col items-start gap-2 py-1">
        <p className="hint max-w-[420px]">
          已经记录 {points.length ? '1 个点' : '0 个点'}。每月首次打开会自动记一个点，攒到两个月就能看到走向；
          也可以现在就记一笔。
        </p>
        {onRecord && (
          <button
            onClick={onRecord}
            className="rounded-lg border border-line-strong px-2.5 py-1 text-[11.5px] text-paper-soft transition-colors hover:border-accent/40 hover:text-paper"
          >
            记录本月快照
          </button>
        )}
      </div>
    )
  }

  const W = 320
  const H = 72
  const pad = 4
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || Math.max(1, max * 0.1)

  const x = (i: number) => pad + (i * (W - pad * 2)) / (points.length - 1)
  const y = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2)

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`

  const first = points[0].value
  const last = points[points.length - 1].value
  const delta = last - first
  const pct = first > 0 ? (delta / first) * 100 : 0
  const up = delta > 0.5
  const down = delta < -0.5
  const DeltaIcon = up ? TrendingUp : down ? TrendingDown : Minus
  const deltaTone = up ? 'text-danger' : down ? 'text-ok' : 'text-paper-faint'

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="relative shrink-0">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[76px] w-[300px]" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.28" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#trendFill)" />
          <motion.path
            d={line}
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 0.8, 0.3, 1] }}
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(p.value)}
              r={i === points.length - 1 ? 3 : 1.8}
              fill={i === points.length - 1 ? 'hsl(var(--accent))' : 'hsl(var(--paper) / .5)'}
            />
          ))}
        </svg>
        <div className="mt-1 flex justify-between px-1 text-[9.5px] text-paper-faint">
          <span>{points[0].label}</span>
          <span>{points[points.length - 1].label}</span>
        </div>
      </div>

      <div className="min-w-0">
        <div className="label-xs mb-1">较 {points[0].label}</div>
        <div className="flex items-baseline gap-2">
          <span className="serif text-[20px] leading-none text-paper">{fmtMoney(last)}</span>
          <span className={`flex items-center gap-1 text-[11.5px] ${deltaTone}`}>
            <DeltaIcon className="h-3 w-3" />
            {up ? '+' : down ? '' : '±'}
            {fmtMoney(Math.abs(delta))}
            {first > 0 && <span className="text-paper-faint">({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span>}
          </span>
        </div>
        <div className="mt-1 text-[10.5px] text-paper-faint">共 {points.length} 个记录点</div>
      </div>
    </div>
  )
}
