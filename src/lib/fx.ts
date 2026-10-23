import type { FxSnapshot } from './types'
import { CURRENCIES } from './money'

const FX_URL =
  'https://api.frankfurter.dev/v2/rates?base=CNY&quotes=' +
  CURRENCIES.filter((c) => c !== 'CNY').join(',')

const CACHE_KEY = 'subs.fx.v1'

export function readFxCache(): FxSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const j = JSON.parse(raw) as FxSnapshot
    if (!j?.ratesToCny || !j.date) return null
    return j
  } catch {
    return null
  }
}

export function writeFxCache(s: FxSnapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(s))
  } catch {
    /* 容量不足时忽略 */
  }
}

interface FrankfurterRow {
  date: string
  base: string
  quote: string
  rate: number
}

/** 联网更新汇率。只发送币种，不发送任何订阅/个人数据。 */
export async function fetchRates(signal?: AbortSignal): Promise<FxSnapshot> {
  const res = await fetch(FX_URL, {
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    signal: signal ?? AbortSignal.timeout(18000),
  })
  if (!res.ok) throw new Error('rate_service_unavailable')
  const rows = (await res.json()) as FrankfurterRow[]
  if (!Array.isArray(rows)) throw new Error('invalid_rates')

  const ratesToCny: Record<string, number> = { CNY: 1 }
  let date = '9999-99-99'
  for (const row of rows) {
    if (!/^[A-Z]{3}$/.test(row.quote)) continue
    if (!Number.isFinite(row.rate) || row.rate <= 0) continue
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) continue
    ratesToCny[row.quote] = 1 / row.rate
    if (row.date < date) date = row.date
  }
  const need = CURRENCIES.filter((c) => c !== 'CNY')
  if (!need.every((c) => Number.isFinite(ratesToCny[c]))) throw new Error('incomplete_rates')

  const snap: FxSnapshot = {
    base: 'CNY',
    ratesToCny,
    date,
    retrievedAt: new Date().toISOString(),
    provider: 'Frankfurter',
  }
  writeFxCache(snap)
  return snap
}

/** 用 icon.horse 取官网图标，返回压缩后的 data URL */
export async function fetchIcon(host: string, signal?: AbortSignal): Promise<string> {
  if (!host) throw new Error('no_host')
  const res = await fetch('https://icon.horse/icon/' + encodeURIComponent(host), {
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    signal: signal ?? AbortSignal.timeout(18000),
  })
  if (!res.ok) throw new Error('icon_not_found')
  const blob = await res.blob()
  if (blob.size > 2 * 1024 * 1024) throw new Error('icon_too_large')
  if (!/^image\/(png|jpeg|webp|x-icon|vnd\.microsoft\.icon|svg\+xml)/i.test(blob.type)) {
    throw new Error('icon_unsupported')
  }
  const bitmap = await createImageBitmap(blob)
  try {
    const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    bitmap.close?.()
  }
}
