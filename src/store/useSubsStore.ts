import * as React from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Decision, DecisionLog, Settings, Snapshot, Subscription, FxSnapshot } from '@/lib/types'
import { uid } from '@/lib/utils'
import { monthlyOf, yearlyOf, makeConverter, oneOffOf } from '@/lib/money'
import { daysUntil, rollForward, todayISO } from '@/lib/date'
import { PRESETS } from '@/lib/catalog'

const DEFAULT_SETTINGS: Settings = {
  nickname: '',
  avatar: 'ring',
  mode: 'dark',
  accent: 'rose',
  base: 'CNY',
  onboarded: false,
  askBeforeRenew: true,
  askLeadDays: 3,
  budget: 0,
}

interface SubsState {
  subs: Subscription[]
  settings: Settings
  decisions: DecisionLog[]
  snapshots: Snapshot[]
  fx: FxSnapshot | null
  fxUpdatedAt: number | null

  // —— 基础 CRUD ——
  addSub: (s: Omit<Subscription, 'id' | 'createdAt' | 'sort' | 'active'> & { id?: string }) => string
  updateSub: (id: string, patch: Partial<Subscription>) => void
  removeSub: (id: string) => void
  reorderSubs: (ids: string[]) => void
  /** 批量：设置在用状态 */
  bulkSetActive: (ids: string[], active: boolean) => void
  /** 批量：改分类 */
  bulkSetCategory: (ids: string[], category: string) => void
  /** 批量：删除 */
  bulkRemove: (ids: string[]) => void

  // —— 决策 ——
  decide: (id: string, decision: Decision) => void
  renew: (id: string) => void

  // —— 设置 ——
  patchSettings: (patch: Partial<Settings>) => void

  // —— 汇率 ——
  setFx: (fx: FxSnapshot) => void

  // —— 快照 ——
  saveSnapshot: () => Snapshot
  /** 每月首次打开时自动记一个点，用来做月均趋势 */
  autoSnapshotMonthly: () => Snapshot | null

  // —— 导入导出 ——
  exportAll: () => string
  importAll: (json: string) => { ok: boolean; message: string }
  restorePresets: () => number
  clearAll: () => void
}

function seedFromPresets(): Subscription[] {
  // [预设 id, 金额, 周期, 距今天数] —— 日期故意错开，让时间轴一上来就有内容
  const picks: [string, number, Subscription['cycle'], number][] = [
    ['chatgpt', 138, 'yearly', 21],
    ['netflix', 60, 'monthly', 3],
    ['bilibili', 25, 'monthly', 9],
    ['icloud', 6, 'monthly', 14],
    ['baidu-netdisk', 25, 'monthly', 26],
    ['spotify', 15, 'monthly', 6],
  ]
  return picks
    .map(([id, amount, cycle, offset], i) => {
      const p = PRESETS.find((x) => x.id === id)
      if (!p) return null
      const d = new Date()
      d.setDate(d.getDate() + offset)
      const nextDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return {
        id: uid('sub'),
        name: p.name,
        amount,
        currency: 'CNY',
        cycle,
        nextDate,
        category: p.category,
        iconKind: 'letter' as const,
        tint: p.tint,
        website: p.website,
        note: '',
        decision: 'pending' as Decision,
        active: true,
        createdAt: new Date().toISOString(),
        sort: i,
      } satisfies Subscription
    })
    .filter(Boolean) as Subscription[]
}

