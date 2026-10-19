// 페이지 렌더러. 각 함수는 { path, html } 을 돌려준다. path 는 사이트 루트 기준 디렉터리('' = 홈)
import {
  SITE, COMPANY, SERVICES, AXES, INDUSTRIES, PORTFOLIO, PORTFOLIO_CATS, REVIEWS, FAQ, BLOG_FAQ, BLOG_PLANS, WEB_AI_PLAN, PRICE_SHOW_WEB_AI,
  CPC, BLOG_CATEGORIES, BLOG_AUTHOR, SEQUENCE, SEO, KEYWORD_LINKS, svc,
} from './data.mjs';
import { page, ORG, WEBSITE, crumbs, crumbNav, quoteForm } from './layout.mjs';
import {
  sectionHead, pageHero, quoteBtn, statsRow, logosMarquee, scrollSequence, serviceCard, axesBento, featuredDuo, problemTabs,
  reviewsCarousel, reviewCards, blogStatsStrip, blogPlans, webAiPlan, otherPricing, marketChart, structureTable, cpcCalculator, checklist,
  industryTabs, faqBlock, faqList, faqLD, postCard, ctaBand, processSteps, portfolioGrid, chatDemo, costStructure, keywordCards, geoTimeline,
  reportChart, reportFieldsTable, monthFlows, geoIndustries, statusBoard,
} from './blocks.mjs';
import { esc, won, man, icon, img } from './lib.mjs';

const depthR = p => (p ? '../'.repeat(p.split('/').filter(Boolean).length) : '');
const url = p => SITE + p;
const T = t => `${t} | ${COMPANY.name}`;

