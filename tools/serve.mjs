// Railway(또는 아무 Node 서버)에서 사이트를 서빙한다 — 의존성 없음
//   node tools/serve.mjs            → _site 를 PORT(기본 8080)로 서빙
//   node tools/serve.mjs --build    → 시작 전에 빌드·내보내기를 먼저 한다(Railway 시작 명령)
//   node tools/serve.mjs --build-only → 빌드·내보내기만 하고 끝(Railway 빌드 단계에서 깨진 상태를 미리 걸러냄)
// - 서빙 폴더는 tools/export-site.mjs 가 만든 _site(소스·도구·글 원고는 들어가지 않음)
// - 예약 글: 09:00·13:00·18:00(KST)이 지날 때마다 다시 빌드해 그 시각의 글을 공개한다(푸시가 없어도)
// - 동영상은 Range(206) 응답, 글자 파일은 gzip, 주소/폴더 → index.html, 없으면 404.html
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '_site');
const PORT = +(process.env.PORT || 8080);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff', '.pdf': 'application/pdf',
};
const TEXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.svg']);

// ── 빌드: build.mjs → export-site.mjs(운영이면 그대로, 아니면 noindex 미리보기)
export function buildSite() {
  const run = args => { const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' }); if (r.status) throw new Error('실패: node ' + args.join(' ')); };
  run(['build.mjs']);
  const prod = process.env.PRODUCTION === 'true';
  const host = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PUBLIC_HOST || 'localhost';
  const tmp = OUT + '.next';
  run(['tools/export-site.mjs', tmp, ...(prod ? [] : ['--preview', `https://${host}/`])]);
  fs.rmSync(OUT + '.old', { recursive: true, force: true });
  if (fs.existsSync(OUT)) fs.renameSync(OUT, OUT + '.old');
  fs.renameSync(tmp, OUT);
  fs.rmSync(OUT + '.old', { recursive: true, force: true });
  cache.clear();
  console.log(`[build] ${new Date().toISOString()} ${prod ? '운영(색인 허용)' : '미리보기(noindex)'}`);
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
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
  const abs = path.normalize(path.join(OUT, rel));
  if (!abs.startsWith(OUT)) { res.writeHead(403); return res.end(); }
  let file = abs;
  try {
    if (fs.statSync(file).isDirectory()) {
      if (!rel.endsWith('/')) { res.writeHead(301, { Location: rel + '/' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '') }); return res.end(); }
      file = path.join(file, 'index.html');
    }
    if (fs.existsSync(file)) return send(req, res, file);
  } catch { /* 아래 404 */ }
  const nf = path.join(OUT, '404.html');
  if (fs.existsSync(nf)) return send(req, res, nf, 404);
  res.writeHead(404); res.end('Not found');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--build-only')) { buildSite(); process.exit(0); }
  // 시작할 때마다 다시 빌드: 이미지가 만들어진 뒤 지난 예약 시각의 글까지 바로 공개
  if (process.argv.includes('--build') || !fs.existsSync(path.join(OUT, 'index.html'))) buildSite();
  let slot = slotKST();
  setInterval(() => { const s = slotKST(); if (s !== slot) { slot = s; try { buildSite(); } catch (e) { console.error('[build] 실패 — 이전 화면 유지:', e.message); } } }, 60 * 1000);
  http.createServer(handler).listen(PORT, '0.0.0.0', () => console.log(`[serve] ${OUT} → :${PORT}`));
}
