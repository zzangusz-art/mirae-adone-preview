// Railway(또는 아무 Node 서버)에서 사이트를 서빙한다 — 의존성 없음
//   node tools/serve.mjs            → _site 를 PORT(기본 8080)로 서빙
//   node tools/serve.mjs --build    → 시작 전에 빌드·내보내기를 먼저 한다(Railway 시작 명령)
//   node tools/serve.mjs --build-only → 빌드·내보내기만 하고 끝(Railway 빌드 단계에서 깨진 상태를 미리 걸러냄)
// - 서빙 폴더는 tools/export-site.mjs 가 만든 _site(소스·도구·글 원고는 들어가지 않음)
// - 예약 글: 09:00·13:00·18:00(KST)이 지날 때마다 다시 빌드해 그 시각의 글을 공개한다(푸시가 없어도)
// - 동영상은 Range(206) 응답, 글자 파일은 gzip, 주소/폴더 → index.html, 없으면 404.html
// - 운영/미리보기는 접속 주소로 나눈다: SITE 도메인(www.mirae-adone.com)은 운영(색인 허용), 그 밖(*.up.railway.app 등)은 미리보기(noindex — 중복 색인 방지)
//   mirae-adone.com(www 없음) → https://www.mirae-adone.com 으로 301. 환경 변수 PRODUCTION=true/false 로 모든 주소를 한쪽으로 고정할 수 있다
// - IndexNow: Railway 에서 실행 중이면 오늘 공개된 인사이트 글 주소를 네이버·Bing 에 알린다(tools/indexnow.mjs)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SITE } from '../src/data.mjs';
import { submitIndexNow } from './indexnow.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = path.join(ROOT, '_site'); // 빌드 단계(--build-only) 결과 — 이미지에 들어 있어 실행 중 빌드가 실패해도 이걸로 서빙
let OUT = BASE; // 지금 서빙 중인 폴더(안에 prod/ · preview/)
let seq = 0;
const PORT = +(process.env.PORT || 8080);
const SITE_HOST = new URL(SITE).hostname, APEX = SITE_HOST.replace(/^www\./, '');
const MODE = process.env.PRODUCTION || '';
const isProdHost = host => MODE === 'true' || (MODE !== 'false' && host === SITE_HOST);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff', '.pdf': 'application/pdf',
};
const TEXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.svg']);

