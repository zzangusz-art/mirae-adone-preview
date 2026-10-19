// 미래애드원 인사이트 — AI 글 자동 작성기 (GitHub Actions에서 하루 3번 실행 → 하루 3편)
// 사용:
//   node tools/blog-ai/generate.mjs              다음 주제 1편 작성 → 검증 통과 시 content/blog/<slug>.md 로 발행
//   node tools/blog-ai/generate.mjs --count 3    연속 3편(수동 보충용)
//   node tools/blog-ai/generate.mjs --topic id   특정 주제
//   node tools/blog-ai/generate.mjs --check      API 호출 없이 기존 글 전체를 같은 검증기로 검사
//   node tools/blog-ai/generate.mjs --plan       다음에 쓸 주제 10개 미리보기(API 호출 없음)
// 주제: content/blog/_topics.json 의 status:"todo" 를 먼저 쓰고, 다 쓰면 서비스×업종×관점 조합으로 자동 생성한다.
// 검증에 실패한 글은 발행하지 않고 content/drafts/ 에 남긴다(사람이 고쳐서 content/blog/ 로 옮기면 발행).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, loadPosts } from '../blog/lib.mjs';
import * as D from '../../src/data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BLOG = path.join(ROOT, 'content/blog');
const DRAFTS = path.join(ROOT, 'content/drafts');
const TOPICS = path.join(BLOG, '_topics.json');
const MODEL = process.env.BLOG_MODEL || 'claude-opus-5-5';
const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };
const won = n => n.toLocaleString('ko-KR') + '원';
const man = n => n % 10000 === 0 ? `${(n / 10000).toLocaleString('ko-KR')}만원` : won(n);

