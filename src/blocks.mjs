// 페이지 조각(섹션) — 여러 페이지에서 같이 쓰는 블록
import {
  COMPANY, STATS, AXES, SERVICES, BLOG_PLANS, BLOG_COMMON, BLOG_SKIN_NOTE, WEB_AI_PLAN, PRICE_SHOW_WEB_AI, OTHER_PRICING,
  MARKET_BLOG, STRUCTURE_COMPARE, CPC, GEO_TIMELINE, REPORT_FIELDS, MONTH1, MONTH2, BOARD_SAMPLE, PROCESS, SEQUENCE, INDUSTRIES,
  PORTFOLIO, PORTFOLIO_CATS, REVIEWS, PARTNER_ROWS, FAQ, FAQ_CATS, PROBLEMS, svc,
} from './data.mjs';
import { esc, won, man, icon, img } from './lib.mjs';

export const sectionHead = ({ eyebrow, title, lead = '', center = false, id = '' }) =>
  `<div class="sh${center ? ' sh--c' : ''}" data-reveal>${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h2${id ? ` id="${id}"` : ''}>${title}</h2>${lead ? `<p class="sh__lead">${lead}</p>` : ''}</div>`;

export const pageHero = ({ R, eyebrow, title, lead, crumbs = '', ctas = '', aside = '', dark = true, cls = '' }) => `
<section class="phero${dark ? ' phero--dark' : ''} ${cls}">
  <div class="phero__bg" aria-hidden="true"><span class="orb orb--a"></span><span class="orb orb--b"></span><span class="grid-lines"></span></div>
  <div class="wrap phero__in${aside ? ' phero__in--2' : ''}">
    <div class="phero__txt">${crumbs}<p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${lead ? `<p class="phero__lead">${lead}</p>` : ''}${ctas ? `<div class="btns">${ctas}</div>` : ''}</div>
    ${aside ? `<div class="phero__aside">${aside}</div>` : ''}
  </div>
</section>`;

export const quoteBtn = (label = '무료 상담 신청', svcSlug = '', cls = 'btn--accent') => `<button class="btn ${cls}" type="button" data-quote${svcSlug ? ` data-service="${svcSlug}"` : ''}>${label} ${icon('arrow')}</button>`;

export const statsRow = (cls = '') => `<dl class="stats ${cls}">${STATS.map(s => `<div class="stats__i"><dt>${s.label}</dt><dd><b data-count="${s.v}">${s.v.toLocaleString('ko-KR')}</b><span>${s.suffix}</span></dd><small>${s.note}</small></div>`).join('')}</dl>`;

// 3줄 교차 슬라이드: 1·3줄은 오른쪽으로, 2줄은 왼쪽으로 흐른다. 트랙은 같은 로고를 두 번 이어 붙여 -50% 이동으로 끊김 없이 반복
const logoItem = (R, l, dup) => `<li${dup ? ' aria-hidden="true"' : ''}>${img(R, l.src, dup ? '' : l.name, { frame: false })}</li>`;
export const logosMarquee = (R, title = '함께한 기업·기관') => `
<section class="logos" aria-label="${title}">
  <div class="wrap logos__head"><p>${title}</p></div>
  <div class="logos__rows">${PARTNER_ROWS.map((row, k) => `<div class="marquee marquee--${k % 2 ? 'l' : 'r'}" style="--dur:${[52, 60, 48][k]}s" data-marquee><ul class="marquee__track">${row.map(l => logoItem(R, l, false)).join('')}${row.map(l => logoItem(R, l, true)).join('')}</ul></div>`).join('')}</div>
</section>`;

