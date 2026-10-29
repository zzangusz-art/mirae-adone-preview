// 빌드 결과 점검: 모든 HTML의 내부 링크·이미지·스크립트 경로가 실제 파일로 이어지는지, JSON-LD가 파싱되는지, 제목·설명 중복이 없는지
// 제목 40자·설명 80자(네이버 서치어드바이저 권장, 공백 포함)를 넘는 페이지는 경고만 한다 — 고칠 곳: src/data.mjs SEO, 글은 content/blog 머리말
// 사용: node build.mjs && node tools/check-site.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = /^(src|tools|content|node_modules|\.git|\.github|_site)$/;
const pages = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.test(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) pages.push(p);
  }
})(ROOT);

let refs = 0, missing = [], ldErr = [], titles = new Map(), descs = new Map(), ids = [], long = [];
const unesc = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
for (const f of pages) {
  const html = fs.readFileSync(f, 'utf8'), rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (rel === '404.html') continue; // <base> 를 쓰는 페이지
  const dir = path.dirname(f);
  for (const m of html.matchAll(/\s(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(u) || u.startsWith('#')) continue;
    refs++;
    let t = path.resolve(dir, u);
    if (u.endsWith('/') || (fs.existsSync(t) && fs.statSync(t).isDirectory())) t = path.join(t, 'index.html');
    if (!fs.existsSync(t)) missing.push(`${rel} → ${u}`);
  }
  for (const m of html.matchAll(/<use href="#([^"]+)"/g)) if (!html.includes(`id="${m[1]}"`)) missing.push(`${rel} → 아이콘 #${m[1]}`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { ldErr.push(`${rel}: ${e.message}`); } }
  const t = html.match(/<title>([^<]*)<\/title>/)?.[1], d = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (t) titles.set(t, [...(titles.get(t) || []), rel]);
  if (d) descs.set(d, [...(descs.get(d) || []), rel]);
  const tl = [...unesc(t || '')].length, dl = [...unesc(d || '')].length;
  if (tl > 40 || dl > 80) long.push(`${rel}: 제목 ${tl}자 · 설명 ${dl}자`);
  const idList = [...html.replace(/<template[\s\S]*?<\/template>/g, '').matchAll(/\sid="([^"]+)"/g)].map(x => x[1]);
  const dup = idList.filter((x, i) => idList.indexOf(x) !== i);
  if (dup.length) ids.push(`${rel}: ${[...new Set(dup)].join(', ')}`);
}
const dupT = [...titles].filter(([, v]) => v.length > 1), dupD = [...descs].filter(([, v]) => v.length > 1);
console.log(`pages ${pages.length} · refs ${refs} · missing ${missing.length} · JSON-LD errors ${ldErr.length} · dup titles ${dupT.length} · dup descriptions ${dupD.length} · dup ids ${ids.length} · long title/desc ${long.length}`);
for (const x of [...missing.slice(0, 30), ...ldErr, ...dupT.map(([k, v]) => `제목 중복 "${k}": ${v.join(', ')}`), ...dupD.map(([k, v]) => `설명 중복: ${v.join(', ')}`), ...ids, ...long.map(x => `길이 초과(제목 40·설명 80자 권장) ${x}`)]) console.log('  - ' + x);
process.exit(missing.length || ldErr.length || dupT.length || ids.length ? 1 : 0);
