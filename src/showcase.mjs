// 사례·증거 블록: AI 검색 실제 녹화, AI 답변 설계 슬라이드, 작업 전후 변화, 홈페이지 레퍼런스, 협력 언론사
import fs from 'node:fs';
import { WEBCASE_META, AI_RECORDINGS, CASE_CHANGES, PRESS_LOGOS, BLOG_PLANS } from './data.mjs';
import { esc, man, icon, img, imgSize } from './lib.mjs';
import { sectionHead } from './blocks.mjs';

export const WEBCASES = JSON.parse(fs.readFileSync(new URL('./webcases.json', import.meta.url), 'utf8'));
const pic = (R, rel, alt, { eager = false, cls = '' } = {}) => {
  const { w, h } = imgSize(rel);
  return `<img${cls ? ` class="${cls}"` : ''} src="${R}assets/img/${rel}" width="${w}" height="${h}" alt="${esc(alt)}"${eager ? '' : ' loading="lazy"'} decoding="async">`;
};

// ───────── AI 검색 실제 녹화(로그인하지 않은 ChatGPT, 화면 그대로)
export const aiRecording = R => {
  const r = AI_RECORDINGS[0], v = `${R}assets/video/${r.video}`;
  return `<section class="sec sec--ink airec-sec" id="ai-proof">
<div class="wrap">
  ${sectionHead({ eyebrow: 'REAL AI SEARCH', title: 'AI에게 회사 이름을 물으면,<br>홈페이지를 근거로 답합니다', lead: '로그인하지 않은 ChatGPT에 직접 묻고 화면을 그대로 녹화했습니다. 답변에 공식 홈페이지가 출처로 붙는지 확인해 보세요.', center: true })}
  <div class="airec" data-airec>
    <div class="airec__screen" data-reveal>
      <div class="airec__bar"><span></span><span></span><span></span><p>chatgpt.com</p><em>실제 녹화</em><button class="airec__toggle" type="button" data-airec-toggle aria-label="일시정지">${icon('pause')}</button></div>
      <div class="airec__view">
        <video muted playsinline loop preload="none" poster="${v}-d-poster.webp" data-d="${v}-d.mp4" data-m="${v}-m.mp4" data-poster-m="${v}-m-poster.webp" data-airec-video aria-label="ChatGPT에 「${esc(r.q)}」를 묻는 실제 화면 녹화"></video>
      </div>
    </div>
  </div>
</div>
</section>`;
};