// ───────── 홈 스크롤 시퀀스 무대(오른쪽 화면). 01~03은 HTML 목업, 04·05는 실제 자료(카톡 운영 기록·블로그 통계)
const seqScreens = R => [
  `<div class="scr scr--intake"><p class="scr__label">${icon('user')} 상담 메모</p><dl><div><dt>업종</dt><dd>정형외과 · 송파구</dd></div><div><dt>주력</dt><dd>도수치료 · 체외충격파</dd></div><div><dt>목표</dt><dd>평일 오전 예약 늘리기</dd></div></dl><p class="scr__label">키워드 후보</p><div class="kw"><span>송파 도수치료</span><span>잠실 정형외과</span><span>체외충격파 비용</span><span>거북목 운동</span><span class="is-muted">+12</span></div></div>`,
  `<div class="scr scr--doc"><div class="doc__bar"><span>18회차 원고</span><b data-typecount>0</b><small>자 / 1,500자</small></div><h4>송파 도수치료, 몇 회 받아야 할까</h4><p class="doc__l" style="--w:96%"></p><p class="doc__l" style="--w:88%"></p><p class="doc__l" style="--w:92%"></p><p class="doc__l" style="--w:64%"></p><p class="doc__h">치료 횟수를 정하는 기준</p><p class="doc__l" style="--w:90%"></p><p class="doc__l" style="--w:84%"></p><p class="doc__l" style="--w:72%"></p><p class="doc__by">${icon('pen')} 상주 작가 작성</p></div>`,
  `<div class="scr scr--design"><div class="thumb"><span class="thumb__tag">GUIDE</span><strong>송파 도수치료<br>몇 회 받아야 할까</strong><span class="thumb__sub">○○정형외과</span></div><div class="layers"><p>레이어</p><span>제목 텍스트</span><span>배경 그래픽</span><span>병원 로고</span><span class="is-on">하단 배너</span></div><div class="banner">진료 예약 · 02-000-0000</div></div>`,
  `<div class="scr scr--phone">${img(R, REVIEWS[2].src, '실제 카카오톡 운영 기록: 62회차 원고 전달과 사진 교체 요청', { frame: false })}<span class="scr__badge">실제 운영 기록 · 2024.01</span></div>`,
  `<div class="scr scr--report">${img(R, 'portfolio/blog-stats-06.webp', '실제 관리 블로그 네이버 통계 화면, 월 조회수 15,867', { frame: false })}<span class="scr__badge">실제 관리 블로그 통계 화면</span></div>`,
];
export const scrollSequence = R => {
  const screens = seqScreens(R);
  return `
<section class="seq" id="how" data-seq style="--n:${SEQUENCE.length}">
  <div class="wrap">
    ${sectionHead({ eyebrow: 'HOW WE WORK', title: '광고를 맡긴 뒤,<br>실제로 일어나는 일', lead: '누가 쓰고, 누가 디자인하고, 언제 올라가는지. 계약 이후의 과정을 순서대로 보여 드립니다.' })}
  </div>
  <div class="seq__pin">
    <div class="wrap seq__grid">
      <ol class="seq__steps">${SEQUENCE.map((s, i) => `<li class="seq__step${i === 0 ? ' is-on' : ''}" data-seq-step="${i}"><span class="seq__n">${s.n}</span><div><p class="seq__k">${s.k}</p><h3>${s.h}</h3><p>${s.d}</p></div><div class="seq__m">${screens[i]}</div></li>`).join('')}</ol>
      <div class="seq__stage" aria-hidden="true"><div class="seq__device glass">${screens.map((s, i) => `<div class="seq__screen${i === 0 ? ' is-on' : ''}" data-seq-screen="${i}">${s}</div>`).join('')}</div><div class="seq__rail"><span data-seq-bar></span></div></div>
    </div>
  </div>
</section>`;
};

// HOW WE WORK — 벤토 그리드(01 넓게, 02 오른쪽, 03~05 아래 세 칸). 화면 목업은 seqScreens 그대로
export const howBento = R => {
  const screens = seqScreens(R);
  return `
<section class="sec how" id="how">
  <div class="wrap">
    ${sectionHead({ eyebrow: 'HOW WE WORK', title: '광고를 맡긴 뒤,<br>실제로 일어나는 일', lead: '누가 쓰고, 누가 디자인하고, 언제 올라가는지. 계약 이후의 과정을 순서대로 보여 드립니다.' })}
    <ol class="hbento">${SEQUENCE.map((s, i) => `<li class="hb hb--${i + 1}" data-reveal style="--d:${i * 70}ms">
      <div class="hb__head"><span class="hb__n">${s.n}</span><p class="hb__k">${s.k}</p></div>
      <h3>${s.h}</h3><p class="hb__d">${s.d}</p>
      <div class="hb__v" aria-hidden="${i < 3}">${screens[i]}</div>
    </li>`).join('')}</ol>
  </div>
</section>`;
};

export const serviceCard = (R, s, { quick = false } = {}) => `<article class="scard" data-axis="${s.axis}">
  <a class="scard__a" href="${R}services/${s.slug}/"><span class="scard__no">${String(s.no).padStart(2, '0')}</span>${s.isNew ? '<span class="badge badge--new">NEW</span>' : ''}<h3>${esc(s.name)}</h3><p>${esc(s.copy)}</p><span class="scard__model">${esc(s.model)}</span></a>
  ${quick ? `<button class="scard__quick" type="button" data-svc-quick="${s.slug}" aria-label="${esc(s.name)} 빠르게 보기">${icon('plus')}</button>` : ''}
</article>`;

export const axesBento = R => `<div class="bento">${AXES.map((a, i) => {
  const list = SERVICES.filter(s => s.axis === a.id);
  return `<article class="bento__c bento__c--${a.id}" data-reveal style="--d:${i * 80}ms"><p class="bento__en">${a.en}</p><h3>${a.ko} <small>${list.length}</small></h3><p>${a.desc}</p><ul>${list.map(s => `<li><a href="${R}services/${s.slug}/">${esc(s.name)}${icon('arrow')}</a></li>`).join('')}</ul></article>`;
}).join('')}</div>`;

