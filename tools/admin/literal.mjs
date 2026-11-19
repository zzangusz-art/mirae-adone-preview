// src/data.mjs 같은 「내용 파일」을 안전하게 고치기 위한 작은 해석기(브라우저·Node 공용, 의존성 없음)
// - export const 이름 = 값; 을 찾고, 값 안의 문자열·숫자·참거짓 「글자 그대로 적힌 값」만 고칠 수 있게 위치를 알려 준다
// - 다른 값으로 계산되는 부분(템플릿 ${…}, 함수 호출, 변수 참조, .map() 등)은 'code' 로 표시해 잠근다 → 가격·전화번호 같은 한 곳 관리 값이 깨지지 않는다
// - 고칠 때는 원문에서 그 글자 범위만 바꾼다(나머지 코드·주석·줄바꿈은 그대로)

const WS = /\s/;
const IDENT = /[A-Za-z0-9_$À-￿]/;

// 문자열·템플릿·주석을 건너뛴다. i 는 여는 따옴표/슬래시 위치. 끝 다음 위치를 돌려준다
function skipQuoted(s, i) {
  const q = s[i];
  for (let j = i + 1; j < s.length; j++) {
    if (s[j] === '\\') { j++; continue; }
    if (s[j] === q) return j + 1;
    if (s[j] === '\n' && q !== '`') throw new Error(`문자열이 줄 안에서 끝나지 않음(${lineOf(s, i)}행)`);
  }
  throw new Error(`문자열이 끝나지 않음(${lineOf(s, i)}행)`);
}
function skipTemplate(s, i) { // i = 여는 백틱
  for (let j = i + 1; j < s.length; j++) {
    const c = s[j];
    if (c === '\\') { j++; continue; }
    if (c === '`') return j + 1;
    if (c === '$' && s[j + 1] === '{') { j = skipBalanced(s, j + 1) - 1; }
  }
  throw new Error(`템플릿 문자열이 끝나지 않음(${lineOf(s, i)}행)`);
}
function skipComment(s, i) { // i = '/' 이고 다음이 '/' 또는 '*'
  if (s[i + 1] === '/') { const e = s.indexOf('\n', i); return e < 0 ? s.length : e; }
  const e = s.indexOf('*/', i + 2); if (e < 0) throw new Error('주석이 끝나지 않음'); return e + 2;
}
// 괄호 하나({ [ ( )를 짝 맞춰 건너뛴다. i = 여는 괄호
function skipBalanced(s, i) {
  const open = s[i], close = { '{': '}', '[': ']', '(': ')' }[open];
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === '\'' || c === '"') { j = skipQuoted(s, j) - 1; continue; }
    if (c === '`') { j = skipTemplate(s, j) - 1; continue; }
    if (c === '/' && (s[j + 1] === '/' || s[j + 1] === '*')) { j = skipComment(s, j) - 1; continue; }
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') { depth--; if (depth === 0) { if (c !== close) throw new Error(`괄호 짝이 맞지 않음(${lineOf(s, j)}행)`); return j + 1; } }
  }
  throw new Error(`괄호가 닫히지 않음(${lineOf(s, i)}행)`);
}
export const lineOf = (s, i) => s.slice(0, i).split('\n').length;
function ws(s, i) {
  for (;;) {
    while (i < s.length && WS.test(s[i])) i++;
    if (s[i] === '/' && (s[i + 1] === '/' || s[i + 1] === '*')) { i = skipComment(s, i); continue; }
    return i;
  }
}
// 값 하나(식)의 끝: 깊이 0 에서 , ; ) ] } 를 만나면 멈춘다
function skipExpr(s, i) {
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === '\'' || c === '"') { j = skipQuoted(s, j) - 1; continue; }
    if (c === '`') { j = skipTemplate(s, j) - 1; continue; }
    if (c === '/' && (s[j + 1] === '/' || s[j + 1] === '*')) { j = skipComment(s, j) - 1; continue; }
    if (c === '{' || c === '[' || c === '(') { j = skipBalanced(s, j) - 1; continue; }
    if (c === ',' || c === ';' || c === ')' || c === ']' || c === '}') return trimEnd(s, i, j);
    if (c === '\n') { // 줄이 바뀌고 다음 줄이 export/const 로 시작하면 세미콜론 없이 끝난 것
      const k = ws(s, j);
      if (/^(export|const|let|function|import)\s/.test(s.slice(k, k + 9))) return trimEnd(s, i, j);
    }
  }
  return trimEnd(s, i, s.length);
}
const trimEnd = (s, a, b) => { while (b > a && WS.test(s[b - 1])) b--; return b; };