// ── 사실 목록: 사이트 데이터(src/data.mjs)에서만 만든다. 순서를 고정해 프롬프트 캐시가 유지되게 한다
function factSheet() {
  const { COMPANY: C, BLOG_PLANS, BLOG_COMMON, WEB_AI_PLAN, PRICE_SHOW_WEB_AI, SERVICES, CPC, MARKET_BLOG, REPORT_FIELDS, PROCESS, INDUSTRIES, STATS } = D;
  const L = [];
  L.push(`[회사] ${C.name}(${C.nameEn}). 대표 ${C.ceo}. 서울 송파구 소재 통합 마케팅 회사. 대표번호 ${C.phone}. 슬로건 「${C.slogan}」`);
  L.push('[운영 방식] 한 업체를 작가·디자이너·마케터 3인이 전담(3인 1업체). 상주 작가·디자이너가 직접 제작하고 외주로 다시 넘기지 않음. 1:1 전담 담당자와 전용 카카오톡 단톡방. 발행 전 원고·디자인 확인 후 발행. 회차별 발행 URL, 1~2주 단위·월간 보고.');
  L.push(`[자사 수치] ${STATS.map(s => `${s.label} ${s.v.toLocaleString('ko-KR')}${s.suffix}(${s.note})`).join(', ')}.`);
  L.push('[대표자 경험] 대표는 광고대행업과 별도로 식자재 유통 사업을 운영(미래애드원 법인 사업 아님).');
  for (const p of BLOG_PLANS) L.push(`[블로그 가격] ${p.name}: 월 ${p.count}회 ${won(p.price)}(${man(p.price)}, VAT 별도), 1회당 ${won(Math.round(p.price / p.count))}.`);
  L.push(`[블로그 공통] ${BLOG_COMMON.join(' / ')}.`);
  if (PRICE_SHOW_WEB_AI) L.push(`[홈페이지+AI 검색] ${WEB_AI_PLAN.build.name} ${won(WEB_AI_PLAN.build.price)}(${man(WEB_AI_PLAN.build.price)}, 1개월 차, VAT 별도), ${WEB_AI_PLAN.operate.name} 월 ${won(WEB_AI_PLAN.operate.price)}(${man(WEB_AI_PLAN.operate.price)}, 2개월 차부터, VAT 별도).`);
  L.push('[가격 원칙] 블로그 가격 공개. 검색광고는 매체비와 운영 수수료를 나눠 안내. 그 밖의 서비스는 상담 후 견적. 견적서에 제공 범위·횟수·수정·보고 주기·VAT·계약 기간을 적음.');
  L.push('[보장 정책] AI 검색·검색 노출은 최적화 작업과 리포트를 제공하며 특정 순위나 AI 답변 노출을 보장하지 않음. 체험단·카페 바이럴은 광고·협찬 표시를 하고 후기·댓글을 조작하지 않음.');
  L.push(`[진행 절차] ${PROCESS.map((p, i) => `${i + 1}. ${p.k} — ${p.d}`).join(' ')}`);
  L.push(`[AI 검색 리포트 기록 기준] ${REPORT_FIELDS.map(([k, v]) => `${k}: ${v}`).join(' / ')}`);
  L.push(`[검색광고 클릭당 비용 예시] 업종 핵심 키워드 상위 노출 기준 예시 범위: ${CPC.rows.map(r => `${r.k} ${won(r.lo)}~${won(r.hi)}(${man(r.lo)}~${man(r.hi)}, 월 100클릭이면 ${man(r.lo * 100)}~${man(r.hi * 100)})`).join(', ')}. 실제 단가는 네이버 검색광고 키워드 도구에서 확인. 법률 업종은 헤럴드경제 2025년 5월 보도에서 인기 키워드 클릭당 10만원 초과 사례가 소개됨.`);
  L.push(`[블로그 대행 시세] ${MARKET_BLOG.date} 조회. ${MARKET_BLOG.rows.filter(r => !r.ours).map(r => `${r.k}(${r.sub}) 1회당 ${won(r.lo)}~${won(r.hi)}`).join(', ')}. 업체명은 쓰지 않음.`);
  for (const s of SERVICES) L.push(`[서비스 ${s.no}] ${s.name} (/services/${s.slug}/) — ${s.copy} 제공 범위: ${s.scope.join(', ')}. 판매 구조: ${s.model}.`);
  for (const x of INDUSTRIES) L.push(`[업종] ${x.name} (/industries/${x.slug}/) — ${x.behavior} 주의: ${x.caution}`);
  return L.join('\n');
}
function allowedNumbers(sheet) {
  const set = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '15', '20', '24', '30', '40', '50', '60', '90', '100', '2024', '2025', '2026']);
  for (const m of sheet.matchAll(/\d[\d,]*(?:\.\d+)?/g)) set.add(m[0].replace(/,/g, ''));
  return set;
}

