// 공통 레이아웃: <head>, 헤더(메가 메뉴), 푸터, 레이어(드로어·모달·토스트·상담폼), 아이콘 스프라이트
import { SITE, COMPANY, NAV, AXES, SERVICES, BLOG_PLANS, INDUSTRIES, KEYWORDS, KEYWORD_LINKS, NAVER_SITE_VERIFICATION } from './data.mjs';
import { esc, icon, ld, man } from './lib.mjs';

const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<defs>
<filter id="lg-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="2" seed="11" result="n"/><feGaussianBlur in="n" stdDeviation="1.6" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="22" xChannelSelector="R" yChannelSelector="G"/></filter>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-left" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-right" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><path d="M6.6 3.5h2.6l1.3 4.1-2 1.4a11.5 11.5 0 006.5 6.5l1.4-2 4.1 1.3v2.6a2 2 0 01-2.2 2A16.5 16.5 0 014.6 5.7a2 2 0 012-2.2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
<symbol id="i-chat" viewBox="0 0 24 24"><path d="M12 4C7 4 3 7.1 3 11c0 2.4 1.5 4.5 3.9 5.8L6 20.5l4.3-2.6c.6.1 1.1.1 1.7.1 5 0 9-3.1 9-7s-4-7-9-7z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
<symbol id="i-doc" viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-download" viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
<symbol id="i-ext" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-pause" viewBox="0 0 24 24"><path d="M9 6v12M15 6v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></symbol>
<symbol id="i-mute" viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
<symbol id="i-sound" viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
<symbol id="i-replay" viewBox="0 0 24 24"><path d="M4.5 12a7.5 7.5 0 102.2-5.3M4.5 4.5v3.8h3.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-spark" viewBox="0 0 24 24"><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" fill="currentColor"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 20V4M4 20h16M8 16l4-5 3 3 5-7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-pen" viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
<symbol id="i-image" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="10" r="1.6" fill="currentColor"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-bowl" viewBox="0 0 24 24"><path d="M3.5 11h17a8.5 8.5 0 01-17 0zM8 7c0-1.5 1-1.5 1-3M12 7c0-1.5 1-1.5 1-3M16 7c0-1.5 1-1.5 1-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
<symbol id="i-bed" viewBox="0 0 24 24"><path d="M3 18V7M3 14h18v4M21 14v-2.5a3 3 0 00-3-3h-7V14M7 11.5a1.5 1.5 0 100-.01" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></symbol>
<symbol id="i-cross" viewBox="0 0 24 24"><path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-scale" viewBox="0 0 24 24"><path d="M12 4v16M7 20h10M5 7h14M5 7l-2.5 6a2.5 2.5 0 005 0zM19 7l-2.5 6a2.5 2.5 0 005 0z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
<symbol id="i-store" viewBox="0 0 24 24"><path d="M4 9l1.5-5h13L20 9M4 9h16v1.5a2.7 2.7 0 01-5.3 0 2.7 2.7 0 01-5.4 0 2.7 2.7 0 01-5.3 0zM5.5 13v7h13v-7M10 20v-4h4v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
<symbol id="i-bag" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6zM9 8V6.5a3 3 0 016 0V8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-book" viewBox="0 0 24 24"><path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5zM12 6v13.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
<symbol id="i-home" viewBox="0 0 24 24"><path d="M4 11l8-6.5 8 6.5M6 9.5V20h12V9.5M10 20v-5.5h4V20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-quote" viewBox="0 0 24 24"><path d="M10 7H6.5A2.5 2.5 0 004 9.5V13h4v4h-.5M20 7h-3.5A2.5 2.5 0 0014 9.5V13h4v4h-.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
</defs></svg>`;

export const MEGA_FEATURE = () => {
  const p = BLOG_PLANS[0];
  return `<a class="mega__feature" href="{R}services/brand-blog/"><span class="mega__tag">공개 가격</span><strong>브랜드 블로그 월 ${p.count}회 ${man(p.price)}부터</strong><span>상주 작가·디자이너 직접 제작 · VAT 별도</span><span class="mega__go">가격 보기 ${icon('arrow')}</span></a>`;
};

export function head({ R, title, desc, canonical, og = 'og.jpg', jsonld = [], extraHead = '', kw = [] }) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${kw.length ? `<meta name="keywords" content="${esc(kw.join(', '))}">\n` : ''}<meta name="naver-site-verification" content="${NAVER_SITE_VERIFICATION}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${COMPANY.name}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}assets/img/${og}">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#111D30">
<link rel="icon" href="${R}favicon.ico" sizes="32x32">
<link rel="icon" href="${R}assets/img/brand/icon-512.png" type="image/png">
<link rel="apple-touch-icon" href="${R}assets/img/brand/icon-180.png">
<link rel="alternate" type="application/rss+xml" title="미래애드원 인사이트" href="${R}insights/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&display=swap">
<link rel="stylesheet" href="${R}assets/css/style.css?v={V}">
${jsonld.map(ld).join('\n')}
${extraHead}
</head>`;
}

