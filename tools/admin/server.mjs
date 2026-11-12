// 관리자 페이지 /admin/ — 측정 결과 보기(AI·검색 노출 추이, 인사이트 발행, 구글 색인 요청, 서치콘솔 판독)
// - 로그인: 아이디 ADMIN_USER(기본 admin) + 비밀번호 ADMIN_PASSWORD(Railway 변수 — 공개 저장소라 코드에 두지 않음).
//   맞으면 12시간짜리 HttpOnly 쿠키(서명값)를 준다. 아이디·비밀번호를 바꾸면 기존 로그인은 모두 풀린다
// - 데이터: 같은 폴더 data.enc(암호화, 저장소에 들어 있음)를 ADMIN_DATA_KEY 로 풀어 로그인한 사람에게만 보낸다
//   data.enc 는 상위 폴더 tools/admin-export.mjs 가 이 PC 의 측정 폴더로 만든다(deploy.bat 이 배포 때 자동 실행)
// - 로그인 실패: 한 IP 15분에 5번, 전체 15분에 30번이 넘으면 15분 동안 막는다
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { open, parseKey } from './crypto.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(HERE, 'index.html');
const DATA = path.join(HERE, 'data.enc');
const LOCAL_KEY = path.resolve(HERE, '..', '..', '..', '.admin-data-key'); // 이 PC 에서만 있는 키 파일(로컬 실행용). 서버에는 없음
const COOKIE = 'ma_admin';
const TTL = 12 * 3600;
const WINDOW = 15 * 60e3, PER_IP = 5, GLOBAL = 30;

const SEC = {
  'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
};
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

const password = () => process.env.ADMIN_PASSWORD || '';
const username = () => (process.env.ADMIN_USER || 'admin').trim();
function keyText() {
  if (process.env.ADMIN_DATA_KEY) return process.env.ADMIN_DATA_KEY;
  try { return fs.readFileSync(LOCAL_KEY, 'utf8'); } catch { return ''; }
}
const sha = s => crypto.createHash('sha256').update(s).digest();
const secret = () => sha(['mirae-admin-session', username(), password(), keyText().trim()].join('\0'));
const sign = exp => crypto.createHmac('sha256', secret()).update('v1.' + exp).digest('base64url');

function cookies(req) {
  const out = {};
  for (const p of String(req.headers.cookie || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  }
  return out;
}
function authed(req) {
  if (!password()) return false;
  const [exp, mac] = String(cookies(req)[COOKIE] || '').split('.');
  if (!exp || !mac || !/^\d+$/.test(exp) || +exp < Date.now() / 1000) return false;
  const a = Buffer.from(mac), b = Buffer.from(sign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
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

  if (p === '/admin/api/login' && m === 'POST') {
    if (!password()) return json(res, 503, { error: 'setup' });
    const ip = ipOf(req);
    if (blocked(ip)) return json(res, 429, { error: 'locked', minutes: 15 });
    if (!/application\/json/.test(req.headers['content-type'] || '')) return json(res, 415, { error: 'type' });
    let input = '', user = '';
    try { const b = JSON.parse(await readBody(req)); input = String(b.password || ''); user = String(b.username || '').trim(); } catch { return json(res, 400, { error: 'body' }); }
    const userOk = crypto.timingSafeEqual(sha(user), sha(username())); // 둘 다 늘 비교 — 어느 쪽이 틀렸는지 응답 시간으로 드러나지 않게
    const pwOk = crypto.timingSafeEqual(sha(input), sha(password()));
    const ok = input.length > 0 && userOk && pwOk;
    if (!ok) { fail(ip); await sleep(600); return json(res, 401, { error: 'wrong' }); }
    fails.delete(ip);
    const exp = Math.floor(Date.now() / 1000) + TTL;
    return json(res, 200, { ok: true }, { 'Set-Cookie': setCookie(req, `${exp}.${sign(exp)}`, TTL) });
  }

  if (p === '/admin/api/logout' && m === 'POST') return json(res, 200, { ok: true }, { 'Set-Cookie': setCookie(req, '', 0) });

  if (p === '/admin/api/data' && (m === 'GET' || m === 'HEAD')) {
    if (!password()) return json(res, 503, { error: 'setup' });
    if (!authed(req)) return json(res, 401, { error: 'login' });
    const r = loadData();
    if (r.error) return json(res, 503, { error: r.error });
    return json(res, 200, r.data);
  }

  return json(res, 404, { error: 'not found' });
}