export const useSubsStore = create<SubsState>()(
  persist(
    (set, get) => ({
      subs: [],
      settings: DEFAULT_SETTINGS,
      decisions: [],
      snapshots: [],
      fx: null,
      fxUpdatedAt: null,

      addSub: (input) => {
        const id = input.id ?? uid('sub')
        const sort = (get().subs.at(-1)?.sort ?? 0) + 1
        set((s) => ({
          subs: [
            ...s.subs,
            {
              ...input,
              id,
              active: true,
              createdAt: new Date().toISOString(),
              sort,
            } as Subscription,
          ],
        }))
        return id
      },

      updateSub: (id, patch) =>
        set((s) => ({
          subs: s.subs.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),

      removeSub: (id) => set((s) => ({ subs: s.subs.filter((x) => x.id !== id) })),

      reorderSubs: (ids) =>
        set((s) => {
          const map = new Map(ids.map((id, i) => [id, i]))
          return {
            subs: s.subs
              .map((x) => (map.has(x.id) ? { ...x, sort: map.get(x.id)! } : x))
              .sort((a, b) => a.sort - b.sort),
          }
        }),

      bulkSetActive: (ids, active) =>
        set((s) => ({
          subs: s.subs.map((x) =>
            ids.includes(x.id)
              ? { ...x, active, decision: active ? 'pending' : 'release' }
              : x
          ),
        })),

      bulkSetCategory: (ids, category) =>
        set((s) => ({
          subs: s.subs.map((x) => (ids.includes(x.id) ? { ...x, category } : x)),
        })),

      bulkRemove: (ids) =>
        set((s) => ({ subs: s.subs.filter((x) => !ids.includes(x.id)) })),

      decide: (id, decision) => {
        const sub = get().subs.find((x) => x.id === id)
        if (!sub) return
        const log: DecisionLog = {
          id: uid('dec'),
          subId: sub.id,
          subName: sub.name,
          decision,
          at: new Date().toISOString(),
          amount: sub.amount,
          currency: sub.currency,
          cycle: sub.cycle,
        }
        set((s) => ({
          decisions: [log, ...s.decisions].slice(0, 300),
          subs: s.subs.map((x) =>
            x.id === id
              ? {
                  ...x,
                  decision,
                  decidedAt: log.at,
                  active: decision === 'release' ? false : x.active,
                }
              : x
          ),
        }))
      },

      renew: (id) =>
        set((s) => ({
          subs: s.subs.map((x) =>
            x.id === id
              ? {
                  ...x,
                  nextDate: rollForward(todayISO(), x.cycle),
                  decision: 'pending',
                  decidedAt: undefined,
                  active: true,
                }
              : x
          ),
        })),

      patchSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      setFx: (fx) => set({ fx, fxUpdatedAt: Date.now() }),

      saveSnapshot: () => {
        const { subs, fx, settings } = get()
        const toCny = makeConverter(fx?.ratesToCny)
        const monthly = subs.reduce((a, s) => a + monthlyOf(s, toCny), 0)
        const yearly = subs.reduce((a, s) => a + yearlyOf(s, toCny), 0)
        const byCategory: Record<string, number> = {}
        subs.forEach((s) => {
          const m = monthlyOf(s, toCny)
          if (m > 0) byCategory[s.category] = (byCategory[s.category] ?? 0) + m
        })
        const snap: Snapshot = {
          id: uid('snap'),
          at: new Date().toISOString(),
          base: settings.base,
          monthly,
          yearly,
          count: subs.filter((s) => s.active).length,
          byCategory,
        }
        set((s) => ({ snapshots: [snap, ...s.snapshots].slice(0, 36) }))
        return snap
      },

      autoSnapshotMonthly: () => {
        const { snapshots } = get()
        const now = new Date()
        const thisMonth = `${now.getFullYear()}-${now.getMonth()}`
        const last = snapshots[0]
        if (last) {
          const d = new Date(last.at)
          if (`${d.getFullYear()}-${d.getMonth()}` === thisMonth) return null
        }
        return get().saveSnapshot()
      },

      exportAll: () => {
        const { subs, settings, decisions, snapshots, fx } = get()
        return JSON.stringify(
          {
            app: 'subs',
            version: 1,
            exportedAt: new Date().toISOString(),
            settings: { ...settings, onboarded: true },
            subs,
            decisions,
            snapshots,
            fx,
          },
          null,
          2
        )
      },

      importAll: (json) => {
        try {
          const j = JSON.parse(json)
          if (!j || j.app !== 'subs' || !Array.isArray(j.subs)) {
            return { ok: false, message: '这不是 Subs 的备份文件。' }
          }
          set({
            subs: j.subs as Subscription[],
            settings: { ...DEFAULT_SETTINGS, ...(j.settings ?? {}) },
            decisions: Array.isArray(j.decisions) ? j.decisions : [],
            snapshots: Array.isArray(j.snapshots) ? j.snapshots : [],
            fx: j.fx ?? null,
          })
          return { ok: true, message: `已导入 ${j.subs.length} 条订阅。` }
        } catch {
          return { ok: false, message: '文件无法解析，请检查是否完整。' }
        }
      },

      restorePresets: () => {
        const existing = new Set(get().subs.map((s) => s.name))
        const picks = PRESETS.filter((p) => !existing.has(p.name)).slice(0, 12)
        const base = get().subs.at(-1)?.sort ?? 0
        const added: Subscription[] = picks.map((p, i) => ({
          id: uid('sub'),
          name: p.name,
          amount: 20,
          currency: 'CNY',
          cycle: 'monthly',
          nextDate: rollForward(todayISO(), 'monthly'),
          category: p.category,
          iconKind: 'letter',
          tint: p.tint,
          website: p.website,
          note: '来自内置名单，费用慢慢补。',
          decision: 'pending',
          active: true,
          createdAt: new Date().toISOString(),
          sort: base + i + 1,
        }))
        set((s) => ({ subs: [...s.subs, ...added] }))
        return added.length
      },

      clearAll: () =>
        set({
          subs: seedFromPresets(),
          decisions: [],
          snapshots: [],
        }),
    }),
    {
      name: 'subs.state.v1',
      version: 1,
      partialize: (s) => ({
        subs: s.subs,
        settings: s.settings,
        decisions: s.decisions,
        snapshots: s.snapshots,
        fx: s.fx,
        fxUpdatedAt: s.fxUpdatedAt,
      }),
    }
  )
)

/** 首次访问：给一份示例数据，界面不至于空荡 */
export function ensureSeeded() {
  const { subs } = useSubsStore.getState()
  if (subs.length === 0) {
    useSubsStore.setState({ subs: seedFromPresets() })
  }
}

/* ——————————————— 派生选择器 ———————————————
   注意：选择器只返回稳定引用（数组本身或原语），
   派生对象一律用 useMemo 在组件侧计算，
   否则 zustand 的浅比较每帧都不相等，会陷入无限渲染。
   ——————————————————————————————— */

export function useTotals() {
  const subs = useSubsStore((s) => s.subs)
  const rates = useSubsStore((s) => s.fx?.ratesToCny)

  return React.useMemo(() => {
    const toCny = makeConverter(rates)
    const monthly = subs.reduce((a, x) => a + monthlyOf(x, toCny), 0)
    const yearly = subs.reduce((a, x) => a + yearlyOf(x, toCny), 0)
    const oneOff = subs.reduce((a, x) => a + oneOffOf(x, toCny), 0)
    const activeCount = subs.filter((x) => x.active).length
    const byCategory: Record<string, number> = {}
    subs.forEach((x) => {
      const m = monthlyOf(x, toCny)
      if (m > 0) byCategory[x.category] = (byCategory[x.category] ?? 0) + m
    })
    return { monthly, yearly, oneOff, activeCount, total: subs.length, byCategory, toCny }
  }, [subs, rates])
}

export function useUpcoming(days = 30) {
  const subs = useSubsStore((s) => s.subs)
  return React.useMemo(
    () =>
      subs
        .filter((x) => x.active && x.cycle !== 'lifetime')
        .map((x) => ({ sub: x, days: daysUntil(x.nextDate) }))
        .filter((x) => x.days <= days)
        .sort((a, b) => a.days - b.days),
    [subs, days]
  )
}

export function usePending() {
  const subs = useSubsStore((s) => s.subs)
  return React.useMemo(
    () =>
      subs
        .filter((x) => x.active && x.decision === 'pending' && daysUntil(x.nextDate) <= 7)
        .sort((a, b) => daysUntil(a.nextDate) - daysUntil(b.nextDate)),
    [subs]
  )
}




