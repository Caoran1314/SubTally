import * as React from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Check, HardDrive, Wifi, Sparkles } from 'lucide-react'
import { useSubsStore, ensureSeeded } from '@/store/useSubsStore'
import { AmbientLight, DialAvatar, DialRing, BrandMark, GlassCard } from '@/components/ambient'
import { Button, Input, Label } from '@/components/ui'
import { AppearanceMenu } from '@/components/AppShell'
import { cn } from '@/lib/utils'

const POINTS = [
  { n: '1', text: '各类订阅，集中管理' },
  { n: '2', text: '续费前提醒，留出决定的时间' },
  { n: '3', text: '每月花费与分类支出，一眼看清' },
]

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative min-h-dvh">
      <AmbientLight />
      <div className="absolute right-4 top-4 z-10">
        <AppearanceMenu />
      </div>

      <div className="mx-auto grid min-h-dvh w-full max-w-[1180px] items-center gap-10 px-6 py-16 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
        {/* 左：宣言 */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 0.8, 0.3, 1] }}
        >
          <div className="mb-9 pl-1">
            <BrandMark />
          </div>

          <h1 className="serif text-balance text-[clamp(34px,5.2vw,58px)] font-semibold leading-[1.22] tracking-[.01em] text-paper">
            把订阅理清，
            <br />
            把选择留给自己。
          </h1>

          <div className="my-8 max-w-[420px]">
            <div className="ruled" />
          </div>

          <ul className="space-y-3.5">
            {POINTS.map((p, i) => (
              <motion.li
                key={p.n}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.09, duration: 0.5 }}
                className="flex items-center gap-4"
              >
                <span className="numeral w-4 text-[13px] text-accent/72">{p.n}</span>
                <span className="text-[13.5px] text-paper-soft">{p.text}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* 右：玻璃说明卡 */}
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 0.8, 0.3, 1] }}
        >
          <GlassCard glow className="p-7 sm:p-8">
            <h2 className="serif text-[19px] font-semibold tracking-[.01em] text-paper">本地存储，仅你可见</h2>
            <p className="mt-1.5 text-[12.5px] text-paper-mute">无需账号，打开就能开始整理。</p>

            <div className="mt-6 space-y-5">
              <Feature
                icon={<HardDrive className="h-3.5 w-3.5" />}
                title="本地保存"
                desc="记录留在当前浏览器，不会自动上传或同步。"
              />
              <Feature
                icon={<Wifi className="h-3.5 w-3.5" />}
                title="由你选择联网"
                desc="日常记录可离线使用；更新汇率、获取官网图标前会先征得你同意。"
              />
            </div>

            <Button size="lg" className="mt-7 w-full" onClick={onStart}>
              开始使用 <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="mt-4 text-[11px] leading-relaxed text-paper-faint">
              共用同一浏览器会看到同一份记录。换设备或清除浏览器数据前，记得导出备份。
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-[12.5px] font-medium text-paper-soft">
        <span className="grid h-5 w-5 place-items-center rounded-md border border-line bg-ink-800/60 text-accent">
          {icon}
        </span>
        {title}
      </div>
      <p className="text-[11.5px] leading-relaxed text-paper-mute">{desc}</p>
    </div>
  )
}

/* ————————————————————————— 引导 ————————————————————————— */

export function Onboarding({ onDone }: { onDone: () => void }) {
  const settings = useSubsStore((s) => s.settings)
  const patch = useSubsStore((s) => s.patchSettings)
  const [nick, setNick] = React.useState(settings.nickname)
  const [err, setErr] = React.useState('')

  const submit = () => {
    const t = nick.trim()
    if (t.length < 1 || t.length > 24) {
      setErr('填写一个 1–24 字的昵称吧。')
      return
    }
    patch({ nickname: t, onboarded: true })
    ensureSeeded()
    onDone()
  }

  return (
    <div className="relative grid min-h-dvh place-items-center px-6">
      <AmbientLight />
      <div className="absolute right-4 top-4">
        <AppearanceMenu />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 0.8, 0.3, 1] }}
        className="w-full max-w-[440px]"
      >
        <div className="mb-7 text-center">
          <div className="mb-5 flex justify-center">
            <BrandMark />
          </div>
          <h1 className="serif text-[24px] font-semibold text-paper">先认识一下。</h1>
          <p className="hint mt-1.5">昵称和头像只保存在这个浏览器。</p>
        </div>

        <GlassCard glow className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-accent/30 bg-accent/10">
              <DialAvatar className="h-6 w-6 text-accent" />
            </span>
            <div className="flex-1">
              <Label>选择头像</Label>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-paper-soft">使用刻度环</span>
                <Check className="h-3 w-3 text-accent" />
              </div>
            </div>
          </div>

          <Label htmlFor="nickname">怎么称呼你</Label>
          <Input
            id="nickname"
            autoFocus
            maxLength={24}
            value={nick}
            onChange={(e) => {
              setNick(e.target.value)
              setErr('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="一个昵称，1–24 字"
            className={cn(err && 'border-danger/60')}
          />
          {err && <p className="mt-1.5 text-[11.5px] text-danger">{err}</p>}

          <Button size="lg" className="mt-6 w-full" onClick={submit}>
            <Sparkles className="h-4 w-4" /> 保存并开始
          </Button>

          <button
            onClick={() => {
              patch({ nickname: '旅人', onboarded: true })
              ensureSeeded()
              onDone()
            }}
            className="mt-3 w-full text-center text-[11.5px] text-paper-faint transition-colors hover:text-paper-mute"
          >
            先跳过，直接开始
          </button>
        </GlassCard>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-paper-faint">
          <DialRing className="h-3 w-3" />
          一圈刻度 · 数据不离开这台设备
        </p>
      </motion.div>
    </div>
  )
}

