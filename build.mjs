// 미래애드원 사이트 정적 빌드: src/data.mjs + src/pages.mjs + content/blog/*.md → 카테고리별 페이지(디렉터리/index.html)
// 실행: node build.mjs        (내용 수정은 src/data.mjs, 글은 content/blog/*.md)
// 환경변수 BASE: 404 페이지 <base> 주소(기본 '/'). 미리보기 배포에서는 export-site.mjs 가 바꾼다.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as D from './src/data.mjs';
import * as PG from './src/pages.mjs';
import { ROOT } from './src/lib.mjs';
import { loadPosts } from './tools/blog/lib.mjs';

const { SITE, COMPANY, SERVICES, INDUSTRIES, BLOG_CATEGORIES, BLOG_PLANS, WEB_AI_PLAN, PRICE_SHOW_WEB_AI, CPC, FAQ, SEO, KEYWORD_LINKS } = D;
const wr = (rel, s) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());

// 1) 이전 빌드 결과 지우기 (소스·에셋은 건드리지 않음)
const GENERATED_DIRS = ['about', 'services', 'industries', 'pricing', 'portfolio', 'reviews', 'faq', 'contact', 'privacy', 'insights'];
const GENERATED_FILES = ['index.html', '404.html', 'sitemap.xml', 'robots.txt', 'llms.txt', 'assets/js/data.js'];
for (const d of GENERATED_DIRS) fs.rmSync(path.join(ROOT, d), { recursive: true, force: true });
for (const f of GENERATED_FILES) fs.rmSync(path.join(ROOT, f), { force: true });

// 2) 글
const catIndex = c => Math.max(0, BLOG_CATEGORIES.indexOf(c));
// 썸네일: tools/thumbs/build_thumbs.py 가 만든 assets/img/insights/<slug>.jpg (없으면 CSS 표지로 대신 — 빌드 전에 썸네일 생성기를 먼저 돌린다)
const thumbOf = slug => fs.existsSync(path.join(ROOT, 'assets/img/insights', slug + '.jpg')) ? `insights/${slug}.jpg` : null;
const POSTS = loadPosts(path.join(ROOT, 'content/blog'), { R: '../../', today }).map(p => ({ ...p, coverKey: catIndex(p.category), coverText: p.cover || p.title, thumb: thumbOf(p.slug) }));
const noThumb = POSTS.filter(p => !p.thumb).map(p => p.slug);
if (noThumb.length) console.warn(`경고: 썸네일 없음 ${noThumb.length}편 (python tools/thumbs/build_thumbs.py 먼저 실행): ${noThumb.join(', ')}`);
for (const p of POSTS) {
  if (!BLOG_CATEGORIES.includes(p.category)) console.warn(`경고: ${p.file} 카테고리 '${p.category}' 가 목록에 없음`);
  if (p.service && !SERVICES.some(s => s.slug === p.service)) console.warn(`경고: ${p.file} service '${p.service}' 없음`);
}

// 3) 페이지
const pages = [
  PG.home(POSTS), PG.about(), PG.servicesIndex(), ...SERVICES.map(s => PG.serviceDetail(s, POSTS)),
  PG.industriesIndex(), ...INDUSTRIES.map(PG.industryDetail), PG.pricing(), PG.portfolio(), PG.reviews(), PG.faqPage(), PG.contact(), PG.privacy(),
  PG.insightsIndex(POSTS), ...POSTS.map(p => PG.insightPost(p, POSTS)), PG.notFound(),
];
const V = crypto.createHash('md5').update(['assets/css/style.css', 'assets/js/app.js', 'assets/js/config.js'].map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('') + today).digest('hex').slice(0, 8);
for (const pg of pages) {
  const html = pg.html.replaceAll('{V}', V).replaceAll('{BASE}', process.env.BASE || '/');
  wr(pg.file ? pg.path : `${pg.path}index.html`, html);
}

// 4) 브라우저용 데이터
const client = {
  services: SERVICES.map(s => ({ slug: s.slug, name: s.name, short: s.short })),
  cpc: CPC.rows, operate: PRICE_SHOW_WEB_AI ? WEB_AI_PLAN.operate.price : null,
  posts: POSTS.map(p => ({ slug: p.slug, title: p.title, date: p.date, category: p.category, minutes: p.minutes, coverKey: p.coverKey, coverText: p.coverText, d: p.description, thumb: p.thumb })),
};
wr('assets/js/data.js', `/* 빌드 생성 파일 — 수정은 src/data.mjs */\nwindow.MA=${JSON.stringify(client)};\n`);

