// 관리자 「홈페이지 수정」 — 브라우저에서 GitHub 저장소에 바로 저장(→ Railway·GitHub Pages 자동 배포)
// - 권한: 대표님이 GitHub 에서 발급한 Fine-grained 토큰(이 저장소 · Contents 읽기/쓰기). 토큰은 이 브라우저 localStorage 에만 두고 서버로 보내지 않는다
//   (관리자 로그인은 임시 계정일 수 있으므로, 실제로 고칠 수 있는 권한은 토큰이 쥔다)
// - 문구·가격·FAQ: src/data.mjs 안의 「글자 그대로 적힌 값」만 그 자리에서 바꾼다(literal.mjs). 계산되는 값은 잠금
// - 이미지: assets/img 교체·추가(브라우저에서 원래 형식·크기로 변환)
// - 인사이트 글: content/blog/*.md 수정·새로 쓰기·삭제
// - 수정 기록: 최근 커밋, 관리자 수정 되돌리기
import { parseExports, walk, pathKey, applyEdits, literalText, cloneItem, removeItem, getPath, lineOf } from './literal.mjs';

const OWNER = 'zzangusz-art', NAME = 'mirae-adone-preview', REPO = `${OWNER}/${NAME}`, BRANCH = 'main', API = 'https://api.github.com';
const DATA_FILE = 'src/data.mjs';
const TOKEN_KEY = 'ma_admin_gh_token';
const enc = new TextEncoder(), dec = new TextDecoder();

// ── 공용
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, el = document) => el.querySelector(s);
const kst = d => new Date(Date.parse(d) + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
const todayKST = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
function b64FromBytes(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function bytesFromB64(b) { const s = atob(String(b).replace(/\s/g, '')); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
const store = { get: () => { try { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } },
  set: (v, remember) => { try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); if (v) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, v); } catch { } } };

class GhError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
let TOKEN = '';
async function gh(p, { method = 'GET', body, accept } = {}) {
  const r = await fetch(p.startsWith('http') ? p : API + p, {
    method, cache: 'no-store',
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: accept || 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    let m = ''; try { m = (await r.json()).message || ''; } catch { }
    const hint = r.status === 401 ? '토큰이 맞지 않거나 만료됐습니다. 「토큰 바꾸기」로 다시 넣어 주세요.'
      : r.status === 403 ? (/rate limit/i.test(m) ? 'GitHub 요청 한도에 걸렸습니다. 잠시 뒤 다시 시도해 주세요.' : '토큰에 이 저장소 쓰기 권한이 없습니다(Contents: Read and write 필요).')
        : r.status === 404 ? '저장소나 파일을 찾지 못했습니다(토큰에 mirae-adone-preview 저장소가 선택돼 있는지 확인).' : '';
    throw new GhError(r.status, `${hint || 'GitHub 오류'} (${r.status}${m ? ' · ' + m : ''})`);
  }
  return accept === 'raw' ? r.text() : r.status === 204 ? null : r.json();
}
const treeCache = new Map();
async function treeOf(commitSha) {
  if (!treeCache.has(commitSha)) treeCache.set(commitSha, gh(`/repos/${REPO}/git/trees/${commitSha}?recursive=1`).then(t => new Map(t.tree.filter(x => x.type === 'blob').map(x => [x.path, x]))));
  return treeCache.get(commitSha);
}
const headSha = async () => (await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`)).object.sha;
async function getText(path) {
  const j = await gh(`/repos/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`);
  return { text: dec.decode(bytesFromB64(j.content)), sha: j.sha };
}
// 여러 파일을 커밋 하나로. files: [{ path, content: string|Uint8Array } | { path, sha } | { path, content: null }(삭제)]
// expect: { 경로: 불러올 때의 blob sha } — 그사이 다른 곳에서 바뀌었으면 덮어쓰지 않고 멈춘다
async function commitFiles(files, message, expect = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const head = await headSha();
    const commit = await gh(`/repos/${REPO}/git/commits/${head}`);
    if (Object.keys(expect).length) {
      const t = await treeOf(head);
      for (const [p, sha] of Object.entries(expect)) if ((t.get(p)?.sha || null) !== sha) throw new GhError(409, `${p} 가 그사이 다른 곳에서 바뀌었습니다. 새로 불러온 뒤 다시 고쳐 주세요.`);
    }
    const tree = [];
    for (const f of files) {
      if (f.content === null) tree.push({ path: f.path, mode: '100644', type: 'blob', sha: null });
      else if (f.sha) tree.push({ path: f.path, mode: '100644', type: 'blob', sha: f.sha });
      else {
        f.blobSha ||= (await gh(`/repos/${REPO}/git/blobs`, { method: 'POST', body: { content: b64FromBytes(typeof f.content === 'string' ? enc.encode(f.content) : f.content), encoding: 'base64' } })).sha;
        tree.push({ path: f.path, mode: '100644', type: 'blob', sha: f.blobSha });
      }
    }
    const t = await gh(`/repos/${REPO}/git/trees`, { method: 'POST', body: { base_tree: commit.tree.sha, tree } });
    const c = await gh(`/repos/${REPO}/git/commits`, { method: 'POST', body: { message, tree: t.sha, parents: [head] } });
    try { await gh(`/repos/${REPO}/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: { sha: c.sha, force: false } }); return { sha: c.sha, files }; }
    catch (e) { if (e.status === 422 && attempt < 2) continue; throw e; } // 매일 자동 갱신 등과 겹치면 최신 위에 다시
  }
}

// ── 저장 뒤 사이트 반영 확인(Railway 가 GitHub 에 남기는 배포 기록)
let toastEl;
function toast(html, kind = '') { if (!toastEl) return; toastEl.className = `ed-toast ${kind}`; toastEl.innerHTML = html; toastEl.hidden = !html; }
async function watchDeploy(sha, what) {
  toast(`<b>${esc(what)}</b> 저장했습니다(${sha.slice(0, 7)}). 사이트에 반영하는 중… 보통 2~3분 걸립니다.`, 'busy');
  const t0 = Date.now();
  while (Date.now() - t0 < 6 * 60e3) {
    await new Promise(r => setTimeout(r, 12000));
    try {
      const ds = await gh(`/repos/${REPO}/deployments?sha=${sha}&per_page=10`);
      const d = ds.find(x => x.creator?.login === 'railway-app[bot]');
      if (!d) continue;
      const [s] = await gh(`/repos/${REPO}/deployments/${d.id}/statuses?per_page=1`);
      if (s?.state === 'success') { toast(`<b>${esc(what)}</b> 사이트에 반영됐습니다. 사이트를 새로고침해 확인하세요(이미지는 Ctrl+F5).`, 'ok'); return; }
      if (s && ['failure', 'error'].includes(s.state)) { toast(`<b>${esc(what)}</b> 저장은 됐지만 사이트 반영(빌드)이 실패했습니다. 「수정 기록」에서 이 수정을 되돌리거나 내용을 확인해 주세요.`, 'bad'); return; }
    } catch { }
  }
  toast(`<b>${esc(what)}</b> 저장했습니다. 반영 확인이 늦어지고 있습니다 — 몇 분 뒤 사이트를 확인해 주세요.`, '');
}

