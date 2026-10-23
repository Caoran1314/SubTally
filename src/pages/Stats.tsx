import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { FileText, Camera, Download, Check, X, Moon, Package } from 'lucide-react'
import { useSubsStore, useTotals } from '@/store/useSubsStore'
import { fmtMoney, fmtNumber, monthlyOf, oneOffOf, CYCLE_META, CYCLE_ORDER } from '@/lib/money'
import { CATEGORY_TINT } from '@/lib/catalog'
import { openReport } from '@/lib/report'
import { download } from '@/lib/utils'
import { fmtDateShort } from '@/lib/date'
import { GlassCard, Numeral, SectionTitle, ServiceGlyph } from '@/components/ambient'
import { Badge, Button } from '@/components/ui'
import { EmptyState, Metric } from '@/components/pieces'

const AXIS = 'hsl(var(--paper-faint))'

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line-strong/70 bg-ink-850/97 px-2.5 py-1.5 text-[11.5px] text-paper-soft shadow-lg backdrop-blur-xl">
      <div className="mb-0.5 text-paper">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="tabular-nums">
          {p.dataKey === 'count' ? `${p.value} 项` : fmtMoney(Number(p.value))}
        </div>
      ))}
    </div>
  )
}

/** 单项月均分档 */
const BUCKETS = [
  { label: '≤¥10', min: 0, max: 10 },
  { label: '¥10–50', min: 10, max: 50 },
  { label: '¥50–100', min: 50, max: 100 },
  { label: '¥100–300', min: 100, max: 300 },
  { label: '>¥300', min: 300, max: Infinity },
]