// ── 주제: 대기열 → 없으면 서비스×업종×관점 조합
const ANGLES = [
  { id: 'cost', t: '비용 구조와 견적서에서 확인할 항목', cat: null },
  { id: 'choose', t: '대행사·방식을 고르는 기준', cat: null },
  { id: 'mistake', t: '자주 하는 실수와 피하는 방법', cat: null },
  { id: 'process', t: '시작부터 첫 보고까지 진행 순서', cat: null },
  { id: 'check', t: '스스로 점검하는 체크리스트', cat: null },
  { id: 'measure', t: '성과를 확인하는 방법과 보고서 읽는 법', cat: null },
];
const SVC_CAT = { website: '홈페이지', 'seo-aeo-geo': 'AI 검색·SEO', 'ai-visibility': 'AI 검색·SEO', 'brand-blog': '블로그 마케팅', 'blog-viral': '블로그 마케팅', 'cafe-viral': '블로그 마케팅', 'naver-search-ads': '검색광고·플레이스', 'naver-place': '검색광고·플레이스', analytics: '검색광고·플레이스', sns: 'SNS·콘텐츠', shortform: 'SNS·콘텐츠', 'photo-video': 'SNS·콘텐츠', 'smartstore-detail': 'SNS·콘텐츠', 'press-pr': 'SNS·콘텐츠', conversion: '홈페이지', 'industry-consulting': '업종별 가이드', 'store-opening': '업종별 가이드', franchise: '업종별 가이드' };
function autoTopic(used) {
  // 서비스·업종·관점을 고르게 돌리도록 순서를 섞지 않고 대각선으로 순회
  const S = D.SERVICES, I = D.INDUSTRIES, A = ANGLES;
  for (let k = 0; k < S.length * I.length * A.length; k++) {
    const s = S[k % S.length], x = I[Math.floor(k / S.length) % I.length], a = A[Math.floor(k / (S.length * I.length)) % A.length];
    const id = `auto-${s.slug}-${x.slug}-${a.id}`;
    if (used.has(id)) continue;
    const cat = (k % 4 === 3) ? '업종별 가이드' : SVC_CAT[s.slug];
    return { id, title: `${x.name} ${s.short} — ${a.t}`, angle: `${x.name} 사업자가 ${s.name}을(를) 검토할 때 궁금해하는 「${a.t}」를 구체적으로 다룬다. 업종 특성(${x.behavior})과 주의점(${x.caution})을 반영한다.`, keywords: [`${x.name.split('·')[0]} ${s.short}`, `${s.short} ${a.id === 'cost' ? '비용' : a.id === 'choose' ? '업체 선택' : a.id === 'mistake' ? '실수' : a.id === 'process' ? '진행 과정' : a.id === 'check' ? '체크리스트' : '성과 확인'}`], category: cat, service: s.slug, status: 'todo', auto: true };
  }
  return null;
}
function nextTopic(topics, posts) {
  const used = new Set([...topics.map(t => t.id), ...posts.map(p => p.topic).filter(Boolean)]);
  const queued = topics.find(t => t.status === 'todo');
  if (queued) return queued;
  const t = autoTopic(used);
  if (t) topics.push(t);
  return t;
}

// ── 검증
const BANNED = [
  [/(?:노출|순위|상위|매출|효과|결과|1위)\s*(?:을|를)?\s*보장(?:합니다|해 ?드|됩니다|하는)|무조건|반드시 (?:노출|상위)|100%\s*(?:노출|효과|만족|보장)/, '보장·단정 표현'],
  [/최고의|최상의|업계 ?1위|국내 ?1위|전국 ?1위|유일한|유일하게|단연|압도적|완벽한|혁신적인|놀라운|최저가|가장 저렴/, '최상급·과장 표현'],
  [/알아보겠습니다|살펴보겠습니다|알아볼까요|살펴볼까요|결론적으로|요약하자면|정리하자면|꿀팁|마무리하며|도움이 되셨기를|이 글에서는|오늘은 .{0,20}(?:알아|살펴)/, '상투 표현'],
  [/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, '이모지'],
  [/치료 ?효과|완치|부작용(?:이)? 없|승소 ?(?:보장|확률)|합격 ?보장|성적 ?향상 ?보장/, '규제 업종 금지 표현'],
];
const NAMES = ['알아서', 'alaseo', '그루브웹', '아토믹크루', 'atomic', '크리앤서', '디프레임', 'D.Frame', '블로그메이트', 'blogmate', '애드리절트', '마켓잇'];
const OK_LINK = /mirae-adone\.com|searchadvisor\.naver\.com|developers\.google\.com|searchad\.naver\.com|ftc\.go\.kr|law\.go\.kr/;
const bigrams = s => { const t = s.replace(/\s+/g, ''); const set = new Set(); for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2)); return set; };
const sim = (a, b) => { const A = bigrams(a), B = bigrams(b); let n = 0; for (const x of A) if (B.has(x)) n++; return n / Math.max(1, Math.min(A.size, B.size)); };

