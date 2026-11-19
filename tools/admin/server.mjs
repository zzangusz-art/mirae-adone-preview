// 관리자 페이지 /admin/ — 측정 결과 보기(방문·전환, 문의, AI·검색 노출, 콘텐츠·SEO, 운영 기록)
// - 계정: 총괄(ADMIN_USER/ADMIN_PASSWORD, 전체) · 업체(ADMIN_CLIENT_USER/ADMIN_CLIENT_PASSWORD, 운영 기록 제외 — 서버가 데이터에서 뺌)
// - 로그인: 아이디 ADMIN_USER(기본 admin) + 비밀번호 ADMIN_PASSWORD(Railway 변수 — 공개 저장소라 코드에 두지 않음).
//   맞으면 12시간짜리 HttpOnly 쿠키(서명값)를 준다. 아이디·비밀번호를 바꾸면 기존 로그인은 모두 풀린다
// - 데이터: 같은 폴더 data.enc(암호화, 저장소에 들어 있음)를 ADMIN_DATA_KEY 로 풀어 로그인한 사람에게만 보낸다
//   data.enc 는 상위 폴더 tools/admin-export.mjs 가 이 PC 의 측정 폴더로 만든다(deploy.bat 이 배포 때 자동 실행)
// - 로그인 실패: 한 IP 15분에 5번, 전체 15분에 30번이 넘으면 15분 동안 막는다
// - 임시 계정(사용자 요청 2026-11-19): Railway 에 ADMIN_PASSWORD 가 없는 동안만 admin / 1234 로 들어갈 수 있다.
//   이 값은 공개 저장소에 있어 비밀이 아니므로, 임시 계정 상태에서는 서버가 데이터를 절대 풀지 않고 암호문(data.enc)을 그대로 보낸다.
//   브라우저가 사용자가 붙여 넣은 데이터 키(.admin-data-key)로 직접 푼다(키는 그 브라우저 localStorage 에만 저장, 서버로 보내지 않음).
//   ADMIN_PASSWORD 를 넣으면 임시 계정은 자동으로 꺼지고, ADMIN_DATA_KEY 까지 있으면 예전처럼 서버가 풀어서 보낸다.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { open, parseKey } from './crypto.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(HERE, 'index.html');
const DATA = process.env.ADMIN_DATA_FILE || path.join(HERE, 'data.enc'); // ADMIN_DATA_FILE: 로컬 시험용
const LOCAL_KEY = path.resolve(HERE, '..', '..', '..', '.admin-data-key'); // 이 PC 에서만 있는 키 파일(로컬 실행용). 서버에는 없음. ADMIN_LOCAL_KEY=off 로 끔(시험용)
const COOKIE = 'ma_admin';
const TTL = 12 * 3600;
const WINDOW = 15 * 60e3, PER_IP = 5, GLOBAL = 30;

const SEC = {
  'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
};
// 「홈페이지 수정」(editor.js·literal.mjs)은 사용자 요청(11-19)으로 꺼 둠 — 다시 켜려면 STATIC 에 두 파일을 넣고 CSP 에
// script-src blob: · img-src blob: · connect-src https://api.github.com 를 더한 뒤 index.html 왼쪽 메뉴에 연결(커밋 2de2e07 참고)
// 글꼴: 사이트와 같은 구글 폰트 Noto Sans KR(fonts.googleapis.com 스타일 · fonts.gstatic.com 글꼴 파일)
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
const STATIC = {};

