import * as React from 'react'
import { cn } from '@/lib/utils'
import { PRESETS } from '@/lib/catalog'

/* ============================================================
   SubTally 的识别：刻度环
   订阅的本质是「周期」——一圈刻度，一个标出当前位置的点。
   背景是几圈缓慢转动的细环 + 一团暖光；玻璃才有东西可透。
   ============================================================ */

export function AmbientLight({ intensity = 1 }: { intensity?: number }) {
  const motes = React.useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: (i * 37 + 11) % 100,
        size: 1 + ((i * 7) % 3),
        delay: -((i * 3.7) % 22),
        duration: 26 + ((i * 5) % 20),
        opacity: 0.14 + ((i % 5) * 0.06),
      })),
    []
  )

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 暖色深底 */}
      <div className="absolute inset-0 bg-ink-950" />

      {/* 三团会动的光 —— 只做氛围，不承载符号 */}
      <div
        className="absolute -left-[18%] -top-[26%] h-[76vw] w-[76vw] animate-drift rounded-full blur-[90px]"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, hsl(var(--accent-glow) / .34), hsl(var(--accent-glow) / .1) 45%, transparent 68%)',
          animationDuration: '34s',
          opacity: 0.7 * intensity,
        }}
      />
      <div
        className="absolute -right-[22%] top-[4%] h-[62vw] w-[62vw] animate-drift rounded-full blur-[100px]"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, hsl(28 62% 48% / .26), hsl(18 48% 30% / .1) 48%, transparent 70%)',
          animationDuration: '44s',
          animationDirection: 'alternate-reverse',
          opacity: 0.85 * intensity,
        }}
      />
      <div
        className="absolute -bottom-[30%] left-[18%] h-[70vw] w-[70vw] animate-drift rounded-full blur-[110px]"
        style={{
          background: 'radial-gradient(circle at 50% 50%, hsl(274 44% 40% / .2), transparent 66%)',
          animationDuration: '52s',
          opacity: 0.9 * intensity,
        }}
      />

      {/* 细尘 */}
      {motes.map((m, i) => (
        <span
          key={i}
          className="absolute bottom-[-6vh] rounded-full bg-paper"
          style={{
            left: `${m.left}%`,
            width: m.size,
            height: m.size,
            opacity: m.opacity,
            animation: `floatUp ${m.duration}s linear ${m.delay}s infinite`,
          }}
        />
      ))}

      {/* 刻度环：几圈极淡的细环，慢慢转。背景只留刻度，不画「位置点」 */}
      <DialRing
        className="absolute left-[10%] top-[14%] h-[20rem] w-[20rem] text-paper/[.032]"
        style={{ animation: 'spin 320s linear infinite' }}
        dot={false}
      />
      <DialRing
        className="absolute right-[6%] bottom-[10%] h-[26rem] w-[26rem] text-paper/[.026]"
        style={{ animation: 'spin 460s linear infinite reverse' }}
        dot={false}
      />
      <DialRing
        className="absolute left-[58%] top-[4%] h-[13rem] w-[13rem] text-paper/[.036]"
        style={{ animation: 'spin 240s linear infinite' }}
        ticks={24}
        dot={false}
      />

      {/* 暗角 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 34%, transparent 0%, transparent 42%, hsl(var(--ink-950) / var(--vignette)) 100%)',
        }}
      />
    </div>
  )
}

/* ————————————————————————— 刻度环 —————————————————————————
   外环 + 一圈内刻度 + 一个标出当前位置的点。
   ————————————————————————————————————————————— */

export function DialRing({
  className,
  style,
  ticks = 12,
  dot = true,
}: {
  className?: string
  style?: React.CSSProperties
  ticks?: number
  dot?: boolean
}) {
  // 用虚线做刻度：每条刻度长 1，间隔按周长均分
  const r = 9
  const circumference = 2 * Math.PI * r
  const cell = circumference / ticks
  const dash = `${Math.max(0.8, cell * 0.22)} ${Math.max(0.8, cell * 0.78)}`

  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} style={style} aria-hidden>
      {/* 外环 */}
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="0.7" opacity="0.75" />
      {/* 一圈刻度 */}
      <circle
        cx="16"
        cy="16"
        r={r}
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray={dash}
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* 当前位置的点：环外偏上 */}
      {dot && <circle cx="16" cy="2" r="1.7" fill="currentColor" />}
    </svg>
  )
}