// ═════════ 홈
export function home(posts) {
  const R = '';
  const wallCols = [
    ['portfolio/blog-skin-01.webp', 'portfolio/web-06.webp', 'portfolio/blog-skin-07.webp', 'portfolio/web-14.webp'],
    ['portfolio/web-02.webp', 'portfolio/blog-skin-04.webp', 'portfolio/web-11.webp', 'portfolio/blog-skin-13.webp'],
    ['portfolio/blog-skin-10.webp', 'portfolio/web-08.webp', 'portfolio/blog-skin-02.webp', 'portfolio/web-17.webp'],
    ['portfolio/web-15.webp', 'portfolio/blog-skin-12.webp', 'portfolio/web-04.webp', 'portfolio/blog-skin-06.webp'],
  ];
  const wall = wallCols.map((c, i) => `<div class="wall__col" style="--i:${i}">${[...c, ...c].map(s => `<img src="assets/img/${s}" alt="" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async">`).join('')}</div>`).join('');
  const body = `
<section class="hero" data-hero>
  <div class="wall" aria-hidden="true"><div class="wall__in">${wall}</div></div>
  <div class="hero__shade" aria-hidden="true"></div>
  <div class="wrap hero__in">
    <div class="hero__txt">
      <p class="eyebrow eyebrow--lt">MIRAE ADONE · 통합 마케팅 파트너</p>
      <h1><span class="hero__l">광고를 넘어,</span><span class="hero__l">비즈니스의 성장을 <em>설계</em>하다.</span></h1>
      <p class="hero__lead">광고 영업 전화와 불분명한 관리에 지치셨나요? 직접 제작하고 운영하는 마케팅 파트너 미래애드원을 만나 보세요. 블로그관리대행부터 홈페이지 제작·AEO·GEO 마케팅·네이버 블로그 광고·바이럴 마케팅까지.</p>
      <div class="btns">${quoteBtn('맞춤 광고 상담')}<a class="btn btn--glass" href="services/">18개 서비스 보기</a></div>
    </div>
    <div class="hero__cards" aria-hidden="true">
      <div class="hcard hcard--a glass"><p class="hcard__k">${icon('chat')} 발행 전 확인 요청</p><p class="hcard__t">18회차 원고 · 송파 도수치료</p><div class="hcard__bub">원고와 썸네일 보내드립니다. 확인 부탁드립니다 :)</div><div class="hcard__act"><span>수정 요청</span><b>확인 완료</b></div></div>
      <div class="hcard hcard--b glass"><p class="hcard__k">${icon('chart')} 10월 운영 보고</p><ul class="hcard__bars"><li><span>발행</span><i style="--w:100%"></i><b>30/30</b></li><li><span>URL 전달</span><i style="--w:100%"></i><b>30</b></li><li><span>노출 확인</span><i style="--w:80%"></i><b>24</b></li></ul></div>
      <div class="hcard hcard--c glass"><p class="hcard__k">${icon('spark')} AI 답변 점검</p><p class="hcard__t">질문 30개 · ChatGPT·Gemini·Grok</p><div class="hcard__ring"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" class="bg"/><circle cx="18" cy="18" r="15.9" class="fg" stroke-dasharray="40 100"/></svg><span>측정 기록<br><small>예시</small></span></div></div>
    </div>
  </div>
  <div class="wrap hero__foot">${statsRow('stats--glass glass')}</div>
  <a class="hero__scroll" href="#manifesto" aria-label="아래로 스크롤"><span></span></a>
</section>

${logosMarquee(R)}

<section class="manifesto" id="manifesto">
  <div class="wrap">
    <p class="eyebrow">WHY MIRAE ADONE</p>
    <p class="manifesto__t" data-words>광고 영업 전화, 불분명한 계약 조건,<br>연락이 닿지 않는 담당자 때문에 불안하셨나요?<br>미래애드원은 직접 기획하고 제작·관리하는 실행형 파트너입니다.<br>상주 작가와 디자이너, 발행 전 확인,<br>전용 소통 채널과 정기 보고로 무엇을 어떻게 진행하는지 보여 드립니다.</p>
    <ul class="pillars">${[['chat', '담당자 소통', '1:1 전담 담당자와 전용 단톡방'], ['shield', '발행 전 확인', '원고·디자인을 먼저 보고 승인'], ['pen', '직접 제작', '상주 작가·디자이너가 직접 작업'], ['chart', '정기 보고', '회차별 URL, 1~2주·월간 보고']].map(([ic, k, d], i) => `<li data-reveal style="--d:${i * 70}ms">${icon(ic)}<b>${k}</b><span>${d}</span></li>`).join('')}</ul>
  </div>
</section>

${scrollSequence(R)}

<section class="sec sec--gray" id="features">
  <div class="wrap">
    ${sectionHead({ eyebrow: 'SERVICES', title: '검색·콘텐츠·웹·광고·브랜딩을<br>한 팀이 운영합니다', lead: '18개 서비스를 네 갈래로 나눴습니다. 필요한 것만 고르거나, 업종에 맞게 묶어서 맡기실 수 있습니다.' })}
    ${featuredDuo(R)}
    ${axesBento(R)}
    <div class="sub-h" data-reveal><h3>어떤 점이 고민이신가요?</h3><p>고민을 고르면 먼저 볼 서비스를 추천해 드립니다.</p></div>
    ${problemTabs(R)}
  </div>
</section>

<section class="sec" id="reviews">
  <div class="wrap">
    ${sectionHead({ eyebrow: 'CLIENT RECORDS', title: '말보다 기록으로<br>보여 드립니다', lead: '실제 카카오톡 운영 기록입니다. 회차별 원고를 보내고, 요청을 반영하고, 확인을 받은 뒤 발행합니다.' })}
    ${reviewsCarousel(R)}
    <div class="sub-h" data-reveal><h3>관리 중인 블로그의 실제 통계 화면</h3><p>네이버 블로그 관리자 화면을 그대로 옮겼습니다. 숫자는 각 화면의 해당 월 조회수입니다.</p></div>
    ${blogStatsStrip(R, 4)}
    <div class="center"><a class="btn btn--line" href="reviews/">후기·운영 기록 전체 보기 ${icon('arrow')}</a></div>
  </div>
</section>

<section class="sec sec--navy" id="pricing">
  <div class="wrap">
    ${sectionHead({ eyebrow: 'PRICING', title: '가격은 자신 있게<br>먼저 공개합니다', lead: '제공 범위와 VAT, 보고 방식까지 같이 적었습니다. 비교해 보시고 결정하셔도 늦지 않습니다.' })}
    ${blogPlans(R, { compact: true })}
    ${webAiPlan(R)}
    ${otherPricing()}
  </div>
</section>

<section class="sec" id="why">
  <div class="wrap">
    ${sectionHead({ eyebrow: 'WHY IT’S REASONABLE', title: '왜 이 가격이 가능한지,<br>숫자로 설명드립니다', lead: '외주로 넘기는 중간 단계를 없앤 자체 제작 구조라서 가능한 가격입니다. 공개된 시장 자료와 나란히 놓고 보시면 차이가 보입니다.' })}
    <div class="why">${marketChart()}${structureTable()}</div>
    ${cpcCalculator()}
    <div class="center"><a class="btn btn--line" href="pricing/">가격 비교 자료 자세히 ${icon('arrow')}</a></div>
  </div>
</section>

<section class="sec sec--gray" id="industries">
  <div class="wrap">
    ${sectionHead({ eyebrow: 'INDUSTRIES', title: '사업에 따라<br>정답이 달라집니다', lead: '업종마다 고객이 찾는 방식이 다릅니다. 채널 조합과 주의할 규정을 업종별로 정리했습니다.' })}
    ${industryTabs(R)}
    <nav class="kwlinks" aria-label="업종·서비스 바로가기" data-reveal><p>많이 찾는 서비스</p><ul>${KEYWORD_LINKS.map(([t, h]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></nav>
  </div>
</section>

<section class="sec" id="faq">
  <div class="wrap wrap--narrow">
    ${sectionHead({ eyebrow: 'FAQ', title: '자주 묻는 질문', center: true })}
    ${faqBlock(FAQ.slice(0, 10), { idp: 'hf' })}
    <div class="center"><a class="btn btn--line" href="faq/">질문 전체 보기 ${icon('arrow')}</a></div>
  </div>
</section>

<section class="sec sec--gray">
  <div class="wrap exp">
    <div data-reveal><p class="eyebrow">BUSINESS EXPERIENCE</p><h2>광고를 넘어<br>실제 사업을 이해합니다</h2><p>미래애드원의 대표는 광고대행업 외에 별도의 식자재 유통 사업을 운영합니다. 직접 사업을 하며 겪는 고객 확보와 비용, 운영의 고민을 알기 때문에 광고 상품보다 사업 과제를 먼저 묻습니다.</p><p class="small">식자재 유통 사업은 미래애드원 법인과 별개로 대표자가 운영하는 사업입니다.</p><a class="btn btn--line btn--sm" href="about/#experience">회사소개 보기 ${icon('arrow')}</a></div>
    <div class="exp__posts">
      <div class="exp__ph"><p class="eyebrow">INSIGHTS</p><a href="insights/" class="link">전체 글 ${icon('arrow')}</a></div>
      ${posts.slice(0, 3).map(p => postCard(R, p)).join('')}
    </div>
  </div>
</section>

${ctaBand(R)}`;
  return {
    path: '',
    html: page({
      R, current: '', title: SEO.home.title, desc: SEO.home.desc, kw: SEO.home.kw,
      canonical: SITE, bodyClass: 'is-home', jsonld: [{ '@context': 'https://schema.org', '@graph': [ORG, WEBSITE] }], body,
    }),
  };
}

// ═════════ 회사소개
export function about() {
  const p = 'about/', R = depthR(p);
  const body = `
${pageHero({ R, eyebrow: 'ABOUT', title: '우리는 광고만 파는<br>회사가 아닙니다', lead: '미래애드원은 블로그관리대행·홈페이지 제작·AEO·GEO 마케팅·바이럴 마케팅을 직접 운영하는 서울 송파구의 온라인광고대행사입니다. 전문 콘텐츠 제작과 디지털 광고 운영을 하나로 연결합니다.', crumbs: crumbNav(R, [['홈', ''], ['회사소개', p]]), ctas: `${quoteBtn('상담 신청')}<a class="btn btn--glass" href="${COMPANY.brochure}" target="_blank" rel="noopener">${icon('download')} 회사소개서</a>` })}
<section class="sec">
  <div class="wrap intro">
    <div data-reveal><p class="eyebrow">COMPANY</p><h2>화려한 약속보다<br>명확한 실행 범위</h2></div>
    <div class="intro__txt" data-reveal style="--d:80ms"><p>상주 작가·디자이너의 자체 제작 시스템을 기반으로 브랜드 블로그, SNS, 홈페이지, 검색광고, 플레이스, AI 검색 최적화, 촬영과 PR까지 다양한 서비스를 운영합니다.</p><p>업종별 실무 경험으로 광고주의 사업 조건을 살피고, 계약 이후에도 승인·소통·정기 보고를 통해 업무 과정을 공유합니다. 미래애드원은 화려한 약속보다 명확한 실행 범위와 확인 가능한 운영 기록을 중요하게 생각합니다.</p></div>
  </div>
  <div class="wrap">${statsRow('stats--line')}</div>
</section>
<section class="sec sec--gray" id="team">
  <div class="wrap">
    ${sectionHead({ eyebrow: 'TEAM STRUCTURE', title: '3인 1업체 전담 구조', lead: '한 업체를 작가·디자이너·마케터 세 사람이 함께 맡습니다. 외부로 다시 넘기지 않습니다.' })}
    <div class="trio">${[['pen', '전문 작가', '업종을 이해하고 1,500자 기준 원고를 직접 씁니다. 회차마다 주제와 키워드를 바꿉니다.'], ['image', '디자이너', '썸네일·하단 배너·본문 이미지, 홈페이지형 블로그 스킨을 만듭니다.'], ['chart', '마케터', '키워드와 채널을 설계하고 발행·노출을 확인해 보고서를 씁니다.']].map(([ic, k, d], i) => `<article class="trio__c glass glass--light" data-reveal style="--d:${i * 80}ms">${icon(ic)}<h3>${k}</h3><p>${d}</p></article>`).join('')}<div class="trio__hub" data-reveal><span>1:1 전담 담당자</span><small>전용 단톡방으로 소통</small></div></div>
  </div>
</section>
<section class="sec" id="experience">
  <div class="wrap exp exp--about">
    <div data-reveal><p class="eyebrow">BUSINESS EXPERIENCE</p><h2>마케팅과 사업 운영을<br>함께 경험한 시선</h2><p>미래애드원의 대표는 광고대행업 외에도 별도의 식자재 유통 사업을 운영합니다. 직접 사업을 운영하며 얻은 현장 경험을 고객사의 마케팅 과제를 이해하는 데 활용합니다.</p><p class="small">식자재 유통 사업은 미래애드원 법인 사업이 아니며, 대표자가 별도로 운영하는 사업입니다.</p></div>
    <blockquote class="exp__q glass glass--light" data-reveal style="--d:80ms">${icon('quote')}<p>광고를 아는 회사는 많습니다.<br>사업을 이해하는 회사는 다릅니다.</p><cite>미래애드원</cite></blockquote>
  </div>
</section>
<section class="sec sec--navy" id="process">
  <div class="wrap">
    ${sectionHead({ eyebrow: 'PROCESS', title: '계약부터 운영까지 투명하게', lead: '진단에서 보고까지 여섯 단계로 진행합니다. 단계마다 무엇을 받는지 미리 알려 드립니다.' })}
    ${processSteps('proc--dark')}
  </div>
</section>
${logosMarquee(R)}
<section class="sec">
  <div class="wrap press">
    <div data-reveal><p class="eyebrow">PRESS</p><h2>언론사 직접 제휴</h2><p>보도자료 작성부터 송출까지 한 번에 진행합니다. 매체별 게재 조건을 미리 안내하고, 게재 URL로 결과를 보고합니다.</p><a class="btn btn--line btn--sm" href="${R}services/press-pr/">언론보도·기업 PR ${icon('arrow')}</a></div>
    <div class="press__img" data-reveal style="--d:80ms">${img(R, 'press/press-01.webp', '협력 언론사 로고 모음')}</div>
  </div>
</section>
<section class="sec sec--gray" id="info">
  <div class="wrap wrap--narrow">
    ${sectionHead({ eyebrow: 'INFORMATION', title: '회사 정보', center: true })}
    <table class="tbl tbl--info" data-reveal><tbody>
      <tr><th>상호</th><td>${COMPANY.name} (${COMPANY.nameEn})</td></tr><tr><th>대표</th><td>${COMPANY.ceo}</td></tr><tr><th>사업자등록번호</th><td>${COMPANY.bizNo}</td></tr>
      <tr><th>주소</th><td>${COMPANY.address} <a class="link" href="https://map.naver.com/p/search/${encodeURIComponent(COMPANY.address)}" target="_blank" rel="noopener">지도 ${icon('ext')}</a></td></tr>
      <tr><th>대표번호</th><td><a href="tel:${COMPANY.phone}">${COMPANY.phone}</a> <button class="link" type="button" data-copy="${COMPANY.phone}">${icon('copy')} 복사</button></td></tr>
      <tr><th>상담 채널</th><td><a class="link" href="${COMPANY.kakao}" target="_blank" rel="noopener">카카오톡 오픈채팅</a> · <a class="link" href="${COMPANY.naverBlog}" target="_blank" rel="noopener">네이버 블로그</a></td></tr>
    </tbody></table>
  </div>
</section>
${ctaBand(R)}`;
  return { path: p, html: page({ R, current: 'about/', title: SEO.about.title, kw: SEO.about.kw, desc: SEO.about.desc, canonical: url(p), jsonld: [{ '@context': 'https://schema.org', '@graph': [ORG, crumbs([['홈', SITE], ['회사소개', url(p)]])] }], body }) };
}

// ═════════ 서비스 전체
export function servicesIndex() {
  const p = 'services/', R = depthR(p);
  const body = `
${pageHero({ R, eyebrow: 'SERVICES', title: '18개 서비스,<br>필요한 것만 고르세요', lead: '기존 11개 상품에 신규 추천 6개와 카페 바이럴을 더했습니다. 네 갈래로 나눠 두었으니 업종과 목표에 맞게 고르시면 됩니다.', crumbs: crumbNav(R, [['홈', ''], ['서비스', p]]), ctas: quoteBtn('어떤 서비스가 맞는지 상담') })}
<section class="sec">
  <div class="wrap">
    <div class="fchips fchips--scroll" role="group" aria-label="서비스 분류" data-svc-filter><button type="button" class="is-on" data-axis="">전체 <small>${SERVICES.length}</small></button>${AXES.map(a => `<button type="button" data-axis="${a.id}">${a.ko} <small>${SERVICES.filter(s => s.axis === a.id).length}</small></button>`).join('')}</div>
    <div class="sgrid" data-svc-grid>${SERVICES.map(s => serviceCard(R, s, { quick: true })).join('')}</div>
  </div>
</section>
<section class="sec sec--gray"><div class="wrap">${sectionHead({ eyebrow: 'NOT SURE?', title: '어떤 서비스부터 할지<br>모르겠다면', lead: '지금 고민을 고르면 먼저 볼 서비스를 알려 드립니다.' })}${problemTabs(R)}</div></section>
${ctaBand(R)}
<script type="application/json" id="svc-quick">${JSON.stringify(Object.fromEntries(SERVICES.map(s => [s.slug, { name: s.name, copy: s.copy, lead: s.lead, scope: s.scope, model: s.model }]))).replace(/</g, '\\u003c')}</script>`;
  return {
    path: p, html: page({
      R, current: 'services/', title: T('서비스 전체'), desc: '홈페이지·SEO·AEO·GEO·브랜드 블로그·검색광고·플레이스·SNS·바이럴·촬영·PR까지 미래애드원의 18개 마케팅 서비스를 한눈에 확인하세요.', canonical: url(p),
      jsonld: [{ '@context': 'https://schema.org', '@graph': [crumbs([['홈', SITE], ['서비스', url(p)]]), { '@type': 'ItemList', itemListElement: SERVICES.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: url(`services/${s.slug}/`), name: s.name })) }] }], body,
    }),
  };
}