export const featuredDuo = R => {
  const b = svc('brand-blog'), g = svc('seo-aeo-geo');
  return `<div class="duo">
  <a class="duo__c duo__c--blog" href="${R}services/brand-blog/" data-reveal><p class="eyebrow">주력 상품</p><h3>월 15회 33만원부터 시작하는<br>브랜드 블로그</h3><p>${esc(b.lead)}</p><ul class="ticks">${BLOG_COMMON.slice(0, 4).map(t => `<li>${icon('check')}${t}</li>`).join('')}</ul><span class="duo__go">블로그 관리대행 보기 ${icon('arrow')}</span></a>
  <a class="duo__c duo__c--geo" href="${R}services/seo-aeo-geo/" data-reveal style="--d:90ms"><p class="eyebrow">성장 상품</p><h3>홈페이지 구축 이후에도<br>계속 키우는 검색 전략</h3><p>${esc(g.lead)}</p><ul class="ticks">${g.scope.slice(0, 4).map(t => `<li>${icon('check')}${esc(t)}</li>`).join('')}</ul><span class="duo__go">AI 검색 최적화 보기 ${icon('arrow')}</span></a>
</div>`;
};

export const problemTabs = R => `<div class="ptabs" data-tabs>
  <div class="ptabs__list" role="tablist" aria-label="고민 선택">${PROBLEMS.map((p, i) => `<button role="tab" type="button" id="pt-${i}" aria-controls="pp-${i}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${esc(p.k)}</button>`).join('')}</div>
  ${PROBLEMS.map((p, i) => `<div class="ptabs__panel glass glass--light" role="tabpanel" id="pp-${i}" aria-labelledby="pt-${i}"${i ? ' hidden' : ''}><p class="ptabs__q">“${esc(p.k)}”</p><p>${esc(p.d)}</p><p class="ptabs__rec">미래애드원의 추천</p><div class="ptabs__svc">${p.rec.map(slug => { const s = svc(slug); return `<a href="${R}services/${slug}/"><strong>${esc(s.name)}</strong><span>${esc(s.copy)}</span>${icon('arrow')}</a>`; }).join('')}</div></div>`).join('')}
</div>`;

// ───────── 후기(실제 카카오톡 운영 기록)
export const reviewCards = (R, list = REVIEWS) => list.map((r, i) => `<article class="rv" data-reveal style="--d:${(i % 3) * 70}ms">
  <button class="rv__shot" type="button" data-lightbox="reviews" data-index="${i}" aria-label="${esc(r.title)} 원본 보기">${img(R, r.src, `카카오톡 운영 기록: ${r.title}`, { cls: 'rv__img' })}<span class="rv__zoom">${icon('search')} 원본</span></button>
  <div class="rv__txt"><p class="rv__meta">${esc(r.biz)} · ${esc(r.date)}</p><h3>${esc(r.title)}</h3><blockquote>${icon('quote')}<p>${esc(r.quote)}</p></blockquote><p class="rv__note">${esc(r.note)}</p></div>
</article>`).join('');
export const reviewsCarousel = R => `<div class="car" data-carousel>
  <div class="car__track" tabindex="0" aria-label="고객 운영 기록 목록">${reviewCards(R)}</div>
  <div class="car__ui"><button class="iconbtn" type="button" data-car-prev aria-label="이전">${icon('left')}</button><div class="car__dots" data-car-dots></div><button class="iconbtn" type="button" data-car-next aria-label="다음">${icon('right')}</button></div>
</div>`;

export const blogStatsStrip = (R, n = 8) => `<div class="statsimg">${PORTFOLIO.filter(p => p.cat === 'blog-stats').slice(0, n).map((p, i) => `<figure data-reveal style="--d:${(i % 4) * 60}ms"><button type="button" data-lightbox="blog-stats" data-index="${i}" aria-label="${esc(p.cap)} 크게 보기">${img(R, p.src, `블로그 통계 화면 — ${p.cap}`)}</button><figcaption>${esc(p.cap)}</figcaption></figure>`).join('')}</div>`;

// ───────── 가격
export const blogPlans = (R, { compact = false } = {}) => `<div class="plans" data-plans>
  <div class="seg" role="radiogroup" aria-label="가격 표시 방식"><button type="button" role="radio" aria-checked="true" data-plan-view="month">월 금액</button><button type="button" role="radio" aria-checked="false" data-plan-view="per">1회당 금액</button><span class="seg__thumb"></span></div>
  <p class="plans__hint" aria-hidden="true">옆으로 넘겨 세 상품을 비교해 보세요</p>
  <div class="plans__grid" data-plans-grid>${BLOG_PLANS.map((p, i) => `<article class="plan${p.best ? ' plan--best glass' : ''}" data-reveal style="--d:${i * 80}ms">
    ${p.best ? '<span class="plan__flag">가장 많이 선택</span>' : ''}
    <p class="plan__name">${p.name}</p><p class="plan__label">${esc(p.label)}</p>
    <p class="plan__price"><span class="plan__v" data-month="${man(p.price)}" data-per="${won(Math.round(p.price / p.count))}">${man(p.price)}</span><small data-month-unit="/ 월 · VAT 별도" data-per-unit="/ 1회 · VAT 별도">/ 월 · VAT 별도</small></p>
    <p class="plan__count">월 <b>${p.count}</b>회 발행 · 1회당 ${won(Math.round(p.price / p.count))}</p>
    <ul class="ticks">${p.perks.map(t => `<li>${icon('check')}${esc(t)}</li>`).join('')}</ul>
    <button class="btn ${p.best ? 'btn--accent' : 'btn--line'} btn--block" type="button" data-quote data-service="brand-blog" data-plan="${p.name} 월 ${p.count}회">이 상품으로 상담하기</button>
  </article>`).join('')}</div>
  ${compact ? '' : `<div class="plans__common"><p>모든 상품 공통</p><ul>${BLOG_COMMON.map(t => `<li>${icon('check')}${esc(t)}</li>`).join('')}</ul><small>${esc(BLOG_SKIN_NOTE)}</small></div>`}
