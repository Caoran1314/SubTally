import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  Sparkles,
  Palette as PaletteIcon,
  User,
  Coins,
  BellRing,
  HardDriveDownload,
  Target,
  Database,
} from 'lucide-react'
import { useSubsStore } from '@/store/useSubsStore'
import { fetchRates, readFxCache } from '@/lib/fx'
import { CURRENCIES, CURRENCY_META } from '@/lib/money'
import { download } from '@/lib/utils'
import { GlassCard, SectionTitle } from '@/components/ambient'
import { Badge, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, Switch } from '@/components/ui'
import { ACCENTS, useAppearance } from '@/components/AppShell'
import type { Accent } from '@/lib/types'

function Row({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-paper">{title}</div>
        {desc && <div className="mt-0.5 text-[11.5px] leading-relaxed text-paper-faint">{desc}</div>}
      </div>
      {children}
    </div>
  )
}

export function SettingsPage() {
  const settings = useSubsStore((s) => s.settings)
  const patch = useSubsStore((s) => s.patchSettings)
  const fx = useSubsStore((s) => s.fx)
  const setFx = useSubsStore((s) => s.setFx)
  const subs = useSubsStore((s) => s.subs)
  const snapshots = useSubsStore((s) => s.snapshots)
  const decisions = useSubsStore((s) => s.decisions)
  const exportAll = useSubsStore((s) => s.exportAll)
  const importAll = useSubsStore((s) => s.importAll)
  const restorePresets = useSubsStore((s) => s.restorePresets)
  const clearAll = useSubsStore((s) => s.clearAll)
  const { setAccent } = useAppearance()
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [budgetDraft, setBudgetDraft] = React.useState(settings.budget ? String(settings.budget) : '')
  const dataSize = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('subs.state.v1') || ''
      return new Blob([raw]).size
    } catch {
      return 0
    }
  }, [subs, settings, decisions, snapshots])

  const ratesQuery = useQuery({
    queryKey: ['fx'],
    queryFn: ({ signal }) => fetchRates(signal),
    enabled: false,
    retry: 0,
  })

  const cached = React.useMemo(() => fx ?? readFxCache(), [fx])

  React.useEffect(() => {
    if (ratesQuery.data) {
      setFx(ratesQuery.data)
      toast.success(`汇率已更新到 ${ratesQuery.data.date}`)
    }
  }, [ratesQuery.data, setFx])

  React.useEffect(() => {
    if (ratesQuery.error) toast.error('汇率服务暂时连不上，继续用已保存的汇率。')
  }, [ratesQuery.error])

  return (
    <div className="space-y-5">
      <header>
        <h1 className="serif text-[22px] font-semibold tracking-[.01em] text-paper">设置与备份</h1>
        <p className="hint mt-1">所有记录只存在这台设备的浏览器里，不会自动上传或同步。</p>
      </header>

      {/* 外观 */}
      <GlassCard className="p-5">
        <SectionTitle aside={<PaletteIcon className="h-3.5 w-3.5 text-paper-faint" />}>外观</SectionTitle>
        <Row title="明暗" desc="夜里偏暖，白天偏纸。">
          <div className="flex gap-1 rounded-xl border border-line bg-ink-900/40 p-0.5">
            {[
              { k: 'dark', label: '夜里' },
              { k: 'light', label: '白天' },
            ].map((m) => (
              <button
                key={m.k}
                onClick={() => patch({ mode: m.k as 'dark' | 'light' })}
                className={
                  'rounded-lg px-3 py-1.5 text-[11.5px] transition-colors ' +
                  (settings.mode === m.k ? 'bg-accent/14 text-paper' : 'text-paper-mute hover:text-paper-soft')
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </Row>
        <Separator />
        <Row title="强调色" desc="四种植物的颜色，四种植物的心情。">
          <div className="flex gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.key}
                onClick={() => setAccent(a.key as Accent)}
                title={`${a.label} · ${a.hint}`}
                className={
                  'relative grid h-8 w-8 place-items-center rounded-full border transition-all ' +
                  (settings.accent === a.key
                    ? 'border-paper/60 scale-105'
                    : 'border-transparent hover:border-line-strong')
                }
                style={{ background: a.color }}
                aria-label={a.label}
              >
                {settings.accent === a.key && <Check className="h-3.5 w-3.5 text-ink-950" />}
              </button>
            ))}
          </div>
        </Row>
      </GlassCard>

      {/* 个人 */}
      <GlassCard className="p-5">
        <SectionTitle aside={<User className="h-3.5 w-3.5 text-paper-faint" />}>个人</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <Label htmlFor="nick">怎么称呼你</Label>
            <Input
              id="nick"
              maxLength={24}
              value={settings.nickname}
              onChange={(e) => patch({ nickname: e.target.value })}
              placeholder="一个昵称，1–24 字"
            />
          </div>
          <div>
            <Label>头像</Label>
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-line bg-ink-800/70">
                {settings.avatar && settings.avatar !== 'feather' && settings.avatar !== 'ring' ? (
                  <img src={settings.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Sparkles className="h-4 w-4 text-accent" />
                )}
              </span>
              <Button variant="soft" size="sm" onClick={() => patch({ avatar: 'ring' })}>
                用刻度环
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 汇总与汇率 */}
      <GlassCard className="p-5">
        <SectionTitle aside={<Coins className="h-3.5 w-3.5 text-paper-faint" />}>汇总与汇率</SectionTitle>
        <Row title="汇总币种" desc="所有金额都会折算成这个币种来统计。">
          <Select value={settings.base} onValueChange={(v) => patch({ base: v })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c} · {CURRENCY_META[c]?.label ?? c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Separator />
        <Row
          title="参考汇率"
          desc="联网只发送币种代码，不发送任何订阅或个人数据。暂不联网时继续用浏览器里已保存的汇率。"
        >
          <div className="flex items-center gap-2">
            {cached ? <Badge tone="neutral">{cached.date}</Badge> : <Badge tone="accent">未更新</Badge>}
            <Button
              variant="soft"
              size="sm"
              onClick={() => ratesQuery.refetch()}
              disabled={ratesQuery.isFetching}
            >
              <RefreshCw className={ratesQuery.isFetching ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
              {ratesQuery.isFetching ? '更新中' : '联网更新'}
            </Button>
          </div>
        </Row>
      </GlassCard>

      {/* 预算 */}
      <GlassCard className="p-5">
        <SectionTitle aside={<Target className="h-3.5 w-3.5 text-paper-faint" />}>预算目标</SectionTitle>
        <Row
          title="每月预算"
          desc="设一个数，总览会显示已用比例；超了会用醒目颜色提示。留空或 0 表示不设。"
        >
          <div className="flex items-center gap-2">
            <Input
              inputMode="decimal"
              value={budgetDraft}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d.]/g, '')
                setBudgetDraft(v)
                const n = Number(v)
                patch({ budget: Number.isFinite(n) && n > 0 ? n : 0 })
              }}
              placeholder="0"
              className="h-9 w-[110px] text-right"
              aria-label="每月预算"
            />
            <span className="text-[11px] text-paper-faint">CNY / 月</span>
          </div>
        </Row>
      </GlassCard>

      {/* 提醒 */}
      <GlassCard className="p-5">
        <SectionTitle aside={<BellRing className="h-3.5 w-3.5 text-paper-faint" />}>续费提醒</SectionTitle>
        <Row title="续费前问我一句" desc="到期前几天在总览上问「还要不要」，决定留给你自己。">
          <Switch
            checked={settings.askBeforeRenew}
            onCheckedChange={(v) => patch({ askBeforeRenew: v })}
          />
        </Row>
        <Separator />
        <Row title="提前几天问" desc="默认 3 天。">
          <Select
            value={String(settings.askLeadDays)}
            onValueChange={(v) => patch({ askLeadDays: Number(v) })}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 5, 7, 14].map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d} 天
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
      </GlassCard>

      {/* 数据概况 */}
      <GlassCard className="p-5">
        <SectionTitle aside={<Database className="h-3.5 w-3.5 text-paper-faint" />}>数据概况</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['订阅记录', `${subs.length} 条`],
            ['分类', `${new Set(subs.map((s) => s.category)).size} 个`],
            ['快照 / 决策', `${snapshots.length} / ${decisions.length}`],
            ['本地占用', dataSize > 1024 ? `${(dataSize / 1024).toFixed(1)} KB` : `${dataSize} B`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-line/70 p-2.5">
              <div className="label-xs !text-[10px]">{k}</div>
              <div className="mt-1 serif text-[15px] text-paper">{v}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-paper-faint">
          全部数据都在浏览器 localStorage 的 <code className="text-paper-mute">subs.state.v1</code> 里。
          清除浏览器数据会一并清掉，记得先在下面导出备份。
        </p>
      </GlassCard>

      {/* 备份 */}
      <GlassCard className="p-5">
        <SectionTitle aside={<HardDriveDownload className="h-3.5 w-3.5 text-paper-faint" />}>设置与备份</SectionTitle>
        <Row title="导出备份" desc="得到一个 JSON 文件，换设备或清浏览器数据前记得存一份。">
          <Button
            variant="soft"
            size="sm"
            onClick={() => {
              download(`subs-backup-${new Date().toISOString().slice(0, 10)}.json`, exportAll())
              toast.success('备份已下载')
            }}
          >
            <Download className="h-3.5 w-3.5" /> 导出
          </Button>
        </Row>
        <Separator />
        <Row title="导入备份" desc="会覆盖当前所有记录。">
          <>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const text = await f.text()
                const r = importAll(text)
                if (r.ok) toast.success(r.message)
                else toast.error(r.message)
                e.target.value = ''
              }}
            />
            <Button variant="soft" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> 导入
            </Button>
          </>
        </Row>
        <Separator />
        <Row title="恢复内置名单" desc="把常见会员与 AI 套餐再补进列表，费用先留空，慢慢补。">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const n = restorePresets()
              if (n) toast.success(`从内置名单补了 ${n} 项`)
              else toast.message('内置名单里的项目都已经在列表里了。')
            }}
          >
            恢复
          </Button>
        </Row>
        <Separator />
        <Row title="清空重来" desc="记录会清掉，换成一小份示例。此操作不可撤销。">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm('确定清空当前所有记录，换成示例数据吗？')) {
                clearAll()
                toast.success('已重置为示例数据')
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> 清空
          </Button>
        </Row>
      </GlassCard>

      <p className="hint pb-2 text-center">
        Subs v1.0 · 本地优先 · 不收集任何数据
      </p>
    </div>
  )
}