// ── 라벨(관리자 화면용 한글 이름)
const EXPORT_LABELS = {
  COMPANY: '회사 정보', BLOG_PLANS: '블로그 요금제', BLOG_COMMON: '블로그 공통 포함 사항', BLOG_SKIN_NOTE: '블로그 스킨 안내 문구', WEB_AI_PLAN: '홈페이지+AI 검색 패키지(가격)',
  PRICE_SHOW_WEB_AI: '홈페이지 패키지 가격 표시 여부', OTHER_PRICING: '기타 서비스 가격', FAQ: '자주 묻는 질문(FAQ)', FAQ_CATS: 'FAQ 분류', BLOG_FAQ: '블로그 서비스 FAQ',
  SERVICES: '서비스 소개(18종)', INDUSTRIES: '업종 페이지', SEO: '페이지 제목·설명(검색 결과에 보이는 문구)', STATS: '숫자 지표', REVIEWS: '고객 후기', PORTFOLIO: '포트폴리오',
  PORTFOLIO_CATS: '포트폴리오 분류', PROCESS: '진행 절차', PROBLEMS: '고객 고민', AXES: '핵심 축', SEQUENCE: '진행 순서', MARKET_BLOG: '블로그 시장 설명', STRUCTURE_COMPARE: '구조 비교',
  CPC: '광고 단가', GEO_TIMELINE: 'GEO 진행 일정', REPORT_FIELDS: '보고서 항목', MONTH: '월간 운영', BOARD_SAMPLE: '보드 예시', KEYWORDS: '키워드', PARTNER_STRIPS: '파트너 띠',
  PARTNER_LOGOS: '파트너 로고', PARTNER_ROWS: '파트너 줄', WEB_BUILD_CHECKS: '홈페이지 설계 여덟 가지', WEB_INDUSTRY_PAGES: '업종별 홈페이지 구성',
  SITE: '사이트 주소(고급)', SITE_VERIFICATION: '검색엔진 소유 확인(고급)', INDEXNOW_KEY: 'IndexNow 키(고급)', KEYWORD_LINKS: '키워드 자동 링크(고급)', LEGACY_KEYWORDS: '이전 키워드(고급)',
};
const FIRST = ['COMPANY', 'BLOG_PLANS', 'WEB_AI_PLAN', 'OTHER_PRICING', 'FAQ', 'SERVICES', 'SEO', 'STATS', 'REVIEWS', 'PORTFOLIO', 'INDUSTRIES', 'PROCESS'];
const ADVANCED = ['SITE', 'SITE_VERIFICATION', 'INDEXNOW_KEY', 'KEYWORD_LINKS', 'LEGACY_KEYWORDS'];
const KEY_LABELS = { name: '이름', nameEn: '영문 이름', ceo: '대표', bizNo: '사업자등록번호', address: '주소', phone: '전화', email: '이메일', kakao: '카카오톡 링크', naverBlog: '네이버 블로그', brochure: '회사소개서 링크',
  slogan: '슬로건', subSlogan: '보조 슬로건', title: '제목', desc: '설명', description: '설명', q: '질문', a: '답변', c: '분류', price: '가격(원)', count: '횟수', label: '한 줄 설명', perks: '포함 사항', items: '항목',
  note: '안내 문구', period: '기간', summary: '요약', slug: '주소 이름(영문)', cap: '설명 문구', cat: '분류', src: '이미지 경로', alt: '이미지 설명', faq: 'FAQ', keyword: '키워드', card: '공유 이미지 문구', best: '추천 표시',
  tag: '태그', body: '본문', text: '문구', value: '값', unit: '단위', icon: '아이콘', lead: '첫 문단', intro: '소개', points: '핵심 포인트', steps: '단계', who: '대상', what: '내용', how: '방법', result: '결과', quote: '인용' };
const labelOf = k => (typeof k === 'number' ? `${k + 1}번` : KEY_LABELS[k] ? `${KEY_LABELS[k]} <small>${esc(k)}</small>` : esc(k));
const limitOf = path => (path[0] === 'SEO' ? ({ title: 40, desc: 80 })[path.at(-1)] : 0);

// ── 화면(어느 탭인지는 관리자 왼쪽 메뉴가 정한다: #edit/text|img|blog|log)
const TAB_NAMES = { text: '문구·가격·FAQ', img: '이미지', blog: '인사이트 글', log: '수정 기록' };
let ROOT = null, CURTAB = 'text';
export function mountEditor(root, tab = 'text') {
  CURTAB = TAB_NAMES[tab] ? tab : 'text';
  if (root.dataset.mounted) { if (TOKEN) go(CURTAB); else setTitle(); return; }
  root.dataset.mounted = '1'; ROOT = root;
  root.innerHTML = `<section class="card"><div class="card__head"><div><h2 id="edTitle">홈페이지 수정</h2><p class="sub">고친 내용은 GitHub 저장소에 바로 저장되고 2~3분 뒤 사이트(www.mirae-adone.com)에 자동 반영됩니다. 잘못 고쳤으면 「수정 기록」에서 되돌릴 수 있습니다.</p></div><div id="edWho" class="muted" style="font-size:13px"></div></div><div id="edMain"></div></section><div class="ed-toast" id="edToast" hidden></div>`;
  toastEl = $('#edToast', root);
  toastEl.onclick = () => { if (!toastEl.classList.contains('busy')) toastEl.hidden = true; };
  toastEl.title = '눌러서 닫기';
  TOKEN = store.get();
  TOKEN ? showTabs(root) : showToken(root);
}
const setTitle = () => { const h = ROOT && $('#edTitle', ROOT); if (h) h.textContent = TOKEN ? `홈페이지 수정 · ${TAB_NAMES[CURTAB]}` : '홈페이지 수정'; };
const TABS = { text: el => tabText(el), img: el => tabImages(el), blog: el => tabBlog(el), log: el => tabLog(el) };
function go(t) {
  CURTAB = t; setTitle();
  const el = ROOT && $('#edTab', ROOT); if (!el) return;
  el.onclick = null; // 탭마다 다시 연결
  TABS[t](el).catch(err => { el.innerHTML = `<p class="err">${esc(err.message)}</p>`; });
}

function showToken(root, err = '') {
  $('#edMain', root).innerHTML = `
    <div class="ed-token">
      <h3>처음 한 번: GitHub 수정 권한 연결</h3>
      <ol>
        <li>GitHub(사이트 저장소 계정)에 로그인한 뒤 <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">새 토큰 만들기 ↗</a>를 엽니다.</li>
        <li>Token name 「미래애드원 관리자」, Expiration 90일(권장)로 둡니다.</li>
        <li>Repository access → <b>Only select repositories</b> → <b>mirae-adone-preview</b> 하나만 고릅니다.</li>
        <li>Permissions → Repository permissions → <b>Contents</b> 를 <b>Read and write</b> 로 바꿉니다(나머지는 그대로).</li>
        <li>Generate token → 나온 값(github_pat_…)을 복사해 아래에 붙여 넣습니다. 이 값은 이 브라우저에만 저장되고 사이트 서버로 보내지 않습니다.</li>
      </ol>
      <form id="tkForm" autocomplete="off">
        <label for="tk">GitHub 토큰</label>
        <input type="password" id="tk" spellcheck="false" placeholder="github_pat_…" required>
        <label class="ed-chk"><input type="checkbox" id="tkSave" checked> 이 브라우저에 기억하기(공용 PC에서는 끄세요 — 끄면 창을 닫을 때 지워짐)</label>
        <button type="submit" class="ed-btn">연결</button>
        <div class="err" id="tkErr" role="alert">${esc(err)}</div>
      </form>
    </div>`;
  $('#tkForm', root).addEventListener('submit', async e => {
    e.preventDefault();
    const v = $('#tk', root).value.trim(); TOKEN = v;
    $('#tkErr', root).textContent = '확인 중…';
    try {
      const repo = await gh(`/repos/${REPO}`);
      if (repo.permissions && !repo.permissions.push) throw new GhError(403, '이 GitHub 계정에는 저장소 쓰기 권한이 없습니다.');
      store.set(v, $('#tkSave', root).checked);
      showTabs(root);
    } catch (err) { TOKEN = ''; $('#tkErr', root).textContent = err.message; }
  });
}

function showTabs(root) {
  gh('/user').then(u => { $('#edWho', root).innerHTML = `GitHub <b>${esc(u.login)}</b> 로 연결됨 · <button type="button" class="ed-link" id="tkOut">토큰 바꾸기</button>`; $('#tkOut', root).onclick = () => { store.set(''); TOKEN = ''; $('#edWho', root).textContent = ''; showToken(root); }; })
    .catch(e => { if (e.status === 401) { store.set(''); TOKEN = ''; showToken(root, e.message); } });
  $('#edMain', root).innerHTML = '<div id="edTab"></div>';
  go(CURTAB);
}

