// 관리자 페이지 /admin/ — 측정 결과 보기(방문·전환, 문의, AI·검색 노출, 콘텐츠·SEO, 운영 기록)
// - 계정: 총괄(ADMIN_USER/ADMIN_PASSWORD, 전체) · 업체(ADMIN_CLIENT_USER/ADMIN_CLIENT_PASSWORD, 운영 기록 제외 — 서버가 데이터에서 뺌)
//   + 총괄 화면 「계정 관리」에서 만든 계정(Railway 볼륨에 scrypt 해시로 저장, /admin/api/accounts)
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
import { SERVICES, INDUSTRIES } from '../../src/data.mjs';

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

// ── 관리자 화면에서 만든 계정(사용자 요청 11-19) — Railway 볼륨(RAILWAY_VOLUME_MOUNT_PATH)에 저장, 로컬 시험은 ADMIN_STORE_DIR
//    비밀번호는 원문을 두지 않고 scrypt 해시만 저장. 계정 관리는 총괄 계정만, 임시 계정 상태에서는 막는다
const storeDir = () => process.env.ADMIN_STORE_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || '';
const storeFile = () => (storeDir() ? path.join(storeDir(), 'mirae-admin-accounts.json') : '');
function readAccounts() {
  const f = storeFile(); if (!f) return [];
  try { return JSON.parse(fs.readFileSync(f, 'utf8')).accounts || []; }
  catch (e) { if (e.code !== 'ENOENT') console.error('[admin] 계정 파일을 읽지 못함:', e.message); return []; }
}
function writeAccounts(list) {
  const f = storeFile(); if (!f) throw new Error('nostore');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const tmp = `${f}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ v: 1, accounts: list }, null, 1), { mode: 0o600 });
  fs.renameSync(tmp, f);
}
const SCRYPT = { N: 16384, r: 8, p: 1 };
const hashPw = pw => { const salt = crypto.randomBytes(16).toString('hex'); return { salt, hash: crypto.scryptSync(pw, salt, 32, SCRYPT).toString('hex') }; };
const checkPw = (pw, acc) => { const h = crypto.scryptSync(pw, acc.salt, 32, SCRYPT), b = Buffer.from(acc.hash, 'hex'); return b.length === h.length && crypto.timingSafeEqual(h, b); };

// 로그인 쿠키 「만료.역할.계정.서명」 — 계정: m = Railway 변수 총괄, c = Railway 변수 업체, 그 밖 = 화면에서 만든 계정 id
// 서명 열쇠는 계정마다 다르다 → 그 계정의 비밀번호를 바꾸거나 지우면 그 계정의 로그인만 풀린다
function secretFor(aid) {
  const k = keyText().trim();
  if (aid === 'm') return sha(['mirae-admin-session', 'm', username(), password(), k].join('\0'));
  if (aid === 'c') return clientPw() ? sha(['mirae-admin-session', 'c', clientUser(), clientPw(), k].join('\0')) : null;
  const a = readAccounts().find(x => x.id === aid && !x.disabled);
  return a ? sha(['mirae-admin-session', aid, a.role, a.user, a.hash, k].join('\0')) : null;
}
const sign = (exp, role, aid, sec) => crypto.createHmac('sha256', sec).update(`v3.${exp}.${role}.${aid}`).digest('base64url');

function cookies(req) {
  const out = {};
  for (const p of String(req.headers.cookie || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  }
  return out;
}
// 쿠키가 맞으면 { role, aid, user }, 아니면 null
function authed(req) {
  const [exp, role, aid, mac] = String(cookies(req)[COOKIE] || '').split('.');
  if (!exp || !aid || !mac || !ROLES.includes(role) || !/^\d+$/.test(exp) || +exp < Date.now() / 1000) return null;
  if ((aid === 'm' && role !== 'master') || (aid === 'c' && role !== 'client')) return null;
  let acc = null;
  if (aid !== 'm' && aid !== 'c') { acc = readAccounts().find(x => x.id === aid && !x.disabled); if (!acc || acc.role !== role) return null; }
  const sec = secretFor(aid); if (!sec) return null;
  const a = Buffer.from(mac), b = Buffer.from(sign(exp, role, aid, sec));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return { role, aid, user: aid === 'm' ? username() : aid === 'c' ? clientUser() : acc.user };
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

// ── 새 문의 바로 반영(사용자 요청 11-20 「신규 문의가 왔을 때마다」)
//    상담 신청이 구글 시트에 저장되면 사이트(app.js)가 접수번호와 고른 항목만 알려 준다 — 이름·연락처·지역·주소·문의 내용은 받지 않는다.
//    관리자 화면은 마지막 시트 집계(leads.updated) 뒤에 들어온 것만 더해 보여 주고, 다음 자동 집계 때 시트 값으로 자연히 대체된다.
//    누구나 보낼 수 있는 주소라 형식·허용값을 검사하고 IP·전체 횟수를 제한한다(가짜가 섞여도 다음 시트 집계 때 빠짐).
//    볼륨이 있으면 mirae-leads-live.json 에 저장(재배포에도 유지), 없으면 메모리(재시작 때 사라짐 — 시트 집계로 메워짐)
const LIVE_DAYS = 45, LIVE_MAX = 300;
const liveFile = () => (storeDir() ? path.join(storeDir(), 'mirae-leads-live.json') : '');
let liveMem = [];
function readLive() {
  const f = liveFile(); if (!f) return liveMem;
  try { return JSON.parse(fs.readFileSync(f, 'utf8')).leads || []; }
  catch (e) { if (e.code !== 'ENOENT') console.error('[admin] 새 문의 파일을 읽지 못함:', e.message); return []; }
}
function writeLive(list) {
  const f = liveFile(); if (!f) { liveMem = list; return; }
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const tmp = `${f}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ v: 1, leads: list }), { mode: 0o600 });
  fs.renameSync(tmp, f);
}
const liveHits = new Map();
let liveAll = [];
function liveLimited(ip) { // 한 IP 1시간 5건, 전체 하루 100건
  const now = Date.now();
  liveAll = liveAll.filter(t => now - t < 864e5);
  const mine = (liveHits.get(ip) || []).filter(t => now - t < 3600e3);
  if (mine.length >= 5 || liveAll.length >= 100) return true;
  liveHits.set(ip, [...mine, now]); liveAll.push(now);
  if (liveHits.size > 5000) liveHits.clear();
  return false;
}
const SVC_NAMES = new Set(SERVICES.map(s => s.name));
const IND_NAMES = new Set([...INDUSTRIES.map(i => i.name), '기업·B2B', '기타']);
const BUDGETS = new Set(['50만원 미만', '50~100만원', '100~300만원', '300~500만원', '500만원 이상']);
const kstDay = t => new Date(t + 9 * 3600e3).toISOString().slice(0, 10);
const cleanPath = v => (/^\/[A-Za-z0-9._~\-/]{0,120}$/.test(String(v || '')) ? String(v) : '');
const cleanTok = (v, n) => (new RegExp(`^[\\w.\\- ]{1,${n}}$`).test(String(v || '')) ? String(v) : '');
function liveEntry(b) {
  const id = String(b.id || '');
  const m = id.match(/^MA(\d{2})(\d{2})(\d{2})-\d{4}$/); if (!m) return null;
  const day = `20${m[1]}-${m[2]}-${m[3]}`, now = Date.now();
  if (day !== kstDay(now) && day !== kstDay(now - 864e5)) return null; // 접수번호 날짜가 오늘·어제(KST)가 아니면 무시
  const services = (Array.isArray(b.services) ? b.services : []).map(String).filter(s => SVC_NAMES.has(s)).slice(0, 18);
  const industry = IND_NAMES.has(b.industry) ? b.industry : '', budget = BUDGETS.has(b.budget) ? b.budget : '';
  const us = cleanTok(b.utm_source, 40), um = cleanTok(b.utm_medium, 40), ref = /^[a-z0-9.-]{1,80}$/.test(String(b.ref || '')) ? b.ref : '';
  const src = us ? `${us}${um ? ' / ' + um : ''}` : b.gclid === true ? 'google / cpc' : ref || '직접·알 수 없음'; // 시트 집계(pull-ga4-leads.mjs)와 같은 규칙
  const dwell = Number.isInteger(b.dwell) && b.dwell >= 0 && b.dwell < 86400 ? b.dwell : 0;
  return { id, at: new Date(now).toISOString(), services, industry, budget, src, page: cleanPath(b.page), landing: cleanPath(b.landing), device: b.device === '모바일' ? '모바일' : 'PC', dwell };
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
    // 모든 계정을 늘 비교 — 어느 쪽·어느 칸이 틀렸는지 응답 시간으로 드러나지 않게
    const masterOk = crypto.timingSafeEqual(sha(user), sha(username())) & crypto.timingSafeEqual(sha(input), sha(password()));
    const cpw = clientPw();
    const clientOk = crypto.timingSafeEqual(sha(user), sha(clientUser())) & crypto.timingSafeEqual(sha(input), sha(cpw || '\0no-client'));
    const accs = readAccounts(), acc = accs.find(a => a.user === user.toLowerCase() && !a.disabled);
    const accOk = acc ? checkPw(input, acc) : (crypto.scryptSync(input || '-', 'mirae-admin-dummy', 32, SCRYPT), false);
    let who = null;
    if (input.length > 0) {
      if (masterOk) who = { role: 'master', aid: 'm' };
      else if (cpw && clientOk) who = { role: 'client', aid: 'c' };
      else if (accOk) who = { role: acc.role, aid: acc.id };
    }
    if (!who) { fail(ip); await sleep(600); return json(res, 401, { error: 'wrong' }); }
    fails.delete(ip);
    if (acc && who.aid === acc.id) { acc.lastLogin = new Date().toISOString(); try { writeAccounts(accs); } catch { } }
    const exp = Math.floor(Date.now() / 1000) + TTL;
    return json(res, 200, { ok: true, role: who.role }, { 'Set-Cookie': setCookie(req, `${exp}.${who.role}.${who.aid}.${sign(exp, who.role, who.aid, secretFor(who.aid))}`, TTL) });
  }

  if (p === '/admin/api/logout' && m === 'POST') return json(res, 200, { ok: true }, { 'Set-Cookie': setCookie(req, '', 0) });

  // 새 문의 알림(사이트 상담 폼 → 로그인 없이) / 새 문의 목록(관리자 화면 → 로그인 필요)
  if (p === '/admin/api/lead-event') {
    if (m !== 'POST') return json(res, 405, { error: 'method' });
    if (!/application\/json/.test(req.headers['content-type'] || '')) return json(res, 415, { error: 'type' });
    let b;
    try { b = JSON.parse(await readBody(req, 4096)); } catch { return json(res, 400, { error: 'body' }); }
    if (!b || typeof b !== 'object' || b.test === true) { res.writeHead(204, SEC); return res.end(); } // 시험 접수(이름에 테스트·test)는 세지 않음
    const e = liveEntry(b);
    if (!e) return json(res, 400, { error: 'invalid' });
    const list = readLive();
    if (list.some(x => x.id === e.id)) { res.writeHead(204, SEC); return res.end(); } // 같은 접수번호는 한 번만
    if (liveLimited(ipOf(req))) return json(res, 429, { error: 'limit' });
    const keep = Date.now() - LIVE_DAYS * 864e5;
    try { writeLive([...list.filter(x => Date.parse(x.at) > keep), e].slice(-LIVE_MAX)); }
    catch (err) { console.error('[admin] 새 문의 저장 실패:', err.message); return json(res, 500, { error: 'write' }); }
    console.log(`[admin] 새 문의 ${e.id} · ${e.services.join(', ') || '서비스 미선택'} · ${e.src}`);
    res.writeHead(204, SEC); return res.end();
  }
  if (p === '/admin/api/live' && m === 'GET') {
    if (!authed(req)) return json(res, 401, { error: 'login' });
    return json(res, 200, { leads: readLive(), stored: !!liveFile() });
  }

  // 계정 관리(총괄만): 목록 / 만들기 / 비밀번호 바꾸기 / 지우기
  if (p === '/admin/api/accounts') {
    const who = authed(req);
    if (!who) return json(res, 401, { error: 'login' });
    if (who.role !== 'master') return json(res, 403, { error: 'forbidden' });
    const view = () => ({
      store: !!storeFile(), temp: isTemp(), me: who.aid,
      env: [{ user: username(), role: 'master', active: !isTemp() }, { user: clientUser(), role: 'client', active: !!clientPw() }],
      accounts: readAccounts().map(({ id, user, role, createdAt, createdBy, lastLogin, changedAt }) => ({ id, user, role, createdAt, createdBy, lastLogin, changedAt })),
    });
    if (m === 'GET') return json(res, 200, view());
    if (m !== 'POST') return json(res, 405, { error: 'method' });
    if (!/application\/json/.test(req.headers['content-type'] || '')) return json(res, 415, { error: 'type' });
    if (isTemp()) return json(res, 403, { error: 'temp' }); // 임시 계정(공개된 1234)으로는 계정을 만들 수 없게
    if (!storeFile()) return json(res, 503, { error: 'nostore' });
    let b;
    try { b = JSON.parse(await readBody(req)); } catch { return json(res, 400, { error: 'body' }); }
    const list = readAccounts();
    const pwBad = pw => typeof pw !== 'string' || pw.length < 8 || pw.length > 128;
    if (b.action === 'create') {
      const user = String(b.user || '').trim().toLowerCase(), role = ROLES.includes(b.role) ? b.role : 'client';
      if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(user)) return json(res, 400, { error: 'user', msg: '아이디는 영문 소문자·숫자·. _ - 로 3~30자입니다.' });
      if (user === username().toLowerCase() || user === clientUser().toLowerCase() || list.some(a => a.user === user)) return json(res, 409, { error: 'dup', msg: '이미 있는 아이디입니다.' });
      if (pwBad(b.password)) return json(res, 400, { error: 'pw', msg: '비밀번호는 8자 이상이어야 합니다.' });
      if (list.length >= 50) return json(res, 400, { error: 'max', msg: '계정은 50개까지 만들 수 있습니다.' });
      list.push({ id: crypto.randomBytes(6).toString('hex'), user, role, ...hashPw(b.password), createdAt: new Date().toISOString(), createdBy: who.user });
    } else if (b.action === 'password') {
      const a = list.find(x => x.id === b.id); if (!a) return json(res, 404, { error: 'none', msg: '계정을 찾지 못했습니다.' });
      if (pwBad(b.password)) return json(res, 400, { error: 'pw', msg: '비밀번호는 8자 이상이어야 합니다.' });
      Object.assign(a, hashPw(b.password), { changedAt: new Date().toISOString() });
    } else if (b.action === 'delete') {
      const i = list.findIndex(x => x.id === b.id); if (i < 0) return json(res, 404, { error: 'none', msg: '계정을 찾지 못했습니다.' });
      if (list[i].id === who.aid) return json(res, 400, { error: 'self', msg: '지금 로그인한 계정은 지울 수 없습니다.' });
      list.splice(i, 1);
    } else return json(res, 400, { error: 'action' });
    try { writeAccounts(list); } catch (e) { console.error('[admin] 계정 저장 실패:', e.message); return json(res, 500, { error: 'write', msg: '저장 공간에 쓰지 못했습니다.' }); }
    return json(res, 200, { ok: true, ...view() });
  }

  if (p === '/admin/api/data' && (m === 'GET' || m === 'HEAD')) {
    const who = authed(req), role = who?.role;
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
    return json(res, 200, role === 'master' ? { ...r.data, role, me: who.user } : { ...r.data, runs: [], role, me: who.user });
  }

  return json(res, 404, { error: 'not found' });
}