</div>`;

export const webAiPlan = (R, { title = true } = {}) => {
  const { build: b, operate: o } = WEB_AI_PLAN;
  const price = p => PRICE_SHOW_WEB_AI ? `<p class="pkg__price">${man(p.price)}<small>${p === o ? ' / 월' : ''} · VAT 별도</small></p>` : '<p class="pkg__price pkg__price--q">상담 후 맞춤 견적</p>';
  return `<div class="pkg" data-reveal>
  ${title ? '<div class="pkg__head"><p class="eyebrow">WEBSITE + AI SEARCH</p><h3>홈페이지 + AI 검색 통합 상품</h3><p>만들고 끝내지 않습니다. 첫 달에 구축과 초기 최적화를, 둘째 달부터 월 단위 육성을 합니다.</p></div>' : ''}
  <div class="pkg__flow">
    <article class="pkg__c"><p class="pkg__step">STEP 1 · ${b.period}</p><h4>${b.name}</h4>${price(b)}<ul class="ticks">${b.items.map(t => `<li>${icon('check')}${esc(t)}</li>`).join('')}</ul></article>
    <span class="pkg__arrow" aria-hidden="true">${icon('arrow')}</span>
    <article class="pkg__c pkg__c--op glass"><p class="pkg__step">STEP 2 · ${o.period}</p><h4>${o.name}</h4>${price(o)}<ul class="ticks">${o.items.map(t => `<li>${icon('check')}${esc(t)}</li>`).join('')}</ul></article>
  </div>
  <p class="pkg__note">${esc(WEB_AI_PLAN.note)}</p>
  <div class="btns"><button class="btn btn--accent" type="button" data-quote data-service="seo-aeo-geo">AI 검색 최적화 견적 받기 ${icon('arrow')}</button><a class="btn btn--line" href="${R}services/seo-aeo-geo/">진행 방식 자세히</a></div>
</div>`;
};

export const otherPricing = () => `<div class="otherp"><p class="otherp__h">그 밖의 서비스</p><dl>${OTHER_PRICING.map(o => `<div><dt>${esc(o.k)}</dt><dd>${esc(o.v)}</dd></div>`).join('')}</dl></div>`;

// ───────── 왜 합리적인가
export const marketChart = () => {
  const max = Math.max(...MARKET_BLOG.rows.map(r => r.hi));
  return `<figure class="mchart" data-reveal data-bars>
  <figcaption><strong>블로그 대행 1회당 금액 비교</strong><span>${MARKET_BLOG.date} 조회 · 부가세 별도 기준</span></figcaption>
  <ul>${MARKET_BLOG.rows.map(r => `<li class="${r.ours ? 'is-ours' : ''}"><div class="mchart__k"><b>${esc(r.k)}</b><small>${esc(r.sub)}</small></div><div class="mchart__bar"><span class="mchart__range" style="--lo:${(r.lo / max * 100).toFixed(1)}%;--hi:${(r.hi / max * 100).toFixed(1)}%"></span><em>${r.lo === r.hi ? won(r.lo) : `${won(r.lo)} ~ ${won(r.hi)}`}</em></div></li>`).join('')}</ul>