// ── 문구·가격·FAQ
const T = { base: null, work: '', exps: [], pending: new Map(), applied: [], structural: [], cur: 'COMPANY', q: '' };
const allEdits = () => [...T.applied, ...T.pending.values()];
async function tabText(el) {
  el.innerHTML = '<p class="muted">src/data.mjs 를 불러오는 중…</p>';
  if (!T.base) { T.base = await getText(DATA_FILE); T.work = T.base.text; }
  T.exps = parseExports(T.work);
  const names = T.exps.map(e => e.name);
  const order = [...FIRST.filter(n => names.includes(n)), ...names.filter(n => !FIRST.includes(n) && !ADVANCED.includes(n)), ...ADVANCED.filter(n => names.includes(n))];
  el.innerHTML = `
    <div class="ed-bar">
      <label>항목 <select id="exSel">${order.map(n => `<option value="${n}"${n === T.cur ? ' selected' : ''}>${esc(EXPORT_LABELS[n] || n)}</option>`).join('')}</select></label>
      <label class="ed-grow">찾기 <input type="search" id="exQ" placeholder="사이트에 보이는 문구 일부를 넣으면 그 문구가 있는 칸만 모아 보여 줍니다" value="${esc(T.q)}"></label>
    </div>
    <p class="muted" style="font-size:12.5px;margin:6px 0 12px">회색 칸(🔒)은 다른 값으로 자동 계산되는 부분이라 여기서 고칠 수 없습니다. 가격을 바꾸면 그 가격을 쓰는 FAQ·안내 문구도 함께 바뀝니다.</p>
    <div id="exBody"></div>
    <div class="ed-save" id="exSave" hidden><span id="exCount"></span><button type="button" class="ed-btn ghost" id="exUndo">바꾼 내용 취소</button><button type="button" class="ed-btn" id="exGo">저장해서 사이트에 반영</button></div>`;
  $('#exSel', el).onchange = e => { T.cur = e.target.value; T.q = ''; $('#exQ', el).value = ''; drawText(el); };
  let qt; $('#exQ', el).oninput = e => { clearTimeout(qt); qt = setTimeout(() => { T.q = e.target.value.trim(); drawText(el); }, 250); };
  $('#exUndo', el).onclick = () => { if (!confirm('저장하지 않은 수정을 모두 취소할까요?')) return; T.work = T.base.text; T.pending.clear(); T.applied = []; T.structural = []; tabText(el); };
  $('#exGo', el).onclick = () => saveText(el);
  drawText(el);
}
function fieldHtml(f) {
  const k = pathKey(f.path), p = T.pending.get(k), n = f.node;
  const val = p ? p.value : n.value, changed = p ? ' is-changed' : '';
  const lim = limitOf(f.path), len = typeof val === 'string' ? [...val].length : 0;
  const cnt = lim ? `<span class="ed-cnt${len > lim ? ' over' : ''}">${len}/${lim}자</span>` : '';
  if (n.type === 'bool') return `<label class="ed-chk${changed}"><input type="checkbox" data-k="${esc(k)}"${val ? ' checked' : ''}> 켜기</label>`;
  if (n.type === 'num') return `<input type="text" inputmode="numeric" class="ed-in num${changed}" data-k="${esc(k)}" value="${esc(String(val))}">${typeof val === 'number' && val >= 1000 ? `<span class="ed-cnt">${val.toLocaleString('ko-KR')}</span>` : ''}`;
  const long = String(val).length > 70 || /\n/.test(val);
  return (long ? `<textarea class="ed-in${changed}" data-k="${esc(k)}" rows="${Math.min(8, Math.ceil(String(val).length / 70) + 1)}">${esc(val)}</textarea>` : `<input type="text" class="ed-in${changed}" data-k="${esc(k)}" value="${esc(val)}">`) + cnt;
}
let FIELDS = new Map();
function nodeHtml(exp, node, path, depth) {
  if (node.type === 'obj') {
    return `<div class="ed-obj">${node.props.map(p => `<div class="ed-row"><div class="ed-key">${labelOf(p.key)}</div><div class="ed-val">${nodeHtml(exp, p.node, [...path, p.key], depth + 1)}</div></div>`).join('')}</div>`;
  }
  if (node.type === 'arr') {
    const complex = node.items.some(n => n.type === 'obj' || n.type === 'arr');
    const ak = esc(pathKey(path));
    const items = node.items.map((n, k) => {
      const inner = nodeHtml(exp, n, [...path, k], depth + 1);
      const del = n.type !== 'code' ? `<button type="button" class="ed-link del" data-del="${ak}" data-i="${k}">삭제</button>` : '';
      if (!complex) return `<div class="ed-li"><span class="ed-num">${k + 1}</span><div class="ed-val">${inner}</div>${del}</div>`;
      const first = n.type === 'obj' ? (walk(exp, n).find(f => f.node.type === 'str') || {}).node?.value || '' : '';
      return `<details class="ed-item"${depth > 1 ? '' : ''}><summary><span class="ed-num">${k + 1}</span> ${esc(String(first).slice(0, 70)) || '(항목)'} ${del}</summary>${inner}</details>`;
    }).join('');
    const add = node.items.length && node.items.at(-1).type !== 'code' ? `<button type="button" class="ed-link add" data-add="${ak}">+ 항목 추가(마지막 항목 복사)</button>` : '';
    ARRS.set(pathKey(path), node);
    return `<div class="ed-arr">${items || '<p class="muted">비어 있음</p>'}${add}</div>`;
  }
  if (node.type === 'code') return `<div class="ed-lock" title="다른 값으로 계산되는 부분">🔒 <code>${esc(T.work.slice(node.start, Math.min(node.end, node.start + 90)))}${node.end - node.start > 90 ? '…' : ''}</code></div>`;
  FIELDS.set(pathKey(path), { path, node, exp });
  return fieldHtml({ path, node });
}
let ARRS = new Map();
function drawText(el) {
  FIELDS = new Map(); ARRS = new Map();
  const body = $('#exBody', el);
  if (T.q) {
    const q = T.q.toLowerCase(), hits = [];
    for (const e of T.exps) for (const f of walk(e.name, e.node)) if (f.node.type === 'str' && String(T.pending.get(pathKey(f.path))?.value ?? f.node.value).toLowerCase().includes(q)) hits.push({ ...f, exp: e.name });
    body.innerHTML = hits.length ? `<p class="muted" style="margin:0 0 8px">「${esc(T.q)}」 ${hits.length}곳${hits.length > 60 ? ' (앞 60곳만 표시)' : ''}</p>` + hits.slice(0, 60).map(f => { FIELDS.set(pathKey(f.path), f); return `<div class="ed-row"><div class="ed-key">${esc(EXPORT_LABELS[f.exp] || f.exp)} › ${f.path.slice(1).map(x => (typeof x === 'number' ? x + 1 : KEY_LABELS[x] || x)).join(' › ')}</div><div class="ed-val">${fieldHtml(f)}</div></div>`; }).join('')
      : `<p class="muted">「${esc(T.q)}」가 들어간 문구를 찾지 못했습니다. 띄어쓰기를 줄이거나 더 짧게 찾아보세요.</p>`;
  } else {
    const e = T.exps.find(x => x.name === T.cur) || T.exps[0];
    const warn = ADVANCED.includes(e.name) ? '<p class="note" style="margin-top:0">⚠ 기술 설정입니다. 잘못 바꾸면 검색 등록·사이트 주소가 깨질 수 있어요.</p>' : '';
    body.innerHTML = warn + `<p class="muted" style="font-size:12px;margin:0 0 8px">src/data.mjs ${e.line}행 · ${esc(e.name)}</p>` + nodeHtml(e.name, e.node, [e.name], 0);
  }
  body.oninput = body.onchange = ev => {
    const t = ev.target.closest('[data-k]'); if (!t) return;
    const f = FIELDS.get(t.dataset.k); if (!f) return;
    let v = f.node.type === 'bool' ? t.checked : t.value;
    if (f.node.type === 'num') v = v.replace(/[^\d.-]/g, '');
    if (String(v) === String(f.node.value)) T.pending.delete(t.dataset.k); else T.pending.set(t.dataset.k, { ...f, value: f.node.type === 'num' ? Number(v) : v });
    t.classList.toggle('is-changed', T.pending.has(t.dataset.k));
    const c = t.parentElement.querySelector('.ed-cnt'); const lim = limitOf(f.path);
    if (c && lim) { const len = [...String(v)].length; c.textContent = `${len}/${lim}자`; c.classList.toggle('over', len > lim); }
    updateSaveBar(el);
  };
  body.onclick = ev => {
    const a = ev.target.closest('[data-add],[data-del]'); if (!a) return;
    ev.preventDefault();
    const arr = ARRS.get(a.dataset.add || a.dataset.del); if (!arr) return;
    T.work = applyPending(T.work); T.applied.push(...[...T.pending.values()].map(p => ({ ...p, loose: true }))); T.pending.clear(); // 번호가 밀릴 수 있어 검증은 값 포함 여부로
    const arrNow = findArr(T.work, a.dataset.add || a.dataset.del);
    if (a.dataset.add) { T.work = cloneItem(T.work, arrNow); T.structural.push(`항목 추가`); }
    else { if (!confirm(`${+a.dataset.i + 1}번 항목을 지울까요? (저장 전까지는 「바꾼 내용 취소」로 되돌릴 수 있습니다)`)) { T.exps = parseExports(T.work); return drawText(el); } T.work = removeItem(T.work, arrNow, +a.dataset.i); T.structural.push(`항목 삭제`); }
    T.exps = parseExports(T.work);
    drawText(el);
    const det = [...$('#exBody', el).querySelectorAll('details')]; if (a.dataset.add && det.length) det.at(-1).open = true;
  };
  updateSaveBar(el);
}
function findArr(src, key) {
  const parts = key.split('\u0001'); const exp = parseExports(src).find(e => e.name === parts[0]);
  let n = exp.node;
  for (const p of parts.slice(1)) n = n.type === 'obj' ? n.props.find(x => String(x.key) === p).node : n.items[+p];
  return n;
}
function applyPending(src) {
  if (!T.pending.size) return src;
  const fresh = new Map(); for (const e of parseExports(src)) for (const f of walk(e.name, e.node)) fresh.set(pathKey(f.path), f);
  return applyEdits(src, [...T.pending].map(([k, p]) => { const f = fresh.get(k); if (!f) throw new Error(`바꿀 위치를 찾지 못함: ${k}`); return { start: f.node.start, end: f.node.end, text: literalText(f.node, p.value) }; }));
}
function updateSaveBar(el) {
  const n = T.pending.size + T.applied.length + T.structural.length;
  $('#exSave', el).hidden = !n;
  $('#exCount', el).textContent = `바꾼 곳 ${T.pending.size + T.applied.length}${T.structural.length ? ` · ${T.structural.join(', ')}` : ''}`;
}
async function saveText(el) {
  const btn = $('#exGo', el); btn.disabled = true;
  try {
    const final = applyPending(T.work);
    if (final === T.base.text) { toast('바뀐 내용이 없습니다.'); return; }
    // 검증: 브라우저에서 새 파일을 실제로 불러 보고, 바꾼 값이 그 자리에 들어갔는지 확인
    const url = URL.createObjectURL(new Blob([final], { type: 'text/javascript' }));
    let mod; try { mod = await import(url); } catch (err) { throw new Error(`바꾼 파일을 읽지 못했습니다(문법 오류): ${err.message}`); } finally { URL.revokeObjectURL(url); }
    const before = parseExports(T.base.text).map(e => e.name);
    const missing = before.filter(n => !(n in mod)); if (missing.length) throw new Error(`항목이 사라졌습니다: ${missing.join(', ')}`);
    for (const p of allEdits()) {
      const ok = p.loose ? JSON.stringify(mod[p.path[0]]).includes(JSON.stringify(p.value).replace(/^"|"$/g, '')) : getPath(mod, p.path) === p.value;
      if (!ok) throw new Error(`값이 예상과 다르게 들어갔습니다: ${p.path.join(' › ')}`);
    }
    const lines = allEdits().map(p => `• ${EXPORT_LABELS[p.path[0]] || p.path[0]} › ${p.path.slice(1).map(x => (typeof x === 'number' ? x + 1 : KEY_LABELS[x] || x)).join(' › ')}\n   ${String(p.node.value).slice(0, 60)} → ${String(p.value).slice(0, 60)}`);
    const over = allEdits().filter(p => limitOf(p.path) && [...String(p.value)].length > limitOf(p.path));
    if (!confirm(`이대로 저장할까요? 2~3분 뒤 사이트에 반영됩니다.\n\n${[...lines, ...T.structural.map(s => '• ' + s)].slice(0, 15).join('\n')}${lines.length > 15 ? `\n… 외 ${lines.length - 15}곳` : ''}${over.length ? `\n\n⚠ 글자 수 기준을 넘은 칸 ${over.length}곳(검색 결과에서 잘릴 수 있음)` : ''}`)) return;
    const what = `문구 ${allEdits().length}곳${T.structural.length ? ` · ${T.structural.join(', ')}` : ''}`;
    const exps = [...new Set(allEdits().map(p => EXPORT_LABELS[p.path[0]] || p.path[0]))].join(', ');
    const r = await commitFiles([{ path: DATA_FILE, content: final }], `관리자 수정: ${exps || '내용'} ${what}`, { [DATA_FILE]: T.base.sha });
    T.base = { text: final, sha: r.files[0].blobSha }; T.work = final; T.pending.clear(); T.applied = []; T.structural = [];
    tabText(el.closest('#edTab') || el);
    watchDeploy(r.sha, what);
  } catch (err) { toast(esc(err.message), 'bad'); }
  finally { btn.disabled = false; }
}

