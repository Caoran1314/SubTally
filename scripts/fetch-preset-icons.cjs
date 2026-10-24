// 构建前抓取预设服务的真实图标，落到 public/presets/
// 依次尝试 icon.horse → Google s2 → DuckDuckGo，走 NAS 代理
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'public', 'presets');
const PROXY = 'http://127.0.0.1:7890';

// 与 catalog.ts 保持一致
const PRESETS = [
  ['apple-music', 'music.apple.com'],
  ['apple-news', 'apple.com'],
  ['apple-tv', 'tv.apple.com'],
  ['icloud', 'icloud.com'],
  ['baidu-netdisk', 'pan.baidu.com'],
  ['bilibili', 'bilibili.com'],
  ['tencent-video', 'v.qq.com'],
  ['iqiyi', 'iqiyi.com'],
  ['youku', 'youku.com'],
  ['netflix', 'netflix.com'],
  ['spotify', 'spotify.com'],
  ['youtube-premium', 'youtube.com'],
  ['qq-music', 'y.qq.com'],
  ['netease-music', 'music.163.com'],
  ['suno', 'suno.com'],
  ['chatgpt', 'chatgpt.com'],
  ['claude', 'claude.ai'],
  ['gemini', 'gemini.google.com'],
  ['cursor', 'cursor.com'],
  ['github-copilot', 'github.com'],
  ['midjourney', 'midjourney.com'],
  ['notion', 'notion.so'],
  ['goodnotes', 'goodnotes.com'],
  ['figma', 'figma.com'],
  ['adobe-cc', 'adobe.com'],
  ['capcut', 'jianying.com'],
  ['wechat-reading', 'weread.qq.com'],
  ['planet', 'zsxq.com'],
  ['cloudflare', 'cloudflare.com'],
  ['dmit', 'dmit.io'],
  ['iproyal', 'iproyal.com'],
  ['jd', 'jd.com'],
  ['china-telecom', '189.cn'],
  ['china-unicom', '10010.com'],
  ['china-mobile', '10086.cn'],
  ['xbox-gamepass', 'xbox.com'],
  ['nintendo', 'nintendo.com'],
  ['1password', '1password.com'],
  ['dropbox', 'dropbox.com'],
  ['google-one', 'one.google.com'],
];

fs.mkdirSync(OUT, { recursive: true });

function tryFetch(url, dest) {
  try {
    execFileSync('curl.exe', ['-sS', '-L', '--max-time', '25', '--fail', '-x', PROXY, '-o', dest, url], { stdio: 'ignore', timeout: 40000 });
    const st = fs.statSync(dest);
    if (st.size < 200) { fs.unlinkSync(dest); return false; }
    const b = fs.readFileSync(dest);
    const isImg =
      (b[0] === 0x89 && b[1] === 0x50) || // PNG
      (b[0] === 0xff && b[1] === 0xd8) || // JPEG
      (b.slice(0, 4).toString() === 'GIF8') ||
      (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') ||
      (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) || // ICO
      (b.slice(0, 200).toString('utf8').includes('<svg'));
    if (!isImg) { fs.unlinkSync(dest); return false; }
    return true;
  } catch {
    try { fs.unlinkSync(dest); } catch {}
    return false;
  }
}

(async () => {
  let ok = 0, fail = [];
  for (const [id, host] of PRESETS) {
    if (fs.existsSync(path.join(OUT, id + '.png')) || fs.existsSync(path.join(OUT, id + '.ico'))) { ok++; continue; }
    const dest = path.join(OUT, id + '.png');
    const sources = [
      `https://icon.horse/icon/${host}`,
      `https://www.google.com/s2/favicons?domain=${host}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${host}.ico`,
    ];
    let done = false;
    for (const src of sources) {
      if (tryFetch(src, dest)) { done = true; break; }
    }
    if (done) {
      const kb = Math.round(fs.statSync(dest).size / 1024 * 10) / 10;
      console.log(`  ✅ ${id.padEnd(18)} ${host.padEnd(22)} ${kb} KB`);
      ok++;
    } else {
      console.log(`  ❌ ${id.padEnd(18)} ${host}`);
      fail.push(id);
    }
  }
  console.log('');
  console.log(`完成：${ok}/${PRESETS.length} 成功${fail.length ? '，失败: ' + fail.join(', ') : ''}`);
})();