export function header(R, current) {
  const mega = AXES.map(a => `<div class="mega__col"><p class="mega__axis"><span>${a.en}</span>${a.ko}</p><ul>${SERVICES.filter(s => s.axis === a.id).map(s => `<li><a href="${R}services/${s.slug}/"><span>${s.navLines ? s.navLines.map(esc).join('<br>') : esc(s.name)}</span>${s.isNew ? '<em>NEW</em>' : ''}</a></li>`).join('')}</ul></div>`).join('');
  const navItem = n => n.mega
    ? `<li class="gnb__item has-mega${current === n.href ? ' is-current' : ''}"><a class="gnb__link" href="${R}${n.href}" aria-haspopup="true" aria-expanded="false">${n.label}${icon('chev', 'gnb__chev')}</a>
      <div class="mega" role="region" aria-label="서비스 전체"><div class="mega__inner glass glass--light">${mega}${MEGA_FEATURE().replace('{R}', R)}<a class="mega__all" href="${R}services/">18개 서비스 전체 보기 ${icon('arrow')}</a></div></div></li>`
    : `<li class="gnb__item${current === n.href ? ' is-current' : ''}"><a class="gnb__link" href="${R}${n.href}"${current === n.href ? ' aria-current="page"' : ''}>${n.label}</a></li>`;
  return `<a class="skip" href="#main">본문 바로가기</a>
<header class="hd" data-hd>
  <div class="hd__bar glass">
    <a class="hd__logo" href="${R || './'}" aria-label="${COMPANY.name} 홈"><img src="${R}assets/img/brand/logo.png" width="900" height="240" alt="${COMPANY.name}" class="logo-c"><img src="${R}assets/img/brand/logo-white.png" width="900" height="240" alt="" aria-hidden="true" class="logo-w"></a>
    <nav class="gnb" aria-label="주 메뉴"><ul>${NAV.map(navItem).join('')}</ul></nav>
    <div class="hd__act">
      <a class="hd__tel" href="tel:${COMPANY.phone}" data-track="tel">${icon('phone')}<span>${COMPANY.phone}</span></a>
      <button class="btn btn--accent btn--sm" type="button" data-quote>무료 상담</button>
      <button class="hd__menu" type="button" aria-label="메뉴 열기" data-drawer-open="nav">${icon('menu')}</button>
    </div>
  </div>
</header>`;
}