</figure>`;
};

export const structureTable = () => `<div class="cmp" data-reveal><table><thead><tr>${STRUCTURE_COMPARE.cols.map((c, i) => `<th scope="col"${i === 2 ? ' class="is-ours"' : ''}>${c}</th>`).join('')}</tr></thead><tbody>${STRUCTURE_COMPARE.rows.map(r => `<tr><th scope="row">${r[0]}</th><td data-label="일반적인 구조"><span>${r[1]}</span></td><td class="is-ours" data-label="${STRUCTURE_COMPARE.cols[2]}"><span>${icon('check')}${r[2]}</span></td></tr>`).join('')}</tbody></table></div>`;

export const cpcCalculator = () => `<div class="calc glass glass--light" data-calc data-reveal>
  <div class="calc__in">
    <p class="eyebrow">COST SIMULATOR</p>
    <h3>검색광고로만 문의를 받으면<br>한 달에 얼마가 들까요?</h3>
    <div class="fld"><label for="calc-ind">업종</label><select id="calc-ind" data-calc-ind>${CPC.rows.map(r => `<option value="${r.id}">${r.k} · 클릭당 ${man(r.lo)}~${man(r.hi)}</option>`).join('')}</select></div>
    <div class="fld"><label for="calc-clicks">월 클릭 수 <output data-calc-clicks-out>100</output>회</label><input id="calc-clicks" type="range" min="20" max="500" step="10" value="100" data-calc-clicks></div>
    <p class="calc__q">예시 검색어 <span data-calc-q></span></p>
  </div>
  <div class="calc__out">
    <div class="calc__row calc__row--ad"><p>검색광고 예상 매체비 <small>클릭할 때마다 과금 · 멈추면 노출 종료</small></p><b data-calc-ad>—</b></div>
    <div class="calc__row calc__row--geo"><p>AI 검색 운영 파트너십 <small>월 고정 · 클릭 수와 무관 · 만든 페이지는 자산으로 남음</small></p><b>${PRICE_SHOW_WEB_AI ? man(WEB_AI_PLAN.operate.price) + ' / 월' : '상담 후 견적'}</b></div>
    <p class="calc__note">${esc(CPC.note)} <a href="${CPC.source[1]}" target="_blank" rel="noopener nofollow">출처 보기</a> · AI 검색 최적화는 노출을 보장하지 않으므로 광고와 병행하며 비중을 조절하는 방식을 권합니다.</p>
  </div>
</div>`;

export const checklist = () => {
  const items = [['가격과 VAT', '월 금액에 부가세가 포함인지 별도인지'], ['발행 횟수와 분량', '월 몇 회, 원고 몇 자 기준인지'], ['디자인 포함 여부', '썸네일·배너·본문 이미지가 요금에 들어가는지'], ['발행 전 확인', '올리기 전에 원고를 볼 수 있는지'], ['보고 방식', '발행 URL과 노출 확인을 언제, 어떻게 받는지'], ['해지 조건', '최소 계약 기간과 해지·환불 기준']];
  return `<ol class="chk">${items.map(([k, d], i) => `<li data-reveal style="--d:${i * 50}ms"><span>${String(i + 1).padStart(2, '0')}</span><div><b>${k}</b><p>${d}</p></div></li>`).join('')}</ol>`;
};

// ───────── 업종
export const industryTabs = R => `<div class="itabs" data-tabs>
  <div class="itabs__list" role="tablist" aria-label="업종 선택">${INDUSTRIES.map((x, i) => `<button role="tab" type="button" id="it-${i}" aria-controls="ip-${i}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${icon(x.icon)}<span>${x.name}</span></button>`).join('')}</div>
  ${INDUSTRIES.map((x, i) => `<div class="itabs__panel" role="tabpanel" id="ip-${i}" aria-labelledby="it-${i}"${i ? ' hidden' : ''}>
    <div><p class="itabs__beh">${esc(x.behavior)}</p><ul class="ticks">${x.deliver.map(t => `<li>${icon('check')}${esc(t)}</li>`).join('')}</ul><p class="itabs__warn">${icon('shield')} ${esc(x.caution)}</p><a class="btn btn--line btn--sm" href="${R}industries/${x.slug}/">${x.name} 솔루션 자세히 ${icon('arrow')}</a></div>
    <div class="itabs__mix"><p>추천 채널 조합</p><ol>${x.mix.map((slug, k) => `<li><span>${k + 1}</span><a href="${R}services/${slug}/">${esc(svc(slug).name)}</a></li>`).join('')}</ol></div>
  </div>`).join('')}
</div>`;

// ───────── FAQ
export const faqList = (items, { idp = 'f' } = {}) => `<div class="acc" data-acc>${items.map((f, i) => `<div class="acc__i" data-cat="${esc(f.c || '')}"><h3><button type="button" class="acc__b" aria-expanded="false" aria-controls="${idp}-${i}" id="${idp}-b${i}">${esc(f.q)}<span class="acc__ic">${icon('plus')}</span></button></h3><div class="acc__p" id="${idp}-${i}" role="region" aria-labelledby="${idp}-b${i}" hidden><div class="acc__in"><p>${esc(f.a)}</p></div></div></div>`).join('')}</div>`;
export const faqBlock = (items = FAQ, { chips = true, idp = 'f', search = false } = {}) => `<div class="faq" data-faq>
  ${search || chips ? `<div class="faq__tools">${chips ? `<div class="fchips" role="group" aria-label="질문 분류"><button type="button" class="is-on" data-faq-cat="">전체</button>${FAQ_CATS.filter(c => items.some(f => f.c === c)).map(c => `<button type="button" data-faq-cat="${c}">${c}</button>`).join('')}</div>` : ''}${search ? `<label class="faq__search">${icon('search')}<input type="search" placeholder="궁금한 내용을 검색해 보세요" data-faq-q aria-label="질문 검색"></label>` : ''}</div>` : ''}
  ${faqList(items, { idp })}
  <p class="faq__empty" hidden data-faq-empty>찾는 질문이 없습니다. <button type="button" class="link" data-quote>상담으로 물어보기</button></p>