export function StatsPage() {
  const totals = useTotals()
  const subs = useSubsStore((s) => s.subs)
  const snapshots = useSubsStore((s) => s.snapshots)
  const decisions = useSubsStore((s) => s.decisions)
  const settings = useSubsStore((s) => s.settings)
  const fx = useSubsStore((s) => s.fx)
  const saveSnapshot = useSubsStore((s) => s.saveSnapshot)

  const active = React.useMemo(() => subs.filter((s) => s.active), [subs])

  /* ── 周期结构 ── */
  const cycles = React.useMemo(
    () =>
      CYCLE_ORDER.map((c) => {
        const items = active.filter((s) => s.cycle === c)
        const monthly = items.reduce((a, s) => a + monthlyOf(s, totals.toCny), 0)
        return { cycle: c, label: CYCLE_META[c].label, count: items.length, monthly }
      }).filter((x) => x.count > 0),
    [active, totals.toCny]
  )
  const cycleMonthly = cycles.reduce((a, x) => a + x.monthly, 0)

  /* ── 决策结果 ── */
  const decisionStats = React.useMemo(() => {
    const released = subs.filter((s) => s.decision === 'release' || !s.active)
    const saved = released.reduce((a, s) => a + oneOffOf(s, totals.toCny) + monthlyOf({ ...s, active: true }, totals.toCny) * 12, 0)
    // 放手 = 省下一年；用「若仍按原周期付」估算
    const savedYearly = released.reduce((a, s) => {
      const m = CYCLE_META[s.cycle].months
      if (!m) return a + totals.toCny(s.amount, s.currency) // 一次性本就不再发生
      return a + (totals.toCny(s.amount, s.currency) / m) * 12
    }, 0)
    return {
      keep: active.filter((s) => s.decision === 'keep').length,
      pending: active.filter((s) => s.decision === 'pending').length,
      released: released.length,
      savedYearly,
      logCount: decisions.length,
    }
  }, [subs, active, decisions, totals.toCny])

  /* ── 金额分布 ── */
  const dist = React.useMemo(() => {
    const rows = BUCKETS.map((b) => ({ ...b, count: 0, amount: 0 }))
    active.forEach((s) => {
      const m = monthlyOf(s, totals.toCny)
      if (m <= 0) return
      const b = rows.find((r) => m > r.min && m <= r.max) ?? rows[rows.length - 1]
      b.count += 1
      b.amount += m
    })
    return rows
  }, [active, totals.toCny])

  /* ── 最贵的几项（排行，总览没有） ── */
  const top = React.useMemo(
    () =>
      active
        .map((s) => ({ sub: s, m: monthlyOf(s, totals.toCny) }))
        .filter((x) => x.m > 0)
        .sort((a, b) => b.m - a.m)
        .slice(0, 8),
    [active, totals.toCny]
  )

  /* ── CSV 导出 ── */
  const exportSubsCsv = () => {
    const head = ['名称', '分类', '周期', '金额', '币种', '下次续费', '状态', '决策', '备注', '月均折算CNY']
    const rows = subs.map((s) => [
      s.name,
      s.category,
      CYCLE_META[s.cycle].label,
      String(s.amount),
      s.currency,
      s.nextDate,
      s.active ? '在用' : '已停',
      s.decision,
      (s.note ?? '').replace(/[\r\n,]/g, ' '),
      monthlyOf(s, totals.toCny).toFixed(2),
    ])
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    download(`subs-${new Date().toISOString().slice(0, 10)}.csv`, '\ufeff' + csv, 'text/csv')
    toast.success('已导出订阅 CSV')
  }

  const exportSnapshotsCsv = () => {
    const head = ['记录时间', '汇总币种', '月均', '年度', '订阅数']
    const rows = snapshots.map((s) => [s.at.slice(0, 19).replace('T', ' '), s.base, s.monthly.toFixed(2), s.yearly.toFixed(2), String(s.count)])
    const csv = [head, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\r\n')
    download(`subs-snapshots-${new Date().toISOString().slice(0, 10)}.csv`, '\ufeff' + csv, 'text/csv')
    toast.success('已导出快照 CSV')
  }

  if (!subs.length) {
    return (
      <GlassCard className="mt-6 p-8">
        <EmptyState title="还没有数据可看" hint="先添加几条订阅，这里会长出结构分析。" />
      </GlassCard>
    )
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-[22px] font-semibold tracking-[.01em] text-paper">统计</h1>
          <p className="hint mt-1">结构、历史与决策 —— 按月折算，一次性与买断不计入月均。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={exportSubsCsv}>
            <Download className="h-3.5 w-3.5" /> 订阅 CSV
          </Button>
          <Button
            onClick={() => {
              const ok = openReport({ subs, snapshots, decisions, settings, fx })
              if (!ok) toast.error('浏览器拦住了新窗口，请允许弹窗后重试。')
            }}
          >
            <FileText className="h-4 w-4" /> 生成报告
          </Button>
        </div>
      </header>

      <GlassCard className="p-5">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Metric label="月均折算" value={fmtNumber(totals.monthly)} unit="CNY" size="md" />
          <Metric label="年度折算" value={fmtNumber(totals.yearly, 0)} unit="CNY" size="md" />
          <Metric label="一次性 / 买断" value={fmtNumber(totals.oneOff, 0)} unit="CNY" size="md" />
          <Metric label="记录 / 在用" value={`${totals.total}/${totals.activeCount}`} unit="项" size="md" />
        </div>
      </GlassCard>

      {/* ═══ 周期结构 ═══ */}
      <GlassCard className="p-5">
        <SectionTitle aside="同一笔钱，付法不同">周期结构</SectionTitle>
        {cycles.length ? (
          <div className="space-y-3">
            <div className="flex h-[9px] w-full gap-[3px] overflow-hidden rounded-full">
              {cycles.map((c) => {
                const pct = cycleMonthly ? (c.monthly / cycleMonthly) * 100 : 0
                return (
                  <div
                    key={c.cycle}
                    style={{
                      width: `${Math.max(pct, 1.5)}%`,
                      background: `hsl(var(--accent) / ${0.85 - CYCLE_ORDER.indexOf(c.cycle) * 0.16})`,
                    }}
                    title={`${c.label} ${fmtMoney(c.monthly)}`}
                  />
                )
              })}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {cycles.map((c, i) => (
                <div key={c.cycle} className="rounded-lg border border-line/70 p-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-paper-faint">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: `hsl(var(--accent) / ${0.85 - i * 0.16})` }}
                    />
                    {c.label}
                  </div>
                  <div className="mt-1 serif text-[15px] text-paper">
                    {c.count}
                    <span className="ml-0.5 text-[10px] text-paper-faint">项</span>
                  </div>
                  <div className="text-[10.5px] text-paper-faint">
                    贡献 {fmtMoney(c.monthly)}/月
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="hint py-6 text-center">没有周期性订阅。</p>
        )}
      </GlassCard>

      {/* ═══ 决策结果 ═══ */}
      <GlassCard className="p-5">
        <SectionTitle
          aside={
            decisionStats.keep + decisionStats.released === 0
              ? '还没做过决定 —— 总览里选「留下 / 放手」后会记在这里'
              : '续费问过之后的账'
          }
        >
          决策结果
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-4">
          <DecisionTile icon={<Check className="h-3.5 w-3.5" />} label="留下" value={decisionStats.keep} tone="ok" />
          <DecisionTile icon={<X className="h-3.5 w-3.5" />} label="放手" value={decisionStats.released} tone="danger" />
          <DecisionTile icon={<Moon className="h-3.5 w-3.5" />} label="待决定" value={decisionStats.pending} tone="neutral" />
          <div className="rounded-xl border border-line/70 p-3">
            <div className="label-xs mb-1 !text-[10px]">放手一年省下</div>
            <div className="serif text-[19px] leading-none text-ok">
              {decisionStats.savedYearly > 0 ? fmtMoney(decisionStats.savedYearly) : '—'}
            </div>
            <div className="mt-1 text-[10.5px] text-paper-faint">
              按原周期估算{decisionStats.logCount > 0 && ` · ${decisionStats.logCount} 次决定`}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-[1fr_.92fr]">
        {/* ═══ 金额分布 ═══ */}
        <GlassCard className="p-5">
          <SectionTitle aside="单项月均落入哪一档">金额分布</SectionTitle>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dist} margin={{ left: -10, right: 6, top: 8, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--line))" strokeDasharray="3 6" />
                <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
                <RTooltip content={<ChartTip />} cursor={{ fill: 'hsl(var(--paper) / .04)' }} />
                <Bar dataKey="count" radius={[5, 5, 0, 0]} barSize={26}>
                  {dist.map((_, i) => (
                    <Cell key={i} fill="hsl(var(--accent))" fillOpacity={0.35 + i * 0.14} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* ═══ 最贵的几项 ═══ */}
        <GlassCard className="p-5">
          <SectionTitle aside="按月折算排行">最贵的几项</SectionTitle>
          <ul className="space-y-2.5">
            {top.map(({ sub, m }, i) => (
              <li key={sub.id} className="flex items-center gap-2.5">
                <span className="w-3 shrink-0 text-right text-[10px] tabular-nums text-paper-faint">{i + 1}</span>
                <ServiceGlyph
                  name={sub.name}
                  tint={sub.tint}
                  image={sub.iconKind === 'image' ? sub.iconValue : undefined}
                  size={26}
                />
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-paper-soft">{sub.name}</span>
                <span className="serif shrink-0 text-[12.5px] text-paper">{fmtMoney(m)}</span>
                <span className="w-9 shrink-0 text-right text-[10.5px] tabular-nums text-paper-faint">
                  {totals.monthly ? Math.round((m / totals.monthly) * 100) : 0}%
                </span>
              </li>
            ))}
            {!top.length && <p className="hint py-6 text-center">没有可折算的周期订阅。</p>}
          </ul>
        </GlassCard>
      </div>

      {/* ═══ 费用快照（表格化，与总览的折线互补） ═══ */}
      <GlassCard className="p-5">
        <SectionTitle
          aside={
            <span className="flex items-center gap-1.5">
              {snapshots.length > 0 && (
                <Button variant="ghost" size="iconSm" onClick={exportSnapshotsCsv} aria-label="导出快照 CSV">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => {
                  saveSnapshot()
                  toast.success('已保存一份费用快照')
                }}
                aria-label="保存快照"
              >
                <Camera className="h-3.5 w-3.5" />
              </Button>
            </span>
          }
        >
          费用快照
        </SectionTitle>
        {snapshots.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-[.1em] text-paper-faint">
                  <th className="pb-2 font-medium">记录时间</th>
                  <th className="pb-2 text-right font-medium">月均</th>
                  <th className="pb-2 text-right font-medium">年度</th>
                  <th className="pb-2 text-right font-medium">订阅数</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.slice(0, 12).map((s, i) => {
                  const prev = snapshots[i + 1]
                  const delta = prev ? s.monthly - prev.monthly : 0
                  return (
                    <tr key={s.id} className="border-t border-line/50">
                      <td className="py-2 text-paper-soft">{s.at.slice(0, 16).replace('T', ' ')}</td>
                      <td className="py-2 text-right tabular-nums text-paper">
                        {fmtMoney(s.monthly)}
                        {prev && (
                          <span className={`ml-1.5 text-[10px] ${delta > 0 ? 'text-danger' : delta < 0 ? 'text-ok' : 'text-paper-faint'}`}>
                            {delta > 0 ? '+' : ''}
                            {delta !== 0 ? fmtMoney(delta) : '±'}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right tabular-nums text-paper-mute">{fmtMoney(s.yearly, { compact: true })}</td>
                      <td className="py-2 text-right tabular-nums text-paper-mute">{s.count}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="hint max-w-[280px]">保存快照后这里会列出来，并标出每次的增减。每月首次打开也会自动记一笔。</p>
            <Button
              variant="soft"
              size="sm"
              onClick={() => {
                saveSnapshot()
                toast.success('已保存一份费用快照')
              }}
            >
              <Camera className="h-3.5 w-3.5" /> 保存快照
            </Button>
          </div>
        )}
      </GlassCard>

      {/* ═══ 报告说明 ═══ */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="serif text-[14px] text-paper">订阅报告</div>
          <p className="hint mt-0.5">生成一份可在浏览器里打印或存为 PDF 的报告，含构成、明细、决策记录与快照。</p>
        </div>
        <Button
          onClick={() => {
            const ok = openReport({ subs, snapshots, decisions, settings, fx })
            if (!ok) toast.error('浏览器拦住了新窗口，请允许弹窗后重试。')
          }}
        >
          <FileText className="h-4 w-4" /> 生成报告
        </Button>
      </GlassCard>
    </div>
  )
}

function DecisionTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'ok' | 'danger' | 'neutral'
}) {
  const toneCls = tone === 'ok' ? 'text-ok' : tone === 'danger' ? 'text-danger' : 'text-paper-mute'
  return (
    <div className="rounded-xl border border-line/70 p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <span className={toneCls}>{icon}</span>
        <span className="label-xs !text-[10px]">{label}</span>
      </div>
      <div className={`serif text-[19px] leading-none ${toneCls}`}>
        {value}
        <span className="ml-0.5 text-[10px] text-paper-faint">项</span>
      </div>
    </div>
  )
}

