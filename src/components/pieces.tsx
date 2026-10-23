import * as React from 'react'
import { motion } from 'motion/react'
import { Check, HandHelping, Moon, X, ExternalLink, ArrowRight } from 'lucide-react'
import { CATEGORY_TINT } from '@/lib/catalog'
import { fmtMoney, fmtNumber, CYCLE_META } from '@/lib/money'
import { daysUntil, fmtDateCN, relativeDays, weekdayCN, fmtDateShort } from '@/lib/date'
import { cn, pct } from '@/lib/utils'
import type { Subscription } from '@/lib/types'
import { GlassCard, Numeral, ServiceGlyph } from './ambient'
import { Badge, Button, Tooltip } from './ui'

/** 给任意 CSS 颜色加透明度（作用于 hsl()/var() 都安全） */
function withA(color: string, pct: number) {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`
}

/* ————————————————————————— 构成条 ————————————————————————— */

export function CompositionBar({
  data,
  className,
}: {
  data: { category: string; amount: number }[]
  className?: string
}) {
  const total = data.reduce((a, x) => a + x.amount, 0)
  if (!total) {
    return <div className={cn('h-[9px] w-full rounded-full bg-line/60', className)} />
  }
  return (
    <div className={cn('relative', className)}>
      {/* 底下那层柔光，让构成条在暗底上浮起来 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-2 -inset-y-2 rounded-full opacity-40 blur-[10px]"
        style={{
          background: `linear-gradient(90deg, ${data
            .map((d) => CATEGORY_TINT[d.category] ?? 'hsl(var(--accent))')
            .join(', ')})`,
        }}
      />
      <div className="relative flex h-[9px] w-full gap-[3px] overflow-hidden rounded-full">
        {data.map((d) => {
          const c = CATEGORY_TINT[d.category] ?? 'hsl(var(--accent))'
          return (
            <motion.span
              key={d.category}
              initial={{ opacity: 0, scaleX: 0.6 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 0.8, 0.3, 1] }}
              className="h-full origin-left rounded-full"
              style={{
                width: `${(d.amount / total) * 100}%`,
                background: `linear-gradient(90deg, ${c}, ${withA(c, 78)})`,
                boxShadow: `0 0 12px ${withA(c, 50)}`,
              }}
              title={`${d.category} ${pct(d.amount, total)}%`}
            />
          )
        })}
      </div>
    </div>
  )
}

/* ————————————————————————— 分类构成 ————————————————————————— */

export function CategoryList({
  byCategory,
  total,
  limit = 6,
}: {
  byCategory: Record<string, number>
  total: number
  limit?: number
}) {
  const rows = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  if (!rows.length) {
    return <p className="hint py-6 text-center">还没有可折算的花费。加一条带金额的订阅就会出现在这里。</p>
  }

  return (
    <ul className="space-y-3">
      {rows.map(([cat, amount], i) => {
        const share = pct(amount, total)
        return (
          <li key={cat} className="group">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-2 text-[13px] text-paper-soft">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: CATEGORY_TINT[cat] ?? 'hsl(var(--accent))' }}
                />
                {cat}
              </span>
              <span className="flex items-baseline gap-2">
                <span className="serif text-[13.5px] text-paper">{fmtMoney(amount)}</span>
                <span className="w-10 text-right text-[11px] tabular-nums text-paper-faint">{share}%</span>
              </span>
            </div>
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-line/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${share}%` }}
                transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 0.8, 0.3, 1] }}
                className="h-full rounded-full"
                style={{
                  background: CATEGORY_TINT[cat] ?? 'hsl(var(--accent))',
                  boxShadow: `0 0 10px ${withA(CATEGORY_TINT[cat] ?? 'hsl(var(--accent))', 40)}`,
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ————————————————————————— 接下来 30 天 ————————————————————————— */

export function TimelineStrip({
  items,
  base,
}: {
  items: { sub: Subscription; days: number }[]
  base: string
}) {
  if (!items.length) {
    return <p className="hint py-6 text-center">接下来 30 天没有要付的。可以歇一口气。</p>
  }
  return (
    <ol className="relative space-y-0">
      <span className="absolute left-[46px] top-2 bottom-2 w-px bg-line/70" aria-hidden />
      {items.slice(0, 6).map(({ sub, days }) => {
        const urgent = days <= 3
        return (
          <li key={sub.id} className="relative flex items-start gap-3 py-2.5">
            <div className="w-[38px] shrink-0 pt-0.5 text-right">
              <div
                className={cn(
                  'numeral text-[17px] leading-none',
                  urgent ? 'text-accent' : 'text-paper-soft'
                )}
              >
                {days < 0 ? '—' : days === 0 ? '今天' : days}
              </div>
              {days > 0 && <div className="text-[9.5px] text-paper-faint">天后</div>}
            </div>
            <span
              className={cn(
                'relative mt-1.5 h-2 w-2 shrink-0 rounded-full ring-4',
                urgent
                  ? 'bg-accent ring-accent/16'
                  : 'bg-paper-faint/70 ring-ink-950'
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13px] text-paper">{sub.name}</span>
                <span className="serif shrink-0 text-[13px] text-paper-soft">
                  {fmtMoney(sub.amount, { cur: sub.currency })}
                  <span className="ml-1 text-[10.5px] text-paper-faint">
                    /{CYCLE_META[sub.cycle].short}
                  </span>
                </span>
              </div>
              <div className="text-[11px] text-paper-faint">
                {fmtDateCN(sub.nextDate)} · 周{weekdayCN(sub.nextDate)}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ————————————————————————— 续费决策 ————————————————————————— */

export function DecisionCard({
  sub,
  onDecide,
  onRenew,
}: {
  sub: Subscription
  onDecide: (d: 'keep' | 'release' | 'pending') => void
  onRenew: () => void
}) {
  const days = daysUntil(sub.nextDate)
  return (
    <GlassCard glow className="p-4">
      <div className="mb-3 flex items-center gap-3">
        <ServiceGlyph name={sub.name} tint={sub.tint} image={sub.iconKind === 'image' ? sub.iconValue : undefined} size={34} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-medium text-paper">{sub.name}</div>
          <div className="text-[11px] text-paper-faint">
            {relativeDays(days)} · {fmtMoney(sub.amount, { cur: sub.currency })}/{CYCLE_META[sub.cycle].short}
          </div>
        </div>
        <Badge tone={days <= 2 ? 'danger' : 'accent'}>{days <= 0 ? '已到期' : `${days} 天`}</Badge>
      </div>
      <p className="mb-3.5 text-[12px] leading-relaxed text-paper-mute">
        续订前再想一次：这项这个月真的用到了吗？
      </p>
      <div className="flex gap-2">
        <Button variant="soft" size="sm" className="flex-1" onClick={() => onDecide('keep')}>
          <Check className="h-3.5 w-3.5" /> 留下
        </Button>
        <Button variant="danger" size="sm" className="flex-1" onClick={() => onDecide('release')}>
          <X className="h-3.5 w-3.5" /> 放手
        </Button>
        <Button variant="ghost" size="sm" className="flex-1" onClick={() => onDecide('pending')}>
          <Moon className="h-3.5 w-3.5" /> 明天再问
        </Button>
      </div>
    </GlassCard>
  )
}

/* ————————————————————————— 订阅行 ————————————————————————— */

export function SubRow({
  sub,
  onEdit,
  onToggle,
}: {
  sub: Subscription
  onEdit?: () => void
  onToggle?: () => void
}) {
  const days = sub.active ? daysUntil(sub.nextDate) : null
  return (
    <motion.div
      layout
      className={cn(
        'group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition-colors',
        'hover:border-line hover:bg-paper/[.028]',
        !sub.active && 'opacity-52'
      )}
    >
      <ServiceGlyph
        name={sub.name}
        tint={sub.tint}
        image={sub.iconKind === 'image' ? sub.iconValue : undefined}
        size={36}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13.5px] text-paper">{sub.name}</span>
          {sub.decision === 'release' && <Badge>放手中</Badge>}
          {!sub.active && <Badge>已停</Badge>}
        </div>
        <div className="truncate text-[11px] text-paper-faint">
          {sub.category} · {sub.active ? `${fmtDateShort(sub.nextDate)} 续费` : '已放手'}
          {sub.note ? ` · ${sub.note}` : ''}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="serif text-[13.5px] text-paper-soft">
          {fmtMoney(sub.amount, { cur: sub.currency })}
        </div>
        <div className="text-[10.5px] text-paper-faint">
          /{CYCLE_META[sub.cycle].short}
          {days !== null && days <= 3 && days >= 0 && (
            <span className="ml-1 text-accent">{relativeDays(days)}</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Tooltip content={sub.active ? '标记为放手' : '恢复在用'}>
          <Button variant="ghost" size="iconSm" onClick={onToggle} aria-label="切换状态">
            {sub.active ? <HandHelping className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        </Tooltip>
        <Tooltip content="编辑">
          <Button variant="ghost" size="iconSm" onClick={onEdit} aria-label="编辑">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Tooltip>
      </div>
    </motion.div>
  )
}

/* ————————————————————————— 指标 ————————————————————————— */

export function Metric({
  label,
  value,
  unit,
  hint,
  size = 'md',
}: {
  label: string
  value: React.ReactNode
  unit?: string
  hint?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div>
      <div className="label-xs mb-1.5">{label}</div>
      <Numeral value={value} unit={unit} size={size} />
      {hint && <div className="mt-1 text-[10.5px] text-paper-faint">{hint}</div>}
    </div>
  )
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="mb-1 grid h-11 w-11 place-items-center rounded-full border border-line bg-ink-800/50">
        <Moon className="h-5 w-5 text-paper-faint" />
      </div>
      <div className="serif text-[14px] text-paper-soft">{title}</div>
      {hint && <p className="hint max-w-[300px]">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