function decodeString(raw) { // 따옴표 포함 원문 → 값
  const q = raw[0], body = raw.slice(1, -1);
  if (q === '"') return JSON.parse(raw);
  return body.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|\r?\n|.)/g, (m, e) => {
    if (e[0] === 'u') return String.fromCodePoint(parseInt(e[1] === '{' ? e.slice(2, -1) : e.slice(1), 16));
    if (e[0] === 'x') return String.fromCharCode(parseInt(e.slice(1), 16));
    if (e === '\n' || e === '\r\n') return '';
    return { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }[e] ?? e;
  });
}
// 값 → 작은따옴표 문자열 원문(이 파일들의 기존 표기와 같게)
export function encodeString(v) {
  const BS = String.fromCharCode(92), LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029); // 역슬래시·줄 구분 문자
  let out = String(v).split(BS).join(BS + BS).split('\'').join(BS + '\'');
  out = out.split('\r\n').join('\n').split('\n').join(BS + 'n').split('\t').join(BS + 't');
  out = out.split(LS).join(BS + 'u2028').split(PS).join(BS + 'u2029');
  return '\'' + out + '\'';
}

// 값 해석 → 노드. 노드: { type: 'obj'|'arr'|'str'|'num'|'bool'|'code', start, end, ... }
function parseValue(s, i) {
  i = ws(s, i);
  const start = i, c = s[i];
  let node;
  if (c === '{') node = parseObject(s, i);
  else if (c === '[') node = parseArray(s, i);
  else if (c === '\'' || c === '"') { const e = skipQuoted(s, i); node = { type: 'str', start, end: e, value: decodeString(s.slice(i, e)) }; }
  else if (c === '`') {
    const e = skipTemplate(s, i), raw = s.slice(i, e);
    node = /\$\{/.test(raw.replace(/\\./g, '')) ? { type: 'code', start, end: e } : { type: 'str', start, end: e, value: decodeString('\'' + raw.slice(1, -1) + '\'') };
  } else if (/[-\d.]/.test(c) && /^-?(\d[\d_]*\.?\d*|\.\d+)(e[-+]?\d+)?/i.test(s.slice(i, i + 30))) {
    const m = s.slice(i).match(/^-?(\d[\d_]*\.?\d*|\.\d+)(e[-+]?\d+)?/i);
    node = { type: 'num', start, end: i + m[0].length, value: Number(m[0].replace(/_/g, '')) };
  } else if (/^(true|false)\b/.test(s.slice(i, i + 6))) { const v = s.startsWith('true', i); node = { type: 'bool', start, end: i + (v ? 4 : 5), value: v }; }
  else { const e = skipExpr(s, i); return { type: 'code', start, end: e }; }
  // 글자 값 뒤에 연산·호출·속성 접근이 이어지면(예: 'a' + b, [..].map(...)) 전체를 계산식으로 본다
  const k = ws(s, node.end);
  if (k < s.length && !/[,;)\]}]/.test(s[k]) && !(s[k] === '\n')) {
    const rest = s.slice(k, k + 12);
    if (!/^(export|const|let|function|import)\s/.test(rest)) return { type: 'code', start, end: skipExpr(s, start) };
  }
  return node;
}
function parseObject(s, i) {
  const start = i, props = [];
  i = ws(s, i + 1);
  while (s[i] !== '}') {
    if (i >= s.length) throw new Error('객체가 닫히지 않음');
    let key, keyStart = i;
    if (s.startsWith('...', i)) { const e = skipExpr(s, i + 3); props.push({ key: '…', node: { type: 'code', start: i, end: e } }); i = ws(s, e); }
    else {
      if (s[i] === '\'' || s[i] === '"') { const e = skipQuoted(s, i); key = decodeString(s.slice(i, e)); i = e; }
      else if (s[i] === '[') { const e = skipBalanced(s, i); key = s.slice(i, e); i = e; }
      else { let e = i; while (e < s.length && IDENT.test(s[e])) e++; if (e === i) throw new Error(`객체 키를 읽지 못함(${lineOf(s, i)}행)`); key = s.slice(i, e); i = e; }
      i = ws(s, i);
      if (s[i] === ':') { const node = parseValue(s, i + 1); props.push({ key, keyStart, node }); i = ws(s, node.end); }
      else if (s[i] === '(') { const e = skipExpr(s, keyStart); props.push({ key, keyStart, node: { type: 'code', start: keyStart, end: e } }); i = ws(s, e); } // 메서드
      else props.push({ key, keyStart, node: { type: 'code', start: keyStart, end: i } }); // 축약형 { a }
    }
    if (s[i] === ',') i = ws(s, i + 1);
    else if (s[i] !== '}') throw new Error(`객체 안에서 , 또는 } 가 와야 함(${lineOf(s, i)}행)`);
  }
  return { type: 'obj', start, end: i + 1, props };
}
function parseArray(s, i) {
  const start = i, items = [];
  i = ws(s, i + 1);
  while (s[i] !== ']') {
    if (i >= s.length) throw new Error('배열이 닫히지 않음');
    if (s.startsWith('...', i)) { const e = skipExpr(s, i + 3); items.push({ type: 'code', start: i, end: e }); i = ws(s, e); }
    else { const node = parseValue(s, i); items.push(node); i = ws(s, node.end); }
    if (s[i] === ',') i = ws(s, i + 1);
    else if (s[i] !== ']') throw new Error(`배열 안에서 , 또는 ] 가 와야 함(${lineOf(s, i)}행)`);
  }
  return { type: 'arr', start, end: i + 1, items, hasSpread: items.some(n => n.type === 'code' && s.startsWith('...', n.start)) };
}

