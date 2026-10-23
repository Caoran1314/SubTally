import type { Subscription } from './types'
import { CYCLE_META, fmtMoney, monthlyOf } from './money'
import { addMonths, daysUntil, parseISO } from './date'

export interface MonthBucket {
  key: string
  label: string
  year: number
  amount: number
  count: number
  isCurrent: boolean
}

/**
 * 未来 N 个月的实际扣款分布（不是月均折算）。
 * 一条订阅按周期往后推，落到对应月份里 —— 这样能看出「哪几个月要出血」。
 */
export function yearlyDistribution(
  subs: Subscription[],
  toCny: (a: number, c: string) => number,
  horizon = 12
): MonthBucket[] {
  const now = new Date()
  const buckets: MonthBucket[] = []
  for (let i = 0; i < horizon; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: `${d.getMonth() + 1}月`,
      year: d.getFullYear(),
      amount: 0,
      count: 0,
      isCurrent: i === 0,
    })
  }

  const idxOf = (iso: string) => {
    const d = parseISO(iso)
    return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth())
  }

  for (const s of subs) {
    if (!s.active) continue
    const step = CYCLE_META[s.cycle].months
    if (!step) continue
    const per = toCny(s.amount, s.currency)

    let occ = s.nextDate
    let guard = 0
    while (guard < 80) {
      const i = idxOf(occ)
      if (i >= horizon) break
      if (i >= 0) {
        buckets[i].amount += per
        buckets[i].count += 1
      }
      occ = addMonths(occ, step)
      guard++
    }
  }

  return buckets
}

export interface Insight {
  tone: 'accent' | 'neutral' | 'warn'
  text: string
}

/** 从数据里直接读出来的几句话，比堆图表更有用 */
export function buildInsights(
  subs: Subscription[],
  totals: { monthly: number; yearly: number; activeCount: number; byCategory: Record<string, number>; toCny: (a: number, c: string) => number },
  upcoming: { sub: Subscription; days: number }[],
  budget = 0
): Insight[] {
  const out: Insight[] = []
  const active = subs.filter((s) => s.active)

  // ⓪ 预算：最该被看见的一条，放最前
  if (budget > 0) {
    const used = Math.round((totals.monthly / budget) * 100)
    const over = totals.monthly - budget
    if (over > 0.5) {
      out.push({ tone: 'warn', text: `这个月已超出预算 ${fmtMoney(over)}（用到 ${used}%）。` })
    } else if (used >= 85) {
      out.push({ tone: 'warn', text: `预算快用完了，已用 ${used}%（还剩 ${fmtMoney(-over)}）。` })
    } else {
      out.push({ tone: 'neutral', text: `预算用了 ${used}%，还剩 ${fmtMoney(-over)}。` })
    }
  }

  // ① 最大的一类
  const cats = Object.entries(totals.byCategory).sort((a, b) => b[1] - a[1])
  if (cats.length && totals.monthly > 0) {
    const [name, amt] = cats[0]
    const share = Math.round((amt / totals.monthly) * 100)
    // 找出这一类里最贵的一项
    const top = active
      .filter((s) => s.category === name)
      .map((s) => ({ s, m: monthlyOf(s, totals.toCny) }))
      .sort((a, b) => b.m - a.m)[0]
    out.push({
      tone: 'neutral',
      text: `${name}占了 ${share}%${top ? `，其中最大的一项是 ${top.s.name}` : ''}。`,
    })
  }

  // ② 最近一次扣款
  if (upcoming.length) {
    const { sub, days } = upcoming[0]
    out.push({
      tone: days <= 3 ? 'warn' : 'accent',
      text:
        days <= 0
          ? `${sub.name} 已经到期，${fmtMoney(sub.amount, { cur: sub.currency })}。`
          : `${days} 天后扣 ${sub.name}，${fmtMoney(sub.amount, { cur: sub.currency })}。`,
    })
  }

  // ③ 年度视角
  if (totals.activeCount > 0) {
    const avg = totals.monthly / totals.activeCount
    out.push({
      tone: 'neutral',
      text: `一年 ${fmtMoney(totals.yearly, { compact: true })}，平均每项每月 ${fmtMoney(avg)}。`,
    })
  }

  return out.slice(0, 4)
}