// ═════════ 서비스 상세 (공통 템플릿 + 일부 상품 전용 섹션)
const priceBox = (R, s) => {
  if (s.priceRef === 'blog') return `<section class="sec sec--navy" id="price"><div class="wrap">${sectionHead({ eyebrow: 'PRICE', title: '공개 가격', lead: '모든 가격은 부가세 별도입니다. 월 단위로 진행할 수 있습니다.' })}${blogPlans(R)}</div></section>`;
  if (s.priceRef === 'web-ai') return `<section class="sec sec--navy" id="price"><div class="wrap">${sectionHead({ eyebrow: 'PRICE', title: '구축 이후에도 이어지는 계약', lead: '1회 제작 판매가 아니라, 첫 달 구축·육성과 둘째 달부터의 지속 육성으로 나눴습니다.' })}${webAiPlan(R, { title: false })}</div></section>`;
  if (s.priceRef === 'ads') return `<section class="sec sec--gray" id="price"><div class="wrap wrap--narrow">${sectionHead({ eyebrow: 'PRICE', title: '매체비와 수수료를 나눠 안내합니다', center: true })}<div class="adsplit" data-reveal><div><p>광고 매체비</p><b>광고주 계정에서 네이버에 직접 충전</b><span>클릭이 생길 때 차감되는 실제 광고비</span></div><span class="adsplit__plus">${icon('plus')}</span><div><p>운영 수수료</p><b>상담 후 견적</b><span>키워드 설계·입찰·소재·보고 비용</span></div></div><div class="center">${quoteBtn('검색광고 견적 받기', s.slug)}</div></div></section>`;
  return `<section class="sec sec--gray" id="price"><div class="wrap wrap--narrow">${sectionHead({ eyebrow: 'PRICE', title: '상담 후 맞춤 견적', center: true })}<div class="qprice" data-reveal><p>판매 구조</p><b>${esc(s.model)}</b><span>범위 편차가 커서 업종·물량을 확인한 뒤 견적서로 안내합니다. 견적서에는 제공 범위·횟수·수정·보고 주기·VAT를 모두 적습니다.</span>${quoteBtn('이 상품으로 견적 받기', s.slug)}</div></div></section>`;
};