</div>`;
export const faqLD = items => ({ '@type': 'FAQPage', mainEntity: items.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });

// ───────── 인사이트 카드
export const postCard = (R, p, { big = false } = {}) => `<article class="pcard${big ? ' pcard--big' : ''}" data-reveal>
  <a href="${R}insights/${p.slug}/">${p.thumb ? `<div class="pcard__thumb">${img(R, p.thumb, `${p.category} — ${p.coverText}`, { eager: big })}</div>` : `<div class="pcard__cover pcard__cover--${p.coverKey}" aria-hidden="true"><span>${esc(p.category)}</span><strong>${esc(p.coverText)}</strong></div>`}
  <div class="pcard__txt"><p class="pcard__meta"><span>${esc(p.category)}</span><time datetime="${p.date}">${p.date.replace(/-/g, '.')}</time><span>${p.minutes}분</span></p><h3>${esc(p.title)}</h3>${big ? `<p>${esc(p.description)}</p>` : ''}</div></a>
</article>`;

// ───────── CTA 띠
export const ctaBand = (R, { title = '대표님의 사업, 지금 어떤 마케팅이 필요하신가요?', lead = '전화·카카오톡·상담 신청서 중 편한 방법으로 연락 주세요. 담당자가 업종과 상황을 먼저 듣고 필요한 것만 제안합니다.', svc: s = '' } = {}) => `
<section class="cta">
  <div class="wrap cta__in glass" data-reveal>
    <div><p class="eyebrow">CONTACT</p><h2>${title}</h2><p>${lead}</p></div>
    <div class="cta__btns">${quoteBtn('무료 상담 신청', s)}<a class="btn btn--glass" href="tel:${COMPANY.phone}" data-track="tel">${icon('phone')} ${COMPANY.phone}</a><a class="btn btn--glass" href="${COMPANY.kakao}" target="_blank" rel="noopener" data-track="kakao">${icon('chat')} 카카오톡 상담</a></div>
  </div>
</section>`;

export const processSteps = (cls = '') => `<ol class="proc ${cls}">${PROCESS.map((p, i) => `<li data-reveal style="--d:${i * 60}ms"><span class="proc__n">${String(i + 1).padStart(2, '0')}</span><h3>${p.k}</h3><p>${p.d}</p></li>`).join('')}</ol>`;

// ───────── 포트폴리오 그리드
export const portfolioGrid = (R, items, { filters = true, group = 'pf', limit = 0 } = {}) => {
  const cats = PORTFOLIO_CATS.filter(c => items.some(p => p.cat === c.id));
  return `<div class="pf" data-pf>
  ${filters ? `<div class="fchips fchips--scroll" role="group" aria-label="분류">${[`<button type="button" class="is-on" data-pf-cat="">전체 <small>${items.length}</small></button>`, ...cats.map(c => `<button type="button" data-pf-cat="${c.id}">${c.name} <small>${items.filter(p => p.cat === c.id).length}</small></button>`)].join('')}</div>` : ''}
  <div class="pf__grid">${items.map((p, i) => `<figure class="pf__i pf__i--${p.cat}${limit && i >= limit ? ' is-more' : ''}" data-cat="${p.cat}"><button type="button" data-lightbox="${group}" data-index="${i}" aria-label="${esc(p.cap)} 크게 보기">${img(R, p.src, `${PORTFOLIO_CATS.find(c => c.id === p.cat).name} — ${p.cap}`)}</button><figcaption><span>${PORTFOLIO_CATS.find(c => c.id === p.cat).name}</span>${esc(p.cap)}</figcaption></figure>`).join('')}</div>
  ${limit && items.length > limit ? `<div class="pf__more"><button class="btn btn--line" type="button" data-pf-more>더 보기 <small>${items.length - limit}</small></button></div>` : ''}
