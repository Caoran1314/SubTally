import * as React from 'react'
import { motion } from 'motion/react'
import { LayoutDashboard, ListOrdered, ChartNoAxesColumn, Settings as SettingsIcon, Plus, Moon, Sun, Palette, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSubsStore } from '@/store/useSubsStore'
import { AmbientLight, BrandMark, DialAvatar } from './ambient'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, TooltipProvider, Tooltip } from './ui'
import type { Accent } from '@/lib/types'

export type TabKey = 'overview' | 'subs' | 'stats' | 'settings'

const NAV: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: '总览', icon: LayoutDashboard },
  { key: 'subs', label: '全部订阅', icon: ListOrdered },
  { key: 'stats', label: '统计', icon: ChartNoAxesColumn },
  { key: 'settings', label: '设置', icon: SettingsIcon },
]

export const ACCENTS: { key: Accent; label: string; hint: string; color: string }[] = [
  { key: 'rose', label: '藕粉', hint: '灰调豆沙与干枯玫瑰', color: 'hsl(350 44% 74%)' },
  { key: 'violet', label: '藤紫', hint: '暗处的一点紫', color: 'hsl(274 26% 74%)' },
  { key: 'qiuxiang', label: '秋香', hint: '干草与旧纸', color: 'hsl(42 36% 67%)' },
  { key: 'sage', label: '灰绿', hint: '雨后植物', color: 'hsl(136 15% 68%)' },
]

export function useAppearance() {
  const mode = useSubsStore((s) => s.settings.mode)
  const accent = useSubsStore((s) => s.settings.accent)
  const patch = useSubsStore((s) => s.patchSettings)

  React.useEffect(() => {
    document.documentElement.dataset.mode = mode
    document.documentElement.dataset.accent = accent
    document.documentElement.style.colorScheme = mode
  }, [mode, accent])

  return {
    mode,
    accent,
    toggleMode: () => patch({ mode: mode === 'dark' ? 'light' : 'dark' }),
    setAccent: (a: Accent) => patch({ accent: a }),
  }
}

/* ————————————————————————— 外观按钮 ————————————————————————— */

export function AppearanceMenu() {
  const { mode, accent, toggleMode, setAccent } = useAppearance()
  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="强调色">
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>强调色</DropdownMenuLabel>
          {ACCENTS.map((a) => (
            <DropdownMenuItem key={a.key} onSelect={() => setAccent(a.key)}>
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: a.color, boxShadow: `0 0 10px ${a.color}` }}
              />
              <span className="flex-1">{a.label}</span>
              <span className="text-[10.5px] text-paper-faint">{a.hint}</span>
              {accent === a.key && <Check className="h-3.5 w-3.5 text-accent" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={toggleMode}>
            {mode === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            <span>{mode === 'dark' ? '换成白天' : '换成夜里'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" size="icon" onClick={toggleMode} aria-label={mode === 'dark' ? '换成白天' : '换成夜里'}>
        {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  )
}

/* ————————————————————————— 外壳 ————————————————————————— */

export function AppShell({
  tab,
  onTab,
  onAdd,
  children,
}: {
  tab: TabKey
  onTab: (t: TabKey) => void
  onAdd: () => void
  children: React.ReactNode
}) {
  const settings = useSubsStore((s) => s.settings)
  const nick = settings.nickname?.trim()

  return (
    <TooltipProvider>
      <AmbientLight />
      <div className="relative flex min-h-dvh">
        {/* —— 桌面侧栏 —— */}
        <aside className="sticky top-0 hidden h-dvh w-[212px] shrink-0 flex-col justify-between px-4 py-6 lg:flex">
          <div>
            <div className="mb-8 px-2">
              <BrandMark />
            </div>
            <nav className="space-y-1">
              {NAV.map((n) => {
                const active = tab === n.key
                return (
                  <button
                    key={n.key}
                    onClick={() => onTab(n.key)}
                    className={cn(
                      'relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all duration-200 tap',
                      active ? 'text-paper' : 'text-paper-mute hover:bg-paper/[.045] hover:text-paper-soft'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl border border-accent/24 bg-accent/11"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <n.icon className={cn('relative h-4 w-4', active && 'text-accent')} />
                    <span className="relative">{n.label}</span>
                  </button>
                )
              })}
            </nav>
            <div className="mt-5 px-1">
              <Button className="w-full" onClick={onAdd}>
                <Plus className="h-4 w-4" /> 添加订阅
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="ruled" />
            <div className="flex items-center gap-2.5 px-2">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-line bg-ink-800/70">
                {settings.avatar && settings.avatar !== 'feather' && settings.avatar !== 'ring' ? (
                  <img src={settings.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <DialAvatar className="h-4 w-4 text-accent" />
                )}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] text-paper-soft">{nick || '还没有昵称'}</div>
                <div className="text-[10.5px] text-paper-faint">只在本地</div>
              </div>
            </div>
            <div className="flex items-center justify-between px-1">
              <AppearanceMenu />
              <span className="text-[10px] tracking-[.12em] text-paper-faint">v1.0</span>
            </div>
          </div>
        </aside>

        {/* —— 主区 —— */}
        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-8">
          {/* 手机顶栏 */}
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <BrandMark />
            <div className="flex items-center gap-1">
              <AppearanceMenu />
              <Tooltip content="添加订阅">
                <Button size="icon" onClick={onAdd} aria-label="添加订阅">
                  <Plus className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 0.8, 0.3, 1] }}
            className="mx-auto w-full max-w-[1080px]"
          >
            {children}
          </motion.div>
        </main>

        {/* —— 手机底栏 —— */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-ink-950/86 backdrop-blur-2xl lg:hidden">
          <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1.5">
            {NAV.map((n) => {
              const active = tab === n.key
              return (
                <button
                  key={n.key}
                  onClick={() => onTab(n.key)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10.5px] transition-colors tap',
                    active ? 'text-accent' : 'text-paper-faint'
                  )}
                >
                  <n.icon className="h-[18px] w-[18px]" />
                  <span>{n.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  )
}


