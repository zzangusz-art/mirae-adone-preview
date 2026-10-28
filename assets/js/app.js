/* =========================================================
   미래애드원 — 인터랙션 (의존성 없음)
   헤더·메가메뉴 / 드로어 / 모달·라이트박스 / 토스트 / 스켈레톤 / 아코디언 / 탭 / 캐러셀
   스크롤 시퀀스 / 단어 하이라이트 / 가격 토글 / 비용 계산기 / 포트폴리오 필터 / 상담 폼
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CFG = window.MA_CONFIG || {}, DATA = window.MA || {}, ROOT = window.MA_ROOT || '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  html.classList.add('js');
  const won = n => Math.round(n).toLocaleString('ko-KR') + '원';
  const man = n => (n >= 10000 && n % 10000 === 0) ? (n / 10000).toLocaleString('ko-KR') + '만원' : won(n);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = id => `<svg class="i" aria-hidden="true"><use href="#i-${id}"/></svg>`;

  // 리퀴드 글래스 굴절(SVG 필터)은 데스크톱 크로미움에서만 켠다
  const brands = (navigator.userAgentData && navigator.userAgentData.brands || []).map(b => b.brand).join(' ');
  if (/Chromium|Google Chrome|Microsoft Edge/.test(brands) && !navigator.userAgentData.mobile && !reduce) html.classList.add('lg-refract');

  /* ───────── 토스트 */
  const toastBox = $('#toasts');
  function toast(msg, type = 'ok', ms = 2800) {
    if (!toastBox) return;
    const t = document.createElement('div');
    t.className = `toast${type === 'err' ? ' toast--err' : ''}`;
    t.innerHTML = `${icon(type === 'err' ? 'close' : 'check')}<span>${esc(msg)}</span>`;
    toastBox.appendChild(t);
    while (toastBox.children.length > 3) toastBox.firstChild.remove();
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 320); }, ms);
  }
  window.MAtoast = toast;

  /* ───────── 스크롤 잠금 · 포커스 가두기 */
  let locks = 0;
  const lock = on => {
    locks = Math.max(0, locks + (on ? 1 : -1));
    document.body.style.overflow = locks ? 'hidden' : '';
    $('.dock')?.classList.toggle('is-hide', !!locks);
  };
  const focusables = el => $$('a[href],button:not([disabled]),input:not([disabled]):not(.hp),select,textarea,[tabindex]:not([tabindex="-1"])', el).filter(x => x.offsetParent !== null);
  function trap(e, el) {
    if (e.key !== 'Tab') return;
    const f = focusables(el); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ───────── 이미지 스켈레톤 */
  const loaded = img => img.closest('.sk')?.classList.add('is-loaded');
  function wireSkeletons(root = document) {
    $$('.sk img', root).forEach(img => {
      if (img.complete && img.naturalWidth) loaded(img);
      else { img.addEventListener('load', () => loaded(img), { once: true }); img.addEventListener('error', () => loaded(img), { once: true }); }
    });
  }
  wireSkeletons();

  /* ───────── 등장 애니메이션 · 숫자 */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }), { rootMargin: matchMedia('(max-width:1023px)').matches ? '35% 0px 35% 0px' : '0px 0px -8% 0px', threshold: 0 });
  // 뒤로 가기·새로고침으로 중간에서 시작하면 위쪽 섹션은 애니메이션 없이 바로 보이게(올릴 때 하나씩 늦게 나타나는 문제 방지)
  const revealEls = $$('[data-reveal],[data-bars],[data-draw],.tl');
  html.classList.add('no-anim');
  revealEls.forEach(el => { if (el.getBoundingClientRect().bottom < 0) el.classList.add('is-in'); else io.observe(el); });
  requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove('no-anim')));
  // 브라우저가 스크롤 위치를 로드 뒤에 복원하는 경우(뒤로 가기·새로고침)를 위해 한 번 더
  const markAbove = () => {
    const above = revealEls.filter(el => !el.classList.contains('is-in') && el.getBoundingClientRect().bottom < 0);
    if (!above.length) return;
    html.classList.add('no-anim'); above.forEach(el => { el.classList.add('is-in'); io.unobserve(el); });
    requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove('no-anim')));
  };
  addEventListener('load', () => setTimeout(markAbove, 60));
  addEventListener('pageshow', e => { if (e.persisted) markAbove(); });
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = +el.dataset.count; countIO.unobserve(el);
    if (reduce) return;
    const t0 = performance.now(), dur = 1400;
    const step = t => { const k = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = v.toLocaleString('ko-KR'); if (k < 1) requestAnimationFrame(step); };
    el.textContent = '0'; requestAnimationFrame(step);
  }), { threshold: .5 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ───────── 글래스 하이라이트(포인터 따라 이동) */
  let gRAF = 0;
  document.addEventListener('pointermove', e => {
    if (gRAF || e.pointerType !== 'mouse') return;
    gRAF = requestAnimationFrame(() => {
      gRAF = 0;
      const g = e.target.closest && e.target.closest('.glass');
      if (!g) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
      g.style.setProperty('--my', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
    });
  }, { passive: true });

  /* ───────── 헤더 */
  const hd = $('[data-hd]');
  const darkTop = !!$('.hero, .phero--dark');
  if (!darkTop) hd?.classList.add('is-light');
  const totop = $('[data-totop]');
  // 헤더는 항상 고정(스크롤 방향에 따라 숨기지 않음) — 40px 이상 내리면 글래스 배경만 켠다
  function onScroll() {
    const y = scrollY;
    hd?.classList.toggle('is-solid', y > 40);
    totop?.classList.toggle('is-on', y > 900);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  totop?.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
  // 메가 메뉴: 터치 기기에서는 첫 탭에 열기
  $$('.has-mega').forEach(li => {
    const a = $('.gnb__link', li);
    a.addEventListener('click', e => {
      if (matchMedia('(hover: hover)').matches) return;
      if (!li.classList.contains('is-open')) { e.preventDefault(); li.classList.add('is-open'); a.setAttribute('aria-expanded', 'true'); }
    });
    li.addEventListener('mouseenter', () => a.setAttribute('aria-expanded', 'true'));
    li.addEventListener('mouseleave', () => { a.setAttribute('aria-expanded', 'false'); li.classList.remove('is-open'); });
    li.addEventListener('focusout', e => { if (!li.contains(e.relatedTarget)) { li.classList.remove('is-open'); a.setAttribute('aria-expanded', 'false'); } });
  });
  document.addEventListener('click', e => { if (!e.target.closest('.has-mega')) $$('.has-mega.is-open').forEach(li => li.classList.remove('is-open')); });

  /* ───────── 드로어 */
  let lastFocus = null;
  function openDrawer(name, opts = {}) {
    const d = $(`[data-drawer="${name}"]`); if (!d) return;
    lastFocus = document.activeElement;
    d.classList.add('is-open'); d.setAttribute('aria-hidden', 'false'); lock(true);
    if (name === 'quote') prefillForm($('#qd'), opts);
    setTimeout(() => (focusables($('.drawer__panel', d))[name === 'quote' ? 1 : 0] || $('.drawer__panel', d)).focus(), 60);
  }
  function closeDrawer(d) {
    if (!d || !d.classList.contains('is-open')) return;
    d.classList.remove('is-open'); d.setAttribute('aria-hidden', 'true'); lock(false);
    lastFocus?.focus?.();
  }
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-drawer-open]'); if (o) { e.preventDefault(); openDrawer(o.dataset.drawerOpen); return; }
    const q = e.target.closest('[data-quote]');
    if (q) {
      e.preventDefault();
      const navD = $('[data-drawer="nav"]'); if (navD?.classList.contains('is-open')) closeDrawer(navD);
      openDrawer('quote', { service: q.dataset.service, plan: q.dataset.plan });
      if (q.dataset.service) { const s = (DATA.services || []).find(x => x.slug === q.dataset.service); if (s) toast(`「${s.name}」을 선택해 두었습니다`); }
      return;
    }
    const c = e.target.closest('[data-drawer-close]'); if (c) closeDrawer(c.closest('.drawer'));
  });
  $$('.drawer').forEach(d => d.addEventListener('keydown', e => { if (e.key !== 'Escape') trap(e, $('.drawer__panel', d)); }));
  // Esc: 맨 위 레이어부터 닫기(포커스가 레이어 밖에 있어도 동작)
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('#modal')?.classList.contains('is-open')) return; // 모달은 자체 처리
    const d = $$('.drawer.is-open').pop(); if (d) closeDrawer(d);
  });
  // 바텀시트(모바일 상담 드로어): 손잡이·머리 부분을 아래로 끌어 닫기
  $$('[data-sheet-handle]').forEach(h => {
    const panel = h.closest('.drawer__panel'), d = h.closest('.drawer'), head = $('.drawer__head', panel);
    let y0 = null, dy = 0;
    const start = e => { if (innerWidth > 640) return; y0 = e.touches[0].clientY; dy = 0; panel.style.transition = 'none'; };
    const move = e => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); panel.style.transform = `translateY(${dy}px)`; };
    const end = () => { if (y0 === null) return; panel.style.transition = ''; panel.style.transform = ''; if (dy > 90) closeDrawer(d); y0 = null; };
    [h, head].forEach(el => { el.addEventListener('touchstart', start, { passive: true }); el.addEventListener('touchmove', move, { passive: true }); el.addEventListener('touchend', end); });
  });
  // 모바일 메뉴 링크를 누르면 닫기
  $$('.dnav a').forEach(a => a.addEventListener('click', () => closeDrawer(a.closest('.drawer'))));

  /* ───────── 모달 · 라이트박스 */
  const modal = $('#modal'), mBody = $('#modal-body'), mBox = $('.modal__box', modal);
  let lb = null;
  function openModal(content, { lightbox = false } = {}) {
    if (!modal) return;
    lastFocus = document.activeElement;
    mBody.innerHTML = '';
    if (typeof content === 'string') mBody.innerHTML = content; else mBody.appendChild(content);
    modal.classList.toggle('modal--lb', lightbox);
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); lock(true);
    wireSkeletons(mBody);
    setTimeout(() => $('.modal__x', modal).focus(), 50);
  }
  function closeModal() {
    if (!modal?.classList.contains('is-open')) return;
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); lock(false); lb = null;
    lastFocus?.focus?.();
  }
  modal?.addEventListener('click', e => { if (e.target.closest('[data-modal-close]')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal?.classList.contains('is-open') && !modal.contains(e.target)) closeModal(); });
  modal?.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); return; }
    if (lb && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); lbGo(e.key === 'ArrowRight' ? 1 : -1); }
    trap(e, mBox);
  });
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-modal]'); if (!m) return;
    e.preventDefault();
    const tpl = $(`#tpl-${m.dataset.modal}`); if (tpl) openModal(tpl.content.cloneNode(true));
  });
  function lbItems(group) {
    return $$(`[data-lightbox="${group}"]`).filter(b => !b.closest('.is-hide')).map(b => {
      const img = $('img', b), fig = b.closest('figure, article');
      const cap = fig?.querySelector('figcaption')?.textContent || fig?.querySelector('h3')?.textContent || img.alt;
      return { src: b.dataset.full || img.currentSrc || img.src, alt: img.alt, cap, w: b.dataset.w || img.getAttribute('width'), h: b.dataset.h || img.getAttribute('height'), btn: b };
    });
  }
  function lbRender() {
    const it = lb.items[lb.i];
    mBody.innerHTML = `<div class="lb"><h2 id="modal-title" class="sr" style="position:absolute;left:-9999px">${esc(it.cap)}</h2><div class="lb__stage"><span class="sk" style="aspect-ratio:${it.w}/${it.h};max-height:calc(100vh - 180px);width:auto;border-radius:10px"><img src="${it.src}" alt="${esc(it.alt)}" width="${it.w}" height="${it.h}"></span></div>
      <div class="lb__bar"><p class="lb__cap"><small>${lb.i + 1} / ${lb.items.length}</small>${esc(it.cap)}</p>${lb.items.length > 1 ? `<button class="iconbtn" type="button" data-lb="-1" aria-label="이전 이미지">${icon('left')}</button><button class="iconbtn" type="button" data-lb="1" aria-label="다음 이미지">${icon('right')}</button>` : ''}</div></div>`;
    wireSkeletons(mBody);
    const stage = $('.lb__stage', mBody); let sx = 0;
    stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) lbGo(dx < 0 ? 1 : -1); });
  }
  function lbGo(d) { if (!lb) return; lb.i = (lb.i + d + lb.items.length) % lb.items.length; lbRender(); }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-lightbox]');
    if (b) { e.preventDefault(); const items = lbItems(b.dataset.lightbox); lb = { items, i: Math.max(0, items.findIndex(x => x.btn === b)) }; openModal('', { lightbox: true }); lbRender(); return; }
    const n = e.target.closest('[data-lb]'); if (n) lbGo(+n.dataset.lb);
  });

  /* ───────── 히어로 필름: 화면·회선에 맞는 영상 선택, 소리·다시 보기, 스크롤하면 줄어들며 배너가 올라옴 */
  $$('[data-hfilm]').forEach(sec => {
    const v = $('video', sec), snd = $('[data-hfilm-sound]', sec), rep = $('[data-hfilm-replay]', sec), banner = $('#banner');
    const conn = navigator.connection || {}, saveData = conn.saveData || /2g/.test(conn.effectiveType || '');
    const portrait = matchMedia('(max-aspect-ratio: 4/5)').matches && innerWidth < 900;
    const big = !portrait && screen.width * (devicePixelRatio || 1) >= 2400 && !saveData && conn.effectiveType !== '3g';
    const src = ROOT + (portrait ? v.dataset.srcM : big ? v.dataset.src4k : v.dataset.src);
    if (portrait) v.poster = ROOT + v.dataset.posterM;
    const start = () => { if (!v.getAttribute('src')) v.src = src; v.play().catch(() => { rep.hidden = false; }); };
    if (!reduce && !saveData) { v.preload = 'auto'; start(); } else rep.hidden = false;
    v.addEventListener('timeupdate', () => sec.style.setProperty('--fp', (v.currentTime / (v.duration || 10)).toFixed(4)));
    v.loop = true; // 스크롤하기 전까지(화면에 보이는 동안) 계속 반복
    v.addEventListener('timeupdate', () => { if (v.currentTime > (v.duration || 12.5) - 1.5) sec.classList.add('is-ended'); }); // 한 바퀴 본 뒤 SCROLL 안내 강조
    rep.addEventListener('click', () => { if (!v.getAttribute('src')) v.src = src; v.currentTime = 0; v.play(); rep.hidden = true; });
    snd.addEventListener('click', () => {
      const on = v.muted; v.muted = !on;
      snd.setAttribute('aria-pressed', String(on));
      $('span', snd).textContent = on ? '소리 끄기' : '소리 켜기';
      $('use', snd).setAttribute('href', on ? '#i-sound' : '#i-mute');
      if (on && (v.ended || v.paused)) { if (!v.getAttribute('src')) v.src = src; v.currentTime = 0; v.play(); rep.hidden = true; sec.classList.remove('is-ended'); }
      toast(on ? '소리를 켰습니다' : '소리를 껐습니다', 'ok', 1600);
    });
    // 화면 밖이면 멈추고, 돌아오면 이어서(끝난 뒤에는 그대로)
    new IntersectionObserver(([e]) => { if (!e.isIntersecting) v.pause(); else if (v.getAttribute('src') && !reduce) v.play().catch(() => {}); }, { threshold: 0 }).observe(sec);
    // 스크롤 진행도(--p): 필름이 머무는 구간에서만 계산
    let near = true, ticking = false;
    const dockEl = $('.dock');
    const upd = () => { const max = sec.offsetHeight - document.documentElement.clientHeight, p = Math.min(1, Math.max(0, scrollY / Math.max(1, max))); sec.style.setProperty('--p', p.toFixed(4)); dockEl?.classList.toggle('is-film', p < .8); };
    new IntersectionObserver(([e]) => { near = e.isIntersecting; if (near) upd(); else dockEl?.classList.remove('is-film'); }, { rootMargin: '20% 0px' }).observe(sec);
    addEventListener('scroll', () => { if (!near || ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; upd(); }); }, { passive: true }); upd();
    // 배너가 올라오기 시작하면 제목 등장 효과 시작
    if (banner) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { banner.classList.add('is-shown'); o.disconnect(); } }, { threshold: .25 }).observe(banner);
  });

  /* ───────── 홈페이지 레퍼런스: 페이지 넘기기 · 크게 보기 */
  $$('[data-wc]').forEach(p => {
    const view = $('[data-wc-open]', p), vimg = $('img', view), url = $('[data-wc-url]', p), phone = $('.wc__screen img', p);
    const name = $('.wc__side h3', p)?.textContent || '';
    const btns = $$('[data-wc-page]', p);
    let cur = btns.find(b => b.getAttribute('aria-pressed') === 'true') || btns[0], ticket = 0;
    const show = b => {
      if (b === cur) return;
      cur = b; const t = ++ticket;
      btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      view.classList.add('is-swap');
      const im = new Image(); im.src = b.dataset.desk;
      const done = () => {
        if (t !== ticket) return;
        vimg.src = b.dataset.desk; vimg.width = +b.dataset.w; vimg.height = +b.dataset.h; vimg.alt = `${name} ${b.dataset.label} 화면`;
        view.classList.toggle('is-long', !!b.dataset.long);
        requestAnimationFrame(() => view.classList.remove('is-swap'));
      };
      (im.decode ? im.decode() : Promise.resolve()).then(done, done);
      url.textContent = b.dataset.url;
      if (phone && b.dataset.mob) phone.src = b.dataset.mob;
    };
    btns.forEach(b => b.addEventListener('click', () => show(b)));
    view.addEventListener('click', () => {
      const items = btns.filter(b => !b.dataset.long).map(b => ({ src: b.dataset.desk, alt: `${name} ${b.dataset.label} 화면`, cap: `${name} · ${b.dataset.label}`, w: b.dataset.w, h: b.dataset.h, btn: b }));
      lb = { items, i: Math.max(0, items.findIndex(x => x.btn === cur)) };
      openModal('', { lightbox: true }); lbRender();
    });
  });

  /* ───────── 작업 전후 비교: 손잡이 끌기(가로만, 세로 스크롤은 그대로) · 키보드는 숨은 범위 입력 */
  $$('[data-cmp]').forEach(c => {
    const r = $('[data-cmp-range]', c);
    const set = v => { v = Math.max(0, Math.min(100, v)); c.style.setProperty('--pos', v + '%'); r.value = Math.round(v); };
    const at = e => { const b = c.getBoundingClientRect(); set((e.clientX - b.left) / b.width * 100); };
    r.addEventListener('input', () => set(+r.value));
    let down = false, decided = false, horiz = false, sx = 0, sy = 0;
    c.addEventListener('pointerdown', e => {
      if (e.target === r) return;
      down = true; sx = e.clientX; sy = e.clientY; decided = e.pointerType === 'mouse'; horiz = decided;
      if (horiz) { c.setPointerCapture(e.pointerId); c.classList.add('is-drag'); at(e); }
    });
    c.addEventListener('pointermove', e => {
      if (!down) return;
      if (!decided) {
        const dx = Math.abs(e.clientX - sx), dy = Math.abs(e.clientY - sy); if (dx + dy < 6) return;
        decided = true; horiz = dx > dy;
        if (!horiz) { down = false; return; }
        c.setPointerCapture(e.pointerId); c.classList.add('is-drag');
      }
      if (horiz) at(e);
    });
    const end = () => { down = false; c.classList.remove('is-drag'); };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    if (!reduce) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { c.classList.add('is-hint'); o.disconnect(); } }, { threshold: .5 }).observe(c);
  });

  /* ───────── AI 검색 실제 녹화: 화면에 보일 때만 재생, 폭에 맞는 녹화(PC=답변 영역, 모바일=모바일 화면) */
  $$('[data-airec]').forEach(w => {
    const v = $('[data-airec-video]', w), tg = $('[data-airec-toggle]', w);
    const mob = matchMedia('(max-width:640px)').matches;
    if (mob) { v.poster = v.dataset.posterM; w.classList.add('is-m'); }
    let wanted = !reduce, inView = false;
    const sync = () => {
      if (inView && wanted) { if (!v.getAttribute('src')) v.src = mob ? v.dataset.m : v.dataset.d; v.play().catch(() => {}); }
      else v.pause();
      tg.innerHTML = icon(wanted ? 'pause' : 'play'); tg.setAttribute('aria-label', wanted ? '일시정지' : '재생');
    };
    tg.addEventListener('click', () => { wanted = !wanted; sync(); });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { threshold: .2 }).observe(v);
  });

  /* ───────── AI 답변 설계 슬라이드: 가운데 카드에서 질문 입력 → 답변 → 코드·표, 다음 카드는 오른쪽에 미리 보임 */
  $$('[data-aisl]').forEach(w => {
    const slides = $$('[data-aisl-slide]', w), dots = $$('[data-aisl-to]', w);
    slides.forEach(s => {
      s._input = $('[data-aisl-input]', s); s._ph = s._input.textContent;
      const c = $('[data-aisl-type]', s); if (!c) return;
      s._nodes = []; const tw = document.createTreeWalker(c, NodeFilter.SHOW_TEXT); let n;
      while ((n = tw.nextNode())) s._nodes.push([n, n.textContent]);
    });
    const full = s => { s._nodes?.forEach(([n, t]) => { n.textContent = t; }); $$('[data-aisl-seq]>*', s).forEach(c => c.classList.add('is-in')); s.classList.add('is-q', 'is-a', 'is-b', 'is-done'); s._input.classList.remove('is-typing'); s._input.textContent = s._ph; };
    let i = 0, run = 0, inView = false, timer = 0, wake = null;
    const wait = (ms, id) => new Promise(res => { timer = setTimeout(() => { if (id === run) res(); }, ms); });
    const visible = () => inView ? Promise.resolve() : new Promise(r => { wake = r; });
    async function play(k) {
      const id = ++run; clearTimeout(timer);
      i = (k + slides.length) % slides.length;
      slides.forEach((s, j) => {
        const o = j - i, on = o === 0;
        s.style.setProperty('--o', o);
        s.classList.toggle('is-on', on); s.classList.toggle('is-far', Math.abs(o) > 1);
        on ? s.removeAttribute('aria-hidden') : s.setAttribute('aria-hidden', 'true');
        if (!on) full(s);
      });
      dots.forEach((d, j) => j === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current'));
      const s = slides[i], seq = $('[data-aisl-seq]', s), code = $('[data-aisl-type]', s), input = s._input;
      if (reduce) { full(s); return; }
      s.classList.remove('is-q', 'is-a', 'is-b', 'is-done');
      s._nodes?.forEach(([n]) => { n.textContent = ''; });
      seq && [...seq.children].forEach(c => c.classList.remove('is-in'));
      await visible(); if (id !== run) return;
      await wait(450, id);
      input.classList.add('is-typing'); input.textContent = '';
      for (const ch of $('.aisl__q', s).textContent) { input.textContent += ch; await wait(30, id); }
      await wait(360, id);
      input.classList.remove('is-typing'); input.textContent = s._ph;
      s.classList.add('is-q'); await wait(480, id);
      s.classList.add('is-a'); await wait(420, id);
      s.classList.add('is-b');
      if (code) {
        code.classList.add('is-typing');
        for (const [n, t] of s._nodes) for (let c = 0; c < t.length; c += 2) { n.textContent = t.slice(0, c + 2); await wait(t[c] === '\n' ? 55 : 15, id); }
        code.classList.remove('is-typing');
      }
      if (seq) for (const c of seq.children) { c.classList.add('is-in'); await wait(280, id); }
      s.classList.add('is-done');
      await wait(3400, id); await visible(); if (id !== run) return;
      play(i + 1);
    }
    w.addEventListener('click', e => {
      const g = e.target.closest('[data-aisl-go]'), t = e.target.closest('[data-aisl-to]'), card = e.target.closest('[data-aisl-slide]:not(.is-on)');
      if (g) play(i + +g.dataset.aislGo); else if (t) play(+t.dataset.aislTo); else if (card) play(slides.indexOf(card));
    });
    let tx = 0, ty = 0;
    w.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    w.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) play(i + (dx < 0 ? 1 : -1)); });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView && wake) { const r = wake; wake = null; r(); } }, { threshold: .3 }).observe(w);
    play(0);
  });

  /* ───────── 아코디언 */
  function setAcc(btn, open) {
    const p = document.getElementById(btn.getAttribute('aria-controls')); if (!p) return;
    btn.setAttribute('aria-expanded', String(open));
    if (reduce) { p.hidden = !open; return; }
    if (open) {
      p.hidden = false; const h = p.scrollHeight; p.style.height = '0px';
      requestAnimationFrame(() => { p.style.height = h + 'px'; });
      p.addEventListener('transitionend', () => { p.style.height = ''; }, { once: true });
    } else {
      p.style.height = p.scrollHeight + 'px';
      requestAnimationFrame(() => { p.style.height = '0px'; });
      p.addEventListener('transitionend', () => { p.hidden = true; p.style.height = ''; }, { once: true });
    }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.acc__b'); if (!b) return;
    const open = b.getAttribute('aria-expanded') !== 'true';
    const acc = b.closest('[data-acc]');
    if (open) $$('.acc__b[aria-expanded="true"]', acc).forEach(x => x !== b && setAcc(x, false));
    setAcc(b, open);
  });
  // FAQ 분류·검색
  $$('[data-faq]').forEach(f => {
    let cat = '', q = '';
    const apply = () => {
      let n = 0;
      $$('.acc__i', f).forEach(i => {
        const ok = (!cat || i.dataset.cat === cat) && (!q || i.textContent.toLowerCase().includes(q));
        i.hidden = !ok; if (ok) n++;
      });
      $('[data-faq-empty]', f).hidden = n > 0;
    };
    $$('[data-faq-cat]', f).forEach(b => b.addEventListener('click', () => { $$('[data-faq-cat]', f).forEach(x => x.classList.toggle('is-on', x === b)); cat = b.dataset.faqCat; apply(); }));
    $('[data-faq-q]', f)?.addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); apply(); });
  });

  /* ───────── 탭 */
  $$('[data-tabs]').forEach(w => {
    const tabs = $$('[role="tab"]', w);
    const sel = t => {
      tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; const p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on; });
      t.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => sel(t));
      t.addEventListener('keydown', e => {
        const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!k) return;
        e.preventDefault(); const n = tabs[(i + k + tabs.length) % tabs.length]; n.focus(); sel(n);
      });
    });
  });

  /* ───────── 캐러셀 */
  $$('[data-carousel]').forEach(c => {
    const track = $('.car__track', c), items = [...track.children], dots = $('[data-car-dots]', c);
    const per = () => Math.max(1, Math.round(track.clientWidth / (items[0]?.getBoundingClientRect().width || 1)));
    const pages = () => Math.max(1, items.length - per() + 1);
    const draw = () => { dots.innerHTML = Array.from({ length: pages() }, (_, i) => `<button type="button" aria-label="${i + 1}번째로 이동"></button>`).join(''); mark(); };
    const idx = () => Math.round(track.scrollLeft / ((items[1]?.offsetLeft || 1) - (items[0]?.offsetLeft || 0)));
    const go = i => { const t = items[Math.max(0, Math.min(items.length - 1, i))]; track.scrollTo({ left: t.offsetLeft - items[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' }); };
    const mark = () => $$('button', dots).forEach((d, i) => d.classList.toggle('is-on', i === Math.min(idx(), pages() - 1)));
    $('[data-car-prev]', c).addEventListener('click', () => go(idx() - 1));
    $('[data-car-next]', c).addEventListener('click', () => go(idx() + 1 >= pages() ? 0 : idx() + 1));
    dots.addEventListener('click', e => { const b = e.target.closest('button'); if (b) go($$('button', dots).indexOf(b)); });
    track.addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true });
    track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(idx() + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx() - 1); } });
    let lastW = innerWidth; addEventListener('resize', () => { if (innerWidth !== lastW) { lastW = innerWidth; draw(); } }); draw();
  });

  /* ───────── 선언문 단어 하이라이트(스크롤 연동) */
  const words = $('[data-words]');
  if (words && !reduce) {
    const keys = ['직접', '실행형', '상주', '발행', '전', '확인', '정기', '보고'];
    // 줄(.ln)은 그대로 두고 줄 안의 단어만 감싼다
    $$('.ln', words).forEach(ln => { ln.innerHTML = ln.textContent.trim().split(/\s+/).map(w => `<span class="w${keys.some(k => w.startsWith(k)) ? ' is-key' : ''}">${esc(w)}</span>`).join(' '); });
    const ws = $$('.w', words);
    const upd = () => {
      const r = words.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh * .82 - r.top) / (r.height + vh * .35)));
      const n = Math.round(p * ws.length);
      for (let i = 0; i < n; i++) ws[i].classList.add('is-lit'); // 한 번 읽은 단어는 위로 올려도 그대로
    };
    let near = false, ticking = false;
    new IntersectionObserver(([e]) => { near = e.isIntersecting; if (near) upd(); }, { rootMargin: '50% 0px' }).observe(words);
    addEventListener('scroll', () => { if (!near || ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; upd(); }); }, { passive: true }); upd();
  }

  /* ───────── 스크롤 시퀀스 */
  const seq = $('[data-seq]');
  if (seq) {
    const pin = $('.seq__pin', seq), steps = $$('[data-seq-step]', seq), screens = $$('[data-seq-screen]', seq), bar = $('[data-seq-bar]', seq);
    const typer = $$('[data-typecount]', seq);
    let cur = -1, typed = new Set();
    const typeCount = el => { if (typed.has(el)) return; typed.add(el); const t0 = performance.now(); const to = 1512; const f = t => { const k = Math.min(1, (t - t0) / 1600); el.textContent = Math.round(to * k).toLocaleString('ko-KR'); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); };
    const setStep = i => {
      if (i === cur) return; cur = i;
      steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
      screens.forEach((s, k) => s.classList.toggle('is-on', k === i));
      if (i === 1) typer.forEach(typeCount);
    };
    const desk = matchMedia('(min-height:560px)'); // CSS와 같은 조건: 이 높이 미만이면 고정 없이 세로 나열
    const upd = () => {
      if (!desk.matches) return;
      const r = pin.getBoundingClientRect(), total = r.height - document.documentElement.clientHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
      bar?.style.setProperty('--p', (p * 100).toFixed(1) + '%');
      setStep(Math.min(steps.length - 1, Math.floor(p * steps.length * .999)));
    };
    let near = false, ticking = false, lastW = innerWidth;
    new IntersectionObserver(([e]) => { near = e.isIntersecting; upd(); }, { rootMargin: '25% 0px' }).observe(pin);
    addEventListener('scroll', () => { if (!near || ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; upd(); }); }, { passive: true });
    addEventListener('resize', () => { if (innerWidth !== lastW) { lastW = innerWidth; upd(); } }); upd();
    steps.forEach((s, i) => s.addEventListener('click', () => {
      if (!desk.matches) return;
      const top = pin.getBoundingClientRect().top + scrollY, total = pin.offsetHeight - document.documentElement.clientHeight;
      scrollTo({ top: top + total * (i + .5) / steps.length, behavior: reduce ? 'auto' : 'smooth' });
    }));
    // 모바일: 문서 화면이 보이면 글자 수 세기
    const mIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) typeCount($('[data-typecount]', e.target) || document.createElement('b')); }), { threshold: .5 });
    $$('.seq__m .scr--doc', seq).forEach(el => mIO.observe(el));
  }

  /* ───────── HOW WE WORK 벤토: 원고 카드가 보이면 글자 수 세기 */
  $$('.hbento [data-typecount]').forEach(el => new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return; o.disconnect();
    if (reduce) { el.textContent = '1,512'; return; }
    const t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / 1600); el.textContent = Math.round(1512 * k).toLocaleString('ko-KR'); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f);
  }, { threshold: .4 }).observe(el.closest('.hb')));

  /* ───────── 히어로 벽 — 화면 밖이면 애니메이션 멈춤 */
  const hero = $('[data-hero]');
  if (hero) new IntersectionObserver(([e]) => hero.classList.toggle('is-off', !e.isIntersecting)).observe(hero);
  const style = document.createElement('style'); style.textContent = '.hero.is-off .wall__col{animation-play-state:paused}'; document.head.appendChild(style);

  /* ───────── 가격 표시 전환(월 / 1회당) */
  $$('[data-plans]').forEach(w => {
    const seg = $('.seg', w);
    $$('[data-plan-view]', w).forEach(b => b.addEventListener('click', () => {
      const per = b.dataset.planView === 'per';
      $$('[data-plan-view]', w).forEach(x => x.setAttribute('aria-checked', String(x === b)));
      seg.classList.toggle('is-per', per);
      $$('.plan__v', w).forEach(v => { v.style.opacity = 0; setTimeout(() => { v.textContent = per ? v.dataset.per : v.dataset.month; v.style.opacity = 1; }, 160); });
      $$('[data-month-unit]', w).forEach(u => { u.textContent = per ? u.dataset.perUnit : u.dataset.monthUnit; });
    }));
  });

  $$('[data-plans-grid]').forEach(g => {
    if (getComputedStyle(g).overflowX !== 'auto') return;
    const best = $('.plan--best', g); if (best) g.scrollLeft = best.offsetLeft - (g.clientWidth - best.offsetWidth) / 2;
  });

  /* ───────── 비용 계산기 */
  $$('[data-calc]').forEach(c => {
    const ind = $('[data-calc-ind]', c), rng = $('[data-calc-clicks]', c), out = $('[data-calc-clicks-out]', c), ad = $('[data-calc-ad]', c), q = $('[data-calc-q]', c);
    c.addEventListener('change', () => track('calc_use', { industry: ind?.value || '' }), { once: true });
    const upd = () => {
      const r = (DATA.cpc || []).find(x => x.id === ind.value) || (DATA.cpc || [])[0]; if (!r) return;
      const n = +rng.value; out.textContent = n;
      rng.style.setProperty('--pct', ((n - rng.min) / (rng.max - rng.min) * 100) + '%');
      ad.textContent = `${man(r.lo * n)} ~ ${man(r.hi * n)}`;
      q.textContent = r.q.map(x => `“${x}”`).join(' · ');
    };
    ind.addEventListener('change', upd); rng.addEventListener('input', upd); upd();
  });

  /* ───────── 포트폴리오 필터 · 더 보기 */
  $$('[data-pf]').forEach(w => {
    const items = $$('.pf__i', w), more = $('[data-pf-more]', w);
    $$('[data-pf-cat]', w).forEach(b => b.addEventListener('click', () => {
      $$('[data-pf-cat]', w).forEach(x => x.classList.toggle('is-on', x === b));
      const c = b.dataset.pfCat;
      items.forEach(i => { i.classList.remove('is-more'); i.classList.toggle('is-hide', !!c && i.dataset.cat !== c); });
      more?.parentElement.remove();
    }));
    more?.addEventListener('click', () => { items.forEach(i => i.classList.remove('is-more')); more.parentElement.remove(); wireSkeletons(w); });
  });

  /* ───────── 서비스 목록 필터 · 빠른 보기 */
  const sf = $('[data-svc-filter]');
  if (sf) {
    const cards = $$('[data-svc-grid] .scard');
    $$('button', sf).forEach(b => b.addEventListener('click', () => {
      $$('button', sf).forEach(x => x.classList.toggle('is-on', x === b));
      cards.forEach(c => c.classList.toggle('is-hide', !!b.dataset.axis && c.dataset.axis !== b.dataset.axis));
    }));
  }
  const quick = $('#svc-quick') ? JSON.parse($('#svc-quick').textContent) : null;
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-svc-quick]'); if (!b || !quick) return;
    const s = quick[b.dataset.svcQuick];
    openModal(`<p class="eyebrow">SERVICE</p><h2 id="modal-title">${esc(s.name)}</h2><p><strong>${esc(s.copy)}</strong></p><p style="margin-top:8px;color:var(--ink-2)">${esc(s.lead)}</p><ul class="ticks">${s.scope.map(t => `<li>${icon('check')}${esc(t)}</li>`).join('')}</ul><p class="small">판매 구조 · ${esc(s.model)}</p><div class="btns"><a class="btn btn--primary" href="${ROOT}services/${b.dataset.svcQuick}/">자세히 보기 ${icon('arrow')}</a><button class="btn btn--accent" type="button" data-quote data-service="${b.dataset.svcQuick}">이 상품으로 상담하기</button></div>`);
  });
  // 모달 안에서 상담 버튼을 누르면 모달을 닫고 드로어를 연다
  document.addEventListener('click', e => { if (e.target.closest('#modal [data-quote]')) closeModal(); }, true);

  /* ───────── 인사이트 목록(분류·검색·더 보기, 스켈레톤) */
  const grid = $('[data-ins-grid]');
  if (grid && DATA.posts) {
    const PER = +grid.dataset.per || 9, all = DATA.posts.slice(1); // 첫 글은 상단 대표 글
    let cat = '', q = '', shown = Math.min(PER, all.length);
    const moreBtn = $('[data-ins-more]'), empty = $('[data-ins-empty]');
    const cover = p => p.thumb
      ? `<div class="pcard__thumb"><span class="sk" style="aspect-ratio:1200/675"><img src="${ROOT}assets/img/${p.thumb}" width="1200" height="675" alt="${esc(p.category + ' — ' + p.coverText)}" loading="lazy" decoding="async"></span></div>`
      : `<div class="pcard__cover pcard__cover--${p.coverKey}" aria-hidden="true"><span>${esc(p.category)}</span><strong>${esc(p.coverText)}</strong></div>`;
    const card = p => `<article class="pcard is-in"><a href="${ROOT}insights/${p.slug}/">${cover(p)}<div class="pcard__txt"><p class="pcard__meta"><span>${esc(p.category)}</span><time datetime="${p.date}">${p.date.replace(/-/g, '.')}</time><span>${p.minutes}분</span></p><h3>${esc(p.title)}</h3></div></a></article>`;
    const skel = n => Array.from({ length: n }, () => '<div class="skel-card" aria-hidden="true"><i></i><i style="height:12px;width:40%"></i><i style="height:16px;width:85%"></i><i style="height:16px;width:60%;margin-bottom:20px"></i></div>').join('');
    const list = () => all.filter(p => (!cat || p.category === cat) && (!q || (p.title + p.d + p.category).toLowerCase().includes(q)));
    const render = (append = false) => {
      const L = list(), from = append ? grid.querySelectorAll('.pcard').length : 0;
      if (append) grid.insertAdjacentHTML('beforeend', skel(Math.min(PER, L.length - from)));
      else grid.innerHTML = skel(Math.min(PER, L.length || 1));
      setTimeout(() => {
        $$('.skel-card', grid).forEach(s => s.remove());
        grid.insertAdjacentHTML('beforeend', L.slice(from, shown).map(card).join(''));
        wireSkeletons(grid);
        empty.hidden = L.length > 0; moreBtn.hidden = shown >= L.length;
      }, append ? 260 : 180);
    };
    $$('[data-ins-cats] [data-cat]').forEach(b => b.addEventListener('click', () => { $$('[data-ins-cats] [data-cat]').forEach(x => x.classList.toggle('is-on', x === b)); cat = b.dataset.cat; shown = PER; render(); }));
    let qt; $('[data-ins-q]')?.addEventListener('input', e => { clearTimeout(qt); qt = setTimeout(() => { q = e.target.value.trim().toLowerCase(); shown = PER; render(); }, 200); });
    moreBtn?.addEventListener('click', () => { shown += PER; render(true); });
  }

  /* ───────── 복사 */
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); toast(msg); }
  }
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-copy]'); if (c) { copy(c.dataset.copy, `${c.dataset.copy} 복사했습니다`); return; }
    if (e.target.closest('[data-copy-url]')) copy(location.href, '글 주소를 복사했습니다');
  });

  /* ───────── AI 답변 화면 예시 — 화면에 들어오면 질문 타이핑 후 답변 표시 */
  $$('[data-aichat]').forEach(a => {
    const qEl = $('[data-aichat-q]', a), text = qEl.textContent;
    if (reduce) { a.classList.add('is-typed'); return; }
    qEl.textContent = '';
    let vis = false, busy = false;
    const cycle = () => {
      if (!vis || busy) return; busy = true;
      a.classList.remove('is-typed'); qEl.textContent = '';
      let i = 0; const t = setInterval(() => { qEl.textContent = text.slice(0, ++i); if (i >= text.length) { clearInterval(t); setTimeout(() => a.classList.add('is-typed'), 450); setTimeout(() => { busy = false; cycle(); }, 6500); } }, 45);
    };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; cycle(); }, { threshold: .5 }).observe(a);
  });

  /* ───────── 서브 내비 · 글 목차 현재 위치 */
  function spy(links) {
    const map = links.map(l => [l, document.getElementById(decodeURIComponent(l.hash.slice(1)))]).filter(x => x[1]);
    if (!map.length) return;
    const upd = () => { let on = map[0][0]; for (const [l, s] of map) if (s.getBoundingClientRect().top < innerHeight * .35) on = l; links.forEach(l => l.classList.toggle('is-on', l === on)); };
    addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true }); upd();
  }
  spy($$('[data-subnav] a')); spy($$('.post__toc a'));

  /* ───────── 도크: 푸터가 보이면 숨김 */
  const dock = $('.dock'), ft = $('.ft');
  if (dock && ft) new IntersectionObserver(([e]) => { if (!locks) dock.classList.toggle('is-hide', e.isIntersecting); }).observe(ft);

  /* ───────── 유입 경로 기록(상담 신청에 함께 전달) */
  const ATTR_KEY = 'ma_attr';
  try {
    if (!sessionStorage.getItem(ATTR_KEY)) {
      const u = new URL(location.href), a = { landing: location.pathname, referrer: document.referrer || '' };
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'n_query', 'n_keyword', 'gclid'].forEach(k => { const v = u.searchParams.get(k); if (v) a[k] = v; });
      sessionStorage.setItem(ATTR_KEY, JSON.stringify(a));
    }
  } catch { /* 저장소 차단 환경 */ }
  const attr = () => { try { return JSON.parse(sessionStorage.getItem(ATTR_KEY) || '{}'); } catch { return {}; } };

  /* ───────── 전환 이벤트 — 도구 불러오기·전화/카카오 클릭·스크롤은 assets/js/track.js */
  const track = (name, params) => { try { window.maTrack?.(name, params); } catch { } };

  /* ───────── 상담 폼(3단계) */
  function prefillForm(form, { service, plan } = {}) {
    if (!form) return;
    if (service) { const s = (DATA.services || []).find(x => x.slug === service); $$('input[name="services"]', form).forEach(c => { if (c.dataset.slug === service) c.checked = true; }); if (s && plan) { const m = $('[name="message"]', form); if (m && !m.value) m.value = `${s.name} — ${plan} 상품 문의`; } }
  }
  $$('[data-qf]').forEach(form => {
    const steps = $$('.qf__step', form), lab = $$('.qf__steps li', form), bar = $('.qf__bar span', form);
    const prev = $('[data-qf-prev]', form), next = $('[data-qf-next]', form), submit = $('[data-qf-submit]', form);
    let i = 0; const t0 = Date.now();
    const show = k => {
      i = k; steps.forEach((s, n) => s.classList.toggle('is-on', n === k)); lab.forEach((l, n) => l.classList.toggle('is-on', n <= k));
      bar.style.width = `${(k + 1) / steps.length * 100}%`; prev.hidden = k === 0; next.hidden = k === steps.length - 1; submit.hidden = k !== steps.length - 1;
      const f = $('input:not([type=checkbox]):not(.hp),select,textarea', steps[k]); if (f && form.closest('.drawer.is-open, .contact')) setTimeout(() => f.focus({ preventScroll: true }), 80);
    };
    next.addEventListener('click', () => { show(Math.min(steps.length - 1, i + 1)); track('form_step', { form: form.id, step: i + 1 }); });
    let started = false; // 첫 입력(포커스 또는 체크 — 서비스 칩은 클릭해도 포커스가 안 감)
    const start = () => { if (!started) { started = true; track('form_start', { form: form.id }); } };
    form.addEventListener('focusin', start); form.addEventListener('change', start);
    prev.addEventListener('click', () => show(Math.max(0, i - 1)));
    form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && i < steps.length - 1) { e.preventDefault(); next.click(); } });
    // ?service= 로 들어온 경우(상담 페이지)
    const qs = new URLSearchParams(location.search).get('service'); if (qs && form.id === 'cf') prefillForm(form, { service: qs });
    const phoneIn = $('[name="phone"]', form);
    phoneIn.addEventListener('input', () => { const d = phoneIn.value.replace(/\D/g, '').slice(0, 11); phoneIn.value = d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : d.startsWith('02') && d.length <= 10 ? `${d.slice(0, 2)}-${d.slice(2, d.length - 4)}-${d.slice(-4)}` : `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`; });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form), name = (fd.get('name') || '').trim(), phone = (fd.get('phone') || '').trim(), digits = phone.replace(/\D/g, '');
      const errs = [];
      $$('.fld,.agree', form).forEach(x => x.classList.remove('is-err'));
      if (!name) { errs.push('이름 또는 업체명을 입력해 주세요'); $('[name="name"]', form).closest('.fld').classList.add('is-err'); }
      if (!/^0\d{8,10}$/.test(digits)) { errs.push('연락처를 확인해 주세요'); phoneIn.closest('.fld').classList.add('is-err'); }
      if (!fd.get('agree')) { errs.push('개인정보 수집·이용에 동의해 주세요'); $('.agree', form).classList.add('is-err'); }
      if (errs.length) { toast(errs[0], 'err'); show(steps.length - 1); return; }
      const data = {
        name, phone, services: fd.getAll('services'), industry: fd.get('industry') || '', region: fd.get('region') || '', budget: fd.get('budget') || '',
        url: fd.get('url') || '', message: fd.get('message') || '', agree: true, hp: fd.get('hp') || '', page: location.pathname, attr: attr(), ua: navigator.userAgent, dwell: Date.now() - t0,
      };
      if (data.hp) return;
      form.classList.add('is-busy');
      let ok = false, id = '';
      if (CFG.LEAD_ENDPOINT) {
        try {
          const r = await fetch(CFG.LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
          const j = await r.json(); ok = !!j.ok; id = j.id || ''; if (!ok) throw new Error(j.error || '접수 실패');
        } catch (err) { form.classList.remove('is-busy'); toast('전송에 실패했습니다. 전화나 카카오톡으로 연락 주세요.', 'err', 4200); return; }
      }
      form.classList.remove('is-busy');
      // 실제 접수(저장 성공)만 generate_lead(광고 전환). 접수 주소가 없어 내용만 정리한 경우는 lead_draft
      track(ok ? 'generate_lead' : 'lead_draft', { form: form.id, services: data.services.join(','), industry: data.industry, budget: data.budget });
      const summary = `[미래애드원 상담 신청]\n이름/업체: ${name}\n연락처: ${phone}\n관심 서비스: ${data.services.join(', ') || '미정'}\n업종/지역: ${[data.industry, data.region].filter(Boolean).join(' / ') || '-'}\n예산: ${data.budget || '-'}\n주소: ${data.url || '-'}\n내용: ${data.message || '-'}`;
      const done = ok
        ? `<div class="qf-done">${icon('check')}<h3>상담 신청이 접수되었습니다</h3><p>${id ? `접수번호 ${esc(id)} · ` : ''}담당자가 확인 후 연락드립니다.</p><div class="btns"><a class="btn btn--line" href="${ROOT}portfolio/">기다리는 동안 포트폴리오 보기</a></div></div>`
        : `<div class="qf-done">${icon('doc')}<h3>신청 내용을 정리했습니다</h3><p>지금은 온라인 접수 연결 전이라, 아래 버튼으로 내용을 복사해 카카오톡에 붙여 넣거나 전화로 말씀해 주세요.</p><div class="btns"><button class="btn btn--primary" type="button" data-copy-summary>신청 내용 복사</button><a class="btn btn--accent" href="${CFG.KAKAO}" target="_blank" rel="noopener">카카오톡 상담</a><a class="btn btn--line" href="tel:${CFG.PHONE}">${CFG.PHONE}</a></div></div>`;
      form.innerHTML = done;
      $('[data-copy-summary]', form)?.addEventListener('click', () => copy(summary, '신청 내용을 복사했습니다'));
      toast(ok ? '상담 신청이 접수되었습니다' : '신청 내용을 정리했습니다');
    });
    show(0);
  });
})();