</div>`;
};

// ───────── AI 검색(GEO) 전용 블록 — 참고 이미지 1~7을 미래애드원 기준(보장 표현 없이)으로 재구성
export const chatDemo = () => `<div class="aichat glass" data-aichat data-reveal>
  <div class="aichat__bar"><span></span><span></span><span></span><p>AI 답변 화면 예시</p><em>예시</em></div>
  <div class="aichat__body">
    <p class="aichat__q" data-aichat-q>송파에서 도수치료 잘하는 정형외과 추천해줘</p>
    <div class="aichat__a" data-aichat-a>
      <p>도수치료는 치료사 경력과 진료 과정 안내가 분명한 곳을 고르는 것이 좋습니다. 공개된 정보를 기준으로 몇 곳을 정리했습니다.</p>
      <ol><li><mark>○○정형외과</mark> — 도수치료·체외충격파 진료 과목과 회차별 비용 안내 페이지 운영, 의료진 소개 공개</li><li>△△재활의학과 — 재활 운동 프로그램 안내</li></ol>
      <p class="aichat__src">출처 · ○○정형외과 홈페이지 「도수치료 비용과 횟수」</p>
    </div>
  </div>
  <p class="aichat__cap">AI는 답을 만들 때 읽기 쉬운 공식 출처를 인용합니다. 미래애드원은 고객의 질문에 답하는 페이지를 만들고, 실제로 어떻게 언급되는지 기록합니다. 화면은 설명용 예시입니다.</p>
</div>`;

export const costStructure = () => {
  const max = CPC.rows[0].hi;
  return `<div class="cost" data-reveal data-bars>
  <article class="cost__c cost__c--ad"><p class="cost__h">${icon('chart')} 키워드 광고 <small>클릭당 과금</small></p><p class="cost__s">클릭 1번 = 즉시 비용 · 멈추면 노출도 즉시 종료</p><p class="cost__l">업종별 클릭당 비용 예시 범위</p>
    <ul class="hbars">${CPC.rows.slice(0, 5).map(r => `<li><span>${r.k}</span><div><i style="--w:${(r.hi / max * 100).toFixed(1)}%"></i><b>${man(r.lo)}~${man(r.hi)}</b></div></li>`).join('')}</ul>
    <p class="cost__f cost__f--ad">클릭 = 즉시 과금<span>중단하면 노출 0</span></p></article>
  <article class="cost__c cost__c--geo"><p class="cost__h">${icon('spark')} AI 검색 최적화 <small>월 관리비</small></p><p class="cost__s">구축 + 월 관리비 · 클릭이 늘어도 추가 비용 없음</p><p class="cost__l">월 관리로 쌓이는 것</p>
    <ul class="hbars hbars--geo">${[['답변 가능한 질문', '매달 늘어남', 78], ['서비스·FAQ 페이지', '사이트에 누적', 86], ['브랜드 정보 일관성', '출처 정리', 70], ['작업 기록', '1~2주·월간 보고', 92], ['클릭 비용', '0원', 0]].map(([k, v, w]) => `<li><span>${k}</span><div>${w ? `<i style="--w:${w}%"></i>` : '<i class="is-zero"></i>'}<b>${v}</b></div></li>`).join('')}</ul>
    <p class="cost__f cost__f--geo">클릭해도 추가 비용 없음<span>만든 페이지는 사이트 자산</span></p></article>
</div>`;
};

export const keywordCards = () => `<div class="kwc">${[CPC.rows[0], CPC.rows[1], CPC.rows[3]].map((r, i) => `<article class="kwc__c" data-reveal style="--d:${i * 80}ms"><p class="kwc__ind">${r.k}</p><p class="kwc__q">${r.q.map(q => `“${esc(q)}”`).join('<br>')}</p><dl><div><dt>클릭당 비용(예시)</dt><dd class="is-ad">${man(r.lo)}~${man(r.hi)}</dd></div><div><dt>월 100클릭이면</dt><dd class="is-ad">${man(r.lo * 100)}~${man(r.hi * 100)}</dd></div><div><dt>AI 답변·자연 검색 유입</dt><dd class="is-geo">클릭 비용 0원</dd></div></dl><p class="kwc__f">같은 질문에 답하는 페이지가 있으면 광고 의존도를 낮출 수 있습니다</p></article>`).join('')}</div>`;

export const geoTimeline = () => `<div class="tl" data-reveal><ol>${GEO_TIMELINE.map((t, i) => `<li style="--d:${i * 90}ms"><span class="tl__dot"></span><p class="tl__t">${t.t}</p><h4>${t.h}</h4><p>${t.d}</p></li>`).join('')}</ol><p class="tl__note">${icon('spark')} 광고는 집행을 멈추면 노출도 사라집니다. 사이트에 만든 답변 페이지는 관리 기간만큼 쌓입니다. 질문 수는 관리 범위 예시이며 노출 결과를 보장하지 않습니다.</p></div>`;

// 리포트 예시 차트: 질문 30개 표본 중 브랜드 언급 수(예시 데이터)
export const reportChart = () => {
  const pts = [[0, 0], [1, 2], [2, 4], [3, 7], [4, 11], [5, 14], [6, 17]], labels = ['기준선', '1개월', '2개월', '3개월', '4개월', '5개월', '6개월'];
  const W = 640, H = 240, px = x => 40 + x * ((W - 60) / 6), py = y => H - 30 - y * ((H - 60) / 30);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${px(x).toFixed(1)},${py(y).toFixed(1)}`).join('');
  return `<figure class="rchart glass" data-reveal data-draw>
  <figcaption><strong>AI 검색 리포트 화면 예시</strong><span>질문 30개 표본 중 브랜드가 언급된 질문 수 · <em>예시 데이터</em></span></figcaption>
  <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="예시 데이터: 기준선 0개에서 6개월 차 17개까지 늘어난 선 그래프">
    ${[0, 10, 20, 30].map(v => `<g><line x1="40" x2="${W - 20}" y1="${py(v)}" y2="${py(v)}" class="rchart__grid"/><text x="30" y="${py(v) + 4}" text-anchor="end">${v}</text></g>`).join('')}
    <path d="${line} L${px(6)},${py(0)} L${px(0)},${py(0)} Z" class="rchart__area"/>
    <path d="${line}" class="rchart__line" pathLength="1"/>
    ${pts.map(([x, y]) => `<circle cx="${px(x)}" cy="${py(y)}" r="4" class="rchart__dot"/>`).join('')}
    ${labels.map((l, i) => `<text x="${px(i)}" y="${H - 8}" text-anchor="middle">${l}</text>`).join('')}
  </svg>
  <p class="rchart__note">실제 보고서에는 질문 원문, 플랫폼, 측정 일시·로그인 여부, 캡처가 함께 들어갑니다. 위 수치는 화면 설명용 예시이며 결과를 보장하지 않습니다.</p>
</figure>`;
};