function validate(md, { allowed, slugs, titles = [] }) {
  const errs = [];
  let meta, body;
  try { ({ meta, body } = parseFrontmatter(md)); } catch (e) { return { ok: false, errs: ['머리말 형식 오류: ' + e.message] }; }
  for (const k of ['title', 'description', 'slug', 'category', 'tags', 'cover']) if (!meta[k] || (Array.isArray(meta[k]) && !meta[k].length)) errs.push(`머리말 ${k} 누락`);
  if (meta.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) errs.push('slug는 영문 소문자·숫자·하이픈만');
  if (meta.slug && slugs.has(meta.slug)) errs.push(`이미 있는 slug: ${meta.slug}`);
  if (meta.category && !D.BLOG_CATEGORIES.includes(meta.category)) errs.push(`category는 ${D.BLOG_CATEGORIES.join('/')} 중 하나`);
  if (meta.service && !D.SERVICES.some(s => s.slug === meta.service)) errs.push(`service 값이 서비스 목록에 없음: ${meta.service}`);
  if (meta.title && (meta.title.length < 12 || meta.title.length > 60)) errs.push('제목은 12~60자');
  if (meta.cover && meta.cover.length > 32) errs.push('cover는 32자 이내');
  if (meta.description && (meta.description.length < 40 || meta.description.length > 140)) errs.push('설명은 40~140자');
  for (const t of titles) if (meta.title && sim(meta.title, t) > .72) { errs.push(`기존 글과 제목이 비슷함: ${t}`); break; }
  const len = (body || '').replace(/\s+/g, '').length;
  if (len < 1200 || len > 4800) errs.push(`본문 길이 ${len}자(공백 제외) — 1,200~4,800자`);
  if (!/\n##\s+자주 묻는 질문/.test('\n' + body)) errs.push('"## 자주 묻는 질문" 섹션 없음');
  if ((body.match(/\n###\s+Q\./g) || []).length < 2) errs.push('FAQ 질문(### Q.) 2개 이상 필요');
  if ((body.match(/^##\s/mg) || []).length < 4) errs.push('## 소제목 4개 이상 필요(FAQ 포함)');
  if (!/\]\(\/(?:services|pricing|industries|contact|insights|reviews|portfolio)\//.test(body)) errs.push('사이트 내부 링크(/services/… 등) 1개 이상 필요');
  for (const [re, why] of BANNED) { const m = md.match(re); if (m) errs.push(`금지 표현(${why}): "${m[0]}"`); }
  for (const c of NAMES) if (md.toLowerCase().includes(c.toLowerCase())) errs.push(`타사 이름 사용: ${c}`);
  for (const m of md.matchAll(/https?:\/\/[^\s)]+/g)) if (!OK_LINK.test(m[0])) errs.push(`허용되지 않은 외부 링크: ${m[0]}`);
  for (const m of body.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const u = m[1];
    const okPath = u === '/' || /^\/(?:pricing|industries|contact|insights|reviews|portfolio|faq|about|services)\/$/.test(u)
      || (/^\/services\/([a-z-]+)\/$/.test(u) && D.SERVICES.some(s => `/services/${s.slug}/` === u))
      || (/^\/industries\/([a-z-]+)\/$/.test(u) && D.INDUSTRIES.some(s => `/industries/${s.slug}/` === u))
      || (/^\/insights\/([a-z0-9-]+)\/$/.test(u) && slugs.has(u.split('/')[2]));
    if (!okPath) errs.push(`없는 내부 주소: ${u}`);
  }
  const unknown = new Set();
  for (const m of body.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(만원|원|%|퍼센트|개월|주|일|년|건|명|시간|회|클릭|배)/g)) {
    const n = m[1].replace(/,/g, '');
    if (!allowed.has(n)) unknown.add(m[0]);
  }
  if (unknown.size) errs.push(`사실 목록에 없는 수치: ${[...unknown].slice(0, 8).join(', ')}`);
  return { ok: errs.length === 0, errs, meta, len };
}

const SYSTEM = sheet => `당신은 통합 마케팅 회사 미래애드원의 인사이트 담당 에디터입니다. 블로그·홈페이지·AI 검색·검색광고를 맡기려는 사업자가 검색창이나 AI에게 묻는 질문에, 실무자가 직접 답하듯 글을 씁니다. 읽는 사람은 마케팅 전문가가 아닌 음식점·병원·법률사무소·학원·쇼핑몰 대표입니다.

# 반드시 지킬 것
- [사실 목록]에 있는 내용만 미래애드원에 관한 사실로 씁니다. 목록에 없는 실적·수치·고객 사례·후기를 만들지 않습니다. 일반론을 쓸 때도 확인할 수 없는 통계 수치(검색량, 전환율 등)는 쓰지 않습니다.
- 순위·노출·매출을 보장하거나 단정하지 않습니다. AI 답변 노출은 보장되지 않는다는 점을 필요할 때 분명히 말합니다.
- 다른 대행사·플랫폼 업체명을 쓰지 않습니다. 시장 가격은 [사실 목록]의 시세만 조회일과 함께 씁니다. 다른 업체를 깎아내리지 않습니다.
- 의료·법률 등 규제 업종을 다룰 때는 광고 규정과 심의를 확인하라고 안내하고, 효과·결과를 약속하는 표현 예시를 쓰지 않습니다.
- 최상급·과장 표현(최고, 1위, 유일, 압도적, 완벽, 혁신, 최저가)과 상투 표현(알아보겠습니다, 살펴보겠습니다, 결론적으로, 요약하자면, 꿀팁, 이 글에서는), 이모지를 쓰지 않습니다.
- 가격은 「2026년 10월 기준, 부가세 별도」처럼 기준을 붙입니다.

# 문체
- 존댓말 「-습니다/-입니다」체. 한 문장은 짧게, 한 문단은 2~4문장.
- 첫 문단에서 질문에 바로 답합니다(결론 먼저). 그다음 이유, 그다음 대표가 오늘 할 수 있는 일.
- 현장에서 실제로 오가는 말투와 구체적인 장면을 씁니다. 같은 문장 구조를 반복하지 않고, 「~하는 것이 중요합니다」로 문단을 끝내지 않습니다.
- 비교가 필요하면 마크다운 표, 순서가 있으면 번호 목록을 씁니다. 굵은 글씨는 글 전체에서 3번 이하.
- 사이트 내부 링크는 [사실 목록]에 나온 경로(/services/…/, /industries/…/)와 /pricing/, /contact/, /reviews/, /portfolio/, /faq/, 기존 글 /insights/<slug>/ 만 씁니다. 외부 링크는 꼭 필요할 때만 공식 문서(네이버 서치어드바이저, Google 검색 센터, 공정거래위원회, 국가법령정보센터)로 씁니다.
- 글 끝에 상담을 강요하지 않습니다. 관련 서비스 페이지를 한 번 자연스럽게 연결하면 충분합니다.

# 출력 형식 (이 형식 외의 말은 출력하지 않습니다)
---
title: (12~60자, 검색 질문이 드러나게)
description: (40~140자, 글의 답을 한 문장으로)
slug: (영문 소문자-하이픈, 주제 뜻이 드러나게)
category: (${D.BLOG_CATEGORIES.join(' | ')} 중 하나)
tags: (쉼표로 구분 3~5개)
service: (가장 관련 있는 서비스 slug 하나 — [사실 목록]의 /services/<slug>/ 에서)
cover: (카드 표지에 쓸 2줄 이내 짧은 문구, 32자 이내)
---
(첫 문단: 질문에 대한 답)

## (소제목 3~6개)
...

## 자주 묻는 질문

### Q. (질문)
(답 1~3문장)

### Q. (질문)
(답 1~3문장)

본문은 공백 제외 1,500~3,000자로 씁니다.

[사실 목록]
${sheet}`;

function userMsg(topic, posts, today) {
  return `오늘 날짜: ${today}
주제 ID: ${topic.id}
주제: ${topic.title}
다룰 방향: ${topic.angle}
포함할 검색어: ${(topic.keywords || []).join(', ')}
권장 카테고리: ${topic.category}
관련 서비스: ${topic.service || '알맞은 것 선택'}

이미 발행된 글(같은 내용을 반복하지 말고, 관련 있으면 내부 링크로 연결):
${posts.slice(0, 60).map(p => `- ${p.title} → /insights/${p.slug}/`).join('\n') || '- 없음'}

위 형식대로 글 한 편을 써 주세요.`;
}

async function callClaude(client, system, messages) {
  if (client.dry) { // --dry <파일>: API 대신 파일 내용을 응답으로 써서 발행 경로만 시험
    const text = fs.readFileSync(client.dry, 'utf8').replace(/^(date|time|author|generated|topic):.*\r?\n/gm, '').trim();
    return { text, res: { usage: { input_tokens: 0, output_tokens: 0 }, model: 'dry-run', content: [{ type: 'text', text }] } };
  }
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default', // 안전 분류기가 거절하면 서버가 권장 모델로 다시 시도
    output_config: { effort: 'high' }, // Opus 5.5 기본값은 medium — 글 품질을 위해 high로 명시
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages,
  });
  if (res.stop_reason === 'refusal') return { refused: true, res };
  if (res.stop_reason === 'max_tokens') throw new Error('max_tokens 도달 — 글이 잘렸습니다');
  const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('').trim().replace(/^```(?:markdown)?\s*|\s*```$/g, '');
  return { text, res };
}

const nowKST = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour === '24' ? '00' : p.hour}:${p.minute}` };
};

async function writeOne(client, topics, sheet, allowed) {
  const posts = loadPosts(BLOG);
  const id = opt('--topic');
  const topic = id ? topics.find(t => t.id === id) : nextTopic(topics, posts);
  if (!topic) { console.log('작성할 주제가 없습니다.'); return false; }
  const { date, time } = nowKST();
  const system = SYSTEM(sheet);
  const messages = [{ role: 'user', content: userMsg(topic, posts, date) }];
  const slugs = new Set(posts.map(p => p.slug)), titles = posts.map(p => p.title);
  console.log(`주제: ${topic.id} — ${topic.title}`);

  let out, v;
  for (let attempt = 1; attempt <= 2; attempt++) {
    out = await callClaude(client, system, messages);
    if (out.refused) { console.log(`거절됨(${out.res.stop_details?.category ?? '분류 없음'}) — 이 주제는 건너뜁니다.`); topic.status = 'skipped'; topic.note = 'refusal'; return true; }
    const u = out.res.usage;
    console.log(`응답 ${attempt}차: 입력 ${u.input_tokens} / 캐시 읽기 ${u.cache_read_input_tokens ?? 0} / 출력 ${u.output_tokens} 토큰, 모델 ${out.res.model}`);
    v = validate(out.text, { allowed, slugs, titles });
    if (v.ok) break;
    console.log('검증 실패:\n  - ' + v.errs.join('\n  - '));
    if (attempt === 1) {
      messages.push({ role: 'assistant', content: out.res.content.filter(b => b.type !== 'fallback') });
      messages.push({ role: 'user', content: `아래 문제를 고쳐서 같은 형식으로 글 전체를 다시 써 주세요.\n- ${v.errs.join('\n- ')}` });
    }
  }

  let meta, body;
  try { ({ meta, body } = parseFrontmatter(out.text)); } catch { meta = { title: topic.title, tags: [] }; body = out.text; }
  const slug = meta.slug && /^[a-z0-9-]+$/.test(meta.slug) ? meta.slug : topic.id;
  const front = ['---', `title: ${meta.title}`, `description: ${meta.description || ''}`, `slug: ${slug}`, `date: ${date}`, `time: ${time}`,
    `category: ${meta.category || topic.category}`, `tags: ${(meta.tags || []).join(', ')}`, `service: ${meta.service || topic.service || ''}`, `cover: ${meta.cover || ''}`,
    `author: ${D.BLOG_AUTHOR}`, `generated: ${MODEL} ${date}`, `topic: ${topic.id}`, '---'].join('\n');
  const md = `${front}\n${body}\n`;

  if (!v.ok) {
    fs.mkdirSync(DRAFTS, { recursive: true });
    const f = path.join(DRAFTS, `${date}-${topic.id}.md`);
    fs.writeFileSync(f, `<!-- 검증 실패로 발행하지 않음:\n- ${v.errs.join('\n- ')}\n-->\n` + md);
    console.log(`초안으로 저장: ${path.relative(ROOT, f)}`);
    topic.status = 'draft'; topic.draft = path.relative(ROOT, f).replace(/\\/g, '/');
  } else {
    const f = path.join(BLOG, `${slug}.md`);
    fs.writeFileSync(f, md);
    console.log(`발행: ${path.relative(ROOT, f)} (${v.len}자)`);
    topic.status = 'done'; topic.slug = slug; topic.date = date;
  }
  return true;
}

async function main() {
  const sheet = factSheet();
  const allowed = allowedNumbers(sheet);

  if (flag('--check')) {
    const posts = loadPosts(BLOG);
    let bad = 0;
    const slugs = new Set(posts.map(p => p.slug));
    for (const f of fs.readdirSync(BLOG).filter(f => f.endsWith('.md') && !f.startsWith('_'))) {
      const md = fs.readFileSync(path.join(BLOG, f), 'utf8');
      const v = validate(md, { allowed, slugs: new Set([...slugs].filter(s => s + '.md' !== f && s !== parseFrontmatter(md).meta.slug)), titles: [] });
      console.log(`${v.ok ? 'OK ' : 'NG '} ${f} (${v.len ?? '?'}자)${v.ok ? '' : '\n    - ' + v.errs.join('\n    - ')}`);
      if (!v.ok) bad++;
    }
    process.exit(bad ? 1 : 0);
  }

  const topics = JSON.parse(fs.readFileSync(TOPICS, 'utf8'));
  if (flag('--plan')) {
    const posts = loadPosts(BLOG), copy = JSON.parse(JSON.stringify(topics));
    for (let i = 0; i < 10; i++) { const t = nextTopic(copy, posts); if (!t) break; console.log(`${i + 1}. [${t.category}] ${t.title} (${t.id})`); t.status = 'planned'; }
    return;
  }

  let client;
  if (opt('--dry')) client = { dry: path.resolve(opt('--dry')) };
  else { const { default: Anthropic } = await import('@anthropic-ai/sdk'); client = new Anthropic(); } // ANTHROPIC_API_KEY 등 환경 자격 증명 사용
  const count = Math.max(1, Math.min(5, +(opt('--count') || 1)));
  for (let i = 0; i < count; i++) {
    const did = await writeOne(client, topics, sheet, allowed);
    fs.writeFileSync(TOPICS, JSON.stringify(topics, null, 2) + '\n');
    if (!did) break;
  }
}

main().catch(async err => {
  const { default: Anthropic } = await import('@anthropic-ai/sdk').catch(() => ({ default: null }));
  if (Anthropic && err instanceof Anthropic.AuthenticationError) console.error('인증 실패: ANTHROPIC_API_KEY를 확인하세요.');
  else if (Anthropic && err instanceof Anthropic.RateLimitError) console.error('요청 한도 초과: 잠시 뒤 다시 실행하세요.');
  else if (Anthropic && err instanceof Anthropic.BadRequestError) console.error('요청 오류(400):', err.message);
  else if (Anthropic && err instanceof Anthropic.APIConnectionError) console.error('연결 오류:', err.message);
  else if (Anthropic && err instanceof Anthropic.APIError) console.error(`API 오류 ${err.status}:`, err.message);
  else console.error(err);
  process.exit(1);
});
