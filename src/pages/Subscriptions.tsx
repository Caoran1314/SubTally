import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Search,
  Plus,
  GripVertical,
  X,
  CheckSquare,
  Square,
  Trash2,
  HandHelping,
  ArrowRight,
  LayoutList,
  LayoutGrid,
  SlidersHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSubsStore, useTotals } from '@/store/useSubsStore'
import { fmtMoney, CYCLE_META, monthlyOf } from '@/lib/money'
import { daysUntil, fmtDateShort, relativeDays } from '@/lib/date'
import { CATEGORIES, CATEGORY_TINT } from '@/lib/catalog'
import { cn } from '@/lib/utils'
import type { Subscription } from '@/lib/types'
import { GlassCard, ServiceGlyph } from '@/components/ambient'
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
} from '@/components/ui'
import { EmptyState } from '@/components/pieces'

type StatusFilter = 'all' | 'pending' | 'release' | 'due'
type SortKey = 'manual' | 'date' | 'amount' | 'category' | 'name'
type ViewMode = 'list' | 'grid'

const STATUS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待决定' },
  { key: 'due', label: '7 天内' },
  { key: 'release', label: '放手中' },
]

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'manual', label: '手动排序' },
  { key: 'date', label: '按到期日' },
  { key: 'amount', label: '按月均金额' },
  { key: 'category', label: '按分类' },
  { key: 'name', label: '按名称' },
]

/* ————————————————————————— 小件 ————————————————————————— */

/** 账本式列宽：拖动 / 勾选 / 图标 / 名称 / 分类 / 下次 / 金额 / 月均 / 操作 */
const COLS =
  'grid items-center gap-2.5 grid-cols-[18px_18px_34px_minmax(0,1fr)_64px_76px_42px] sm:gap-3 sm:grid-cols-[20px_20px_38px_minmax(0,1fr)_84px_76px_96px_80px_52px]'

function ListHeader() {
  return (
    <div
      className={
        COLS +
        ' border-b border-line/60 px-2.5 pb-2 pt-1 text-[10px] uppercase tracking-[.1em] text-paper-faint'
      }
    >
      <span />
      <span />
      <span />
      <span>名称</span>
      <span className="hidden sm:block">分类</span>
      <span>下次</span>
      <span className="text-right">金额</span>
      <span className="hidden text-right sm:block">月均</span>
      <span />
    </div>
  )
}

function CatChip({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] text-paper-faint">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: CATEGORY_TINT[category] ?? 'hsl(var(--accent))' }}
      />
      {category}
    </span>
  )
}

function DuePill({ sub }: { sub: Subscription }) {
  if (!sub.active) return <Badge>已停</Badge>
  const days = daysUntil(sub.nextDate)
  const urgent = days <= 3
  const soon = days <= 7
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10.5px] tabular-nums',
        urgent
          ? 'border-accent/40 bg-accent/12 text-accent'
          : soon
            ? 'border-line-strong bg-paper/[.05] text-paper-soft'
            : 'border-line bg-transparent text-paper-faint'
      )}
    >
      {days <= 0 ? '已到期' : days <= 7 ? relativeDays(days) : fmtDateShort(sub.nextDate)}
    </span>
  )
}

/* ————————————————————————— 列表行 ————————————————————————— */

