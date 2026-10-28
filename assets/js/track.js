/* =========================================================
   방문·전환 추적 — 아이디는 assets/js/config.js 에서만 넣는다
   - CFG.TRACK_HOSTS(운영 주소)에서만 외부 스크립트를 불러온다. 미리보기에서 시험: ?track=on (끄기 ?track=off, 탭을 닫을 때까지 유지)
   - window.maTrack(이름, 값) 하나로 GTM(dataLayer)·GA4·Google Ads·네이버·메타·카카오·Clarity 에 나눠 보낸다
   - 이름·연락처 등 상담 내용은 어떤 도구에도 보내지 않는다
   ========================================================= */
(() => {
  const CFG = window.MA_CONFIG || {};
  const qs = new URLSearchParams(location.search).get('track');
  let force = qs;
  try { if (qs) sessionStorage.setItem('ma_track', qs); else force = sessionStorage.getItem('ma_track'); } catch { /* 저장소 차단 환경 */ }
  const ON = force === 'on' || (force !== 'off' && (CFG.TRACK_HOSTS || []).includes(location.hostname));
  const DOMAIN = location.hostname.replace(/^www\./, ''); // 네이버 inflow 는 1차 도메인
  const load = (src, onload) => { const s = document.createElement('script'); s.async = true; s.src = src; if (onload) s.onload = onload; document.head.appendChild(s); };
  window.dataLayer = window.dataLayer || [];

  if (ON) {
    if (CFG.GTM_ID) { dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' }); load(`https://www.googletagmanager.com/gtm.js?id=${CFG.GTM_ID}`); }
    const gIds = [CFG.GA4_ID, CFG.GOOGLE_ADS_ID].filter(Boolean);
    if (gIds.length) {
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date()); gIds.forEach(id => gtag('config', id));
      load(`https://www.googletagmanager.com/gtag/js?id=${gIds[0]}`);
    }
    const naver = [CFG.NAVER_ANALYTICS_ID, CFG.NAVER_WCS_ID].filter(Boolean);
    if (naver.length) load('https://wcs.naver.net/wcslog.js', () => naver.forEach(wa => { window.wcs_add = { wa }; try { wcs.inflow(DOMAIN); wcs_do(); } catch { } }));
    if (CFG.CLARITY_ID) { window.clarity = window.clarity || function () { (clarity.q = clarity.q || []).push(arguments); }; load(`https://www.clarity.ms/tag/${CFG.CLARITY_ID}`); }
    if (CFG.META_PIXEL_ID && !window.fbq) {
      const n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      window._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      load('https://connect.facebook.net/en_US/fbevents.js'); fbq('init', CFG.META_PIXEL_ID); fbq('track', 'PageView');
    }
    if (CFG.KAKAO_PIXEL_ID) load('https://t1.daumcdn.net/kas/static/kp.js', () => { try { kakaoPixel(CFG.KAKAO_PIXEL_ID).pageView(); } catch { } });
  }

  // 이벤트 보내기. generate_lead = 실제 접수(LEAD_ENDPOINT 저장 성공)만 — 광고 전환으로도 보낸다
  function maTrack(name, params = {}) {
    const p = { page_path: location.pathname, ...params };
    dataLayer.push({ event: name, ...p }); // GTM 맞춤 이벤트 트리거용(이름 그대로)
    if (force === 'on') console.info('[track]', name, p);
    if (!ON) return;
    const lead = name === 'generate_lead', contact = name === 'click_tel' || name === 'click_kakao';
    try { window.gtag?.('event', name, p); } catch { }
    try { window.clarity?.('event', name); } catch { }
    try { if (lead && CFG.GOOGLE_ADS_ID && CFG.GOOGLE_ADS_LEAD_LABEL) gtag('event', 'conversion', { send_to: `${CFG.GOOGLE_ADS_ID}/${CFG.GOOGLE_ADS_LEAD_LABEL}` }); } catch { }
    try { if ((lead || contact) && CFG.NAVER_WCS_ID && window.wcs) { window.wcs_add = { wa: CFG.NAVER_WCS_ID }; wcs.trans({ type: lead ? 'lead' : name === 'click_tel' ? 'custom001' : 'custom002' }); } } catch { }
    try { if ((lead || contact) && window.fbq) fbq('track', lead ? 'Lead' : 'Contact'); } catch { }
    try { if (lead && CFG.KAKAO_PIXEL_ID && window.kakaoPixel) kakaoPixel(CFG.KAKAO_PIXEL_ID).participation(); } catch { }
  }
  window.maTrack = maTrack;

  // 클릭: 전화·카카오톡·상담 열기·상담 페이지로 가는 버튼
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href], button, [data-track]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const at = a.closest('.dock') ? 'dock' : a.closest('.drawer') ? 'drawer' : a.closest('header') ? 'header' : a.closest('footer') ? 'footer' : a.closest('section[id]')?.id || 'body';
    if (a.dataset.track === 'tel' || href.startsWith('tel:')) return maTrack('click_tel', { location: at });
    if (a.dataset.track === 'kakao' || /open\.kakao\.com|pf\.kakao\.com/.test(href)) return maTrack('click_kakao', { location: at });
    if (a.matches('[data-quote], [data-drawer-open="quote"]')) return maTrack('open_quote', { location: at, service: a.dataset.service || '' });
    if (/(^|\/)contact\/(\?|$)/.test(href)) return maTrack('click_contact', { location: at });
  }, true);

  // 스크롤 깊이 25·50·75·100% (페이지마다 한 번씩)
  const marks = [25, 50, 75, 100], seen = new Set();
  addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - innerHeight; if (h < 400) return;
    const pct = (scrollY / h) * 100;
    for (const m of marks) if (pct >= m - 1 && !seen.has(m)) { seen.add(m); maTrack('scroll_depth', { percent: m }); }
  }, { passive: true });
})();