export const reportFieldsTable = () => `<div class="cmp cmp--fields" data-reveal><table><thead><tr><th scope="col">필드</th><th scope="col">기록 기준</th></tr></thead><tbody>${REPORT_FIELDS.map(([k, v]) => `<tr><th scope="row">${k}</th><td data-label="기록 기준">${v}</td></tr>`).join('')}</tbody></table></div>`;

export const monthFlows = () => `<div class="flows"><article data-reveal><p class="eyebrow">1개월 차</p><h3>구축 + 첫 달 육성</h3><ol>${MONTH1.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join('')}</ol></article><article data-reveal style="--d:90ms"><p class="eyebrow">2개월 차부터</p><h3>반복 운영</h3><ol>${MONTH2.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join('')}</ol></article></div>`;

export const geoIndustries = R => `<div class="gind">${[['legal', '법무법인·로펌', 'scale', ['법률 상담 FAQ', '사건 유형별 콘텐츠', '비용 안내 FAQ', '변호사 프로필 정리']], ['medical', '의원·병원', 'cross', ['시술 설명 콘텐츠', '비용·과정 FAQ', '의료진 정보 구조화', '진료 안내 페이지']], ['franchise', '창업·프랜차이즈', 'store', ['창업 절차 콘텐츠', '비용 구조 FAQ', '가맹점 현황 정리', '본사 정보 정리']], ['legal', '세무·노무', 'doc', ['사업자 유형별 콘텐츠', '수수료 구조 FAQ', '실무 사례 정리', '세무 일정 안내']]].map(([slug, n, ic, items], i) => `<a class="gind__c" href="${R}industries/${slug}/" data-reveal style="--d:${i * 70}ms">${icon(ic)}<h4>${n}</h4><ul>${items.map(t => `<li>${t}</li>`).join('')}</ul></a>`).join('')}</div>
<p class="gind__note">${icon('spark')} 위 업종 외에도 <b>키워드 광고비가 높거나, 새로운 유입 채널이 필요한 업종</b>에 적합합니다.</p>`;

export const statusBoard = () => `<div class="board glass" data-board data-reveal>
  <div class="board__bar"><p><span class="live-dot"></span> 진행 현황 보드</p><em data-board-tag>샘플 화면</em></div>
  <div class="board__scroll"><table><thead><tr><th>상태</th><th>고객</th><th>업종</th><th>상품</th><th>이번 작업</th><th>진행</th></tr></thead><tbody data-board-body>${BOARD_SAMPLE.map(r => `<tr><td><span class="st st--${r.st}">${{ done: '완료', doing: '진행 중', wait: '대기' }[r.st]}</span></td><td>${r.client}</td><td>${r.biz}</td><td>${r.pkg}</td><td>${r.task}</td><td><span class="prog" aria-label="${r.prog}/5">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= r.prog ? 'on' : ''}"></i>`).join('')}</span><small>${r.date}</small></td></tr>`).join('')}</tbody></table></div>
  <p class="board__note">계약 고객에게는 이런 보드로 작업 단계와 일정을 공유합니다. 지금 보이는 표는 화면 설명용 샘플이며, 실제 보드는 고객별로 따로 열람합니다.</p>
</div>`;