// ── 이미지
const IMG = { list: null, folder: '', q: '', sel: null };
const extOf = p => (p.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase() || '';
const MIME = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
async function loadImages(force) {
  if (IMG.list && !force) return;
  const t = await treeOf(await headSha());
  IMG.list = [...t.values()].filter(x => x.path.startsWith('assets/img/') && /\.(webp|jpe?g|png|gif|svg)$/i.test(x.path)).map(x => ({ path: x.path, rel: x.path.slice(11), size: x.size, sha: x.sha })).sort((a, b) => a.path.localeCompare(b.path));
}
async function tabImages(el) {
  el.innerHTML = '<p class="muted">이미지 목록을 불러오는 중…</p>';
  await loadImages();
  const folders = [...new Set(IMG.list.map(x => x.rel.includes('/') ? x.rel.slice(0, x.rel.lastIndexOf('/')) : '(최상위)'))].sort();
  if (!IMG.folder) IMG.folder = folders.includes('portfolio') ? 'portfolio' : folders[0];
  el.innerHTML = `
    <div class="ed-bar">
      <label>폴더 <select id="imF">${folders.map(f => `<option${f === IMG.folder ? ' selected' : ''}>${esc(f)}</option>`).join('')}</select></label>
      <label class="ed-grow">파일 이름 찾기 <input type="search" id="imQ" value="${esc(IMG.q)}"></label>
      <button type="button" class="ed-btn" id="imAdd">+ 새 이미지 올리기</button>
    </div>
    <div id="imPanel"></div>
    <p class="muted" style="font-size:12.5px;margin:8px 0">이미지를 누르면 크게 보고 교체할 수 있습니다. 교체한 이미지는 같은 파일 이름·형식·크기로 저장돼, 사이트 코드를 고치지 않아도 그 자리에 바로 반영됩니다.</p>
    <div class="ed-grid" id="imGrid"></div>`;
  const draw = () => {
    const rows = IMG.list.filter(x => (IMG.folder === '(최상위)' ? !x.rel.includes('/') : x.rel.startsWith(IMG.folder + '/') && !x.rel.slice(IMG.folder.length + 1).includes('/')) && (!IMG.q || x.rel.toLowerCase().includes(IMG.q.toLowerCase())));
    $('#imGrid', el).innerHTML = rows.map(x => `<button type="button" class="ed-img" data-p="${esc(x.path)}"><img src="/${esc(x.path)}" alt="" loading="lazy"><span>${esc(x.rel.split('/').pop())}<small>${Math.round(x.size / 1024)}KB</small></span></button>`).join('') || '<p class="muted">이미지가 없습니다.</p>';
  };
  $('#imF', el).onchange = e => { IMG.folder = e.target.value; draw(); };
  $('#imQ', el).oninput = e => { IMG.q = e.target.value.trim(); draw(); };
  $('#imGrid', el).onclick = e => { const b = e.target.closest('[data-p]'); if (b) imgDetail(el, IMG.list.find(x => x.path === b.dataset.p)); };
  $('#imAdd', el).onclick = () => imgAdd(el, folders);
  draw();
}
async function toImage(file, { mime, width, height, crop, maxW = 1600, quality = 0.86 }) {
  const bmp = await createImageBitmap(file);
  let sx = 0, sy = 0, sw = bmp.width, sh = bmp.height, tw, th;
  if (width && height && crop) { const r = width / height; if (sw / sh > r) { const nw = sh * r; sx = (sw - nw) / 2; sw = nw; } else { const nh = sw / r; sy = (sh - nh) / 2; sh = nh; } tw = width; th = height; }
  else { tw = Math.min(width || maxW, sw); th = Math.round(tw * sh / sw); }
  const cv = document.createElement('canvas'); cv.width = tw; cv.height = th;
  const cx = cv.getContext('2d'); cx.imageSmoothingQuality = 'high'; cx.drawImage(bmp, sx, sy, sw, sh, 0, 0, tw, th);
  const blob = await new Promise(r => cv.toBlob(r, mime, quality));
  if (!blob || blob.type !== mime) throw new Error(`이 브라우저는 ${mime.split('/')[1].toUpperCase()} 저장을 지원하지 않습니다. 크롬·엣지에서 해 주세요.`);
  return { bytes: new Uint8Array(await blob.arrayBuffer()), w: tw, h: th, url: URL.createObjectURL(blob), size: blob.size };
}
function imgDetail(el, x) {
  const ext = extOf(x.path), can = !!MIME[ext];
  $('#imPanel', el).innerHTML = `
    <div class="ed-detail">
      <div class="ed-prev"><img id="imOld" src="/${esc(x.path)}" alt=""><div class="muted" style="font-size:12.5px" id="imDim">${esc(x.rel)} · ${Math.round(x.size / 1024)}KB</div></div>
      <div class="ed-prev" id="imNewBox" hidden><img id="imNew" alt=""><div class="muted" style="font-size:12.5px" id="imNewDim"></div></div>
      <div class="ed-act">
        <p style="margin:0 0 6px"><b>${esc(x.rel.split('/').pop())}</b></p>
        <p class="muted" style="font-size:12.5px;margin:0 0 10px">사이트 경로: <code>${esc(x.rel)}</code> <button type="button" class="ed-link" id="imCopy">경로 복사</button></p>
        ${can ? `<label class="ed-btn ghost" style="display:inline-block">교체할 이미지 선택<input type="file" id="imFile" accept="image/*" hidden></label>
        <label class="ed-chk"><input type="checkbox" id="imCrop" checked> 원래 비율로 가운데 맞춰 자르기</label>
        <button type="button" class="ed-btn" id="imSave" disabled>교체 저장</button>` : `<p class="muted">${esc(ext.toUpperCase())} 파일은 여기서 교체할 수 없습니다.</p>`}
        <button type="button" class="ed-link" id="imClose">닫기</button>
      </div>
    </div>`;
  const old = $('#imOld', el); let ow = 0, oh = 0, made = null, file = null;
  old.onload = () => { ow = old.naturalWidth; oh = old.naturalHeight; $('#imDim', el).textContent = `${x.rel} · ${ow}×${oh} · ${Math.round(x.size / 1024)}KB`; };
  $('#imClose', el).onclick = () => { $('#imPanel', el).innerHTML = ''; };
  $('#imCopy', el).onclick = () => navigator.clipboard?.writeText(x.rel).then(() => toast(`경로를 복사했습니다: ${esc(x.rel)}`));
  if (!can) return;
  const remake = async () => {
    if (!file) return;
    try {
      made = await toImage(file, { mime: MIME[ext], width: ow, height: oh, crop: $('#imCrop', el).checked });
      $('#imNew', el).src = made.url; $('#imNewBox', el).hidden = false;
      $('#imNewDim', el).textContent = `새 이미지 ${made.w}×${made.h} · ${Math.round(made.size / 1024)}KB`;
      $('#imSave', el).disabled = false;
    } catch (err) { toast(esc(err.message), 'bad'); }
  };
  $('#imFile', el).onchange = e => { file = e.target.files[0]; remake(); };
  $('#imCrop', el).onchange = remake;
  $('#imSave', el).onclick = async () => {
    if (!made || !confirm(`${x.rel} 을(를) 새 이미지로 바꿀까요?`)) return;
    $('#imSave', el).disabled = true;
    try {
      const r = await commitFiles([{ path: x.path, content: made.bytes }], `관리자 수정: 이미지 교체 ${x.rel}`);
      x.size = made.size; IMG.list = null; treeCache.clear();
      watchDeploy(r.sha, `이미지 ${x.rel}`);
      $('#imPanel', el).innerHTML = `<p class="note">${esc(x.rel)} 을(를) 교체했습니다. 반영되면 이 목록의 미리보기도 새 이미지로 바뀝니다.</p>`;
    } catch (err) { toast(esc(err.message), 'bad'); $('#imSave', el).disabled = false; }
  };
}
function imgAdd(el, folders) {
  $('#imPanel', el).innerHTML = `
    <div class="ed-detail">
      <div class="ed-prev" id="naBox" hidden><img id="naImg" alt=""><div class="muted" style="font-size:12.5px" id="naDim"></div></div>
      <div class="ed-act">
        <p style="margin:0 0 8px"><b>새 이미지 올리기</b> — WebP 로 바꿔(가로 최대 1600px) 저장합니다.</p>
        <label>폴더 <select id="naF">${folders.filter(f => f !== '(최상위)').map(f => `<option${f === IMG.folder ? ' selected' : ''}>${esc(f)}</option>`).join('')}</select></label>
        <label class="ed-btn ghost" style="display:inline-block;margin-top:8px">이미지 선택<input type="file" id="naFile" accept="image/*" hidden></label>
        <label style="display:block;margin-top:8px">파일 이름(영문·숫자·-) <input type="text" id="naName" class="ed-in" placeholder="예: portfolio-new-01"></label>
        <button type="button" class="ed-btn" id="naSave" disabled style="margin-top:8px">올리기</button>
        <button type="button" class="ed-link" id="naClose">닫기</button>
        <p class="muted" style="font-size:12.5px">올린 뒤 「문구·가격·FAQ」에서 해당 항목의 「이미지 경로」 칸에 경로를 넣으면 사이트에 표시됩니다. 포트폴리오처럼 번호로 정해지는 이미지는 같은 이름으로 올리면 그 자리에 들어갑니다.</p>
      </div>
    </div>`;
  let made = null;
  const slug = s => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const check = () => { $('#naSave', el).disabled = !(made && /^[a-z0-9][a-z0-9-]*$/.test($('#naName', el).value)); };
  $('#naClose', el).onclick = () => { $('#imPanel', el).innerHTML = ''; };
  $('#naName', el).oninput = check;
  $('#naFile', el).onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      made = await toImage(f, { mime: 'image/webp', maxW: 1600 });
      $('#naImg', el).src = made.url; $('#naBox', el).hidden = false; $('#naDim', el).textContent = `${made.w}×${made.h} · ${Math.round(made.size / 1024)}KB`;
      if (!$('#naName', el).value) $('#naName', el).value = slug(f.name) || `image-${Date.now().toString(36)}`;
      check();
    } catch (err) { toast(esc(err.message), 'bad'); }
  };
  $('#naSave', el).onclick = async () => {
    const rel = `${$('#naF', el).value}/${$('#naName', el).value}.webp`, p = `assets/img/${rel}`;
    if (IMG.list.some(x => x.path === p) && !confirm(`${rel} 이(가) 이미 있습니다. 덮어쓸까요?`)) return;
    $('#naSave', el).disabled = true;
    try {
      const r = await commitFiles([{ path: p, content: made.bytes }], `관리자 수정: 이미지 추가 ${rel}`);
      IMG.list = null; treeCache.clear();
      watchDeploy(r.sha, `이미지 ${rel}`);
      $('#imPanel', el).innerHTML = `<p class="note">올렸습니다: <code>${esc(rel)}</code> <button type="button" class="ed-link" id="naCopy">경로 복사</button></p>`;
      $('#naCopy', el).onclick = () => navigator.clipboard?.writeText(rel).then(() => toast('경로를 복사했습니다.'));
    } catch (err) { toast(esc(err.message), 'bad'); $('#naSave', el).disabled = false; }
  };
}