// ───────── AI 답변 설계 슬라이드(설명용 예시 화면, 자동 입력 애니메이션)
const J = (k, v, last = false) => `  <span class="t-k">"${k}"</span>: <span class="t-s">"${v}"</span>${last ? '' : ','}\n`;
const SLIDES = () => {
  const [b1, b2, b3] = BLOG_PLANS;
  return [
    { k: '구조화 데이터', q: '우리 병원 정보를 AI가 읽을 수 있게 구조화 데이터로 만들어줘', a: '네. 검색엔진과 AI가 그대로 읽는 JSON-LD로 정리했습니다.', type: 'code', lang: 'json',
      code: `{\n${J('@context', 'https://schema.org')}${J('@type', 'MedicalClinic')}${J('name', '○○정형외과')}${J('medicalSpecialty', 'Orthopedic')}${J('address', '서울특별시 송파구 ○○로 12')}${J('telephone', '02-000-0000')}${J('openingHours', 'Mo-Fr 09:00-18:30', true)}}` },
    { k: '질문형 문단', q: '블로그 관리대행 비용을 묻는 질문에 바로 답하는 문단으로 써줘', a: '첫 문장에 답을 두고, 범위와 조건을 이어 붙였습니다.', type: 'qa',
      items: [['Q', '블로그 관리대행 비용은 얼마인가요?'], ['A', `미래애드원은 월 ${b1.count}회 ${man(b1.price)}부터입니다(VAT 별도).`], ['', `월 ${b2.count}회 ${man(b2.price)}, 월 ${b3.count}회 ${man(b3.price)} 상품이 있고, 원고는 포스팅당 1,500자 기준입니다.`], ['', '발행 전에 원고와 디자인을 먼저 확인받고, 매달 발행 URL을 보고합니다.']] },
    { k: 'AI 수집 허용', q: 'AI 검색엔진이 우리 사이트를 읽을 수 있는지 확인해줘', a: 'AI 검색 봇에 대한 규칙이 없었습니다. 수집을 허용하고 사이트 요약 파일을 추가합니다.', type: 'code', lang: 'robots.txt · llms.txt',
      code: `<span class="t-c"># robots.txt</span>\n<span class="t-k">User-agent</span>: OAI-SearchBot\n<span class="t-k">Allow</span>: <span class="t-s">/</span>\n<span class="t-k">User-agent</span>: PerplexityBot\n<span class="t-k">Allow</span>: <span class="t-s">/</span>\n<span class="t-k">Sitemap</span>: <span class="t-s">https://www.example.co.kr/sitemap.xml</span>\n\n<span class="t-c"># llms.txt</span>\n<span class="t-k">#</span> ○○정형외과\n<span class="t-k">&gt;</span> 송파구 도수치료·체외충격파 진료, 평일 09:00-18:30` },
    { k: '답변 점검', q: '이번 달 AI 답변에 우리 병원이 몇 번 나왔는지 정리해줘', a: '같은 질문 30개를 세 곳에 물어 그대로 기록했습니다.', type: 'table',
      head: ['질문', 'ChatGPT', 'Gemini', 'Perplexity'],
      rows: [['송파 도수치료 잘하는 곳', '언급', '출처 인용', '—'], ['도수치료 비용 얼마', '출처 인용', '언급', '출처 인용'], ['체외충격파 몇 번 받아야', '—', '언급', '—'], ['송파 정형외과 야간 진료', '언급', '—', '출처 인용']],
      foot: '질문 30개 중 언급 14 · 출처 인용 6 (예시 수치)' },
    { k: '답변형 글', q: 'AI가 인용하기 좋은 블로그 글 주제 다섯 개만 뽑아줘', a: '사람들이 실제로 묻는 문장 그대로 골랐습니다.', type: 'list',
      items: ['도수치료, 몇 번 받아야 효과가 있나요?', '도수치료 실비 보험 청구 되나요?', '체외충격파와 도수치료, 무엇이 다른가요?', '송파 정형외과 야간 진료 시간 정리', '도수치료 받은 날 운동해도 될까요?'] },
  ];
};
const slideBody = s => {
  if (s.type === 'code') return `<div class="aisl__code"><p><span>${esc(s.lang)}</span><span>${icon('copy')} 코드 복사</span></p><pre><code data-aisl-type>${s.code}</code></pre></div>`;
  if (s.type === 'qa') return `<div class="aisl__qa" data-aisl-seq>${s.items.map(([t, v]) => `<p class="${t === 'Q' ? 'is-q' : ''}">${t ? `<b>${t}.</b>` : ''}${esc(v)}</p>`).join('')}</div>`;
  if (s.type === 'table') return `<div class="aisl__tbl" data-aisl-seq><div class="aisl__tr aisl__th">${s.head.map(h => `<span>${h}</span>`).join('')}</div>${s.rows.map(r => `<div class="aisl__tr"><span>${esc(r[0])}</span>${r.slice(1).map(v => `<span class="${v === '출처 인용' ? 'is-cite' : v === '언급' ? 'is-men' : 'is-no'}">${v}</span>`).join('')}</div>`).join('')}<p class="aisl__tfoot">${esc(s.foot)}</p></div>`;
  return `<ol class="aisl__list" data-aisl-seq>${s.items.map(v => `<li>${esc(v)}</li>`).join('')}</ol>`;
};
export const aiSlides = () => {
  const S = SLIDES();
  return `<section class="sec aisl-sec" id="ai-method">
<div class="wrap">
  ${sectionHead({ eyebrow: 'AEO · GEO', title: '이렇게 AI의 답이 되도록<br>설계합니다', lead: '검색 결과를 넘어 AI 답변까지. 미래애드원이 실제로 하는 작업을 화면으로 옮겼습니다.', center: true })}
  <div class="aisl" data-aisl data-reveal>
    <div class="aisl__stage">${S.map((s, i) => `<article class="aisl__slide${i === 0 ? ' is-on' : ' is-next'}" data-aisl-slide style="--o:${i}" aria-label="${i + 1}. ${esc(s.k)}"${i ? ' aria-hidden="true"' : ''}>
      <div class="aisl__top"><b>AI 검색</b><small>설명용 예시 화면</small><span class="aisl__step">${String(i + 1).padStart(2, '0')} ${esc(s.k)}</span><span class="aisl__av" aria-hidden="true">M</span></div>
      <div class="aisl__body">
        <p class="aisl__q">${esc(s.q)}</p>
        <p class="aisl__a">${esc(s.a)}</p>
        ${slideBody(s)}
      </div>
      <div class="aisl__input" aria-hidden="true">${icon('plus')}<p data-aisl-input>무엇이든 물어보세요</p><span class="aisl__send">${icon('arrow')}</span></div>
    </article>`).join('')}</div>
    <button class="aisl__nav aisl__nav--prev" type="button" data-aisl-go="-1" aria-label="이전 화면">${icon('left')}</button>
    <button class="aisl__nav aisl__nav--next" type="button" data-aisl-go="1" aria-label="다음 화면">${icon('right')}</button>
    <ol class="aisl__dots">${S.map((s, i) => `<li><button type="button" data-aisl-to="${i}"${i === 0 ? ' aria-current="true"' : ''}><span>${String(i + 1).padStart(2, '0')}</span>${esc(s.k)}</button></li>`).join('')}</ol>
  </div>
</div>
</section>`;
};

