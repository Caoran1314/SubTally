import type { Cycle } from './types'
import { CYCLE_META } from './money'

const MS_DAY = 86400000

export function todayISO(d = new Date()) {
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return t.toISOString().slice(0, 10)
}

export function parseISO(s: string) {
  const [y, m, d] = (s || '').split('-').map(Number)
  if (!y || !m || !d) return new Date()
  return new Date(y, m - 1, d)
}

export function daysUntil(iso: string, from = new Date()) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  const b = parseISO(iso).getTime()
  return Math.round((b - a) / MS_DAY)
}

export function addMonths(iso: string, months: number) {
  const d = parseISO(iso)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  // 处理 1/31 + 1 月 → 2/28 这类溢出
  if (d.getDate() < day) d.setDate(0)
  return todayISO(d)
}

export function advance(iso: string, cycle: Cycle) {
  const m = CYCLE_META[cycle].months
  if (!m) return iso
  return addMonths(iso, m)
}

const MONTH_CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']

export function monthCN(m: number) {
  return MONTH_CN[((m % 12) + 12) % 12]
}

export function monthLabel(d = new Date()) {
  return `${monthCN(d.getMonth())}月`
}

export function fmtDateCN(iso: string) {
  const d = parseISO(iso)
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

export function fmtDateShort(iso: string) {
  const d = parseISO(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

/** 下一次发生的日期（若已过期，往后推） */
export function rollForward(iso: string, cycle: Cycle, now = new Date()) {
  let cur = iso
  let guard = 0
  while (daysUntil(cur, now) < 0 && guard < 240) {
    cur = advance(cur, cycle)
    guard++
    if (!CYCLE_META[cycle].months) break
  }
  return cur
}

export function weekdayCN(iso: string) {
  const d = parseISO(iso)
  return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
}

export function relativeDays(n: number) {
  if (n === 0) return '今天'
  if (n === 1) return '明天'
  if (n === 2) return '后天'
  if (n < 0) return `已过 ${Math.abs(n)} 天`
  return `${n} 天后`
}