function ListRow({
  sub,
  selected,
  onSelect,
  onEdit,
  onToggle,
  monthly,
  dragHandle,
}: {
  sub: Subscription
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onToggle: () => void
  monthly: number
  dragHandle?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        COLS,
        'group rounded-xl border px-2.5 py-2 transition-all duration-200',
        selected
          ? 'border-accent/40 bg-accent/[.07]'
          : 'border-transparent hover:border-line hover:bg-paper/[.03]',
        !sub.active && 'opacity-55'
      )}
    >
      {dragHandle}

      <button
        onClick={onSelect}
        aria-label={selected ? '取消选择' : '选择'}
        className={cn(
          'grid h-6 w-full place-items-center transition-all',
          selected ? 'text-accent' : 'text-paper-faint/40 hover:text-paper-soft'
        )}
      >
        {selected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
      </button>

      <ServiceGlyph
        name={sub.name}
        tint={sub.tint}
        image={sub.iconKind === 'image' ? sub.iconValue : undefined}
        size={34}
      />

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-medium text-paper">{sub.name}</span>
          {sub.decision === 'release' && <Badge>放手中</Badge>}
        </div>
        {sub.note && <div className="truncate text-[10.5px] text-paper-faint/80">{sub.note}</div>}
      </div>

      <div className="hidden sm:block">
        <CatChip category={sub.category} />
      </div>

      <div>
        <DuePill sub={sub} />
      </div>

      <div className="text-right">
        <span className="serif text-[13.5px] text-paper">{fmtMoney(sub.amount, { cur: sub.currency })}</span>
        <span className="ml-0.5 text-[9.5px] text-paper-faint">/{CYCLE_META[sub.cycle].short}</span>
      </div>

      <div className="hidden text-right text-[11px] tabular-nums text-paper-mute sm:block">
        {monthly > 0 ? fmtMoney(monthly) : '—'}
      </div>

      <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Tooltip content={sub.active ? '标记为放手' : '恢复在用'}>
          <Button variant="ghost" size="iconSm" onClick={onToggle} aria-label="切换状态">
            {sub.active ? <HandHelping className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
          </Button>
        </Tooltip>
        <Button variant="ghost" size="iconSm" onClick={onEdit} aria-label="编辑">
          改
        </Button>
      </div>
    </div>
  )
}
function SortableListRow(props: React.ComponentProps<typeof ListRow> & { draggable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.sub.id,
    disabled: !props.draggable,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10')}
    >
      <ListRow
        {...props}
        dragHandle={
          props.draggable ? (
            <button
              {...attributes}
              {...listeners}
              aria-label="拖动排序"
              className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-paper-faint/30 transition-opacity hover:text-paper-mute active:cursor-grabbing"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )
        }
      />
    </div>
  )
}

/* ————————————————————————— 卡片 ————————————————————————— */

function SubCard({
  sub,
  selected,
  onSelect,
  onEdit,
  onToggle,
  monthly,
}: {
  sub: Subscription
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onToggle: () => void
  monthly: number
}) {
  const days = sub.active ? daysUntil(sub.nextDate) : null
  return (
    <motion.div
      layout
      className={cn(
        'group relative flex flex-col rounded-2xl border p-3.5 transition-all duration-200',
        selected
          ? 'border-accent/45 bg-accent/[.08]'
          : 'border-line/80 bg-paper/[.022] hover:border-line-strong hover:bg-paper/[.045]',
        !sub.active && 'opacity-55'
      )}
    >
      <button
        onClick={onSelect}
        aria-label={selected ? '取消选择' : '选择'}
        className={cn(
          'absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-md transition-all',
          selected ? 'text-accent' : 'text-paper-faint/35 opacity-0 hover:text-paper-mute group-hover:opacity-100'
        )}
      >
        {selected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
      </button>

      <div className="mb-3 flex items-start gap-2.5">
        <ServiceGlyph
          name={sub.name}
          tint={sub.tint}
          image={sub.iconKind === 'image' ? sub.iconValue : undefined}
          size={34}
        />
        <div className="min-w-0 pr-6">
          <div className="truncate text-[13px] font-medium text-paper">{sub.name}</div>
          <CatChip category={sub.category} />
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline gap-1">
          <span className="serif text-[20px] leading-none text-paper">
            {fmtMoney(sub.amount, { cur: sub.currency })}
          </span>
          <span className="text-[10px] text-paper-faint">/{CYCLE_META[sub.cycle].short}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[10px] tabular-nums text-paper-faint">
            {monthly > 0 ? `≈ ${fmtMoney(monthly)}/月` : '一次性'}
          </span>
          <span className="flex items-center gap-1">
            {sub.decision === 'release' && <Badge>放手</Badge>}
            <DuePill sub={sub} />
          </span>
        </div>
      </div>

      <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="mr-auto text-[9.5px] text-paper-faint/70">
          {days !== null ? (days <= 0 ? '已到期' : `${days} 天后`) : '已停'}
        </span>
        <Button variant="ghost" size="iconSm" onClick={onToggle} aria-label="切换状态">
          {sub.active ? <HandHelping className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
        </Button>
        <Button variant="ghost" size="iconSm" onClick={onEdit} aria-label="编辑">
          改
        </Button>
      </div>
    </motion.div>
  )
}

/* ————————————————————————— 页 ————————————————————————— */

export function SubscriptionsPage({ onAdd, onEdit }: { onAdd: () => void; onEdit: (s: Subscription) => void }) {
  const subs = useSubsStore((s) => s.subs)
  const reorder = useSubsStore((s) => s.reorderSubs)
  const update = useSubsStore((s) => s.updateSub)
  const bulkSetActive = useSubsStore((s) => s.bulkSetActive)
  const bulkSetCategory = useSubsStore((s) => s.bulkSetCategory)
  const bulkRemove = useSubsStore((s) => s.bulkRemove)
  const totals = useTotals()

  const [q, setQ] = React.useState('')
  const [status, setStatus] = React.useState<StatusFilter>('all')
  const [category, setCategory] = React.useState<string>('all')
  const [sort, setSort] = React.useState<SortKey>('manual')
  const [view, setView] = React.useState<ViewMode>('list')
  const [showFilters, setShowFilters] = React.useState(false)
  const [sel, setSel] = React.useState<Set<string>>(new Set())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const usedCategories = React.useMemo(() => {
    const set = new Set(subs.map((s) => s.category))
    return CATEGORIES.filter((c) => set.has(c))
  }, [subs])

  const list = React.useMemo(() => {
    let r = [...subs]
    if (status === 'pending') r = r.filter((x) => x.active && x.decision === 'pending')
    if (status === 'release') r = r.filter((x) => x.decision === 'release' || !x.active)
    if (status === 'due') r = r.filter((x) => x.active && daysUntil(x.nextDate) <= 7)
    if (category !== 'all') r = r.filter((x) => x.category === category)
    const needle = q.trim().toLowerCase()
    if (needle) {
      r = r.filter(
        (x) =>
          x.name.toLowerCase().includes(needle) ||
          x.category.toLowerCase().includes(needle) ||
          (x.note ?? '').toLowerCase().includes(needle)
      )
    }
    switch (sort) {
      case 'date':
        r.sort((a, b) => daysUntil(a.nextDate) - daysUntil(b.nextDate))
        break
      case 'amount':
        r.sort((a, b) => monthlyOf(b, totals.toCny) - monthlyOf(a, totals.toCny))
        break
      case 'category':
        r.sort((a, b) => a.category.localeCompare(b.category, 'zh') || a.name.localeCompare(b.name, 'zh'))
        break
      case 'name':
        r.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
        break
      default:
        r.sort((a, b) => a.sort - b.sort)
    }
    return r
  }, [subs, status, category, q, sort, totals.toCny])

  /** 按分类排序时分组显示 */
  const groups = React.useMemo(() => {
    if (sort !== 'category') return null
    const map = new Map<string, Subscription[]>()
    list.forEach((s) => {
      const arr = map.get(s.category) ?? []
      arr.push(s)
      map.set(s.category, arr)
    })
    return [...map.entries()]
  }, [list, sort])

  const onDragEnd = (e: DragEndEvent) => {
    if (sort !== 'manual') return
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = list.map((x) => x.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    reorder(arrayMove(ids, from, to))
  }

  const allSelected = list.length > 0 && list.every((x) => sel.has(x.id))
  const toggleAll = () => setSel(allSelected ? new Set() : new Set(list.map((x) => x.id)))
  const selIds = [...sel]
  const selMonthly = subs.filter((s) => sel.has(s.id)).reduce((a, s) => a + monthlyOf(s, totals.toCny), 0)
  const activeFilters = (status !== 'all' ? 1 : 0) + (category !== 'all' ? 1 : 0) + (sort !== 'manual' ? 1 : 0)

  const rowProps = (sub: Subscription) => ({
    sub,
    selected: sel.has(sub.id),
    onSelect: () =>
      setSel((prev) => {
        const n = new Set(prev)
        n.has(sub.id) ? n.delete(sub.id) : n.add(sub.id)
        return n
      }),
    onEdit: () => onEdit(sub),
    onToggle: () => {
      update(sub.id, { active: !sub.active, decision: sub.active ? 'release' : 'pending' })
      toast.success(sub.active ? `已标记放掉 ${sub.name}` : `已恢复 ${sub.name}`)
    },
    monthly: monthlyOf(sub, totals.toCny),
  })

  return (
    <div className="mx-auto w-full max-w-[860px] space-y-4 pb-24">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-[22px] font-semibold tracking-[.01em] text-paper">全部订阅</h1>
          <p className="hint mt-1">
            {totals.activeCount} 项在用 · 每月 {fmtMoney(totals.monthly)} · 共 {subs.length} 条记录
          </p>
        </div>
        <Button onClick={onAdd} size="sm">
          <Plus className="h-3.5 w-3.5" /> 添加订阅
        </Button>
      </header>

      {/* ═══ 工具栏（吸顶） ═══ */}
      <GlassCard className="sticky top-2 z-30 p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-paper-faint" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索订阅、分类或备注"
              className="h-9 pl-9 text-[12.5px]"
              aria-label="搜索订阅"
            />
          </div>

          <div className="flex items-center gap-0.5 rounded-xl border border-line bg-ink-900/40 p-0.5">
            {STATUS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatus(f.key)}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-[11.5px] transition-colors',
                  status === f.key ? 'bg-accent/14 text-paper' : 'text-paper-mute hover:text-paper-soft'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Button
            variant={showFilters || activeFilters > 0 ? 'soft' : 'ghost'}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            筛选
            {activeFilters > 0 && (
              <span className="ml-0.5 rounded-full bg-accent/25 px-1 text-[10px] text-accent">{activeFilters}</span>
            )}
          </Button>

          <div className="flex items-center gap-0.5 rounded-xl border border-line bg-ink-900/40 p-0.5">
            {(
              [
                ['list', LayoutList],
                ['grid', LayoutGrid],
              ] as const
            ).map(([v, Icon]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-label={v === 'list' ? '列表视图' : '卡片视图'}
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-lg transition-colors',
                  view === v ? 'bg-accent/14 text-paper' : 'text-paper-faint hover:text-paper-soft'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line/60 pt-2.5">
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="h-8 w-[132px] text-[11.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="h-4 w-px bg-line" />

              <button
                onClick={() => setCategory('all')}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                  category === 'all'
                    ? 'border-accent/40 bg-accent/12 text-paper'
                    : 'border-line text-paper-mute hover:border-line-strong'
                )}
              >
                全部分类
              </button>
              {usedCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(category === c ? 'all' : c)}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                    category === c
                      ? 'border-accent/40 bg-accent/12 text-paper'
                      : 'border-line text-paper-mute hover:border-line-strong'
                  )}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: CATEGORY_TINT[c] ?? 'hsl(var(--accent))' }}
                  />
                  {c}
                  <span className="text-paper-faint">{subs.filter((s) => s.category === c).length}</span>
                </button>
              ))}

              {activeFilters > 0 && (
                <button
                  onClick={() => {
                    setCategory('all')
                    setStatus('all')
                    setSort('manual')
                  }}
                  className="ml-auto text-[11px] text-accent/80 hover:text-accent"
                >
                  清除筛选
                </button>
              )}
            </div>
          </motion.div>
        )}
      </GlassCard>

      {/* ═══ 计数 / 全选 ═══ */}
      <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 text-paper-mute transition-colors hover:text-paper"
        >
          {allSelected ? <CheckSquare className="h-3.5 w-3.5 text-accent" /> : <Square className="h-3.5 w-3.5" />}
          全选
        </button>
        <span className="text-paper-faint">
          显示 {list.length} 条
          {groups && ` · ${groups.length} 个分类`}
        </span>
        {sort === 'manual' && view === 'list' && (
          <span className="ml-auto text-paper-faint">拖动左侧手柄可调整顺序</span>
        )}
      </div>

      {/* ═══ 内容 ═══ */}
      {list.length === 0 ? (
        <GlassCard className="p-6">
          <EmptyState
            title={q || category !== 'all' || status !== 'all' ? '没有符合条件的订阅' : '这里还是空的'}
            hint={
              q || category !== 'all' || status !== 'all'
                ? '换个关键词或筛选条件试试。'
                : '添加一条订阅，或从内置名单里挑。'
            }
            action={
              <Button size="sm" onClick={onAdd}>
                <Plus className="h-3.5 w-3.5" /> 添加
              </Button>
            }
          />
        </GlassCard>
      ) : groups ? (
        /* —— 按分类分组 —— */
        <div className="space-y-5">
          {groups.map(([cat, items]) => {
            const sub = items.reduce((a, s) => a + monthlyOf(s, totals.toCny), 0)
            return (
              <section key={cat}>
                <div className="mb-2 flex items-baseline gap-2 px-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: CATEGORY_TINT[cat] ?? 'hsl(var(--accent))' }}
                  />
                  <h2 className="serif text-[14px] font-semibold text-paper">{cat}</h2>
                  <span className="text-[11px] text-paper-faint">
                    {items.length} 项 · {fmtMoney(sub)}/月
                  </span>
                </div>
                <div className={view === 'grid' ? 'grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-0.5'}>
                  {items.map((s) =>
                    view === 'grid' ? (
                      <SubCard key={s.id} {...rowProps(s)} />
                    ) : (
                      <ListRow key={s.id} {...rowProps(s)} />
                    )
                  )}
                </div>
              </section>
            )
          })}
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <SubCard key={s.id} {...rowProps(s)} />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={list.map((x) => x.id)} strategy={verticalListSortingStrategy}>
            <div>
              <ListHeader />
            </div>
            <motion.div layout className="space-y-0.5">
              {list.map((s) => (
                <SortableListRow key={s.id} {...rowProps(s)} draggable={sort === 'manual'} />
              ))}
            </motion.div>
          </SortableContext>
        </DndContext>
      )}

      {/* ═══ 多选浮动条 ═══ */}
      <AnimatePresence>
        {sel.size > 0 && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 lg:bottom-6"
          >
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-line-strong/80 bg-ink-850/96 px-2.5 py-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,.9)] backdrop-blur-2xl">
              <span className="px-1 text-[11.5px] text-paper-soft">
                已选 <span className="text-paper">{sel.size}</span> 项
                {selMonthly > 0 && <span className="ml-1 text-paper-faint">· {fmtMoney(selMonthly)}/月</span>}
              </span>
              <div className="h-4 w-px bg-line" />
              <Button
                variant="soft"
                size="sm"
                onClick={() => {
                  bulkSetActive(selIds, false)
                  toast.success(`已标记 ${selIds.length} 项放手`)
                  setSel(new Set())
                }}
              >
                放手
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  bulkSetActive(selIds, true)
                  toast.success(`已恢复 ${selIds.length} 项`)
                  setSel(new Set())
                }}
              >
                恢复
              </Button>
              <Select
                value=""
                onValueChange={(v) => {
                  if (!v) return
                  bulkSetCategory(selIds, v)
                  toast.success(`已改到「${v}」`)
                  setSel(new Set())
                }}
              >
                <SelectTrigger className="h-8 w-[92px] text-[11.5px]">
                  <SelectValue placeholder="改分类" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (!confirm(`删除选中的 ${selIds.length} 条记录？`)) return
                  bulkRemove(selIds)
                  toast.success('已删除')
                  setSel(new Set())
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="iconSm" onClick={() => setSel(new Set())} aria-label="取消选择">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}