const TEMP_USER = 'admin', TEMP_PW = '1234';
const isTemp = () => !process.env.ADMIN_PASSWORD;
const password = () => process.env.ADMIN_PASSWORD || TEMP_PW;
const username = () => (process.env.ADMIN_PASSWORD ? process.env.ADMIN_USER || 'admin' : TEMP_USER).trim();
// 계정 두 종류(사용자 요청 11-19): master = 총괄 담당자(전체), client = 미래애드원 업체(운영 기록 제외)
// 업체 계정은 Railway 변수 ADMIN_CLIENT_PASSWORD 를 넣었을 때만 켜진다(아이디 ADMIN_CLIENT_USER, 기본 miraeadone).
// 업체 계정은 서버가 데이터를 풀어 운영 부분을 빼고 보내야 하므로 ADMIN_DATA_KEY 가 있어야 하고, 임시 계정 상태에서는 꺼진다.
const clientUser = () => (process.env.ADMIN_CLIENT_USER || 'miraeadone').trim();
const clientPw = () => (isTemp() ? '' : process.env.ADMIN_CLIENT_PASSWORD || '');
const ROLES = ['master', 'client'];
function keyText() {
  if (process.env.ADMIN_DATA_KEY) return process.env.ADMIN_DATA_KEY;
  if (process.env.ADMIN_LOCAL_KEY === 'off') return '';
  try { return fs.readFileSync(LOCAL_KEY, 'utf8'); } catch { return ''; }
}
const sha = s => crypto.createHash('sha256').update(s).digest();
// 역할마다 서명 열쇠가 다르다 — 그 계정의 아이디·비밀번호를 바꾸면 그 계정의 기존 로그인만 풀린다
const secret = role => sha(['mirae-admin-session', role, role === 'client' ? clientUser() : username(), role === 'client' ? clientPw() : password(), keyText().trim()].join('\0'));
const sign = (exp, role) => crypto.createHmac('sha256', secret(role)).update(`v2.${exp}.${role}`).digest('base64url');

