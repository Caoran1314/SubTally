export type Cycle = 'monthly' | 'quarterly' | 'yearly' | 'once' | 'lifetime'

export type Mode = 'dark' | 'light'
export type Accent = 'rose' | 'violet' | 'qiuxiang' | 'sage'
export type Decision = 'keep' | 'pending' | 'release'

export type IconKind = 'letter' | 'image'

export interface Subscription {
  id: string
  name: string
  /** 金额（原币种数值） */
  amount: number
  currency: string
  cycle: Cycle
  /** 下次续费 / 扣款日，YYYY-MM-DD */
  nextDate: string
  category: string
  iconKind: IconKind
  /** letter: 品牌色 + 衬线斜体首字母；image: data URL */
  iconValue?: string
  /** 图标底色（hsl 字符串） */
  tint?: string
  note?: string
  decision: Decision
  decidedAt?: string
  /** 是否仍在用（放手后置 false） */
  active: boolean
  createdAt: string
  sort: number
  website?: string
}

export interface Settings {
  nickname: string
  /** 'ring' = 刻度环头像；也允许传 data URL */
  avatar: 'ring' | 'feather' | string
  mode: Mode
  accent: Accent
  /** 汇总币种 */
  base: string
  /** 是否已看过引导 */
  onboarded: boolean
  /** 自动续费后是否仍要询问 */
  askBeforeRenew: boolean
  /** 提前几天问 */
  askLeadDays: number
  /** 每月预算（汇总币种；0 = 未设置） */
  budget: number
}

export interface FxSnapshot {
  base: string
  /** 1 单位外币 = ? CNY */
  ratesToCny: Record<string, number>
  date: string
  retrievedAt: string
  provider: string
}

export interface DecisionLog {
  id: string
  subId: string
  subName: string
  decision: Decision
  at: string
  amount: number
  currency: string
  cycle: Cycle
}

export interface Snapshot {
  id: string
  at: string
  base: string
  monthly: number
  yearly: number
  count: number
  byCategory: Record<string, number>
}