function serviceExtra(R, s) {
  if (s.slug === 'brand-blog') return `
<section class="sec" id="how"><div class="wrap">${sectionHead({ eyebrow: 'HOW', title: '찍어내는 포스팅이 아닌<br>업종을 이해한 맞춤 제작', lead: '상담과 업종 분석부터 발행 후 보고까지, 한 업체를 세 사람이 맡아 진행합니다.' })}
<ol class="flowline">${SEQUENCE.map((q, i) => `<li data-reveal style="--d:${i * 60}ms"><span>${q.n}</span><b>${q.k}</b><p>${q.d}</p></li>`).join('')}</ol></div></section>
<section class="sec sec--gray" id="records"><div class="wrap">${sectionHead({ eyebrow: 'RECORDS', title: '발행 전 확인, 실제로 이렇게 합니다', lead: '고객과 실제로 주고받은 카카오톡 운영 기록입니다.' })}${reviewsCarousel(R)}</div></section>
<section class="sec" id="why"><div class="wrap">${sectionHead({ eyebrow: 'COMPARE', title: '1회당 금액으로 비교해 보세요' })}<div class="why">${marketChart()}${structureTable()}</div></div></section>
<section class="sec sec--gray" id="skins"><div class="wrap">${sectionHead({ eyebrow: 'PORTFOLIO', title: '블로그 스킨과 운영 성과' })}${portfolioGrid(R, PORTFOLIO.filter(x => x.cat === 'blog-skin' || x.cat === 'blog-stats'), { group: 'svc-pf', limit: 8 })}</div></section>`;
  if (s.slug === 'seo-aeo-geo' || s.slug === 'ai-visibility') return `
<section class="sec sec--ink" id="ai"><div class="wrap two">
  <div data-reveal>${sectionHead({ eyebrow: 'AI SEARCH', title: '고객은 이제<br>AI에게 먼저 묻습니다', lead: '「추천해 줘」라고 물으면 AI는 읽을 수 있는 출처를 골라 답합니다. 답할 페이지가 없는 브랜드는 그 목록에 들어가기 어렵습니다.' })}</div>
  ${chatDemo()}
</div></section>
${s.slug === 'seo-aeo-geo' ? `<section class="sec sec--ink" id="cost"><div class="wrap">${sectionHead({ eyebrow: 'COST STRUCTURE', title: '광고는 클릭할 때마다<br><em class="t-warm">돈이 빠져나갑니다</em>', lead: '광고는 집행 여부를 고를 수 있지만, 클릭이 생기는 순간 비용이 나갑니다. AI 검색 최적화는 비용 구조가 다릅니다.' })}${costStructure()}</div></section>
<section class="sec sec--ink" id="keyword"><div class="wrap">${sectionHead({ eyebrow: 'KEYWORD COST VS GEO', title: '클릭 한 번에 수만 원,<br><em class="t-cool">AI 답변 유입은 0원입니다</em>', lead: '업종 핵심 키워드의 클릭당 비용 예시와 비교해 보세요. 관리를 이어가는 동안 답할 수 있는 질문이 쌓입니다.' })}${keywordCards()}${cpcCalculator()}</div></section>
<section class="sec sec--ink" id="timeline"><div class="wrap">${sectionHead({ eyebrow: 'COMPOUNDING', title: '월 관리 = 답할 수 있는 질문이<br>계속 쌓이는 구조' })}${geoTimeline()}</div></section>` : ''}
<section class="sec" id="report"><div class="wrap two two--top"><div>${sectionHead({ eyebrow: 'REPORT', title: '무엇을 했고, 어떻게 바뀌었는지<br>기록으로 남깁니다', lead: 'AI 답변은 시간·계정·질문 표현에 따라 달라집니다. 그래서 측정 조건까지 함께 기록하고, 표본 테스트를 전체 노출량처럼 보고하지 않습니다.' })}${reportFieldsTable()}</div>${reportChart()}</div></section>
${s.slug === 'seo-aeo-geo' ? `<section class="sec sec--gray" id="flow"><div class="wrap">${sectionHead({ eyebrow: 'FLOW', title: '첫 달과 그다음 달, 하는 일이 다릅니다' })}${monthFlows()}</div></section>
<section class="sec" id="board"><div class="wrap two two--top"><div>${sectionHead({ eyebrow: 'STATUS', title: '지금 어디까지 왔는지<br>언제든 확인하세요', lead: '진행 단계·이번 작업·다음 일정을 표로 공유합니다. 연락이 닿지 않는 대행이 걱정이셨다면 이 부분을 먼저 보시면 됩니다.' })}</div>${statusBoard()}</div></section>
<section class="sec sec--gray" id="fit"><div class="wrap">${sectionHead({ eyebrow: 'INDUSTRY', title: '이런 업종에 먼저 권합니다', lead: '네이버 검색 경쟁이 심하거나, 검색광고 비용이 부담되는 업종입니다.' })}${geoIndustries(R)}</div></section>` : ''}`;
  if (s.slug === 'website') return `
<section class="sec sec--gray" id="works"><div class="wrap">${sectionHead({ eyebrow: 'PORTFOLIO', title: '업종별 제작 사례', lead: '업종별 홈페이지 제작 사례입니다. 이미지를 누르면 크게 볼 수 있습니다.' })}${portfolioGrid(R, PORTFOLIO.filter(x => x.cat === 'web' || x.cat === 'web-set'), { group: 'svc-pf', limit: 9 })}</div></section>`;
  return '';
}