// 5) 인사이트 RSS
const rssDate = (d, t) => new Date(`${d}T${t || '09:00'}:00+09:00`).toUTCString();
const x = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
wr('insights/feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>미래애드원 인사이트</title><link>${SITE}insights/</link><description>블로그·AI 검색·검색광고·홈페이지 운영 실무 노트</description><language>ko</language>
${POSTS.slice(0, 50).map(p => `<item><title>${x(p.title)}</title><link>${SITE}insights/${p.slug}/</link><guid>${SITE}insights/${p.slug}/</guid><category>${x(p.category)}</category><pubDate>${rssDate(p.date, p.time)}</pubDate><description>${x(p.description)}</description></item>`).join('\n')}
</channel></rss>
`);

// 6) sitemap / robots / llms.txt
const urls = pages.filter(p => !p.file).map(p => ({ loc: SITE + p.path, lastmod: p.path.startsWith('insights/') && p.path !== 'insights/' ? (POSTS.find(q => p.path === `insights/${q.slug}/`)?.updated || POSTS.find(q => p.path === `insights/${q.slug}/`)?.date || today) : today }));
wr('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`);
wr('robots.txt', `User-agent: *\nAllow: /\n\n# AI 검색·답변 서비스 크롤러도 공개 페이지 접근 허용\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Yeti\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
const won = n => n.toLocaleString('ko-KR') + '원';
wr('llms.txt', `# ${COMPANY.name} (${COMPANY.nameEn})

> 미래애드원은 상주 작가·디자이너·마케터가 직접 만드는 블로그관리대행(브랜드 블로그 운영대행), 홈페이지 제작, AEO·GEO 마케팅(AI 검색 최적화), 네이버 블로그 광고·검색광고·플레이스, 바이럴 마케팅, SNS 등 18개 서비스를 운영하는 서울 송파구의 온라인광고대행사입니다. 슬로건: ${COMPANY.slogan}

## 회사 정보
- 상호: ${COMPANY.name} / 대표: ${COMPANY.ceo} / 사업자등록번호: ${COMPANY.bizNo}
- 주소: ${COMPANY.address}
- 대표번호: ${COMPANY.phone}
- 운영 방식: 1개 업체를 작가·디자이너·마케터 3인이 전담, 발행 전 원고·디자인 확인, 전용 단톡방, 1~2주 단위·월간 보고
- 대표자는 광고업과 별도로 식자재 유통 사업을 운영합니다(미래애드원 법인 사업 아님).

## 공개 가격 (모두 부가세 별도, ${today} 기준)
${BLOG_PLANS.map(p => `- 브랜드 블로그 ${p.name}: 월 ${p.count}회 ${won(p.price)} (1회당 ${won(Math.round(p.price / p.count))})`).join('\n')}
${PRICE_SHOW_WEB_AI ? `- 홈페이지 + AI 검색 ${WEB_AI_PLAN.build.name}: ${won(WEB_AI_PLAN.build.price)} (1개월 차)\n- ${WEB_AI_PLAN.operate.name}: 월 ${won(WEB_AI_PLAN.operate.price)} (2개월 차부터)` : '- 홈페이지 + AI 검색: 상담 후 견적'}
- 네이버 검색광고: 매체비와 운영 수수료 분리 안내. 그 밖의 서비스는 상담 후 견적.
- AI 검색·검색 노출은 최적화 작업과 리포트를 제공하며 특정 순위·노출을 보장하지 않습니다.

## 이런 검색어에 답하는 페이지
${KEYWORD_LINKS.map(([t, h]) => `- ${t}: ${SITE}${h}`).join('\n')}
- 홈페이지 제작·병원 홈페이지: ${SITE}services/website/ · ${SITE}industries/medical/
- 블로그운영대행·블로그광고대행·블로그 홍보: ${SITE}services/brand-blog/ · ${SITE}services/blog-viral/

## 주요 페이지
- [서비스 전체](${SITE}services/)
${SERVICES.map(s => `- [${s.name}](${SITE}services/${s.slug}/): ${s.copy}`).join('\n')}
- [가격 안내](${SITE}pricing/)
- [업종별 솔루션](${SITE}industries/)
${INDUSTRIES.map(x => `- [${(SEO[x.slug] && SEO[x.slug].h1) || x.name + ' 마케팅'}](${SITE}industries/${x.slug}/)`).join('\n')}
- [포트폴리오](${SITE}portfolio/)
- [고객 후기·운영 기록](${SITE}reviews/)
- [회사소개](${SITE}about/)
- [자주 묻는 질문](${SITE}faq/)
- [상담 신청](${SITE}contact/)

## 자주 묻는 질문
${FAQ.slice(0, 16).map(f => `- ${f.q} ${f.a}`).join('\n')}

## 최근 인사이트
${POSTS.slice(0, 15).map(p => `- [${p.title}](${SITE}insights/${p.slug}/): ${p.description}`).join('\n') || '- 준비 중'}
`);

console.log(`built ${pages.length} pages (posts ${POSTS.length}) · v=${V}`);
