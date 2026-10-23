import * as React from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Plus, ArrowUpRight, CalendarClock } from 'lucide-react'
import { useSubsStore, useTotals, useUpcoming } from '@/store/useSubsStore'
import { fmtMoney, fmtNumber } from '@/lib/money'
import { monthLabel, daysUntil, relativeDays } from '@/lib/date'
import { CATEGORY_TINT } from '@/lib/catalog'
import { buildInsights, yearlyDistribution } from '@/lib/insights'
import { GlassCard, Numeral, SectionTitle, DialRing, ServiceGlyph } from '@/components/ambient'
import { Badge, Button, Tooltip } from '@/components/ui'
import { CategoryList, CompositionBar, DecisionCard, EmptyState, TimelineStrip } from '@/components/pieces'
import { TrendLine } from '@/components/TrendLine'
import { RenewalCalendar } from '@/components/RenewalCalendar'
import { CYCLE_META } from '@/lib/money'

export function OverviewPage({ onAdd, onGoSubs }: { onAdd: () => void; onGoSubs: () => void }) {
  const totals = useTotals()
  const upcoming = useUpcoming(30)
  const subs = useSubsStore((s) => s.subs)
  const decide = useSubsStore((s) => s.decide)
  const renew = useSubsStore((s) => s.renew)
  const fx = useSubsStore((s) => s.fx)

  const dueSoon = upcoming.filter((u) => u.days <= 30)
  const toPay30 = dueSoon.reduce((a, u) => a + u.sub.amount, 0)

  const needDecision = React.useMemo(
    () =>
      subs
        .filter(
          (s) => s.active && s.decision === 'pending' && daysUntil(s.nextDate) <= 7 && s.cycle !== 'lifetime'
        )
        .sort((a, b) => daysUntil(a.nextDate) - daysUntil(b.nextDate)),
    [subs]
  )

  const bandData = React.useMemo(
    () =>
      Object.entries(totals.byCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
    [totals.byCategory]
  )

  const yearAhead = React.useMemo(() => yearlyDistribution(subs, totals.toCny, 12), [subs, totals.toCny])

  const budget = useSubsStore((s) => s.settings.budget)
  const insights = React.useMemo(
    () => buildInsights(subs, totals, dueSoon, budget),
    [subs, totals, dueSoon, budget]
  )

  const nextDue = dueSoon[0]
  const avgPerItem = totals.activeCount ? totals.monthly / totals.activeCount : 0

  /* ── 预算进度 ── */
  const budgetUsedPct = budget > 0 ? Math.min(100, (totals.monthly / budget) * 100) : 0
  const overBudget = budget > 0 && totals.monthly > budget

  /* ── 月均趋势（来自快照）── */
  const snapshots = useSubsStore((s) => s.snapshots)
  const saveSnapshot = useSubsStore((s) => s.saveSnapshot)
  const trendPoints = React.useMemo(
    () =>
      [...snapshots]
        .sort((a, b) => a.at.localeCompare(b.at))
        .slice(-8)
        .map((s) => {
          const d = new Date(s.at)
          return { label: `${d.getMonth() + 1}月`, value: Math.round(s.monthly * 100) / 100 }
        }),
    [snapshots]
  )

  /* ── 一次性 / 买断 ── */
  const oneOffs = React.useMemo(
    () =>
      subs
        .filter((s) => s.cycle === 'once' || s.cycle === 'lifetime')
        .sort((a, b) => b.nextDate.localeCompare(a.nextDate)),
    [subs]
  )
  const oneOffTotal = oneOffs.reduce((a, s) => a + totals.toCny(s.amount, s.currency), 0)

  /* ── 到期区视图切换 ── */
  const [dueView, setDueView] = React.useState<'calendar' | 'timeline'>('calendar')

  if (!subs.length) {
    return (
      <GlassCard glow className="mt-6 p-8">
        <EmptyState
          title="先添一条订阅吧"
          hint="记下会员、创作者充电和 AI 套餐，之后每个月花了多少就自己浮出来了。"
          action={
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4" /> 添加订阅
            </Button>
          }
        />
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* ═══ 这个月花了多少 ═══ */}
      <section className="pt-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="label-xs">{monthLabel()} · 每月花费</span>
          {fx ? <Badge tone="neutral">汇率 {fx.date}</Badge> : <Badge tone="accent">汇率未更新</Badge>}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <Numeral value={fmtNumber(totals.monthly)} unit="CNY / 月" size="hero" className="text-paper" />

          <div className="mb-2 flex items-center gap-6">
            <div>
              <div className="label-xs mb-1">平均每项</div>
              <div className="serif text-[17px] text-paper-soft">
                {fmtMoney(avgPerItem)}
                <span className="ml-1 text-[11px] text-paper-faint">/ 月</span>
              </div>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <div className="label-xs mb-1">在付</div>
              <div className="serif text-[17px] text-paper-soft">
                {totals.activeCount}
                <span className="ml-1 text-[11px] text-paper-faint">项</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 max-w-[760px]">
          <CompositionBar data={bandData} />
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {bandData.slice(0, 5).map((d) => (
              <span key={d.category} className="flex items-center gap-1.5 text-[11px] text-paper-mute">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: CATEGORY_TINT[d.category] ?? 'hsl(var(--accent))' }}
                />
                {d.category}
                <span className="tabular-nums text-paper-faint">
                  {totals.monthly ? Math.round((d.amount / totals.monthly) * 100) : 0}%
                </span>
              </span>
            ))}
            {bandData.length > 5 && (
              <span className="text-[11px] text-paper-faint">+{bandData.length - 5} 类</span>
            )}
          </div>
        </div>

        {/* 预算 */}
        {budget > 0 && (
          <div className="mt-4 max-w-[760px]">
            <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
              <span className="text-paper-faint">
                月预算 <span className="text-paper-soft">{fmtMoney(budget)}</span>
              </span>
              <span className={overBudget ? 'text-danger' : 'text-paper-mute'}>
                {overBudget
                  ? `超出 ${fmtMoney(totals.monthly - budget)}`
                  : `还剩 ${fmtMoney(Math.max(0, budget - totals.monthly))}`}
                <span className="ml-1.5 tabular-nums text-paper-faint">
                  {Math.round(budgetUsedPct)}%
                </span>
              </span>
            </div>
            <div className="h-[5px] w-full overflow-hidden rounded-full bg-line/60">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${budgetUsedPct}%`,
                  background: overBudget ? 'hsl(var(--danger))' : 'hsl(var(--accent))',
                  boxShadow: overBudget
                    ? '0 0 10px hsl(var(--danger) / .5)'
                    : '0 0 10px hsl(var(--accent-glow) / .45)',
                }}
              />
            </div>
          </div>
        )}
      </section>

      {/* ═══ 四格指标 ═══ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="一年下来" value={`¥${fmtNumber(totals.yearly, 0)}`} hint={`≈ 每月 ${fmtMoney(totals.monthly)}`} />
        <StatTile
          label="30 天内要付"
          value={`¥${fmtNumber(toPay30, 0)}`}
          hint={dueSoon.length ? `${dueSoon.length} 笔` : '无到期'}
        />
        <StatTile
          label="下一次扣款"
          value={nextDue ? relativeDays(nextDue.days) : '—'}
          hint={
            nextDue
              ? `${nextDue.sub.name} · ${fmtMoney(nextDue.sub.amount, { cur: nextDue.sub.currency })}`
              : '接下来 30 天没有'
          }
        />
        <StatTile
          label="一次性 / 买断"
          value={totals.oneOff > 0 ? `¥${fmtNumber(totals.oneOff, 0)}` : '—'}
          hint={totals.oneOff > 0 ? '不计入月均' : '暂无'}
        />
      </div>

      {/* ═══ 未来 12 个月 ═══ */}
      <GlassCard className="p-5">
        <SectionTitle aside={<span className="flex items-center gap-1.5"><CalendarClock className="h-3 w-3" />实际扣款</span>}>
          接下来 12 个月
        </SectionTitle>
        <YearAhead buckets={yearAhead} />
      </GlassCard>

      {/* ═══ 月均趋势（环比） ═══ */}
      <GlassCard className="p-5">
        <SectionTitle aside="每月自动记一个点">月均趋势</SectionTitle>
        <TrendLine
          points={trendPoints}
          onRecord={() => {
            saveSnapshot()
            toast.success('已记录本月快照')
          }}
        />
      </GlassCard>

      {/* ═══ 洞察 ═══ */}
      {insights.length > 0 && (
        <ul className="-mt-1 space-y-1.5">
          {insights.map((ins, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35 }}
              className="flex items-start gap-2 text-[12.5px] leading-relaxed text-paper-mute"
            >
              <span
                className={
                  'mt-[7px] h-1 w-1 shrink-0 rounded-full ' +
                  (ins.tone === 'warn'
                    ? 'bg-accent'
                    : ins.tone === 'accent'
                      ? 'bg-accent/70'
                      : 'bg-paper-faint/60')
                }
              />
              <span>{ins.text}</span>
            </motion.li>
          ))}
        </ul>
      )}

      {/* ═══ 需要你决定 ═══ */}
      {needDecision.length > 0 && (
        <section>
          <SectionTitle aside={`${needDecision.length} 项待决定`}>续订前再想一次</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {needDecision.slice(0, 4).map((sub) => (
              <DecisionCard
                key={sub.id}
                sub={sub}
                onDecide={(d) => {
                  decide(sub.id, d)
                  toast.success(
                    d === 'keep' ? `留着 ${sub.name}` : d === 'release' ? `放掉 ${sub.name}` : '明天再问一次'
                  )
                }}
                onRenew={() => renew(sub.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ═══ 结构 + 时间轴 ═══ */}
      <div className="grid gap-4 lg:grid-cols-[1.02fr_.98fr]">
        <GlassCard className="p-5">
          <SectionTitle aside={`${Object.keys(totals.byCategory).length} 个分类`}>钱花在哪</SectionTitle>
          <CategoryList byCategory={totals.byCategory} total={totals.monthly} />
        </GlassCard>

        <GlassCard className="flex flex-col p-5">
          <SectionTitle
            aside={
              <div className="flex items-center gap-0.5 rounded-lg border border-line bg-ink-900/40 p-0.5">
                {(
                  [
                    ['calendar', '日历'],
                    ['timeline', '时间轴'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setDueView(v)}
                    className={
                      'rounded-md px-2 py-0.5 text-[10.5px] transition-colors ' +
                      (dueView === v ? 'bg-accent/14 text-paper' : 'text-paper-faint hover:text-paper-mute')
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
          >
            到期
          </SectionTitle>
          <div className="flex-1">
            {dueView === 'calendar' ? (
              <RenewalCalendar subs={subs} />
            ) : (
              <TimelineStrip items={dueSoon} base="CNY" />
            )}
          </div>
        </GlassCard>
      </div>

      {/* ═══ 一次性与买断 ═══ */}
      <GlassCard className="p-5">
        <SectionTitle aside={oneOffs.length ? `共 ${oneOffs.length} 笔 · ${fmtMoney(oneOffTotal)}` : undefined}>
          一次性与买断
        </SectionTitle>
        {oneOffs.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 py-1">
            <p className="hint max-w-[460px]">
              一次性付费和买断的软件记在这里 —— 不摊进月均，但年终回看时能看清花过什么。
            </p>
            <Button variant="ghost" size="sm" onClick={onAdd}>
              <Plus className="h-3.5 w-3.5" /> 记一笔
            </Button>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {oneOffs.map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <ServiceGlyph
                  name={s.name}
                  tint={s.tint}
                  image={s.iconKind === 'image' ? s.iconValue : undefined}
                  size={30}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] text-paper-soft">{s.name}</div>
                  <div className="text-[10.5px] text-paper-faint">
                    {CYCLE_META[s.cycle].label} · {s.nextDate} · {s.category}
                  </div>
                </div>
                <span className="serif shrink-0 text-[12.5px] text-paper">
                  {fmtMoney(s.amount, { cur: s.currency })}
                </span>
                {!s.active && <Badge>已停</Badge>}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {/* ═══ 底部 ═══ */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <Button variant="glass" size="sm" onClick={onGoSubs}>
          看全部订阅 <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" /> 再加一条
        </Button>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-paper-faint">
          <DialRing className="h-3 w-3 text-accent/70" dot={false} />
          数据只在这台设备的浏览器里
        </span>
      </div>
    </div>
  )
}

/* ————————————————————————— 指标格 ————————————————————————— */

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <GlassCard hairline={false} className="p-3.5">
      <div className="label-xs mb-1.5 !text-[10px]">{label}</div>
      <div className="serif text-[22px] leading-none tracking-[-0.01em] text-paper">{value}</div>
      {hint && <div className="mt-1.5 truncate text-[10.5px] text-paper-faint">{hint}</div>}
    </GlassCard>
  )
}

/* ————————————————————————— 未来 12 个月 ————————————————————————— */

function YearAhead({ buckets }: { buckets: ReturnType<typeof yearlyDistribution> }) {
  const max = Math.max(...buckets.map((b) => b.amount), 1)
  const total = buckets.reduce((a, b) => a + b.amount, 0)
  const peak = buckets.reduce((a, b) => (b.amount > a.amount ? b : a), buckets[0])
  const busiest = buckets.reduce((a, b) => (b.count > a.count ? b : a), buckets[0])

  return (
    <div>
      <div className="flex items-end gap-1.5 sm:gap-2">
        {buckets.map((b, i) => {
          const h = b.amount > 0 ? Math.max(3, (b.amount / max) * 100) : 0
          const isPeak = peak.amount > 0 && b.amount === peak.amount
          return (
            <Tooltip
              key={b.key}
              content={
                <span className="tabular-nums">
                  {b.year} 年 {b.label} · {fmtMoney(b.amount)}
                  <br />
                  {b.count} 笔到期
                </span>
              }
            >
              <div className="group flex min-w-0 flex-1 cursor-default flex-col items-center gap-1.5">
                <div className="relative flex h-[74px] w-full items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.035, ease: [0.22, 0.8, 0.3, 1] }}
                    className="w-full"
                    style={{
                      background: b.isCurrent
                        ? 'hsl(var(--accent))'
                        : isPeak
                          ? 'hsl(var(--accent) / .68)'
                          : 'hsl(var(--paper) / .28)',
                      boxShadow: b.isCurrent
                        ? '0 0 12px hsl(var(--accent-glow) / .45)'
                        : 'inset 0 1px 0 rgba(255,255,255,.14)',
                      borderRadius: '3px 3px 0 0',
                    }}
                  />
                </div>
                <span
                  className={
                    'text-[9.5px] tabular-nums ' +
                    (b.isCurrent ? 'text-accent' : 'text-paper-faint group-hover:text-paper-mute')
                  }
                >
                  {b.label}
                </span>
              </div>
            </Tooltip>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line/60 pt-2.5 text-[11px] text-paper-faint">
        <span>
          12 个月合计 <span className="serif text-[12.5px] text-paper-soft">{fmtMoney(total)}</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {peak.amount > 0 && (
            <span>
              高峰 <span className="text-paper-soft">{peak.label}</span>
              <span className="ml-1 tabular-nums">{fmtMoney(peak.amount)}</span>
            </span>
          )}
          {busiest.count > 0 && (
            <span>
              最密 <span className="text-paper-soft">{busiest.label}</span>
              <span className="ml-1 tabular-nums">{busiest.count} 笔</span>
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