export function serviceDetail(s, posts) {
  const p = `services/${s.slug}/`, R = depthR(p);
  const axis = AXES.find(a => a.id === s.axis);
  const related = SERVICES.filter(x => x.axis === s.axis && x.slug !== s.slug).slice(0, 3);
  const pf = s.portfolio.length && !['brand-blog', 'website'].includes(s.slug) ? PORTFOLIO.filter(x => s.portfolio.includes(x.cat)).slice(0, 6) : [];
  const faqs = [...s.faq.map(([q, a]) => ({ q, a })), ...(s.slug === 'brand-blog' ? BLOG_FAQ.map(([q, a]) => ({ q, a })) : FAQ.filter(f => f.c === '계약').slice(0, 2))];
  const relPosts = posts.filter(x => x.service === s.slug).slice(0, 3);
  const body = `
${pageHero({ R, eyebrow: `${axis.en} · ${String(s.no).padStart(2, '0')}`, title: esc(SEO[s.slug]?.h1 || s.name), lead: `<strong>${esc(s.copy)}</strong><br>${esc(s.lead)}`, crumbs: crumbNav(R, [['홈', ''], ['서비스', 'services/'], [s.name, p]]), ctas: `${quoteBtn('이 상품으로 상담하기', s.slug)}<a class="btn btn--glass" href="#price">가격·판매 구조</a>`, cls: `phero--svc phero--${s.slug}` })}
<nav class="subnav glass glass--light" aria-label="이 페이지 목차" data-subnav><a href="#problem">이런 상황</a><a href="#scope">제공 범위</a><a href="#price">가격</a><a href="#process">진행</a><a href="#svc-faq">FAQ</a></nav>
<section class="sec" id="problem"><div class="wrap">${sectionHead({ eyebrow: 'PROBLEM', title: '이런 상황이라면' })}<div class="pains">${s.pains.map((t, i) => `<article data-reveal style="--d:${i * 70}ms"><span>${String(i + 1).padStart(2, '0')}</span><p>${esc(t)}</p></article>`).join('')}</div>
<div class="fit" data-reveal><p>추천 대상</p><ul>${s.targets.map(t => `<li>${icon('check')}${esc(t)}</li>`).join('')}</ul></div></div></section>
<section class="sec sec--gray" id="scope"><div class="wrap two two--top"><div>${sectionHead({ eyebrow: 'SCOPE', title: '제공 범위', lead: `판매 구조: ${esc(s.model)}` })}</div><ul class="scope" data-reveal>${s.scope.map(t => `<li>${icon('check')}<span>${esc(t)}</span></li>`).join('')}</ul></div></section>
${serviceExtra(R, s)}
${priceBox(R, s)}
<section class="sec" id="process"><div class="wrap">${sectionHead({ eyebrow: 'PROCESS', title: '진행 과정' })}<ol class="flowline flowline--sm">${s.process.map((t, i) => `<li data-reveal style="--d:${i * 60}ms"><span>${String(i + 1).padStart(2, '0')}</span><b>${esc(t)}</b></li>`).join('')}</ol>
<div class="repbox glass glass--light" data-reveal><p>${icon('doc')} 보고서에 들어가는 것</p><ul>${s.report.map(t => `<li>${esc(t)}</li>`).join('')}</ul><button class="link" type="button" data-modal="report">리포트 항목 기준 보기</button></div></div></section>
${pf.length ? `<section class="sec sec--gray" id="cases"><div class="wrap">${sectionHead({ eyebrow: 'CASES', title: '관련 사례' })}${portfolioGrid(R, pf, { filters: false, group: 'svc-pf' })}<div class="center"><a class="btn btn--line" href="${R}portfolio/">포트폴리오 전체 ${icon('arrow')}</a></div></div></section>` : ''}
<section class="sec" id="svc-faq"><div class="wrap wrap--narrow">${sectionHead({ eyebrow: 'FAQ', title: `${esc(s.short)} 자주 묻는 질문`, center: true })}${faqBlock(faqs, { chips: false, idp: 'sf' })}</div></section>
${relPosts.length ? `<section class="sec sec--gray"><div class="wrap">${sectionHead({ eyebrow: 'INSIGHTS', title: '관련 글' })}<div class="pgrid">${relPosts.map(x => postCard(R, x)).join('')}</div></div></section>` : ''}
<section class="sec ${relPosts.length ? '' : 'sec--gray'}"><div class="wrap">${sectionHead({ eyebrow: 'RELATED', title: `함께 보면 좋은 ${axis.ko} 서비스` })}<div class="sgrid sgrid--3">${related.map(x => serviceCard(R, x)).join('')}</div></div></section>
${ctaBand(R, { title: `${esc(s.name)}, 어디서부터 시작할지 같이 정해 보세요`, svc: s.slug })}
<template id="tpl-report"><h2 id="modal-title">AI·검색 노출 리포트 표준</h2>${reportFieldsTable().replace(' data-reveal', '')}<p class="small">일부 플랫폼은 공식 전체 노출량을 제공하지 않으므로 수동 표본 테스트를 전체 노출량으로 보고하지 않습니다.</p></template>`;
  const offers = s.priceRef === 'blog' ? { offers: BLOG_PLANS.map(b => ({ '@type': 'Offer', name: `${b.name} 월 ${b.count}회`, price: b.price, priceCurrency: 'KRW', priceSpecification: { '@type': 'UnitPriceSpecification', price: b.price, priceCurrency: 'KRW', unitText: '월', valueAddedTaxIncluded: false } })) }
    : s.priceRef === 'web-ai' && PRICE_SHOW_WEB_AI ? { offers: [WEB_AI_PLAN.build, WEB_AI_PLAN.operate].map(b => ({ '@type': 'Offer', name: b.name, price: b.price, priceCurrency: 'KRW', priceSpecification: { '@type': 'PriceSpecification', price: b.price, priceCurrency: 'KRW', valueAddedTaxIncluded: false } })) } : {};
  return {
    path: p, html: page({
      R, current: 'services/', title: SEO[s.slug]?.title || T(s.name), kw: SEO[s.slug]?.kw || [s.name, s.short],
      desc: SEO[s.slug]?.desc || `미래애드원 ${s.name}: ${s.copy} ${s.scope.slice(0, 3).join(', ')}. 판매 구조: ${s.model}.`,
      canonical: url(p), bodyClass: `is-svc svc-${s.slug}`,
      jsonld: [{ '@context': 'https://schema.org', '@graph': [{ '@type': 'Service', '@id': url(p) + '#service', name: s.name, serviceType: s.name, ...(SEO[s.slug] ? { alternateName: SEO[s.slug].kw.slice(0, 4), keywords: SEO[s.slug].kw.join(', ') } : {}), description: s.lead, provider: { '@id': SITE + '#org' }, areaServed: 'KR', url: url(p), ...offers }, crumbs([['홈', SITE], ['서비스', url('services/')], [s.name, url(p)]]), faqLD(faqs)] }, { '@context': 'https://schema.org', ...ORG }], body,
    }),
  };
}

// ═════════ 업종별 솔루션
export function industriesIndex() {
  const p = 'industries/', R = depthR(p);
  const body = `
${pageHero({ R, eyebrow: 'INDUSTRIES', title: '사업에 따라<br>정답이 달라집니다', lead: '음식점, 숙박, 병원, 법률, 프랜차이즈, 쇼핑몰, 학원. 고객이 찾는 방식에 맞춰 채널을 조합합니다.', crumbs: crumbNav(R, [['홈', ''], ['업종별 솔루션', p]]), ctas: quoteBtn('업종별 상담') })}
<section class="sec"><div class="wrap"><div class="icards">${INDUSTRIES.map((x, i) => `<a class="icard" href="${R}industries/${x.slug}/" data-reveal style="--d:${(i % 4) * 60}ms">${icon(x.icon)}<h2>${x.name}</h2><p>${esc(x.behavior)}</p><ul>${x.mix.slice(0, 3).map(sl => `<li>${esc(svc(sl).short)}</li>`).join('')}</ul><span>${icon('arrow')}</span></a>`).join('')}</div></div></section>
<section class="sec sec--gray"><div class="wrap">${sectionHead({ eyebrow: 'COMPARE', title: '업종별 채널 조합 한눈에' })}${industryTabs(R)}</div></section>
${ctaBand(R)}`;
  return { path: p, html: page({ R, current: 'industries/', title: T('업종별 솔루션 — 병원 마케팅·학원·인테리어·부동산 블로그 마케팅'), kw: ['병원 마케팅', '학원 블로그 마케팅', '인테리어 블로그 마케팅', '부동산 블로그 마케팅', '업종별 마케팅'], desc: '미래애드원 업종별 솔루션: 병원 마케팅·병원 홈페이지, 학원·인테리어·부동산 블로그 마케팅, 음식점·숙박·법률·프랜차이즈·쇼핑몰까지 고객 행동에 맞춘 채널 조합과 광고 규정을 정리했습니다.', canonical: url(p), jsonld: [{ '@context': 'https://schema.org', '@graph': [crumbs([['홈', SITE], ['업종별 솔루션', url(p)]])] }], body }) };
}

