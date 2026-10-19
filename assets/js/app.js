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
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('[data-reveal],[data-bars],[data-draw],.tl').forEach(el => io.observe(el));
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
  let lastY = scrollY;
  const totop = $('[data-totop]');
  function onScroll() {
    const y = scrollY;
    hd?.classList.toggle('is-solid', y > 40);
    const megaOpen = $('.has-mega.is-open');
    if (!megaOpen) hd?.classList.toggle('is-hidden', y > 480 && y > lastY + 4);
    if (y < lastY - 4) hd?.classList.remove('is-hidden');
    lastY = y;
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
      return { src: img.currentSrc || img.src, alt: img.alt, cap, w: img.getAttribute('width'), h: img.getAttribute('height'), btn: b };
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
    addEventListener('resize', draw); draw();
  });

  /* ───────── 선언문 단어 하이라이트(스크롤 연동) */
  const words = $('[data-words]');
  if (words && !reduce) {
    const keys = ['직접', '실행형', '상주', '발행', '전', '확인', '정기', '보고'];
    words.innerHTML = words.textContent.trim().split(/\s+/).map(w => `<span class="w${keys.some(k => w.startsWith(k)) ? ' is-key' : ''}">${esc(w)}</span>`).join(' ');
    const ws = $$('.w', words);
    const upd = () => {
      const r = words.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh * .82 - r.top) / (r.height + vh * .35)));
      const n = Math.round(p * ws.length);
      ws.forEach((w, i) => w.classList.toggle('is-lit', i < n));
    };
    addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true }); upd();
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
    const desk = matchMedia('(min-width:1024px)');
    const upd = () => {
      if (!desk.matches) return;
      const r = pin.getBoundingClientRect(), total = r.height - innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
      bar?.style.setProperty('--p', (p * 100).toFixed(1) + '%');
      setStep(Math.min(steps.length - 1, Math.floor(p * steps.length * .999)));
    };
    addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true }); addEventListener('resize', upd); upd();
    steps.forEach((s, i) => s.addEventListener('click', () => {
      if (!desk.matches) return;
      const top = pin.getBoundingClientRect().top + scrollY, total = pin.offsetHeight - innerHeight;
      scrollTo({ top: top + total * (i + .5) / steps.length, behavior: reduce ? 'auto' : 'smooth' });
    }));
    // 모바일: 문서 화면이 보이면 글자 수 세기
    const mIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) typeCount($('[data-typecount]', e.target) || document.createElement('b')); }), { threshold: .5 });
    $$('.seq__m .scr--doc', seq).forEach(el => mIO.observe(el));
  }

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

  /* ───────── 비용 계산기 */
  $$('[data-calc]').forEach(c => {
    const ind = $('[data-calc-ind]', c), rng = $('[data-calc-clicks]', c), out = $('[data-calc-clicks-out]', c), ad = $('[data-calc-ad]', c), q = $('[data-calc-q]', c);
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
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect();
      let i = 0; const t = setInterval(() => { qEl.textContent = text.slice(0, ++i); if (i >= text.length) { clearInterval(t); setTimeout(() => a.classList.add('is-typed'), 450); } }, 45);
    }, { threshold: .5 }).observe(a);
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

  /* ───────── 전환 이벤트 */
  function track(name, params = {}) {
    try { window.gtag?.('event', name, params); } catch { }
    try { if (window.wcs && name === 'generate_lead') { window._nasa = window._nasa || {}; window._nasa.cnv = window.wcs.cnv('4', '1'); window.wcs_do?.(window._nasa); } } catch { }
  }
  document.addEventListener('click', e => { const t = e.target.closest('[data-track]'); if (t) track(t.dataset.track === 'tel' ? 'click_tel' : 'click_kakao', { page: location.pathname }); });
  if (CFG.GA4_ID) { const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${CFG.GA4_ID}`; document.head.appendChild(s); window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); }; gtag('js', new Date()); gtag('config', CFG.GA4_ID); }
  if (CFG.NAVER_WCS_ID) { const s = document.createElement('script'); s.src = 'https://wcs.naver.net/wcslog.js'; s.onload = () => { window.wcs_add = { wa: CFG.NAVER_WCS_ID }; window.wcs?.inflow?.(); window.wcs_do?.(); }; document.head.appendChild(s); }

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
    next.addEventListener('click', () => show(Math.min(steps.length - 1, i + 1)));
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
      track('generate_lead', { services: data.services.join(','), industry: data.industry });
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