// ── 빌드: build.mjs → export-site.mjs 두 벌(prod = 운영, preview = noindex 미리보기)
// 실행 중 다시 빌드할 때는 새 폴더(_site.r1, r2 …)로 내보낸 뒤 서빙 폴더만 바꾼다.
// 폴더 이름 바꾸기(rename)는 쓰지 않는다 — 컨테이너(overlayfs)에서는 이미지에 들어 있던 폴더의 이름을 바꾸면 EXDEV 로 실패한다.
export function buildSite(dest = `${BASE}.r${++seq}`, { ping = true } = {}) {
  const run = args => { const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' }); if (r.status) throw new Error('실패: node ' + args.join(' ')); };
  run(['build.mjs']);
  const host = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PUBLIC_HOST || 'localhost';
  run(['tools/export-site.mjs', path.join(dest, 'prod')]);
  run(['tools/export-site.mjs', path.join(dest, 'preview'), '--preview', `https://${host}/`]);
  const prev = OUT;
  OUT = dest;
  cache.clear();
  if (prev !== BASE && prev !== dest) fs.rmSync(prev, { recursive: true, force: true });
  console.log(`[build] ${new Date().toISOString()} → ${path.basename(dest)} (운영: ${MODE === 'false' ? '끔' : MODE === 'true' ? '모든 주소' : SITE_HOST})`);
  if (ping) pingNewPosts(dest);
}

// 오늘(KST) 공개된 인사이트 글을 IndexNow 로 알림 — 실행 중 한 주소는 한 번만. 로컬 실행에서는 보내지 않음(INDEXNOW=on 이면 보냄)
const pinged = new Set();
function pingNewPosts(dir) {
  if (MODE === 'false' || (!process.env.RAILWAY_PROJECT_ID && process.env.INDEXNOW !== 'on')) return;
  const today = slotKST().slice(0, 10);
  let xml = '';
  try { xml = fs.readFileSync(path.join(dir, 'prod', 'sitemap.xml'), 'utf8'); } catch { return; }
  const urls = [...xml.matchAll(/<loc>([^<]+\/insights\/[^<\/]+\/)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].filter(m => m[2] === today && !pinged.has(m[1])).map(m => m[1]);
  if (!urls.length) return;
  urls.forEach(u => pinged.add(u));
  submitIndexNow(urls).then(r => console.log(`[indexnow] ${urls.length}개 → ${r.join(' · ')}`));
}

// 예약 공개 시각(KST)이 바뀌면 다시 빌드
const slotKST = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const h = +p.hour % 24;
  return `${p.year}-${p.month}-${p.day}/${h >= 18 ? 3 : h >= 13 ? 2 : h >= 9 ? 1 : 0}`;
};

const cache = new Map(); // gzip 결과(글자 파일만)
function send(req, res, file, status = 200) {
  const ext = path.extname(file).toLowerCase(), type = MIME[ext] || 'application/octet-stream';
  const st = fs.statSync(file);
  const hdr = { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': ext === '.html' || ext === '.xml' || ext === '.txt' ? 'no-cache' : 'public, max-age=604800' };
  if (TEXT.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    const key = file + ':' + st.mtimeMs;
    let gz = cache.get(key);
    if (!gz) { gz = zlib.gzipSync(fs.readFileSync(file), { level: 6 }); cache.set(key, gz); }
    res.writeHead(status, { ...hdr, 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding', 'Content-Length': gz.length });
    return res.end(req.method === 'HEAD' ? undefined : gz);
  }
  const range = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if (range && status === 200) {
    let a = range[1] === '' ? st.size - +range[2] : +range[1], b = range[1] !== '' && range[2] !== '' ? +range[2] : st.size - 1;
    if (a < 0 || a >= st.size || b < a) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
    b = Math.min(b, st.size - 1);
    res.writeHead(206, { ...hdr, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Content-Length': b - a + 1 });
    return req.method === 'HEAD' ? res.end() : fs.createReadStream(file, { start: a, end: b }).pipe(res);
  }
  res.writeHead(status, { ...hdr, 'Accept-Ranges': 'bytes', 'Content-Length': st.size });
  return req.method === 'HEAD' ? res.end() : fs.createReadStream(file).pipe(res);
}

function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
  const host = String(req.headers.host || '').split(':')[0].toLowerCase();
  if (APEX !== SITE_HOST && host === APEX) { res.writeHead(301, { Location: `https://${SITE_HOST}${req.url}` }); return res.end(); }
  const DIR = path.join(OUT, isProdHost(host) ? 'prod' : 'preview');
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
  const abs = path.normalize(path.join(DIR, rel));
  if (abs !== DIR && !abs.startsWith(DIR + path.sep)) { res.writeHead(403); return res.end(); }
  let file = abs;
  try {
    if (fs.statSync(file).isDirectory()) {
      if (!rel.endsWith('/')) { res.writeHead(301, { Location: rel + '/' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '') }); return res.end(); }
      file = path.join(file, 'index.html');
    }
    if (fs.existsSync(file)) return send(req, res, file);
  } catch { /* 아래 404 */ }
  const nf = path.join(DIR, '404.html');
  if (fs.existsSync(nf)) return send(req, res, nf, 404);
  res.writeHead(404); res.end('Not found');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const e of fs.readdirSync(ROOT)) if (/^_site\.\w+$/.test(e)) fs.rmSync(path.join(ROOT, e), { recursive: true, force: true }); // 지난 실행의 빌드 폴더
  if (process.argv.includes('--build-only')) { buildSite(BASE, { ping: false }); process.exit(0); }
  // 시작할 때마다 다시 빌드: 이미지가 만들어진 뒤 지난 예약 시각의 글까지 바로 공개. 실패하면 빌드 단계 결과로 서빙(서버는 죽지 않게)
  const hasBase = fs.existsSync(path.join(BASE, 'prod', 'index.html'));
  if (process.argv.includes('--build') || !hasBase) {
    try { buildSite(); } catch (e) { if (!hasBase) throw e; console.error('[build] 시작 빌드 실패 — 빌드 단계 결과(_site)로 서빙:', e.message); }
  }
  let slot = slotKST();
  setInterval(() => { const s = slotKST(); if (s !== slot) { slot = s; try { buildSite(); } catch (e) { console.error('[build] 실패 — 이전 화면 유지:', e.message); } } }, 60 * 1000);
  http.createServer(handler).listen(PORT, '0.0.0.0', () => console.log(`[serve] ${OUT} → :${PORT}`));
}