export function industryDetail(x) {
  const p = `industries/${x.slug}/`, R = depthR(p);
  // 업종과 맞는 실제 사례를 캡션으로 먼저 고르고, 모자라면 분류로 채운다
  const capRe = { restaurant: /음식|숯불|갈비|맛집|외식|카페/, hospitality: /스테이|여행|관광|숙박/, medical: /의원|한의원|피부과|치과|성형|정형|병원|클리닉/, legal: /법무|노무|세무|법률/, franchise: /물류|기업|본사|프랜차이즈|건설/, ecommerce: /쇼핑|광고|외식 브랜드|주얼리/, education: /학원|유치원|학습|교육/, interior: /인테리어|공간|욕실|도어/, 'real-estate': /부동산/ };
  const catMap = { restaurant: ['viral', 'blog-skin'], hospitality: ['web-set'], medical: ['web', 'blog-skin'], legal: ['web', 'blog-skin'], franchise: ['blog-skin', 'web-set'], ecommerce: ['ads', 'sns'], education: ['web', 'blog-stats'], interior: ['web', 'web-set'], 'real-estate': ['blog-stats', 'web-set'] };
  const byCap = PORTFOLIO.filter(i => capRe[x.slug]?.test(i.cap));
  const pf = [...byCap, ...PORTFOLIO.filter(i => catMap[x.slug].includes(i.cat) && !byCap.includes(i))].slice(0, 6);
  const sx = SEO[x.slug] || {};
  const body = `
${pageHero({ R, eyebrow: 'INDUSTRY SOLUTION', title: esc(sx.h1 || `${x.name} 마케팅`), lead: esc(x.behavior), crumbs: crumbNav(R, [['홈', ''], ['업종별 솔루션', 'industries/'], [x.name, p]]), ctas: quoteBtn(`${x.name} 상담`) })}
<section class="sec"><div class="wrap two two--top"><div>${sectionHead({ eyebrow: 'DELIVERABLES', title: '이렇게 준비합니다' })}<ul class="scope" data-reveal>${x.deliver.map(t => `<li>${icon('check')}<span>${esc(t)}</span></li>`).join('')}</ul><p class="warnbox" data-reveal>${icon('shield')} ${esc(x.caution)}</p></div>
<div><p class="eyebrow">CHANNEL MIX</p><h2 class="h2s">추천 채널 조합</h2><div class="mixlist">${x.mix.map((sl, i) => { const s = svc(sl); return `<a href="${R}services/${sl}/" data-reveal style="--d:${i * 60}ms"><span>${i + 1}</span><div><b>${esc(s.name)}</b><small>${esc(s.copy)}</small></div>${icon('arrow')}</a>`; }).join('')}</div></div></div></section>
<section class="sec sec--gray"><div class="wrap">${sectionHead({ eyebrow: 'CASES', title: '참고할 만한 제작 사례' })}${portfolioGrid(R, pf, { filters: false, group: 'ind-pf' })}</div></section>
<section class="sec"><div class="wrap">${sectionHead({ eyebrow: 'OTHER', title: '다른 업종 보기' })}<div class="ilinks">${INDUSTRIES.filter(i => i.slug !== x.slug).map(i => `<a href="${R}industries/${i.slug}/">${icon(i.icon)}${i.name}</a>`).join('')}</div></div></section>
${ctaBand(R, { title: `${x.name}, 어떤 채널부터 시작할지 정해 드립니다` })}`;
  return { path: p, html: page({ R, current: 'industries/', title: sx.title || T(`${x.name} 마케팅 솔루션`), kw: sx.kw || [], desc: sx.desc || `미래애드원 ${x.name} 마케팅: ${x.mix.map(sl => svc(sl).short).join('·')}. ${x.caution}`, canonical: url(p), jsonld: [{ '@context': 'https://schema.org', '@graph': [crumbs([['홈', SITE], ['업종별 솔루션', url('industries/')], [x.name, url(p)]])] }], body }) };
}

// ═════════ 가격
export function pricing() {
  const p = 'pricing/', R = depthR(p);
  const faqs = FAQ.filter(f => f.c === '가격' || f.c === '계약');
  const body = `
${pageHero({ R, eyebrow: 'PRICING', title: '가격과 범위를<br>먼저 보여 드립니다', lead: '가격표마다 적용 범위·VAT·보고 빈도를 함께 적었습니다. 견적서에는 여기에 계약 기간과 수정 횟수가 더해집니다.', crumbs: crumbNav(R, [['홈', ''], ['가격', p]]), ctas: quoteBtn('맞춤 견적 받기') })}
<section class="sec sec--navy" id="blog"><div class="wrap">${sectionHead({ eyebrow: 'BRAND BLOG', title: '브랜드 블로그 관리대행', lead: '월 단위로 진행할 수 있으며 모두 부가세 별도입니다.' })}${blogPlans(R)}</div></section>
<section class="sec" id="web-ai"><div class="wrap">${webAiPlan(R)}${otherPricing()}</div></section>
<section class="sec sec--gray" id="compare"><div class="wrap">${sectionHead({ eyebrow: 'COMPARE', title: '시장 자료와 나란히 놓고 보세요', lead: '업체명은 밝히지 않고 공개 자료의 유형만 표시했습니다. 포함 범위가 업체마다 달라 참고용으로 보시면 됩니다.' })}<div class="why">${marketChart()}${structureTable()}</div></div></section>
<section class="sec" id="simulator"><div class="wrap">${sectionHead({ eyebrow: 'SIMULATOR', title: '검색광고비와 AI 검색 관리비 비교', lead: '업종과 월 클릭 수를 바꿔 보세요.' })}${cpcCalculator()}</div></section>
<section class="sec sec--gray" id="checklist"><div class="wrap">${sectionHead({ eyebrow: 'CHECKLIST', title: '어느 대행사와 계약하든<br>먼저 확인할 여섯 가지', lead: '미래애드원 견적서에는 이 여섯 가지가 모두 들어 있습니다.' })}${checklist()}</div></section>
<section class="sec"><div class="wrap wrap--narrow">${sectionHead({ eyebrow: 'FAQ', title: '가격·계약 질문', center: true })}${faqBlock(faqs, { chips: false, idp: 'pf' })}</div></section>
${ctaBand(R)}`;
  return {
    path: p, html: page({
      R, current: 'pricing/', title: SEO.pricing.title, kw: SEO.pricing.kw, desc: SEO.pricing.desc, canonical: url(p),
      jsonld: [{ '@context': 'https://schema.org', '@graph': [crumbs([['홈', SITE], ['가격', url(p)]]), faqLD(faqs)] }], body,
    }),
  };
}

// ═════════ 포트폴리오
export function portfolio() {
  const p = 'portfolio/', R = depthR(p);
  const body = `
${pageHero({ R, eyebrow: 'PORTFOLIO', title: '말보다 결과물로<br>보여 드립니다', lead: `블로그 운영 성과, 블로그 스킨, 홈페이지, 바이럴, 검색광고, SNS까지 ${PORTFOLIO.length}개의 작업 사례를 분류해 정리했습니다.`, crumbs: crumbNav(R, [['홈', ''], ['포트폴리오', p]]), ctas: quoteBtn('비슷한 작업 상담') })}
<section class="sec"><div class="wrap">${portfolioGrid(R, PORTFOLIO, { group: 'pf' })}</div></section>
${logosMarquee(R)}
${ctaBand(R)}`;
  return { path: p, html: page({ R, current: 'portfolio/', title: T('포트폴리오'), desc: '홈페이지 제작 35건, 블로그 스킨 14건, 블로그 운영 통계, 바이럴·검색광고·SNS 운영 사례를 업종별로 확인하세요.', canonical: url(p), jsonld: [{ '@context': 'https://schema.org', '@graph': [crumbs([['홈', SITE], ['포트폴리오', url(p)]])] }], body }) };
}

