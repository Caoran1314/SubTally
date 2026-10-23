import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fmtMoney, CYCLE_META } from '@/lib/money'
import { todayISO } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Subscription } from '@/lib/types'
import { Tooltip } from './ui'
import { ServiceGlyph } from './ambient'

const WEEK = ['一', '二', '三', '四', '五', '六', '日']

/**
 * 到期日历（月视图）：每天最多标 3 个图标 + 当日合计。
 * 比一条纵向时间轴更容易看出「这个月哪几天扎堆」。
 */
export function RenewalCalendar({ subs }: { subs: Subscription[] }) {
  const [offset, setOffset] = React.useState(0)
  const today = todayISO()

  const { year, month, label } = React.useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + offset)
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`,
    }
  }, [offset])

  // 当月每天的到期项
  const byDay = React.useMemo(() => {
    const map = new Map<number, Subscription[]>()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const items = subs.filter((s) => s.active && s.nextDate === iso)
      if (items.length) map.set(d, items)
    }
    return map
  }, [subs, year, month])

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // 周一 = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthTotal = Array.from(byDay.values())
    .flat()
    .reduce((a, s) => a + s.amount, 0)
  const monthCount = Array.from(byDay.values()).flat().length

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="serif text-[13.5px] text-paper">{label}</span>
          <span className="text-[10.5px] text-paper-faint">
            {monthCount ? `${monthCount} 笔 · ${fmtMoney(monthTotal)}` : '无到期'}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setOffset((o) => o - 1)}
            aria-label="上个月"
            className="grid h-6 w-6 place-items-center rounded-md text-paper-faint transition-colors hover:bg-paper/[.07] hover:text-paper"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setOffset(0)}
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[10.5px] transition-colors',
              offset === 0 ? 'text-paper-faint' : 'text-accent hover:bg-paper/[.07]'
            )}
          >
            今
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            aria-label="下个月"
            className="grid h-6 w-6 place-items-center rounded-md text-paper-faint transition-colors hover:bg-paper/[.07] hover:text-paper"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEK.map((w) => (
          <div key={w} className="text-center text-[9.5px] text-paper-faint/80">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} className="h-[42px]" />
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const items = byDay.get(d) ?? []
          const isToday = iso === today
          const dayTotal = items.reduce((a, s) => a + s.amount, 0)

          const cell = (
            <div
              key={iso}
              className={cn(
                'relative h-[46px] w-full rounded-lg border transition-colors',
                isToday
                  ? 'border-accent/50 bg-accent/10'
                  : items.length
                    ? 'border-line bg-paper/[.035]'
                    : 'border-transparent'
              )}
            >
              {/* 日期在左上角，永远不被图标挤掉 */}
              <span
                className={cn(
                  'absolute left-1 top-0.5 text-[9.5px] leading-none tabular-nums',
                  isToday ? 'font-semibold text-accent' : items.length ? 'text-paper-soft' : 'text-paper-faint/70'
                )}
              >
                {d}
              </span>
              {items.length > 0 && (
                <div className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-[2px]">
                  {items.slice(0, 3).map((s) => (
                    <ServiceGlyph
                      key={s.id}
                      name={s.name}
                      tint={s.tint}
                      image={s.iconKind === 'image' ? s.iconValue : undefined}
                      size={14}
                    />
                  ))}
                  {items.length > 3 && <span className="text-[8px] text-paper-faint">+{items.length - 3}</span>}
                </div>
              )}
            </div>
          )

          return items.length ? (
            <Tooltip
              key={iso}
              content={
                <span className="block space-y-0.5">
                  <span className="block text-paper">{d} 日 · {fmtMoney(dayTotal)}</span>
                  {items.map((s) => (
                    <span key={s.id} className="block tabular-nums text-paper-mute">
                      {s.name} · {fmtMoney(s.amount, { cur: s.currency })}/{CYCLE_META[s.cycle].short}
                    </span>
                  ))}
                </span>
              }
            >
              {cell}
            </Tooltip>
          ) : (
            cell
          )
        })}
      </div>
    </div>
  )
}
