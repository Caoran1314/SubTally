import type { Cycle, Subscription } from './types'

export const CURRENCIES = ['CNY', 'USD', 'HKD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'CAD'] as const
export type CurrencyCode = (typeof CURRENCIES)[number]

export const CURRENCY_META: Record<string, { symbol: string; label: string }> = {
  CNY: { symbol: '¥', label: '人民币' },
  USD: { symbol: '$', label: '美元' },
  HKD: { symbol: 'HK$', label: '港币' },
  EUR: { symbol: '€', label: '欧元' },
  GBP: { symbol: '£', label: '英镑' },
  JPY: { symbol: '¥', label: '日元' },
  SGD: { symbol: 'S$', label: '新加坡元' },
  AUD: { symbol: 'A$', label: '澳元' },
  CAD: { symbol: 'C$', label: '加元' },
}

/** 每个周期折算成「月数」；一次性/买断不计入月均 */
export const CYCLE_META: Record<Cycle, { label: string; months: number | null; short: string }> = {
  monthly: { label: '每月', months: 1, short: '月' },
  quarterly: { label: '每季', months: 3, short: '季' },
  yearly: { label: '每年', months: 12, short: '年' },
  once: { label: '一次性', months: null, short: '次' },
  lifetime: { label: '买断', months: null, short: '买断' },
}

export const CYCLE_ORDER: Cycle[] = ['monthly', 'quarterly', 'yearly', 'once', 'lifetime']

export function isRecurring(c: Cycle) {
  return CYCLE_META[c].months !== null
}

/** 把一条订阅折算成「每月」的本币金额 */
export function monthlyOf(sub: Subscription, toCny: (amount: number, cur: string) => number) {
  const m = CYCLE_META[sub.cycle].months
  if (!m) return 0
  if (!sub.active) return 0
  return toCny(sub.amount, sub.currency) / m
}

/** 每年 */
export function yearlyOf(sub: Subscription, toCny: (amount: number, cur: string) => number) {
  const m = CYCLE_META[sub.cycle].months
  if (!m) return 0
  if (!sub.active) return 0
  return (toCny(sub.amount, sub.currency) / m) * 12
}

/** 一次性/买断总额（不计入月均，但计入历史支出） */
export function oneOffOf(sub: Subscription, toCny: (amount: number, cur: string) => number) {
  if (CYCLE_META[sub.cycle].months !== null) return 0
  return toCny(sub.amount, sub.currency)
}

export function makeConverter(ratesToCny: Record<string, number> | undefined) {
  return (amount: number, cur: string) => {
    const c = (cur || 'CNY').toUpperCase()
    if (c === 'CNY') return amount
    const r = ratesToCny?.[c]
    if (!r || !Number.isFinite(r)) return amount // 缺汇率时按 1:1 兜底，界面上会提示
    return amount * r
  }
}

/** 显示用：保留合适的小数位 */
export function fmtMoney(n: number, opts?: { cur?: string; compact?: boolean; sign?: boolean }) {
  const cur = opts?.cur ?? 'CNY'
  const meta = CURRENCY_META[cur] ?? { symbol: '', label: cur }
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : opts?.sign ? '+' : ''

  if (opts?.compact && abs >= 10000) {
    const w = abs / 10000
    return `${sign}${meta.symbol}${w >= 100 ? w.toFixed(0) : w.toFixed(1)}万`
  }
  const digits = abs > 0 && abs < 10 ? 2 : abs < 1000 ? (Number.isInteger(abs) ? 0 : 2) : abs < 10000 ? 0 : 0
  return (
    sign +
    meta.symbol +
    abs.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  )
}

/** 只取数字部分，给大字号衬线数字用 */
export function fmtNumber(n: number, digits = 2) {
  if (!Number.isFinite(n)) return '0'
  const abs = Math.abs(n)
  const d = abs >= 1000 ? 0 : abs >= 10 ? 1 : digits
  return n.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d })
}