// ═════════ 고객 후기
export function reviews() {
  const p = 'reviews/', R = depthR(p);
  const body = `
${pageHero({ R, eyebrow: 'CLIENT RECORDS', title: '직접 경험한 분들의<br>기록입니다', lead: '포장된 후기 문장 대신 실제로 주고받은 운영 기록을 보여 드립니다. 이름과 프로필은 원본에서 흐림 처리되어 있습니다.', crumbs: crumbNav(R, [['홈', ''], ['고객 후기', p]]), ctas: quoteBtn('상담 신청') })}
<section class="sec"><div class="wrap">${sectionHead({ eyebrow: 'KAKAOTALK', title: '카카오톡 운영 기록', lead: '2024년 1월, 블로그 관리 고객들과 나눈 대화입니다. 이미지를 누르면 원본 크기로 볼 수 있습니다.' })}<div class="rvgrid">${reviewCards(R)}</div></div></section>
<section class="sec sec--gray"><div class="wrap">${sectionHead({ eyebrow: 'RESULTS', title: '관리 블로그 통계 화면', lead: '네이버 블로그 관리자 통계를 그대로 옮겼습니다. 업종과 시기가 달라 숫자를 서로 비교하기보다 꾸준한 추이를 봐 주세요.' })}${blogStatsStrip(R, 8)}</div></section>
${logosMarquee(R)}
<section class="sec"><div class="wrap wrap--narrow"><div class="notice" data-reveal><h2>후기 게시 원칙</h2><ul><li>고객의 상호·로고·후기는 공개 동의를 받은 것만 게시합니다.</li><li>대가를 주고 쓴 후기나 꾸민 후기를 싣지 않습니다.</li><li>성과 수치는 보고 당시 화면 그대로 보여 드리며, 같은 결과를 약속하지 않습니다.</li></ul></div></div></section>
${ctaBand(R)}`;
  return { path: p, html: page({ R, current: 'reviews/', title: T('고객 후기·운영 기록'), desc: '미래애드원이 블로그 관리 고객과 주고받은 실제 카카오톡 운영 기록과 관리 블로그 통계 화면, 협력 기업·기관을 확인하세요.', canonical: url(p), jsonld: [{ '@context': 'https://schema.org', '@graph': [crumbs([['홈', SITE], ['고객 후기', url(p)]])] }], body }) };
}

// ═════════ FAQ
export function faqPage() {
  const p = 'faq/', R = depthR(p);
  const all = [...FAQ, ...BLOG_FAQ.map(([q, a]) => ({ c: '운영', q, a }))];
  const body = `
${pageHero({ R, eyebrow: 'FAQ', title: '질문이 있으세요?<br>바로 답합니다', lead: '운영·가격·AI 검색·계약에 관한 질문을 모았습니다. 검색창에 단어를 넣으면 바로 찾을 수 있습니다.', crumbs: crumbNav(R, [['홈', ''], ['자주 묻는 질문', p]]) })}
<section class="sec"><div class="wrap wrap--narrow">${faqBlock(all, { idp: 'fq', search: true })}</div></section>
${ctaBand(R, { title: '찾는 답이 없다면 직접 물어보세요' })}`;
  return { path: p, html: page({ R, current: '', title: T('자주 묻는 질문'), desc: '블로그 관리대행 가격·VAT, 발행 전 확인, AI 검색 노출 보장 여부, 계약·보고 방식 등 미래애드원에 자주 묻는 질문을 정리했습니다.', canonical: url(p), jsonld: [{ '@context': 'https://schema.org', '@graph': [crumbs([['홈', SITE], ['자주 묻는 질문', url(p)]]), faqLD(all)] }], body }) };
}

// ═════════ 상담 신청
export function contact() {
  const p = 'contact/', R = depthR(p);
  const body = `
${pageHero({ R, eyebrow: 'CONTACT', title: '대표님의 사업,<br>먼저 듣겠습니다', lead: '상담 신청서를 남기시면 담당자가 확인 후 연락드립니다. 급하시면 전화나 카카오톡이 빠릅니다.', crumbs: crumbNav(R, [['홈', ''], ['상담 신청', p]]) })}
<section class="sec"><div class="wrap contact">
  <div class="contact__form glass glass--light" data-reveal><h2 class="h2s">상담 신청서</h2>${quoteForm('cf', R)}</div>
  <aside class="contact__side">
    <a class="cmeth" href="tel:${COMPANY.phone}" data-track="tel">${icon('phone')}<div><b>전화 상담</b><span>${COMPANY.phone}</span></div></a>
    <button class="cmeth" type="button" data-copy="${COMPANY.phone}">${icon('copy')}<div><b>번호 복사</b><span>나중에 전화하실 때</span></div></button>
    <a class="cmeth" href="${COMPANY.kakao}" target="_blank" rel="noopener" data-track="kakao">${icon('chat')}<div><b>카카오톡 오픈채팅</b><span>사진·자료를 바로 보내실 때</span></div></a>
    <a class="cmeth" href="${COMPANY.brochure}" target="_blank" rel="noopener">${icon('download')}<div><b>회사소개서</b><span>내부 검토용 자료</span></div></a>
    <div class="cinfo"><p>${COMPANY.address}</p><p>사업자등록번호 ${COMPANY.bizNo}</p></div>
  </aside>
</div></section>
<section class="sec sec--gray"><div class="wrap">${sectionHead({ eyebrow: 'AFTER', title: '신청 후에는 이렇게 진행됩니다' })}${processSteps()}</div></section>`;
  return { path: p, html: page({ R, current: '', title: T('상담 신청'), desc: '업종·지역·관심 서비스를 남기시면 미래애드원 담당자가 연락드립니다. 전화 02-6481-6603, 카카오톡 상담도 가능합니다.', canonical: url(p), jsonld: [{ '@context': 'https://schema.org', '@graph': [crumbs([['홈', SITE], ['상담 신청', url(p)]]), { '@type': 'ContactPage', url: url(p), about: { '@id': SITE + '#org' } }] }], body }) };
}

// ═════════ 개인정보처리방침
export function privacy() {
  const p = 'privacy/', R = depthR(p);
  const rows = [
    ['1. 수집 항목', '필수: 이름 또는 업체명, 연락처 / 선택: 업종, 지역, 관심 서비스, 월 광고 예산, 현재 사이트·블로그 주소, 문의 내용 / 자동 수집: 유입 경로(광고 파라미터, 이전 페이지 주소), 접속 기기 종류'],
    ['2. 수집·이용 목적', '상담 신청 확인과 응대, 견적 안내, 서비스 제안'],
    ['3. 보유·이용 기간', '상담 종료 후 1년간 보관 후 파기합니다. 계약이 체결된 경우 관계 법령(전자상거래법 등)에서 정한 기간 동안 보관합니다.'],
    ['4. 처리 위탁', '상담 신청 내용은 Google Workspace(구글 시트·메일)에 저장·전달될 수 있습니다.'],
    ['5. 제3자 제공', '법령에 근거한 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.'],
    ['6. 정보주체의 권리', '언제든지 개인정보 열람·정정·삭제·처리정지를 요청할 수 있으며, 대표번호로 요청하시면 지체 없이 조치합니다.'],
    ['7. 파기 절차', '보유 기간이 지난 정보는 지체 없이 복구할 수 없는 방법으로 삭제합니다.'],
    ['8. 개인정보 보호책임자', `${COMPANY.name} 대표 ${COMPANY.ceo} · ${COMPANY.phone}`],
  ];
  const body = `
${pageHero({ R, eyebrow: 'PRIVACY', title: '개인정보처리방침', lead: `${COMPANY.name}는 상담 신청에 필요한 최소한의 정보만 수집합니다.`, crumbs: crumbNav(R, [['홈', ''], ['개인정보처리방침', p]]) })}
<section class="sec"><div class="wrap wrap--narrow"><table class="tbl tbl--info"><tbody>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table><p class="small">시행일: 2026년 10월 19일</p></div></section>`;
  return { path: p, html: page({ R, title: T('개인정보처리방침'), desc: '미래애드원 홈페이지 상담 신청 시 수집하는 개인정보 항목, 이용 목적, 보유 기간을 안내합니다.', canonical: url(p), body }) };
}