export function footer(R) {
  const col = (t, links) => `<div class="ft__col"><p class="ft__h">${t}</p><ul>${links.map(([h, l]) => `<li><a href="${h.startsWith('http') ? h : R + h}"${h.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${l}</a></li>`).join('')}</ul></div>`;
  return `<footer class="ft">
  <div class="wrap">
    <div class="ft__top">
      <div class="ft__brand">
        <img src="${R}assets/img/brand/logo-white.png" width="900" height="240" alt="${COMPANY.name}" class="ft__logo" loading="lazy">
        <p>${COMPANY.slogan}</p>
        <div class="ft__cta"><a class="btn btn--glass btn--sm" href="tel:${COMPANY.phone}" data-track="tel">${icon('phone')} ${COMPANY.phone}</a><a class="btn btn--glass btn--sm" href="${COMPANY.kakao}" target="_blank" rel="noopener" data-track="kakao">${icon('chat')} 카카오톡 상담</a></div>
      </div>
      ${col('서비스', [['services/brand-blog/', '브랜드 블로그'], ['services/seo-aeo-geo/', 'SEO·AEO·GEO'], ['services/website/', '홈페이지 제작'], ['services/naver-search-ads/', '네이버 검색광고'], ['services/', '전체 18개 서비스']])}
      ${col('회사', [['about/', '회사소개'], ['portfolio/', '포트폴리오'], ['reviews/', '고객 후기'], ['pricing/', '가격 안내'], ['insights/', '인사이트']])}
      ${col('고객지원', [['contact/', '상담 신청'], ['faq/', '자주 묻는 질문'], ['privacy/', '개인정보처리방침'], [COMPANY.brochure, '회사소개서'], [COMPANY.naverBlog, '네이버 블로그']])}
    </div>
    <nav class="ft__kw" aria-label="주요 서비스 키워드"><p>주요 서비스</p><ul>${KEYWORD_LINKS.map(([t, h]) => `<li><a href="${R}${h}">${t}</a></li>`).join('')}</ul></nav>
    <div class="ft__biz">
      <p><span>상호 ${COMPANY.name}</span><span>대표 ${COMPANY.ceo}</span><span>사업자등록번호 ${COMPANY.bizNo}</span></p>
      <p><span>${COMPANY.address}</span><span>대표번호 ${COMPANY.phone}</span></p>
      <p class="ft__legal">AI 검색·검색 노출은 최적화 작업과 리포트를 제공하며 특정 순위나 노출을 보장하지 않습니다. 모든 가격은 부가세 별도입니다.</p>
      <p class="ft__copy">© ${new Date().getFullYear()} ${COMPANY.name}. All rights reserved.</p>
    </div>
  </div>
</footer>`;
}

const SERVICE_CHIPS = () => SERVICES.map(s => `<label class="chip"><input type="checkbox" name="services" value="${esc(s.name)}" data-slug="${s.slug}"><span>${esc(s.short)}</span></label>`).join('');
export const quoteForm = (id, R) => `<form class="qf" id="${id}" novalidate data-qf>
  <ol class="qf__steps" aria-hidden="true"><li class="is-on">관심 서비스</li><li>사업 정보</li><li>연락처</li></ol>
  <div class="qf__bar"><span style="width:33%"></span></div>
  <fieldset class="qf__step is-on" data-step="1">
    <legend>어떤 서비스가 궁금하신가요? <small>여러 개 선택 가능</small></legend>
    <div class="chips">${SERVICE_CHIPS()}</div>
    <p class="qf__hint">잘 모르시겠다면 선택하지 않고 다음으로 넘어가셔도 됩니다.</p>
  </fieldset>
  <fieldset class="qf__step" data-step="2">
    <legend>사업 정보를 알려 주세요</legend>
    <div class="fld"><label for="${id}-biz">업종</label><select id="${id}-biz" name="industry"><option value="">선택</option>${INDUSTRIES.map(i => `<option>${i.name}</option>`).join('')}<option>기업·B2B</option><option>기타</option></select></div>
    <div class="fld"><label for="${id}-region">지역</label><input id="${id}-region" name="region" placeholder="예: 서울 송파구" autocomplete="address-level2"></div>
    <div class="fld"><label for="${id}-budget">월 광고 예산 <small>선택</small></label><select id="${id}-budget" name="budget"><option value="">선택 안 함</option><option>50만원 미만</option><option>50~100만원</option><option>100~300만원</option><option>300~500만원</option><option>500만원 이상</option></select></div>
    <div class="fld"><label for="${id}-url">현재 사이트·블로그 주소 <small>선택</small></label><input id="${id}-url" name="url" type="url" inputmode="url" placeholder="https://"></div>
  </fieldset>
  <fieldset class="qf__step" data-step="3">
    <legend>연락받으실 정보를 남겨 주세요</legend>
    <div class="fld"><label for="${id}-name">이름 / 업체명 <b>*</b></label><input id="${id}-name" name="name" required autocomplete="name" placeholder="홍길동 / 미래식당"></div>
    <div class="fld"><label for="${id}-phone">연락처 <b>*</b></label><input id="${id}-phone" name="phone" required type="tel" inputmode="tel" autocomplete="tel" placeholder="010-0000-0000"></div>
    <div class="fld"><label for="${id}-msg">문의 내용 <small>선택</small></label><textarea id="${id}-msg" name="message" rows="3" placeholder="지금 고민하시는 점을 적어 주시면 상담이 빨라집니다."></textarea></div>
    <label class="agree"><input type="checkbox" name="agree" required> <span>개인정보 수집·이용에 동의합니다 <b>*</b></span> <button type="button" class="link" data-modal="privacy">내용 보기</button></label>
    <input type="text" name="hp" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
  </fieldset>
  <div class="qf__nav">
    <button type="button" class="btn btn--ghost" data-qf-prev hidden>이전</button>
    <button type="button" class="btn btn--primary" data-qf-next>다음 ${icon('arrow')}</button>
    <button type="submit" class="btn btn--accent" data-qf-submit hidden>상담 신청하기</button>
  </div>
</form>`;

export function layers(R) {
  const navAcc = AXES.map(a => `<details class="dnav__grp"><summary>${a.ko} <small>${a.en}</small>${icon('chev')}</summary><ul>${SERVICES.filter(s => s.axis === a.id).map(s => `<li><a href="${R}services/${s.slug}/">${esc(s.name)}</a></li>`).join('')}</ul></details>`).join('');
  return `${SPRITE}
<div class="drawer" id="drawer-nav" data-drawer="nav" aria-hidden="true">
  <div class="drawer__scrim" data-drawer-close></div>
  <aside class="drawer__panel glass glass--light" role="dialog" aria-modal="true" aria-label="전체 메뉴">
    <div class="drawer__head"><img src="${R}assets/img/brand/logo.png" width="900" height="240" alt="${COMPANY.name}" class="drawer__logo"><button class="iconbtn" type="button" aria-label="메뉴 닫기" data-drawer-close>${icon('close')}</button></div>
    <nav class="dnav" aria-label="모바일 메뉴">
      <a href="${R || './'}">홈</a>
      <a href="${R}about/">회사소개</a>
      <details class="dnav__grp" open><summary>서비스 <small>18</small>${icon('chev')}</summary><div class="dnav__sub">${navAcc}<a class="dnav__all" href="${R}services/">전체 서비스 보기</a></div></details>
      <a href="${R}industries/">업종별 솔루션</a>
      <a href="${R}pricing/">가격 안내</a>
      <a href="${R}portfolio/">포트폴리오</a>
      <a href="${R}reviews/">고객 후기</a>
      <a href="${R}insights/">인사이트</a>
      <a href="${R}faq/">자주 묻는 질문</a>
    </nav>
    <div class="drawer__foot"><a class="btn btn--primary btn--block" href="tel:${COMPANY.phone}" data-track="tel">${icon('phone')} ${COMPANY.phone}</a><button class="btn btn--accent btn--block" type="button" data-quote>무료 상담 신청</button></div>
  </aside>
</div>
<div class="drawer drawer--quote" id="drawer-quote" data-drawer="quote" aria-hidden="true">
  <div class="drawer__scrim" data-drawer-close></div>
  <aside class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="qd-title">
    <span class="sheet-handle" aria-hidden="true" data-sheet-handle></span>
    <div class="drawer__head"><div><p class="eyebrow">FREE CONSULTING</p><h2 id="qd-title">맞춤 광고 상담</h2></div><button class="iconbtn" type="button" aria-label="닫기" data-drawer-close>${icon('close')}</button></div>
    <p class="drawer__lead">세 단계면 끝납니다. 담당자가 확인 후 연락드립니다.</p>
    ${quoteForm('qd', R)}
  </aside>
</div>
<div class="modal" id="modal" aria-hidden="true"><div class="modal__scrim" data-modal-close></div><div class="modal__box glass glass--light" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="iconbtn modal__x" type="button" aria-label="닫기" data-modal-close>${icon('close')}</button><div class="modal__body" id="modal-body"></div></div></div>
<template id="tpl-privacy"><h2 id="modal-title">개인정보 수집·이용 안내</h2><table class="tbl"><tbody><tr><th>수집 항목</th><td>이름/업체명, 연락처(필수) · 업종, 지역, 관심 서비스, 월 광고 예산, 사이트·블로그 주소, 문의 내용(선택) · 유입 경로(광고 파라미터 등)</td></tr><tr><th>이용 목적</th><td>상담 응대, 견적 안내, 서비스 제안</td></tr><tr><th>보유 기간</th><td>상담 종료 후 1년. 관계 법령에 따라 보관이 필요한 경우 해당 기간</td></tr></tbody></table><p class="small">동의를 거부할 수 있으나, 필수 항목에 동의하지 않으면 상담 신청이 어렵습니다. 자세한 내용은 <a href="${R}privacy/">개인정보처리방침</a>을 확인해 주세요.</p></template>
<div class="toasts" id="toasts" role="status" aria-live="polite"></div>
<nav class="dock glass" aria-label="빠른 상담">
  <a href="tel:${COMPANY.phone}" data-track="tel">${icon('phone')}<span>전화</span></a>
  <a href="${COMPANY.kakao}" target="_blank" rel="noopener" data-track="kakao">${icon('chat')}<span>카카오톡</span></a>
  <button type="button" data-quote class="dock__main">${icon('doc')}<span>무료 상담 신청</span></button>
</nav>
<button class="totop glass" type="button" aria-label="맨 위로" data-totop>${icon('chev')}</button>`;
}

export function page({ R, current = '', title, desc, canonical, jsonld = [], body, bodyClass = '', og, extraHead = '', kw = [] }) {
  return `${head({ R, title, desc, canonical, og, jsonld, extraHead, kw })}
<body class="${bodyClass}">
${header(R, current)}
<main id="main">
${body}
</main>
${footer(R)}
${layers(R)}
<script>window.MA_ROOT=${JSON.stringify(R)};</script>
<script src="${R}assets/js/config.js?v={V}"></script>
<script src="${R}assets/js/data.js?v={V}"></script>
<script src="${R}assets/js/app.js?v={V}" defer></script>
</body>
</html>
`;
}

export const ORG = {
  '@type': ['Organization', 'ProfessionalService'], '@id': SITE + '#org', name: COMPANY.name, alternateName: [COMPANY.nameEn, 'MIRAEADONE', '미래애드원 광고대행사'], url: SITE,
  logo: SITE + 'assets/img/brand/icon-512.png', image: SITE + 'assets/img/og.jpg', telephone: COMPANY.phone, founder: { '@type': 'Person', name: COMPANY.ceo },
  address: { '@type': 'PostalAddress', streetAddress: '중대로 146 유나프라자 8층', addressLocality: '송파구', addressRegion: '서울특별시', addressCountry: 'KR' },
  taxID: COMPANY.bizNo, sameAs: [COMPANY.naverBlog], areaServed: 'KR', slogan: COMPANY.slogan,
  knowsAbout: KEYWORDS,
  hasOfferCatalog: { '@type': 'OfferCatalog', name: '미래애드원 마케팅 서비스', itemListElement: SERVICES.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: `${SITE}services/${s.slug}/` } })) },
  description: '미래애드원은 상주 작가·디자이너가 직접 만드는 블로그관리대행(브랜드 블로그 운영대행), 홈페이지 제작, AEO·GEO 마케팅(AI 검색 최적화), 네이버 검색광고·플레이스, 바이럴 마케팅, SNS를 운영하는 서울 송파구의 온라인광고대행사다.',
};
export const WEBSITE = { '@type': 'WebSite', '@id': SITE + '#web', url: SITE, name: COMPANY.name, inLanguage: 'ko-KR', publisher: { '@id': SITE + '#org' } };
export const crumbs = list => ({ '@type': 'BreadcrumbList', itemListElement: list.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })) });
export const crumbNav = (R, list) => `<nav class="crumb" aria-label="현재 위치"><ol>${list.map(([name, href], i) => i === list.length - 1 ? `<li aria-current="page">${esc(name)}</li>` : `<li><a href="${href === '' ? (R || './') : R + href}">${esc(name)}</a></li>`).join('')}</ol></nav>`;
