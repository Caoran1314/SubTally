import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(prefix = 's') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

/** 安全地只保留域名，用于 icon.horse 取图标 */
export function publicHost(value: string): string | null {
  if (!value) return null
  let raw = value.trim()
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.username || url.password) return null
  if (!['http:', 'https:'].includes(url.protocol)) return null
  if (url.port) return null
  const host = url.hostname.toLowerCase()
  if (!host.includes('.')) return null
  if (/^(?:\d+\.){3}\d+$/.test(host)) return null
  if (host.includes(':')) return null
  if (/\.(?:localhost|local|internal|test|invalid)$/.test(host)) return null
  return host
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function pct(part: number, whole: number) {
  if (!whole) return 0
  return Math.round((part / whole) * 1000) / 10
}

/** 首字母（衬线斜体用） */
export function initialOf(name: string) {
  const t = (name || '').trim()
  if (!t) return '·'
  if (/^[A-Za-z]/.test(t)) return t[0].toUpperCase()
  return t[0]
}

export function download(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