export function notFound() {
  const R = '/';
  const body = `<section class="phero phero--dark nf"><div class="phero__bg" aria-hidden="true"><span class="orb orb--a"></span><span class="orb orb--b"></span><span class="grid-lines"></span></div><div class="wrap phero__in"><div class="phero__txt"><p class="eyebrow">404</p><h1>찾으시는 페이지가 없습니다</h1><p class="phero__lead">주소가 바뀌었거나 삭제된 페이지입니다.</p><div class="btns"><a class="btn btn--accent" href="${SITE}">홈으로</a><a class="btn btn--glass" href="${SITE}services/">서비스 보기</a></div></div></div></section>`;
  return { path: '404.html', file: true, html: page({ R: '', title: T('페이지를 찾을 수 없습니다'), desc: '요청하신 페이지를 찾을 수 없습니다.', canonical: SITE, body }).replace('<head>', '<head>\n<base href="{BASE}">') };
}

// ═════════ 인사이트(블로그)
export function insightsIndex(posts) {
  const p = 'insights/', R = depthR(p);
  const [first, ...rest] = posts;
  const PER = 9;
  const body = `
${pageHero({ R, eyebrow: 'INSIGHTS', title: '광고주가 알아야 할<br>마케팅 실무 노트', lead: '블로그·AI 검색·검색광고·홈페이지 운영에서 실제로 묻는 질문에 답합니다. 매일 새 글이 올라옵니다.', crumbs: crumbNav(R, [['홈', ''], ['인사이트', p]]), ctas: `<a class="btn btn--glass" href="${R}insights/feed.xml">RSS 구독</a>` })}
<section class="sec">
  <div class="wrap">
    ${first ? `<div class="pfeat">${postCard(R, first, { big: true })}</div>` : '<p class="center">첫 글을 준비하고 있습니다.</p>'}
    <div class="ins-tools"><div class="fchips fchips--scroll" role="group" aria-label="글 분류" data-ins-cats><button type="button" class="is-on" data-cat="">전체 <small>${posts.length}</small></button>${BLOG_CATEGORIES.filter(c => posts.some(x => x.category === c)).map(c => `<button type="button" data-cat="${c}">${c} <small>${posts.filter(x => x.category === c).length}</small></button>`).join('')}</div>
    <label class="faq__search">${icon('search')}<input type="search" placeholder="글 검색" data-ins-q aria-label="글 검색"></label></div>
    <div class="pgrid" data-ins-grid data-per="${PER}">${rest.slice(0, PER).map(x => postCard(R, x)).join('')}</div>
    <p class="center" data-ins-empty hidden>조건에 맞는 글이 없습니다.</p>
    <div class="center"><button class="btn btn--line" type="button" data-ins-more${rest.length > PER ? '' : ' hidden'}>더 보기</button></div>
  </div>
</section>
${ctaBand(R, { title: '글로 다 못 한 이야기는 상담에서 드립니다' })}`;
  return {
    path: p, html: page({
      R, current: 'insights/', title: T('인사이트 — 마케팅 실무 노트'), desc: '브랜드 블로그, AI 검색 최적화(GEO), 네이버 검색광고·플레이스, 홈페이지 운영에 관한 미래애드원 마케팅팀의 실무 글.', canonical: url(p),
      jsonld: [{ '@context': 'https://schema.org', '@graph': [crumbs([['홈', SITE], ['인사이트', url(p)]]), { '@type': 'Blog', '@id': url(p) + '#blog', name: '미래애드원 인사이트', url: url(p), inLanguage: 'ko-KR', publisher: { '@id': SITE + '#org' }, blogPost: posts.slice(0, 30).map(x => ({ '@type': 'BlogPosting', headline: x.title, url: url(`insights/${x.slug}/`), datePublished: x.date, ...(x.thumb ? { image: SITE + 'assets/img/' + x.thumb } : {}) })) }] }], body,
    }),
  };
}

export function insightPost(x, posts) {
  const p = `insights/${x.slug}/`, R = depthR(p);
  const i = posts.indexOf(x), prev = posts[i + 1], next = posts[i - 1];
  const related = posts.filter(y => y !== x && (y.category === x.category || y.service === x.service)).slice(0, 3);
  const s = x.service ? svc(x.service) : null;
  const body = `
<article class="post">
  <header class="post__hero"><div class="phero__bg" aria-hidden="true"><span class="orb orb--a"></span><span class="grid-lines"></span></div><div class="wrap wrap--post">${crumbNav(R, [['홈', ''], ['인사이트', 'insights/'], [x.category, 'insights/']])}<p class="eyebrow">${esc(x.category)}</p><h1>${esc(x.title)}</h1><p class="post__desc">${esc(x.description)}</p><p class="post__meta"><span>${esc(x.author || BLOG_AUTHOR)}</span><time datetime="${x.date}">${x.date.replace(/-/g, '.')}</time><span>${x.minutes}분 읽기</span></p></div></header>
  <div class="wrap post__grid">
    ${x.toc.length > 2 ? `<nav class="post__toc" aria-label="목차"><p>목차</p><ol>${x.toc.map(t => `<li><a href="#${t.id}">${esc(t.t)}</a></li>`).join('')}</ol></nav>` : '<div></div>'}
    <div class="post__body prose">${x.thumb ? `<figure class="post__thumb">${img(R, x.thumb, `${x.category} — ${x.coverText}`, { eager: true })}</figure>` : ''}${x.html}
      ${x.faq.length ? `<h2 id="post-faq">자주 묻는 질문</h2>${faqList(x.faq.map(f => ({ q: f.q, a: f.a })), { idp: 'pq' })}` : ''}
      ${s ? `<aside class="post__cta glass glass--light"><p class="eyebrow">관련 서비스</p><h3>${esc(s.name)}</h3><p>${esc(s.copy)}</p><div class="btns"><a class="btn btn--primary btn--sm" href="${R}services/${s.slug}/">서비스 보기</a><button class="btn btn--accent btn--sm" type="button" data-quote data-service="${s.slug}">상담 신청</button></div></aside>` : ''}
      <div class="post__share"><button class="btn btn--line btn--sm" type="button" data-copy-url>${icon('copy')} 링크 복사</button>${x.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>
      <nav class="post__nav" aria-label="이전·다음 글">${prev ? `<a href="${R}insights/${prev.slug}/"><small>이전 글</small>${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="${R}insights/${next.slug}/" class="is-next"><small>다음 글</small>${esc(next.title)}</a>` : '<span></span>'}</nav>
    </div>
  </div>
</article>
${related.length ? `<section class="sec sec--gray"><div class="wrap">${sectionHead({ eyebrow: 'MORE', title: '함께 읽으면 좋은 글' })}<div class="pgrid">${related.map(y => postCard(R, y)).join('')}</div></div></section>` : ''}
${ctaBand(R, { svc: x.service || '' })}`;
  const ldPost = { '@type': 'BlogPosting', headline: x.title, description: x.description, datePublished: x.date, dateModified: x.updated || x.date, author: { '@type': 'Organization', name: x.author || BLOG_AUTHOR, url: SITE }, publisher: { '@id': SITE + '#org' }, mainEntityOfPage: url(p), inLanguage: 'ko-KR', keywords: x.tags.join(', '), articleSection: x.category, image: SITE + 'assets/img/' + (x.thumb || 'og.jpg') };
  return { path: p, html: page({ R, current: 'insights/', title: T(x.title), desc: x.description, canonical: url(p), bodyClass: 'is-post', og: x.thumb || 'og.jpg', jsonld: [{ '@context': 'https://schema.org', '@graph': [ldPost, crumbs([['홈', SITE], ['인사이트', url('insights/')], [x.title, url(p)]]), ...(x.faq.length ? [faqLD(x.faq.map(f => ({ q: f.q, a: f.a })))] : []), ORG] }], body }) };
}
