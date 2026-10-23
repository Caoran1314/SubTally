export interface Preset {
  id: string
  name: string
  category: string
  /** 小色块底色 */
  tint: string
  website?: string
  /** 常用档位，仅作填写提示 */
  hint?: string
}

export const CATEGORIES = [
  '工具',
  '影音',
  '创作者',
  '云存储',
  '阅读学习',
  '音乐',
  'AI 工具',
  '网络服务',
  '通信',
  '生活服务',
  '效率工具',
  '其他',
] as const

export const CATEGORY_TINT: Record<string, string> = {
  工具: 'hsl(210 22% 62%)',
  影音: 'hsl(350 38% 62%)',
  创作者: 'hsl(18 42% 60%)',
  云存储: 'hsl(196 30% 58%)',
  阅读学习: 'hsl(42 38% 58%)',
  音乐: 'hsl(330 34% 64%)',
  'AI 工具': 'hsl(268 28% 64%)',
  网络服务: 'hsl(160 20% 52%)',
  通信: 'hsl(228 20% 58%)',
  生活服务: 'hsl(96 18% 54%)',
  效率工具: 'hsl(280 16% 58%)',
  其他: 'hsl(28 12% 56%)',
}

/** 内置预设名单：常见会员、创作者充电、AI 套餐 */
export const PRESETS: Preset[] = [
  { id: 'apple-music', name: 'Apple Music', category: '音乐', tint: 'hsl(350 72% 56%)', website: 'music.apple.com', hint: '¥11 / 月' },
  { id: 'apple-news', name: 'Apple News', category: '阅读学习', tint: 'hsl(354 68% 54%)', website: 'apple.com/apple-news', hint: '¥68 / 月' },
  { id: 'apple-tv', name: 'Apple TV+', category: '影音', tint: 'hsl(220 12% 30%)', website: 'tv.apple.com', hint: '¥38 / 月' },
  { id: 'icloud', name: 'iCloud', category: '云存储', tint: 'hsl(205 80% 62%)', website: 'icloud.com', hint: '¥6 / 月' },
  { id: 'baidu-netdisk', name: '百度网盘', category: '云存储', tint: 'hsl(216 78% 56%)', website: 'pan.baidu.com', hint: '¥25 / 月' },
  { id: 'bilibili', name: '哔哩哔哩', category: '影音', tint: 'hsl(340 78% 62%)', website: 'bilibili.com', hint: '¥25 / 月' },
  { id: 'tencent-video', name: '腾讯视频 VIP', category: '影音', tint: 'hsl(28 92% 56%)', website: 'v.qq.com', hint: '¥25 / 月' },
  { id: 'iqiyi', name: '爱奇艺', category: '影音', tint: 'hsl(148 62% 46%)', website: 'iqiyi.com', hint: '¥25 / 月' },
  { id: 'youku', name: '优酷', category: '影音', tint: 'hsl(196 92% 52%)', website: 'youku.com', hint: '¥25 / 月' },
  { id: 'netflix', name: 'Netflix', category: '影音', tint: 'hsl(358 74% 48%)', website: 'netflix.com', hint: '¥60 / 月' },
  { id: 'spotify', name: 'Spotify', category: '音乐', tint: 'hsl(142 62% 42%)', website: 'spotify.com', hint: '¥15 / 月' },
  { id: 'youtube-premium', name: 'YouTube Premium', category: '影音', tint: 'hsl(0 72% 52%)', website: 'youtube.com/premium', hint: '¥68 / 月' },
  { id: 'qq-music', name: 'QQ音乐', category: '音乐', tint: 'hsl(152 74% 42%)', website: 'y.qq.com', hint: '¥8 / 月' },
  { id: 'netease-music', name: '网易云音乐', category: '音乐', tint: 'hsl(354 78% 52%)', website: 'music.163.com', hint: '¥8 / 月' },
  { id: 'suno', name: 'Suno', category: 'AI 工具', tint: 'hsl(28 82% 56%)', website: 'suno.com', hint: '$10 / 月' },
  { id: 'chatgpt', name: 'ChatGPT', category: 'AI 工具', tint: 'hsl(168 44% 42%)', website: 'chatgpt.com', hint: '$20 / 月' },
  { id: 'claude', name: 'Claude', category: 'AI 工具', tint: 'hsl(24 62% 56%)', website: 'claude.ai', hint: '$20 / 月' },
  { id: 'gemini', name: 'Gemini', category: 'AI 工具', tint: 'hsl(212 78% 58%)', website: 'gemini.google.com', hint: '$20 / 月' },
  { id: 'cursor', name: 'Cursor', category: 'AI 工具', tint: 'hsl(220 14% 26%)', website: 'cursor.com', hint: '$20 / 月' },
  { id: 'github-copilot', name: 'GitHub Copilot', category: 'AI 工具', tint: 'hsl(220 12% 36%)', website: 'github.com/features/copilot', hint: '$10 / 月' },
  { id: 'midjourney', name: 'Midjourney', category: 'AI 工具', tint: 'hsl(250 18% 34%)', website: 'midjourney.com', hint: '$10 / 月' },
  { id: 'notion', name: 'Notion', category: '效率工具', tint: 'hsl(30 10% 74%)', website: 'notion.so', hint: '$10 / 月' },
  { id: 'goodnotes', name: 'Goodnotes', category: '效率工具', tint: 'hsl(200 62% 56%)', website: 'goodnotes.com', hint: '¥50 / 年' },
  { id: 'figma', name: 'Figma', category: '创作者', tint: 'hsl(260 62% 60%)', website: 'figma.com', hint: '$15 / 月' },
  { id: 'adobe-cc', name: 'Adobe CC', category: '创作者', tint: 'hsl(348 82% 52%)', website: 'adobe.com', hint: '¥288 / 月' },
  { id: 'capcut', name: '剪映', category: '效率工具', tint: 'hsl(198 88% 54%)', website: 'jianying.com', hint: '¥25 / 月' },
  { id: 'wechat-reading', name: '微信读书', category: '阅读学习', tint: 'hsl(150 42% 44%)', website: 'weread.qq.com', hint: '¥19 / 月' },
  { id: 'planet', name: '知识星球', category: '阅读学习', tint: 'hsl(12 76% 58%)', website: 'zsxq.com', hint: '¥99 / 年' },
  { id: 'cloudflare', name: 'Cloudflare', category: '网络服务', tint: 'hsl(28 92% 56%)', website: 'cloudflare.com', hint: '$20 / 月' },
  { id: 'dmit', name: 'DMIT', category: '网络服务', tint: 'hsl(214 76% 56%)', website: 'dmit.io', hint: '$10 / 月' },
  { id: 'iproyal', name: 'IPRoyal', category: '网络服务', tint: 'hsl(214 66% 52%)', website: 'iproyal.com', hint: '$7 / 月' },
  { id: 'jd', name: '京东', category: '生活服务', tint: 'hsl(0 78% 54%)', website: 'jd.com', hint: '¥149 / 年' },
  { id: 'china-telecom', name: '中国电信', category: '通信', tint: 'hsl(212 74% 52%)', website: '189.cn', hint: '¥199 / 月' },
  { id: 'china-unicom', name: '中国联通', category: '通信', tint: 'hsl(356 74% 52%)', website: '10010.com', hint: '¥129 / 月' },
  { id: 'china-mobile', name: '中国移动', category: '通信', tint: 'hsl(196 78% 48%)', website: '10086.cn', hint: '¥159 / 月' },
  { id: 'xbox-gamepass', name: 'Xbox Game Pass', category: '影音', tint: 'hsl(112 52% 44%)', website: 'xbox.com/game-pass', hint: '$15 / 月' },
  { id: 'nintendo', name: 'Nintendo Switch Online', category: '影音', tint: 'hsl(4 72% 54%)', website: 'nintendo.com', hint: '¥25 / 月' },
  { id: '1password', name: '1Password', category: '工具', tint: 'hsl(216 62% 52%)', website: '1password.com', hint: '$3 / 月' },
  { id: 'dropbox', name: 'Dropbox', category: '云存储', tint: 'hsl(210 92% 52%)', website: 'dropbox.com', hint: '$12 / 月' },
  { id: 'google-one', name: 'Google One', category: '云存储', tint: 'hsl(216 78% 56%)', website: 'one.google.com', hint: '$2 / 月' },
]

export function presetById(id: string) {
  return PRESETS.find((p) => p.id === id)
}

/** 从域名猜一个品牌名 */
export function nameFromHost(host: string) {
  const clean = host.replace(/^www\./, '').split('.')[0] || host
  return clean
    .split(/[-_]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}