// ───────── 작업 전후 변화
const compare = (R, c) => `<div class="bax" data-cmp style="--pos:50%">
  ${pic(R, c.before, `${c.name} 작업 전 홈페이지 첫 화면`, { cls: 'bax__b' })}
  <div class="bax__a">${pic(R, c.after, `${c.name} 작업 후 홈페이지 첫 화면`)}</div>
  <span class="bax__tag bax__tag--b">BEFORE</span><span class="bax__tag bax__tag--a">AFTER</span>
  <span class="bax__line" aria-hidden="true"><i>${icon('left')}${icon('right')}</i></span>
  <input type="range" min="0" max="100" value="50" step="1" aria-label="${esc(c.name)} 작업 전후 화면 비교" data-cmp-range>
</div>`;
export const beforeAfter = R => `<section class="sec sec--gray" id="changes">
<div class="wrap">
  ${sectionHead({ eyebrow: 'BEFORE / AFTER', title: '홈페이지·AEO·GEO 작업 후,<br>이렇게 달라졌습니다', lead: '홈페이지 제작과 AEO·GEO 작업 전후를 같은 기준으로 비교했습니다. 화면 가운데 손잡이를 좌우로 움직여 보세요.' })}
  <div class="chg" data-tabs>
    <div class="chg__tabs" role="tablist" aria-label="전후 비교 사례">${CASE_CHANGES.map((c, i) => `<button role="tab" type="button" id="chg-t-${c.key}" aria-controls="chg-p-${c.key}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}><b>${c.abc}업체</b><small>${esc(c.kind)}</small></button>`).join('')}</div>
    ${CASE_CHANGES.map((c, i) => `<div class="chg__panel" role="tabpanel" id="chg-p-${c.key}" aria-labelledby="chg-t-${c.key}"${i ? ' hidden' : ''}>
      ${compare(R, { ...c, name: `${c.abc}업체` })}
      <div class="chg__side">
        <p class="chg__kind">${c.abc}업체 · ${esc(c.status)}</p>
        <h3>${esc(c.kind)}</h3>
        ${c.timeline ? `<ol class="chg__tl">${c.timeline.map(([d, t], j) => `<li${j === c.timeline.length - 1 ? ' class="is-now"' : ''}><time>${d}</time><p>${esc(t)}</p></li>`).join('')}</ol>`
        : `<table class="chg__tbl"><thead><tr><th scope="col">항목</th><th scope="col">작업 전</th><th scope="col">작업 후</th></tr></thead><tbody>${c.rows.map(([k, b, a]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(b)}</td><td><b>${esc(a)}</b></td></tr>`).join('')}</tbody></table>`}
        <p class="chg__foot">${esc(c.foot || '2026.10.23 측정. 각 홈페이지 첫 화면의 원시 HTML(자바스크립트 실행 전) 기준이며, 작업 후 값은 오픈 전 운영용 빌드입니다. 순위·유입 같은 성과가 아니라 검색엔진과 AI가 읽는 구조를 비교했습니다.')}</p>
      </div>
    </div>`).join('')}
  </div>
</div>
</section>`;

// ───────── 홈페이지 레퍼런스(사이트별 여러 페이지 · PC·모바일 · 전체 스크롤)
export const webCases = (R, { id = 'web-refs', gray = false, title = '직접 만들고 운영하는<br>홈페이지 레퍼런스' } = {}) => {
  const sites = WEBCASES.sites, total = sites.reduce((n, s) => n + s.pages.length, 0);
  const pagesOf = s => [...(s.long ? [{ slug: 'long', label: '메인 전체 스크롤', desktop: s.long, thumb: s.pages[0].thumb, mobile: s.pages[0].mobile, url: s.pages[0].url, long: true }] : []), ...s.pages];
  const path = u => decodeURIComponent(u || '/');
  return `<section class="sec${gray ? ' sec--gray' : ''}" id="${id}">
<div class="wrap">
  ${sectionHead({ eyebrow: 'WEB REFERENCES', title, lead: `메인부터 서브 페이지까지 실제 화면을 그대로 담았습니다.<br>${sites.length}개 사이트, ${total}개 화면을 눌러서 넘겨 보세요.` })}
  <div class="wc" data-tabs>
    <div class="wc__tabs" role="tablist" aria-label="홈페이지 레퍼런스">${sites.map((s, i) => `<button role="tab" type="button" id="${id}-t-${s.key}" aria-controls="${id}-p-${s.key}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}><b>${WEBCASE_META[s.key].abc}업체</b><small>${esc(WEBCASE_META[s.key].kind)}</small></button>`).join('')}</div>
    ${sites.map((s, i) => {
      const m = WEBCASE_META[s.key], P = pagesOf(s), first = s.pages[0], nm = `${m.abc}업체`, start = P[0]; // 긴 캡처가 있으면 그것부터
      return `<div class="wc__panel" role="tabpanel" id="${id}-p-${s.key}" aria-labelledby="${id}-t-${s.key}"${i ? ' hidden' : ''} data-wc>
      <div class="wc__stage">
        <div class="wc__browser">
          <div class="wc__bar"><span></span><span></span><span></span><p data-wc-url>${esc(path(first.url))}</p></div>
          <button class="wc__view${start.long ? ' is-long' : ''}" type="button" data-wc-open aria-label="${nm} 화면 크게 보기">${pic(R, start.desktop, `${nm}(${m.kind}) ${start.label} 화면`, { eager: false })}<span class="wc__zoom">${icon('search')} 크게 보기</span></button>
        </div>
        ${first.mobile ? `<div class="wc__phone" aria-hidden="true"><span class="wc__notch"></span><div class="wc__screen">${pic(R, first.mobile, '')}</div></div>` : ''}
      </div>
      <div class="wc__side">
        <p class="wc__kind">${nm} <span class="wc__st${m.live ? ' is-live' : ''}">${esc(m.status)}</span></p>
        <h3>${esc(m.kind)}</h3>
        <ul class="wc__facts">${m.facts.map(f => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul>
      </div>
      <ol class="wc__pages" aria-label="${nm} 페이지">${P.map((p, j) => `<li><button type="button" data-wc-page aria-pressed="${p === start}" data-desk="${R}assets/img/${p.desktop}" data-mob="${p.mobile ? `${R}assets/img/${p.mobile}` : ''}" data-url="${esc(path(p.url))}" data-label="${esc(p.label)}"${p.long ? ' data-long="1"' : ''} data-w="${imgSize(p.desktop).w}" data-h="${imgSize(p.desktop).h}">${pic(R, p.thumb, '')}<span>${p.long ? `${icon('play')} ` : ''}${esc(p.label)}</span></button></li>`).join('')}</ol>
    </div>`;
    }).join('')}
  </div>
</div>
</section>`;
};

// ───────── 협력 언론사 로고(개별 로고를 다시 배치해 선명하게)
export const pressWall = R => `<div class="presswall" data-reveal>${PRESS_LOGOS.map(l => `<div class="presswall__i">${pic(R, l.src, l.name ? `${l.name} 로고` : '협력 언론사 로고')}</div>`).join('')}</div>
<p class="presswall__note">매체별 게재 조건과 일정은 상담 때 안내합니다.</p>`;
