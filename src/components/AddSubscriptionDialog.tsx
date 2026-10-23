import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, ChevronRight, ImagePlus, Link2, Trash2, Check, ChevronDown } from 'lucide-react'
import { useSubsStore } from '@/store/useSubsStore'
import { CATEGORIES, CATEGORY_TINT, PRESETS, nameFromHost, type Preset } from '@/lib/catalog'
import { CURRENCIES, CURRENCY_META, CYCLE_META, CYCLE_ORDER, isRecurring } from '@/lib/money'
import { rollForward, todayISO } from '@/lib/date'
import { cn, publicHost } from '@/lib/utils'
import type { Cycle, Subscription } from '@/lib/types'
import { fetchIcon } from '@/lib/fx'
import { ServiceGlyph } from '@/components/ambient'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  RadioGroup,
  SegOption,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui'

export function AddSubscriptionDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing?: Subscription | null
}) {
  const addSub = useSubsStore((s) => s.addSub)
  const updateSub = useSubsStore((s) => s.updateSub)
  const removeSub = useSubsStore((s) => s.removeSub)

  const [step, setStep] = React.useState<'pick' | 'form'>('form')
  const [q, setQ] = React.useState('')
  const [name, setName] = React.useState('')
  const [amount, setAmount] = React.useState('')
  const [currency, setCurrency] = React.useState('CNY')
  const [cycle, setCycle] = React.useState<Cycle>('monthly')
  const [nextDate, setNextDate] = React.useState(todayISO())
  const [category, setCategory] = React.useState<string>('工具')
  const [tint, setTint] = React.useState<string>(CATEGORY_TINT['工具'])
  const [iconImage, setIconImage] = React.useState<string | undefined>(undefined)
  const [note, setNote] = React.useState('')
  const [site, setSite] = React.useState('')
  const [showSiteInput, setShowSiteInput] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const reset = React.useCallback(() => {
    setStep('form')
    setQ('')
    setName('')
    setAmount('')
    setCurrency('CNY')
    setCycle('monthly')
    setNextDate(rollForward(todayISO(), 'monthly'))
    setCategory('工具')
    setTint(CATEGORY_TINT['工具'])
    setIconImage(undefined)
    setNote('')
    setSite('')
    setShowSiteInput(false)
  }, [])

  React.useEffect(() => {
    if (!open) return
    if (editing) {
      setStep('form')
      setName(editing.name)
      setAmount(String(editing.amount))
      setCurrency(editing.currency)
      setCycle(editing.cycle)
      setNextDate(editing.nextDate)
      setCategory(editing.category)
      setTint(editing.tint ?? CATEGORY_TINT[editing.category] ?? CATEGORY_TINT['工具'])
      setIconImage(editing.iconKind === 'image' ? editing.iconValue : undefined)
      setNote(editing.note ?? '')
      setSite(editing.website ?? '')
    } else {
      reset()
    }
  }, [open, editing, reset])

  const iconQuery = useQuery({
    queryKey: ['icon', site],
    queryFn: ({ signal }) => fetchIcon(publicHost(site) ?? '', signal),
    enabled: false,
    retry: 0,
  })

  React.useEffect(() => {
    if (iconQuery.data) {
      setIconImage(iconQuery.data)
      toast.success('已匹配图标')
    }
  }, [iconQuery.data])

  React.useEffect(() => {
    if (iconQuery.error) toast.error('暂时没取得图标，可用内置色块或上传图片。')
  }, [iconQuery.error])

  const filtered = React.useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return PRESETS
    return PRESETS.filter(
      (p) => p.name.toLowerCase().includes(n) || p.category.toLowerCase().includes(n)
    )
  }, [q])

  const applyPreset = (p: Preset) => {
    setName(p.name)
    setCategory(p.category)
    setTint(p.tint)
    setSite(p.website ?? '')
    setCycle('monthly')
    setNextDate(rollForward(todayISO(), 'monthly'))
    setStep('form')
  }

  const onCategory = (c: string) => {
    setCategory(c)
    if (!editing?.tint || category !== c) setTint(CATEGORY_TINT[c] ?? CATEGORY_TINT['工具'])
  }

  const save = () => {
    const n = name.trim()
    const a = Number(amount)
    if (!n) return toast.error('给这条订阅起个名字吧。')
    if (!Number.isFinite(a) || a < 0) return toast.error('金额要填一个不小于 0 的数字。')

    const payload = {
      name: n,
      amount: a,
      currency,
      cycle,
      nextDate: nextDate || todayISO(),
      category,
      iconKind: (iconImage ? 'image' : 'letter') as 'image' | 'letter',
      iconValue: iconImage,
      tint,
      note: note.trim() || undefined,
      website: site.trim() || undefined,
      decision: 'pending' as const,
    }

    if (editing) {
      updateSub(editing.id, payload)
      toast.success('已保存')
    } else {
      addSub(payload)
      toast.success(`加了一条 ${n}`)
    }
    onOpenChange(false)
  }

  const isEdit = !!editing

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,600px)]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑订阅' : '添加订阅'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '改完保存即可，历史决策记录会保留。' : '可以先用内置名单，也可以直接填。'}
          </DialogDescription>
        </DialogHeader>

        {step === 'pick' ? (
          <>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-paper-faint" />
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索平台，如 Gemini、哔哩哔哩"
                className="h-9 pl-9 text-[12.5px]"
              />
            </div>
            <div className="max-h-[46vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-1">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-paper/[.05]"
                  >
                    <ServiceGlyph name={p.name} tint={p.tint} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] text-paper">{p.name}</span>
                      <span className="block truncate text-[10.5px] text-paper-faint">{p.category}</span>
                    </span>
                  </button>
                ))}
                {!filtered.length && (
                  <p className="col-span-2 hint py-8 text-center">没有匹配的预设，直接自定义吧。</p>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <button
                onClick={() => setStep('form')}
                className="flex w-full items-center justify-between rounded-xl border border-line bg-ink-900/40 px-3 py-2.5 text-[12.5px] text-paper-soft transition-colors hover:border-line-strong"
              >
                添加上方未包含的软件
                <ChevronRight className="h-3.5 w-3.5 text-paper-faint" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              {/* 名称 + 图标 */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label htmlFor="sub-name">名称</Label>
                  <Input
                    id="sub-name"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如 ChatGPT Plus"
                  />
                </div>
                <div className="shrink-0">
                  <Label>图标</Label>
                  <div className="flex items-center gap-1.5">
                    <ServiceGlyph name={name || '·'} tint={tint} image={iconImage} size={36} />
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => fileRef.current?.click()}
                      aria-label="上传图标"
                      title="上传图片"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => setShowSiteInput((v) => !v)}
                      aria-label="从官网获取图标"
                      title="从官网获取"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      if (f.size > 2 * 1024 * 1024) {
                        toast.error('图片请小于 2 MB。')
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = () => {
                        setIconImage(String(reader.result))
                        toast.success('图标已换')
                      }
                      reader.readAsDataURL(f)
                      e.target.value = ''
                    }}
                  />
                </div>
              </div>

              {showSiteInput && (
                <div className="flex items-end gap-2 rounded-xl border border-line bg-ink-900/30 p-2.5">
                  <div className="flex-1">
                    <Label htmlFor="site">官网地址</Label>
                    <Input
                      id="site"
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      placeholder="例如 chatgpt.com"
                      className="h-9 text-[12.5px]"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="soft"
                    disabled={iconQuery.isFetching}
                    onClick={() => {
                      if (!publicHost(site)) return toast.error('请填公开网站的域名，不要内网地址或带账号的网址。')
                      iconQuery.refetch()
                    }}
                  >
                    {iconQuery.isFetching ? '获取中' : '获取图标'}
                  </Button>
                </div>
              )}

              {/* 金额 + 币种 */}
              <div className="grid grid-cols-[1fr_112px] gap-2">
                <div>
                  <Label htmlFor="amount">金额</Label>
                  <Input
                    id="amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>币种</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 周期 */}
              <div>
                <Label>周期</Label>
                <RadioGroup
                  value={cycle}
                  onValueChange={(v) => {
                    setCycle(v as Cycle)
                    setNextDate(rollForward(todayISO(), v as Cycle))
                  }}
                  className="flex gap-1.5"
                >
                  {CYCLE_ORDER.map((c) => (
                    <SegOption key={c} value={c} label={CYCLE_META[c].label} />
                  ))}
                </RadioGroup>
              </div>

              {/* 日期 + 分类 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="next">{isRecurring(cycle) ? '下次续费' : '购买日期'}</Label>
                  <Input
                    id="next"
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>类别</Label>
                  <Select value={category} onValueChange={onCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isRecurring(cycle) && (
                <p className="hint -mt-2 flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-accent" />
                  到期会自动扣款 · 提前 3 天问你
                </p>
              )}

              {/* 备注 */}
              <div>
                <Label htmlFor="note">留句话</Label>
                <Textarea
                  id="note"
                  rows={2}
                  maxLength={80}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="如果下个月用得少，就换回免费版。"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              {isEdit && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm(`删除「${editing?.name}」这条记录？`)) {
                      removeSub(editing!.id)
                      toast.success('已删除')
                      onOpenChange(false)
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> 删除
                </Button>
              )}
              {!isEdit && (
                <Button variant="ghost" size="sm" onClick={() => setStep('pick')}>
                  <ChevronDown className="h-3.5 w-3.5 rotate-90" /> 选预设
                </Button>
              )}
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <Button size="sm" onClick={save}>
                  保存
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