function cookies(req) {
  const out = {};
  for (const p of String(req.headers.cookie || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  }
  return out;
}
// 로그인 쿠키 「만료.역할.서명」 → 맞으면 역할('master'|'client'), 아니면 ''
function authed(req) {
  const [exp, role, mac] = String(cookies(req)[COOKIE] || '').split('.');
  if (!exp || !mac || !ROLES.includes(role) || !/^\d+$/.test(exp) || +exp < Date.now() / 1000) return '';
  if (role === 'client' && !clientPw()) return '';
  const a = Buffer.from(mac), b = Buffer.from(sign(exp, role));
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? role : '';
}
const isHttps = req => String(req.headers['x-forwarded-proto'] || '').includes('https');
const setCookie = (req, val, age) => `${COOKIE}=${val}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${age}${isHttps(req) ? '; Secure' : ''}`;

// 로그인 실패 제한
const fails = new Map();
let globalFails = [];
const ipOf = req => String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
function blocked(ip) {
  const now = Date.now();
  globalFails = globalFails.filter(t => now - t < WINDOW);
  const mine = (fails.get(ip) || []).filter(t => now - t < WINDOW);
  if (mine.length) fails.set(ip, mine); else fails.delete(ip);
  return mine.length >= PER_IP || globalFails.length >= GLOBAL;
}
function fail(ip) {
  const now = Date.now();
  fails.set(ip, [...(fails.get(ip) || []), now]);
  globalFails.push(now);
  if (fails.size > 5000) fails.clear();
}

// 데이터(풀어 둔 것) — data.enc 가 바뀌거나 키가 바뀌면 다시 푼다
let cache = { sig: '', data: null, error: '' };
function loadData() {
  const k = keyText().trim();
  if (!k) return { error: 'key' };
  let st;
  try { st = fs.statSync(DATA); } catch { return { error: 'nodata' }; }
  const sig = `${st.mtimeMs}:${st.size}:${sha(k).toString('hex')}`;
  if (cache.sig !== sig) {
    try { cache = { sig, data: open(fs.readFileSync(DATA), parseKey(k)), error: '' }; }
    catch (e) { cache = { sig, data: null, error: 'decrypt' }; console.error('[admin] data.enc 를 풀지 못함:', e.message); }
  }
  return cache.data ? { data: cache.data } : { error: cache.error };
}

function json(res, status, obj, extra = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { ...SEC, 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), ...extra });
  res.end(body);
}
function readBody(req, limit = 2048) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function adminHandler(req, res) {
  const p = new URL(req.url, 'http://x').pathname;
  const m = req.method;
  if (p === '/admin') { res.writeHead(301, { ...SEC, Location: '/admin/' }); return res.end(); }

  if (p === '/admin/') {
    if (m !== 'GET' && m !== 'HEAD') { res.writeHead(405, { ...SEC, Allow: 'GET, HEAD' }); return res.end(); }
    const html = fs.readFileSync(PAGE);
    res.writeHead(200, { ...SEC, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': CSP, 'Content-Length': html.length });
    return res.end(m === 'HEAD' ? undefined : html);
  }

  if (STATIC[p] && (m === 'GET' || m === 'HEAD')) {
    const js = fs.readFileSync(path.join(HERE, STATIC[p]));
    res.writeHead(200, { ...SEC, 'Content-Type': 'text/javascript; charset=utf-8', 'Content-Length': js.length });
    return res.end(m === 'HEAD' ? undefined : js);
  }

  if (p === '/admin/api/login' && m === 'POST') {
    const ip = ipOf(req);
    if (blocked(ip)) return json(res, 429, { error: 'locked', minutes: 15 });
    if (!/application\/json/.test(req.headers['content-type'] || '')) return json(res, 415, { error: 'type' });
    let input = '', user = '';
    try { const b = JSON.parse(await readBody(req)); input = String(b.password || ''); user = String(b.username || '').trim(); } catch { return json(res, 400, { error: 'body' }); }
    // 두 계정 모두 늘 비교 — 어느 쪽·어느 칸이 틀렸는지 응답 시간으로 드러나지 않게
    const masterOk = crypto.timingSafeEqual(sha(user), sha(username())) & crypto.timingSafeEqual(sha(input), sha(password()));
    const cpw = clientPw();
    const clientOk = crypto.timingSafeEqual(sha(user), sha(clientUser())) & crypto.timingSafeEqual(sha(input), sha(cpw || '\0no-client'));
    const role = input.length > 0 ? (masterOk ? 'master' : cpw && clientOk ? 'client' : '') : '';
    if (!role) { fail(ip); await sleep(600); return json(res, 401, { error: 'wrong' }); }
    fails.delete(ip);
    const exp = Math.floor(Date.now() / 1000) + TTL;
    return json(res, 200, { ok: true, role }, { 'Set-Cookie': setCookie(req, `${exp}.${role}.${sign(exp, role)}`, TTL) });
  }

  if (p === '/admin/api/logout' && m === 'POST') return json(res, 200, { ok: true }, { 'Set-Cookie': setCookie(req, '', 0) });

  if (p === '/admin/api/data' && (m === 'GET' || m === 'HEAD')) {
    const role = authed(req);
    if (!role) return json(res, 401, { error: 'login' });
    // 임시 계정이거나 서버에 키가 없으면 풀지 않고 암호문 그대로 — 브라우저가 사용자의 데이터 키로 푼다(총괄 계정만)
    if (isTemp() || !keyText().trim()) {
      if (role !== 'master') return json(res, 503, { error: 'key' }); // 업체 계정은 운영 부분을 빼고 보내야 하므로 서버에서 풀 수 있을 때만
      let buf;
      try { buf = fs.readFileSync(DATA); } catch { return json(res, 503, { error: 'nodata' }); }
      return json(res, 200, { encrypted: buf.toString('base64'), temp: isTemp(), role });
    }
    const r = loadData();
    if (r.error) return json(res, 503, { error: r.error });
    // 업체 계정: 운영(자동 측정 실행 기록)은 아예 보내지 않는다
    return json(res, 200, role === 'master' ? { ...r.data, role } : { ...r.data, runs: [], role });
  }

  return json(res, 404, { error: 'not found' });
}
