import type { DecisionLog, FxSnapshot, Settings, Snapshot, Subscription } from './types'
import { CYCLE_META, fmtMoney, makeConverter, monthlyOf, yearlyOf } from './money'
import { CATEGORY_TINT } from './catalog'
import { todayISO } from './date'

interface ReportInput {
  subs: Subscription[]
  snapshots: Snapshot[]
  decisions: DecisionLog[]
  settings: Settings
  fx: FxSnapshot | null
}

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export function buildReportHtml({ subs, snapshots, decisions, settings, fx }: ReportInput) {
  const toCny = makeConverter(fx?.ratesToCny)
  const active = subs.filter((s) => s.active)
  const monthly = subs.reduce((a, s) => a + monthlyOf(s, toCny), 0)
  const yearly = subs.reduce((a, s) => a + yearlyOf(s, toCny), 0)

  const byCat: Record<string, number> = {}
  subs.forEach((s) => {
    const m = monthlyOf(s, toCny)
    if (m > 0) byCat[s.category] = (byCat[s.category] ?? 0) + m
  })
  const catRows = Object.entries(byCat).sort((a, b) => b[1] - a[1])
  const totalCat = catRows.reduce((a, x) => a + x[1], 0)

  const rateLines = Object.entries(fx?.ratesToCny ?? {})
    .filter(([c]) => c !== 'CNY')
    .map(([c, r]) => `${c} 1 = ${(1 / r).toFixed(4)} CNY ← CNY 1 = ${r.toFixed(4)} ${c}`)

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>订阅报告 · ${esc(todayISO())}</title>
<style>
  :root{--ink:#2a211e;--mute:#6b5b55;--line:#e2d7d0;--accent:#b98288;--bg:#fbf7f3}
  *{box-sizing:border-box}
  body{margin:0;padding:44px 40px;background:var(--bg);color:var(--ink);
    font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif;
    font-size:13px;line-height:1.7;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .wrap{max-width:860px;margin:0 auto}
  h1{font-family:Georgia,"Noto Serif SC","Songti SC",serif;font-size:30px;letter-spacing:.02em;margin:0 0 6px}
  .sub{color:var(--mute);font-size:12px;letter-spacing:.08em;text-transform:uppercase}
  .hero{display:flex;align-items:flex-end;gap:28px;margin:26px 0 6px;flex-wrap:wrap}
  .big{font-family:Georgia,"Noto Serif SC",serif;font-size:54px;line-height:1;letter-spacing:-.02em}
  .big small{font-size:14px;letter-spacing:.06em;color:var(--mute);margin-left:8px}
  .kv{display:flex;gap:34px;flex-wrap:wrap;margin-top:6px}
  .kv div{font-size:12px;color:var(--mute)}
  .kv b{display:block;font-family:Georgia,"Noto Serif SC",serif;font-size:19px;color:var(--ink);font-weight:400;margin-top:2px}
  hr{border:0;border-top:1px solid var(--line);margin:26px 0}
  h2{font-family:Georgia,"Noto Serif SC",serif;font-size:16px;margin:0 0 12px;letter-spacing:.02em}
  table{width:100%;border-collapse:collapse;font-size:12.5px}
  th{text-align:left;font-weight:600;color:var(--mute);font-size:11px;letter-spacing:.1em;
    text-transform:uppercase;border-bottom:1px solid var(--line);padding:0 0 7px}
  td{padding:8px 0;border-bottom:1px solid color-mix(in srgb,var(--line) 55%,transparent)}
  .n{text-align:right;font-variant-numeric:tabular-nums;font-family:Georgia,serif}
  .dot{display:inline-block;width:7px;height:7px;border-radius:99px;margin-right:7px;vertical-align:1px}
  .bar{height:4px;border-radius:99px;background:color-mix(in srgb,var(--line) 70%,transparent);overflow:hidden;margin-top:5px}
  .bar i{display:block;height:100%;border-radius:99px}
  .foot{margin-top:34px;padding-top:14px;border-top:1px solid var(--line);color:var(--mute);font-size:11px;line-height:1.9}
  .empty{color:var(--mute);font-size:12px;padding:14px 0}
  @media print{body{padding:0} .wrap{max-width:none} @page{margin:16mm}}
</style></head>
<body><div class="wrap">
  <div class="sub">SubTally · 本地订阅报告</div>
  <h1>把订阅与花费看清</h1>
  <div class="hero">
    <div class="big">${fmtMoney(monthly)}<small>每月折算</small></div>
    <div class="kv">
      <div>年度折算<b>${fmtMoney(yearly)}</b></div>
      <div>在用订阅<b>${active.length} 项</b></div>
      <div>汇总币种<b>${esc(settings.base)}</b></div>
      <div>生成日期<b>${esc(todayISO())}</b></div>
    </div>
  </div>
  <div class="sub" style="margin-top:10px">参考汇率 ${esc(fx?.date ?? '未更新')} · ${esc(fx?.provider ?? '—')}</div>

  <hr>
  <h2>分类构成</h2>
  ${
    catRows.length
      ? `<table><thead><tr><th>分类</th><th class="n">月均折算</th><th class="n">占比</th></tr></thead><tbody>
    ${catRows
      .map(
        ([cat, amount]) => `<tr>
      <td><span class="dot" style="background:${CATEGORY_TINT[cat] ?? '#b98288'}"></span>${esc(cat)}
        <div class="bar"><i style="width:${totalCat ? (amount / totalCat) * 100 : 0}%;background:${CATEGORY_TINT[cat] ?? '#b98288'}"></i></div>
      </td>
      <td class="n">${fmtMoney(amount)}</td>
      <td class="n">${totalCat ? ((amount / totalCat) * 100).toFixed(1) : '0.0'}%</td>
    </tr>`
      )
      .join('')}
    </tbody></table>`
      : '<div class="empty">还没有可折算的花费。</div>'
  }

  <hr>
  <h2>当前订阅明细</h2>
  ${
    active.length
      ? `<table><thead><tr><th>名称</th><th>分类</th><th>周期</th><th>下次续费</th><th class="n">金额</th><th class="n">月均折算</th></tr></thead><tbody>
    ${active
      .map(
        (s) => `<tr>
      <td>${esc(s.name)}</td>
      <td>${esc(s.category)}</td>
      <td>${esc(CYCLE_META[s.cycle].label)}</td>
      <td>${esc(s.nextDate)}</td>
      <td class="n">${esc(fmtMoney(s.amount, { cur: s.currency }))}</td>
      <td class="n">${fmtMoney(monthlyOf(s, toCny))}</td>
    </tr>`
      )
      .join('')}
    </tbody></table>`
      : '<div class="empty">没有在用订阅。</div>'
  }

  ${
    decisions.length
      ? `<hr><h2>续费决策记录</h2>
    <table><thead><tr><th>时间</th><th>订阅</th><th>决定</th><th class="n">金额</th></tr></thead><tbody>
    ${decisions
      .slice(0, 20)
      .map(
        (d) => `<tr>
      <td>${esc(d.at.slice(0, 10))}</td>
      <td>${esc(d.subName)}</td>
      <td>${d.decision === 'keep' ? '留下' : d.decision === 'release' ? '放手' : '明天再问'}</td>
      <td class="n">${esc(fmtMoney(d.amount, { cur: d.currency }))}</td>
    </tr>`
      )
      .join('')}
    </tbody></table>`
      : ''
  }

  ${
    snapshots.length
      ? `<hr><h2>已保存费用快照</h2>
    <table><thead><tr><th>保存时间</th><th class="n">当时月均</th><th class="n">当时年度</th><th class="n">订阅数</th></tr></thead><tbody>
    ${snapshots
      .slice(0, 12)
      .map(
        (s) => `<tr>
      <td>${esc(s.at.slice(0, 16).replace('T', ' '))}</td>
      <td class="n">${esc(fmtMoney(s.monthly))}</td>
      <td class="n">${esc(fmtMoney(s.yearly))}</td>
      <td class="n">${s.count}</td>
    </tr>`
      )
      .join('')}
    </tbody></table>`
      : ''
  }

  <div class="foot">
    此文件由浏览器在本机生成，不连接外部服务。可用浏览器打印功能保存为 PDF。<br>
    参考汇率：${rateLines.length ? esc(rateLines.slice(0, 4).join('；')) : '未更新，按 1:1 折算'}。<br>
    生成于 ${esc(new Date().toLocaleString('zh-CN'))} · SubTally v1.0
  </div>
</div></body></html>`
}

export function openReport(input: ReportInput) {
  const html = buildReportHtml(input)
  const w = window.open('', '_blank', 'width=900,height=1000')
  if (!w) return false
  w.document.open()
  w.document.write(html)
  w.document.close()
  return true
}