// 파일 최상위의 export const 들 → [{ name, node }]
export function parseExports(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    i = ws(s, i);
    if (i >= s.length) break;
    const c = s[i];
    if (s.startsWith('export const ', i) || s.startsWith('export let ', i)) {
      const m = s.slice(i).match(/^export (?:const|let) ([A-Za-z_$][\w$]*)\s*=/);
      if (!m) throw new Error(`export 를 읽지 못함(${lineOf(s, i)}행)`);
      const node = parseValue(s, i + m[0].length);
      out.push({ name: m[1], node, line: lineOf(s, i) });
      i = node.end;
      continue;
    }
    if (c === '\'' || c === '"') { i = skipQuoted(s, i); continue; }
    if (c === '`') { i = skipTemplate(s, i); continue; }
    if (c === '{' || c === '[' || c === '(') { i = skipBalanced(s, i); continue; }
    i++;
  }
  return out;
}

// 노드 트리를 돌며 고칠 수 있는 값 목록 → [{ path:[이름, 키/번호…], node, loose }]
// loose: 배열 안에 ...펼침이 있어 실행 시 번호가 원문 순서와 다를 수 있음(고치는 위치는 정확, 검증은 값 포함 여부로)
export function walk(name, node, path = [name], out = [], loose = false) {
  if (node.type === 'obj') for (const p of node.props) walk(name, p.node, [...path, p.key], out, loose);
  else if (node.type === 'arr') node.items.forEach((n, k) => walk(name, n, [...path, k], out, loose || node.hasSpread));
  else out.push({ path, node, loose });
  return out;
}
export const pathKey = p => p.map(String).join('\u0001');

// 바꾸기 목록 [{ start, end, text }] 을 원문에 적용(뒤에서부터)
export function applyEdits(s, edits) {
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  for (let k = 1; k < sorted.length; k++) if (sorted[k].end > sorted[k - 1].start) throw new Error('바꾸는 범위가 겹침');
  for (const e of sorted) s = s.slice(0, e.start) + e.text + s.slice(e.end);
  return s;
}
export function literalText(node, value) {
  if (node.type === 'str') return encodeString(value);
  if (node.type === 'num') { const n = Number(String(value).replace(/,/g, '')); if (!Number.isFinite(n)) throw new Error(`숫자가 아님: ${value}`); return String(n); }
  if (node.type === 'bool') return value ? 'true' : 'false';
  throw new Error('이 값은 고칠 수 없음');
}
// 배열 항목 복제(마지막 뒤에 같은 모양 하나 더) / 삭제 — 원문 기준
export function cloneItem(s, arr, k = arr.items.length - 1) {
  const it = arr.items[k];
  const lineStart = s.lastIndexOf('\n', it.start) + 1;
  const indent = /^\s*$/.test(s.slice(lineStart, it.start)) ? s.slice(lineStart, it.start) : ' ';
  const sep = indent === ' ' ? ', ' : ',\n' + indent;
  return s.slice(0, it.end) + sep + s.slice(it.start, it.end) + s.slice(it.end);
}
export function removeItem(s, arr, k) {
  const it = arr.items[k];
  if (arr.items.length === 1) return s.slice(0, it.start) + s.slice(it.end);
  if (k < arr.items.length - 1) return s.slice(0, it.start) + s.slice(arr.items[k + 1].start);
  const prev = arr.items[k - 1];
  return s.slice(0, prev.end) + s.slice(it.end);
}
// 경로로 값 꺼내기(검증용)
export const getPath = (obj, path) => path.reduce((o, k) => (o == null ? o : o[k]), obj);