/** 小程序同款图标：暖橙底 + 订阅卡片 + 完成徽标 */
export function BrandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 144 144" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="brand-bg" x1="0" y1="0" x2="0" y2="144" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D97A38" />
          <stop offset="1" stopColor="#B4581C" />
        </linearGradient>
      </defs>
      <rect width="144" height="144" rx="31" fill="url(#brand-bg)" />
      <rect x="30" y="28" width="84" height="88" rx="18" fill="#FFFDF9" />
      <rect x="43" y="44" width="22" height="7" rx="3.5" fill="#C96A2B" />
      <rect x="43" y="64" width="52" height="6" rx="3" fill="#EADFD4" />
      <rect x="43" y="78" width="40" height="6" rx="3" fill="#EADFD4" />
      <rect x="43" y="92" width="46" height="6" rx="3" fill="#EADFD4" />
      <circle cx="110" cy="108" r="22" fill="#FFFDF9" />
      <circle cx="110" cy="108" r="18" fill="#3D8A63" />
      <path d="M101 108l6 6 12-13" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** 品牌标记：小程序同款图标 + 字标 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <BrandIcon className="h-[20px] w-[20px]" />
      <span className="serif text-[17px] tracking-[.04em] text-paper">SubTally</span>
    </span>
  )
}

/** 头像用的刻度环（实心一些，小尺寸也认得出来） */
export function DialAvatar({ className }: { className?: string }) {
  const r = 9
  const cell = (2 * Math.PI * r) / 12
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <circle cx="16" cy="16" r="14.2" stroke="currentColor" strokeWidth="1.6" />
      <circle
        cx="16"
        cy="16"
        r={r}
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray={`${cell * 0.24} ${cell * 0.76}`}
        strokeLinecap="round"
      />
      <circle cx="16" cy="2.2" r="2.4" fill="currentColor" />
    </svg>
  )
}

/* ————————————————————————— 玻璃卡 ————————————————————————— */

export function GlassCard({
  className,
  children,
  glow = false,
  hairline = true,
  as: Tag = 'div',
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  glow?: boolean
  hairline?: boolean
  as?: React.ElementType
}) {
  return (
    <Tag
      className={cn(
        'glass relative overflow-hidden rounded-2xl',
        hairline && 'hairline',
        glow && 'softglow',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* ————————————————————————— 大数字 ————————————————————————— */

export function Numeral({
  value,
  unit,
  size = 'xl',
  className,
}: {
  value: React.ReactNode
  unit?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  className?: string
}) {
  const sizes = {
    sm: 'text-[20px]',
    md: 'text-[28px]',
    lg: 'text-[40px]',
    xl: 'text-[56px]',
    hero: 'text-[clamp(52px,9vw,104px)]',
  }
  return (
    <span className={cn('numeral inline-flex items-baseline gap-1.5', sizes[size], className)}>
      <span>{value}</span>
      {unit && (
        <span className="serif text-[0.32em] font-normal not-italic tracking-[.06em] text-paper-mute">
          {unit}
        </span>
      )}
    </span>
  )
}

/* ————————————————————————— 分节标题 ————————————————————————— */

export function SectionTitle({
  children,
  aside,
  className,
}: {
  children: React.ReactNode
  aside?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3.5 flex items-baseline justify-between gap-4', className)}>
      <h2 className="serif text-[15px] font-semibold tracking-[.02em] text-paper">{children}</h2>
      {aside && <div className="text-[11.5px] text-paper-faint">{aside}</div>}
    </div>
  )
}

/* ————————————————————————— 服务图标 —————————————————————————
   优先用打包在本地 presets/ 里的真实品牌图标（按名称自动匹配预设），
   用户自己上传的图片优先于预设；都没有时退回「品牌色块 + 衬线首字母」。
   ————————————————————————————————————————————— */

export function ServiceGlyph({
  name,
  tint,
  image,
  size = 40,
  className,
}: {
  name: string
  tint?: string
  image?: string
  size?: number
  className?: string
}) {
  const initial = (() => {
    const t = (name || '').trim()
    if (!t) return '·'
    return /^[A-Za-z]/.test(t) ? t[0].toUpperCase() : t[0]
  })()

  const preset = React.useMemo(
    () => PRESETS.find((p) => p.name === (name || '').trim()),
    [name]
  )
  const src = image || (preset ? `./presets/${preset.id}.png` : undefined)

  if (src) {
    return (
      <span
        className={cn('grid shrink-0 place-items-center overflow-hidden rounded-[11px]', className)}
        style={{
          width: size,
          height: size,
          background: 'rgba(250,248,246,.96)',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.10), 0 1px 2px rgba(0,0,0,.18)',
        }}
      >
        <img
          src={src}
          alt=""
          loading="lazy"
          className="h-[74%] w-[74%] object-contain"
          onError={(e) => {
            // 图标丢了就退回首字母，不留破图
            const el = e.currentTarget.parentElement
            if (el) el.dataset.fallback = '1'
          }}
        />
      </span>
    )
  }

  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-[11px]', className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(150deg, ${tint ?? 'hsl(var(--line-strong))'}, ${tint ?? 'hsl(var(--line-strong))'})`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18), inset 0 0 0 1px rgba(0,0,0,.18)',
      }}
    >
      <span
        className="serif italic leading-none text-white/92"
        style={{ fontSize: size * 0.46, textShadow: '0 1px 2px rgba(0,0,0,.35)' }}
      >
        {initial}
      </span>
    </span>
  )
}