// ── 인사이트 글
const B = { posts: null, q: '', filter: 'all' };
function parseMd(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const fm = {}, order = [];
  if (m) for (const line of m[1].split(/\r?\n/)) { const mm = line.match(/^([A-Za-z_][\w-]*):\s?(.*)$/); if (mm) { fm[mm[1]] = mm[2].trim(); order.push(mm[1]); } }
  return { fm, order, body: m ? text.slice(m[0].length) : text };
}
function buildMd(fm, order, body) {
  const keys = [...order, ...Object.keys(fm).filter(k => !order.includes(k))];
  return '---\n' + keys.filter(k => fm[k] != null && String(fm[k]).trim() !== '').map(k => `${k}: ${String(fm[k]).replace(/\r?\n/g, ' ').trim()}`).join('\n') + '\n---\n' + String(body).replace(/^\s*\n/, '').replace(/\s*$/, '\n');
}
const isPublic = fm => fm.date && Date.parse(`${fm.date}T${(fm.time || '00:00')}:00+09:00`) <= Date.now();
const normKw = k => String(k || '').replace(/[\s·]/g, '').toLowerCase();
async function loadPosts(force) {
  if (B.posts && !force) return;
  let entries = null;
  try {
    const q = `query { repository(owner:"${OWNER}", name:"${NAME}") { object(expression:"${BRANCH}:content/blog") { ... on Tree { entries { name oid object { ... on Blob { text } } } } } } }`;
    const r = await gh('/graphql', { method: 'POST', body: { query: q } });
    entries = r.data?.repository?.object?.entries?.filter(e => e.name.endsWith('.md')).map(e => ({ name: e.name, sha: e.oid, text: e.object?.text || '' }));
  } catch { }
  if (!entries) { // GraphQL 이 막히면 하나씩
    const t = await treeOf(await headSha());
    const files = [...t.values()].filter(x => /^content\/blog\/[^/]+\.md$/.test(x.path));
    entries = [];
    for (let i = 0; i < files.length; i += 8) entries.push(...await Promise.all(files.slice(i, i + 8).map(async f => ({ name: f.path.split('/').pop(), sha: f.sha, text: (await getText(f.path)).text }))));
  }
  B.posts = entries.map(e => ({ ...e, path: `content/blog/${e.name}`, ...parseMd(e.text) })).sort((a, b) => `${b.fm.date} ${b.fm.time}`.localeCompare(`${a.fm.date} ${a.fm.time}`));
}
async function tabBlog(el) {
  el.innerHTML = '<p class="muted">인사이트 글을 불러오는 중…</p>';
  await loadPosts();
  const pub = B.posts.filter(p => isPublic(p.fm)).length;
  el.innerHTML = `
    <div class="ed-bar">
      <div class="seg" id="bF"><button type="button" data-f="all" aria-pressed="${B.filter === 'all'}">전체 ${B.posts.length}</button><button type="button" data-f="pub" aria-pressed="${B.filter === 'pub'}">공개 ${pub}</button><button type="button" data-f="sch" aria-pressed="${B.filter === 'sch'}">예약 ${B.posts.length - pub}</button></div>
      <label class="ed-grow">찾기 <input type="search" id="bQ" value="${esc(B.q)}" placeholder="제목·검색어"></label>
      <button type="button" class="ed-btn" id="bNew">+ 새 글 쓰기</button>
    </div>
    <div class="tbl" id="bList"></div>`;
  const draw = () => {
    const q = B.q.toLowerCase();
    const rows = B.posts.filter(p => (B.filter === 'all' || (B.filter === 'pub') === isPublic(p.fm)) && (!q || `${p.fm.title} ${p.fm.keyword} ${p.fm.slug}`.toLowerCase().includes(q)));
    $('#bList', el).innerHTML = `<table><thead><tr><th>공개 일시</th><th>상태</th><th>제목</th><th>1순위 검색어</th><th></th></tr></thead><tbody>${rows.map(p => `<tr><td>${esc(p.fm.date)} ${esc(p.fm.time || '')}</td><td>${isPublic(p.fm) ? '공개' : '<span class="muted">예약</span>'}</td><td style="white-space:normal">${esc(p.fm.title)}</td><td>${esc(p.fm.keyword || '')}</td><td><button type="button" class="ed-link" data-e="${esc(p.path)}">편집</button></td></tr>`).join('')}</tbody></table>`;
  };
  $('#bF', el).onclick = e => { const b = e.target.closest('button'); if (!b) return; B.filter = b.dataset.f; $('#bF', el).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); };
  $('#bQ', el).oninput = e => { B.q = e.target.value.trim(); draw(); };
  $('#bList', el).onclick = e => { const b = e.target.closest('[data-e]'); if (b) postEdit(el, B.posts.find(p => p.path === b.dataset.e)); };
  $('#bNew', el).onclick = () => postEdit(el, null);
  draw();
}
// 사이트 글 검증기(tools/blog-ai/generate.mjs validate)와 같은 기준 — 여기서 걸러야 배포 점검(deploy.bat·GitHub)이 막히지 않는다
let SITE_DATA = null;
async function siteData() {
  if (SITE_DATA) return SITE_DATA;
  const src = T.base ? T.base.text : (await getText(DATA_FILE)).text;
  const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  try { const m = await import(url); SITE_DATA = { cats: m.BLOG_CATEGORIES || [], services: (m.SERVICES || []).map(s => s.slug), industries: (m.INDUSTRIES || []).map(s => s.slug) }; }
  finally { URL.revokeObjectURL(url); }
  return SITE_DATA;
}
const bigrams = s => { const t = s.replace(/\s+/g, ''); const set = new Set(); for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2)); return set; };
const simTitle = (a, b) => { const A = bigrams(a), C = bigrams(b); let n = 0; for (const x of A) if (C.has(x)) n++; return n / Math.max(1, Math.min(A.size, C.size)); };
function checkPost(v, SD, post, slug) {
  const errs = [], warns = [];
  for (const [k, n] of [['title', '제목'], ['description', '설명'], ['category', '분류'], ['tags', '태그'], ['cover', '썸네일 문구'], ['keyword', '1순위 검색어']]) if (!String(v[k] || '').trim()) errs.push(`${n}을(를) 채워 주세요.`);
  const tl = [...v.title].length, dl = [...v.description].length, cl = [...v.cover].length;
  if (tl && (tl < 12 || tl > 40)) errs.push(`제목은 12~40자입니다(지금 ${tl}자).`);
  if (dl && (dl < 40 || dl > 80)) errs.push(`설명은 40~80자입니다(지금 ${dl}자).`);
  if (cl > 32) errs.push(`썸네일 문구는 32자 이내입니다(지금 ${cl}자).`);
  if (v.cover && !/^[가-힣A-Za-z0-9\s.,·?!%~\-—–()'"“”‘’「」『』:/&+]+$/.test(v.cover)) errs.push('썸네일 문구에는 한글·영문·숫자·기본 문장부호만 쓸 수 있습니다(썸네일 글꼴에 없는 문자).');
  if (v.category && SD.cats.length && !SD.cats.includes(v.category)) errs.push(`분류는 ${SD.cats.join(' / ')} 중 하나입니다.`);
  if (v.service && !SD.services.includes(v.service)) errs.push(`연결 서비스 「${v.service}」가 서비스 목록에 없습니다.`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errs.push('주소 이름은 영문 소문자·숫자·- 만 씁니다(앞뒤·연속 - 불가).');
  if (!post && B.posts.some(p => p.name === `${slug}.md` || p.fm.slug === slug)) errs.push('같은 주소 이름의 글이 이미 있습니다.');
  const mineKw = normKw(v.keyword), dup = B.posts.find(p => p !== post && normKw(p.fm.keyword) && normKw(p.fm.keyword) === mineKw);
  if (dup) errs.push(`1순위 검색어가 「${dup.fm.title}」 글과 겹칩니다.`);
  if (!/^\d{4}-\d\d-\d\d$/.test(v.date) || !/^\d\d:\d\d$/.test(v.time)) errs.push('공개 날짜·시각을 확인해 주세요.');
  const body = v.body, len = body.replace(/\s+/g, '').length;
  if (len < 1200 || len > 4800) errs.push(`본문은 공백 빼고 1,200~4,800자입니다(지금 ${len.toLocaleString('ko-KR')}자).`);
  if (!/\n##\s+자주 묻는 질문/.test('\n' + body)) errs.push('「## 자주 묻는 질문」 소제목이 필요합니다.');
  if ((body.match(/\n###\s+Q\./g) || []).length < 2) errs.push('FAQ 질문(### Q. …)이 2개 이상 필요합니다.');
  if ((body.match(/^##\s/mg) || []).length < 4) errs.push('## 소제목이 4개 이상 필요합니다(자주 묻는 질문 포함).');
  if (!/\]\(\/(?:services|pricing|industries|contact|insights|reviews|portfolio)\//.test(body)) errs.push('사이트 내부 링크가 1개 이상 필요합니다(예: [홈페이지 제작](/services/website/)).');
  const when = new Map(B.posts.filter(p => p !== post).map(p => [p.fm.slug || p.name.replace(/\.md$/, ''), `${p.fm.date} ${p.fm.time || '00:00'}`]));
  const mine = `${v.date} ${v.time}`;
  for (const m of body.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const u = m[1], seg = u.split('/')[2];
    const ok = u === '/' || /^\/(?:pricing|industries|contact|insights|reviews|portfolio|faq|about|services)\/$/.test(u)
      || (/^\/services\/[a-z-]+\/$/.test(u) && SD.services.includes(seg)) || (/^\/industries\/[a-z-]+\/$/.test(u) && SD.industries.includes(seg))
      || (/^\/insights\/[a-z0-9-]+\/$/.test(u) && when.has(seg));
    if (!ok) errs.push(`없는 내부 주소: ${u} (끝에 / 가 있는지 확인)`);
    const t = /^\/insights\/[a-z0-9-]+\/$/.test(u) ? when.get(seg) : null;
    if (t && t > mine) errs.push(`아직 공개 전인 글로 가는 링크: ${u} (${t} 공개)`);
  }
  if (/https?:\/\//.test(body)) warns.push('외부 링크는 사이트 점검에서 허용된 주소만 통과합니다.');
  if (!post) { const s = B.posts.find(p => p.fm.title && simTitle(v.title, p.fm.title) > 0.72); if (s) warns.push(`제목이 「${s.fm.title}」와 비슷합니다.`); }
  return { errs, warns };
}
async function postEdit(el, post) {
  const SD = await siteData().catch(() => ({ cats: [], services: [], industries: [] }));
  const isNew = !post;
  const tomorrow = new Date(Date.now() + 9 * 3600e3 + 864e5).toISOString().slice(0, 10);
  const fm = post ? { ...post.fm } : { title: '', description: '', slug: '', date: tomorrow, time: '09:00', category: '', tags: '', keyword: '', service: '', cover: '', author: '미래애드원 마케팅팀' };
  const order = post ? post.order : ['title', 'description', 'slug', 'date', 'time', 'category', 'tags', 'keyword', 'service', 'cover', 'author', 'generated', 'topic'];
  const uniq = k => [...new Set(B.posts.map(p => p.fm[k]).filter(Boolean))].sort();
  const F = (k, label, attrs = '', hint = '') => `<label class="ed-f"><span>${label}${hint ? ` <small class="muted">${hint}</small>` : ''}</span><input class="ed-in" name="${k}" value="${esc(fm[k] || '')}" ${attrs}></label>`;
  el.innerHTML = `
    <p><button type="button" class="ed-link" id="pBack">← 글 목록</button></p>
    <h3 style="margin:0 0 10px">${isNew ? '새 글 쓰기' : esc(fm.title)}</h3>
    <form id="pForm" class="ed-form">
      ${F('title', '제목', 'required', '12~40자 · 1순위 검색어를 앞쪽에')}<span class="ed-cnt" data-c="title"></span>
      ${F('description', '설명(검색 결과에 보이는 문장)', 'required', '40~80자')}<span class="ed-cnt" data-c="description"></span>
      <div class="ed-cols">
        ${F('slug', '주소 이름', isNew ? 'required autocapitalize="off" spellcheck="false" placeholder="예: blog-agency-checklist"' : 'readonly', isNew ? '영문 소문자·숫자·- · 나중에 못 바꿈' : '바꿀 수 없음')}
        ${F('date', '공개 날짜', 'type="date" required')}
        ${F('time', '공개 시각', 'type="time" required', '09:00·13:00·18:00 빌드 때 공개')}
      </div>
      <div class="ed-cols">
        ${F('keyword', '1순위 검색어', 'required', '다른 글과 겹치면 안 됨')}
        ${F('category', '분류', 'list="dlCat" required')}
        ${F('service', '연결 서비스', 'list="dlSvc"')}
      </div>
      ${F('tags', '태그', 'required', '쉼표로 구분')}
      ${F('cover', '썸네일 문구', 'required maxlength="32"', '썸네일 이미지에 들어갈 32자 이내 문장')}<span class="ed-cnt" data-c="cover"></span>
      <label class="ed-f"><span>본문 <small class="muted">마크다운 — ## 소제목 4개 이상(마지막은 「## 자주 묻는 질문」 + ### Q. 2개 이상), 공백 빼고 1,200~4,800자, 내부 링크 1개 이상([홈페이지 제작](/services/website/))</small></span><textarea class="ed-in mono" name="body" rows="22">${esc(post ? post.body : '첫 문단에 질문에 대한 답을 먼저 씁니다.\n\n## 첫 번째 소제목\n\n본문\n\n## 두 번째 소제목\n\n본문\n\n## 세 번째 소제목\n\n본문과 관련 서비스 링크 예: [홈페이지 제작·운영](/services/website/)\n\n## 자주 묻는 질문\n\n### Q. 첫 번째 질문\n답변\n\n### Q. 두 번째 질문\n답변\n')}</textarea></label><span class="ed-cnt" data-c="body"></span>
      <datalist id="dlCat">${(SD.cats.length ? SD.cats : uniq('category')).map(v => `<option value="${esc(v)}">`).join('')}</datalist>
      <datalist id="dlSvc">${(SD.services.length ? SD.services : uniq('service')).map(v => `<option value="${esc(v)}">`).join('')}</datalist>
      <div class="err" id="pErr"></div>
      <div class="ed-save"><span class="muted">${isNew ? '새 글' : esc(post.path)}${post && isPublic(post.fm) ? ' · 이미 공개된 글' : ''}</span>${post ? '<button type="button" class="ed-btn ghost danger" id="pDel">글 삭제</button>' : ''}<button type="submit" class="ed-btn">저장해서 반영</button></div>
    </form>
    <p class="muted" style="font-size:12.5px">썸네일 이미지는 매일 자동 갱신(측정이 끝나는 13시 전후) 때 만들어집니다. 그 전에는 썸네일 없이 글이 공개될 수 있습니다. 금지 표현·근거 없는 수치 검사는 사이트 배포 점검에서 한 번 더 합니다.</p>`;
  const form = $('#pForm', el);
  const counts = () => {
    for (const [k, lo, hi] of [['title', 12, 40], ['description', 40, 80], ['cover', 1, 32]]) { const n = [...form[k].value].length, c = form.querySelector(`[data-c="${k}"]`); c.textContent = `${n}/${hi}자`; c.classList.toggle('over', n > hi || (n > 0 && n < lo)); }
    const n = form.body.value.replace(/\s+/g, '').length, c = form.querySelector('[data-c="body"]'); c.textContent = `본문 ${n.toLocaleString('ko-KR')}자(공백 제외, 1,200~4,800)`; c.classList.toggle('over', n < 1200 || n > 4800);
  };
  form.oninput = counts; counts();
  $('#pBack', el).onclick = () => tabBlog(el);
  if (post) $('#pDel', el).onclick = async () => {
    if (!confirm(`「${fm.title}」 글을 삭제할까요?${isPublic(post.fm) ? '\n이미 공개된 글이라 주소가 없어집니다(검색에서 들어오던 사람은 404).' : ''}`)) return;
    try { const r = await commitFiles([{ path: post.path, content: null }], `관리자 수정: 글 삭제 ${post.name}`, { [post.path]: post.sha }); B.posts = null; treeCache.clear(); watchDeploy(r.sha, `글 삭제 ${fm.title}`); tabBlog(el); }
    catch (err) { $('#pErr', el).textContent = err.message; }
  };
  form.onsubmit = async e => {
    e.preventDefault();
    const v = Object.fromEntries([...new FormData(form)].map(([k, x]) => [k, String(x)]));
    const slug = isNew ? v.slug.trim() : fm.slug || post.name.replace(/\.md$/, '');
    const { errs, warns } = checkPost(v, SD, post, slug);
    if (errs.length) { $('#pErr', el).innerHTML = `<b>저장 전에 고쳐 주세요(사이트 글 기준)</b><ul style="margin:4px 0 0;padding-left:18px">${errs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`; $('#pErr', el).scrollIntoView({ block: 'nearest' }); return; }
    $('#pErr', el).textContent = '';
    if (warns.length && !confirm(`확인해 주세요:\n- ${warns.join('\n- ')}\n\n그래도 저장할까요?`)) return;
    const nf = { ...fm, ...v, slug };
    delete nf.body;
    if (isNew) { nf.generated = `관리자 작성 ${todayKST()}`; nf.topic = slug; }
    const md = buildMd(nf, order, v.body);
    const path = post ? post.path : `content/blog/${slug}.md`;
    const pub = Date.parse(`${v.date}T${v.time}:00+09:00`) <= Date.now();
    if (!confirm(`${isNew ? '새 글을' : '글을'} 저장할까요?\n${v.title}\n공개: ${v.date} ${v.time}${pub ? ' (이미 지난 시각 — 다음 빌드 때 바로 공개)' : ' (예약)'}`)) return;
    try {
      const r = await commitFiles([{ path, content: md }], `관리자 수정: ${isNew ? '새 글' : '글 수정'} ${slug}`, post ? { [path]: post.sha } : {});
      B.posts = null; treeCache.clear();
      watchDeploy(r.sha, `${isNew ? '새 글' : '글'} 「${v.title}」`);
      tabBlog(el);
    } catch (err) { $('#pErr', el).textContent = err.message; }
  };
}

// ── 수정 기록·되돌리기
async function tabLog(el) {
  el.innerHTML = '<p class="muted">최근 수정 기록을 불러오는 중…</p>';
  const cs = await gh(`/repos/${REPO}/commits?sha=${BRANCH}&per_page=30`);
  const reverted = new Set(cs.map(c => (c.commit.message.match(/되돌리기 \[([0-9a-f]{7})\]/) || [])[1]).filter(Boolean));
  el.innerHTML = `<p class="muted" style="font-size:12.5px;margin:0 0 8px">최근 30건. 「관리자 수정」으로 시작하는 것은 이 화면에서 저장한 수정이며 되돌릴 수 있습니다. 「관리자 측정 데이터 자동 갱신」은 매일 자동으로 올라가는 측정 결과입니다.</p>
    <div class="tbl"><table><thead><tr><th>시각</th><th>내용</th><th>누가</th><th></th></tr></thead><tbody>${cs.map(c => { const msg = c.commit.message.split('\n')[0]; const mine = msg.startsWith('관리자 수정:') && !reverted.has(c.sha.slice(0, 7)); return `<tr><td>${esc(kst(c.commit.author.date))}</td><td style="white-space:normal">${esc(msg)}</td><td>${esc(c.author?.login || c.commit.author.name)}</td><td>${mine ? `<button type="button" class="ed-link" data-r="${c.sha}">되돌리기</button>` : reverted.has(c.sha.slice(0, 7)) ? '<span class="muted">되돌림</span>' : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
  el.onclick = async e => {
    const b = e.target.closest('[data-r]'); if (!b) return;
    const sha = b.dataset.r;
    try {
      const c = await gh(`/repos/${REPO}/commits/${sha}`);
      const parent = c.parents[0].sha, head = await headSha();
      const [tp, th] = await Promise.all([treeOf(parent), treeOf(head)]);
      const after = await treeOf(sha);
      const changedSince = c.files.filter(f => (th.get(f.filename)?.sha || null) !== (after.get(f.filename)?.sha || null)).map(f => f.filename);
      if (!confirm(`이 수정을 되돌릴까요?\n${c.commit.message.split('\n')[0]}\n\n파일: ${c.files.map(f => f.filename).join(', ')}${changedSince.length ? `\n\n⚠ 그 뒤에 다시 바뀐 파일이 있습니다(${changedSince.join(', ')}). 되돌리면 그 뒤의 수정도 함께 없어집니다.` : ''}`)) return;
      b.disabled = true;
      const files = [];
      for (const f of c.files) {
        if (f.status === 'renamed') { files.push({ path: f.filename, content: null }); files.push({ path: f.previous_filename, sha: tp.get(f.previous_filename)?.sha }); continue; }
        const ps = tp.get(f.filename)?.sha;
        files.push(ps ? { path: f.filename, sha: ps } : { path: f.filename, content: null });
      }
      const r = await commitFiles(files, `관리자 수정 되돌리기 [${sha.slice(0, 7)}]: ${c.commit.message.split('\n')[0].replace(/^관리자 수정:\s*/, '')}`);
      T.base = null; IMG.list = null; B.posts = null; treeCache.clear();
      watchDeploy(r.sha, '되돌리기');
      tabLog(el);
    } catch (err) { toast(esc(err.message), 'bad'); b.disabled = false; }
  };
}
