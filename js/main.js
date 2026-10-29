/* ASI Innovexa — interactions. No framework; Lenis for the glide when available. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const scrollTo = target => lenis ? lenis.scrollTo(target, { offset: -20 }) : target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = $(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    scrollTo(el);
  }));

  /* ---------- Hero: open through the star ---------- */
  const hero = $('[data-hero]');
  const openHero = () => {
    hero.classList.add('is-open');
    setTimeout(() => hero.classList.add('is-done'), 2000);
  };
  if (reduced) hero.classList.add('is-open', 'is-done');
  else {
    const img = $('.hero__img', hero);
    const go = () => requestAnimationFrame(() => requestAnimationFrame(openHero));
    Promise.race([
      Promise.all([img.decode ? img.decode().catch(() => {}) : Promise.resolve(), document.fonts ? document.fonts.ready : null]),
      new Promise(r => setTimeout(r, 1800)),
    ]).then(go);
  }

  /* ---------- Nav: hide on the way down, return on the way up ---------- */
  const nav = $('[data-nav]');
  let lastY = 0;
  const onScrollNav = y => {
    nav.classList.toggle('is-hidden', y > lastY && y > 240 && !document.body.classList.contains('menu-open'));
    lastY = y;
  };

  /* ---------- Mobile menu ---------- */
  const toggle = $('[data-menu-toggle]');
  const menu = $('[data-menu]');
  function closeMenu() {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('.sr').textContent = 'Open menu';
    document.body.classList.remove('menu-open');
    lenis && lenis.start();
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 900);
  }
  toggle.addEventListener('click', () => {
    if (menu.classList.contains('is-open')) return closeMenu();
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
    toggle.setAttribute('aria-expanded', 'true');
    toggle.querySelector('.sr').textContent = 'Close menu';
    document.body.classList.add('menu-open');
    lenis && lenis.stop();
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Statement: words light up as you read ---------- */
  const statement = $('[data-words]');
  (function splitWords(node) {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.append(part);
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.append(s); }
        });
        n.replaceWith(frag);
      } else if (n.classList && n.classList.contains('pill')) n.classList.add('w');
    });
  })(statement);
  const words = $$('.w', statement);
  const updateWords = () => {
    const r = statement.getBoundingClientRect();
    const p = clamp((innerHeight * .85 - r.top) / (r.height + innerHeight * .35), 0, 1);
    const lit = Math.round(p * words.length * 1.1);
    words.forEach((w, i) => w.classList.toggle('on', i < lit));
  };

  /* ---------- Capabilities: accordion + leaf follower ---------- */
  const caps = $$('.cap');
  caps.forEach(cap => {
    const btn = $('.cap__row', cap);
    btn.addEventListener('click', () => {
      const open = !cap.classList.contains('is-open');
      caps.forEach(c => { c.classList.remove('is-open'); $('.cap__row', c).setAttribute('aria-expanded', 'false'); });
      if (open) { cap.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
      setTimeout(() => lenis && lenis.resize(), 850);
    });
  });

  const follower = $('[data-follower]');
  if (finePointer && !reduced) {
    const fImg = $('img', follower);
    const pos = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2, s: .4, ts: .4, r: 0 };
    let active = false, current = '';
    addEventListener('pointermove', e => { pos.tx = e.clientX; pos.ty = e.clientY; }, { passive: true });
    caps.forEach(cap => {
      const row = $('.cap__row', cap);
      row.addEventListener('pointerenter', () => {
        if (cap.classList.contains('is-open')) return;
        if (current !== cap.dataset.img) { fImg.src = cap.dataset.img; current = cap.dataset.img; }
        active = true; pos.ts = 1; follower.classList.add('is-on');
      });
      row.addEventListener('pointerleave', () => { active = false; pos.ts = .4; follower.classList.remove('is-on'); });
      row.addEventListener('click', () => { active = false; pos.ts = .4; follower.classList.remove('is-on'); });
    });
    (function loop() {
      const dx = pos.tx - pos.x;
      pos.x = lerp(pos.x, pos.tx, .14);
      pos.y = lerp(pos.y, pos.ty, .14);
      pos.s = lerp(pos.s, pos.ts, .12);
      pos.r = lerp(pos.r, clamp(dx * .06, -14, 14), .1);   // lean into the motion, like something in water
      if (active || pos.s > .41) follower.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) rotate(${pos.r}deg) scale(${pos.s})`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Proposal room ---------- */
  const TEAMS = {
    blue:  { tint: '#4C63F0', ink: '#F7F8F4', bg: '#0E1120', stage: 'Strategy', title: 'Should we bid, and how do we win?',
             text: 'We test the opportunity against your capabilities, map the customer’s hot buttons, and set the win themes every section will carry.',
             checks: ['Bid / no-bid call', 'Competitor read', 'Win themes'] },
    pink:  { tint: '#E9A6B8', ink: '#0E1120', bg: '#16121C', stage: 'Storyboard', title: 'Does the outline answer every requirement?',
             text: 'Before anyone writes long-form, reviewers check the outline and storyboards against the compliance matrix so nothing in Sections L and M is missed.',
             checks: ['Compliance matrix', 'Section L/M mapping', 'Storyboards'] },
    red:   { tint: '#E0524A', ink: '#F7F8F4', bg: '#1A0F12', stage: 'Mock evaluation', title: 'How would an evaluator score this today?',
             text: 'A fresh team reads the full draft the way the government will, scores it against the evaluation factors, and logs every weakness for fixing.',
             checks: ['Scored like an evaluator', 'Strengths and weaknesses', 'Tracked dispositions'] },
    gold:  { tint: '#D1AB55', ink: '#0E1120', bg: '#16130D', stage: 'Executive sign-off', title: 'Is this the offer we want to make?',
             text: 'Leadership reviews price, risk and commitments together, and signs off on the final solution before production starts.',
             checks: ['Price-to-win', 'Risk review', 'Final approval'] },
    white: { tint: '#F4F4EE', ink: '#0E1120', bg: '#14161C', stage: 'Final production', title: 'Is it perfect on the page?',
             text: 'Formatting, page counts, file names, forms and certifications are checked line by line, then the package is submitted with time to spare.',
             checks: ['Page and format checks', 'Forms and certifications', 'On-time submission'] },
  };
  const room = $('[data-room]');
  const chips = $$('[role="tab"]', room);
  const blob = $('.room__blob', room);
  const copy = $('.room__copy', room);
  const swatchMark = $('.room__swatch .mark', room);
  const placeBlob = btn => {
    blob.style.width = btn.offsetWidth + 'px';
    blob.style.height = btn.offsetHeight + 'px';
    blob.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
  };
  const selectTeam = (btn, focus) => {
    const t = TEAMS[btn.dataset.team];
    chips.forEach(c => { c.setAttribute('aria-selected', c === btn); c.tabIndex = c === btn ? 0 : -1; });
    if (focus) btn.focus();
    placeBlob(btn);
    room.style.setProperty('--tint', t.tint);
    room.style.setProperty('--tint-ink', t.ink);
    room.style.background = t.bg;
    swatchMark.classList.add('is-burst');
    setTimeout(() => swatchMark.classList.remove('is-burst'), 420);
    $('[data-room-stage]', room).textContent = t.stage;
    $('[data-room-title]', room).textContent = t.title;
    $('[data-room-text]', room).textContent = t.text;
    $('[data-room-checks]', room).innerHTML = t.checks.map(c => `<li>${c}</li>`).join('');
    copy.classList.remove('is-swap'); void copy.offsetWidth; copy.classList.add('is-swap');
  };
  chips.forEach((c, i) => {
    c.tabIndex = i === 0 ? 0 : -1;
    c.addEventListener('click', () => selectTeam(c));
    c.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); selectTeam(chips[(i + d + chips.length) % chips.length], true); }
    });
  });
  const placeCurrent = () => placeBlob(chips.find(c => c.getAttribute('aria-selected') === 'true'));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(placeCurrent);
  addEventListener('resize', placeCurrent);

  /* ---------- Approach: vertical scroll drives a horizontal track ---------- */
  const approach = $('[data-approach]');
  const track = $('[data-approach-track]');
  const bar = $('[data-approach-bar]');
  const horizontal = () => innerWidth > 760 && !(innerHeight <= 520 && innerWidth > innerHeight);
  let travel = 0;
  const sizeApproach = () => {
    if (!horizontal()) { approach.style.height = ''; travel = 0; return; }
    travel = Math.max(0, track.scrollWidth - innerWidth);
    approach.style.height = innerHeight + travel + 'px';
  };
  const updateApproach = () => {
    if (!travel) return;
    const r = approach.getBoundingClientRect();
    const p = clamp(-r.top / travel, 0, 1);
    track.style.transform = `translate3d(${-p * travel}px, 0, 0)`;
    bar.style.transform = `scaleX(${p})`;
  };
  // Phones: the track is a native swipe carousel; the bar follows its scroll.
  track.addEventListener('scroll', () => {
    if (horizontal()) return;
    const max = track.scrollWidth - track.clientWidth;
    bar.style.transform = `scaleX(${max > 0 ? clamp(track.scrollLeft / max, 0, 1) : 0})`;
  }, { passive: true });

  /* ---------- Standards: count up once ---------- */
  const counters = $$('[data-count]');
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    const el = en.target, end = +el.dataset.count, t0 = performance.now(), dur = 1400;
    if (reduced) return;
    const tick = now => {
      const p = clamp((now - t0) / dur, 0, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  counters.forEach(c => io.observe(c));

  /* ---------- Bento + seal ledger: reveal as a group, tiles catch the pointer ---------- */
  $$('.cloud li').forEach((li, i) => li.style.setProperty('--n', i));
  const revealIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    revealIO.unobserve(en.target);
    en.target.classList.add('is-in');
  }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal-group]').forEach(g => revealIO.observe(g));
  if (finePointer) $$('.tile').forEach(tile => tile.addEventListener('pointermove', e => {
    const r = tile.getBoundingClientRect();
    tile.style.setProperty('--mx', e.clientX - r.left + 'px');
    tile.style.setProperty('--my', e.clientY - r.top + 'px');
  }, { passive: true }));

  /* ---------- Sectors rail: drag with inertia, cards tilt with speed ---------- */
  const rail = $('[data-rail]');
  const sectors = $$('.sector', rail);
  let down = false, startX = 0, startLeft = 0, vel = 0, lastX = 0, moved = false;
  rail.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;               // touch uses native scrolling
    down = true; moved = false; startX = lastX = e.clientX; startLeft = rail.scrollLeft; vel = 0;
    rail.setPointerCapture(e.pointerId);
  });
  rail.addEventListener('pointermove', e => {
    if (!down) return;
    if (Math.abs(e.clientX - startX) > 4) { moved = true; rail.classList.add('is-drag'); }
    vel = e.clientX - lastX; lastX = e.clientX;
    rail.scrollLeft = startLeft - (e.clientX - startX);
  });
  const release = () => {
    if (!down) return;
    down = false; rail.classList.remove('is-drag');
    if (reduced) return;
    (function glide() {
      vel *= .94;
      rail.scrollLeft -= vel;
      if (Math.abs(vel) > .4) requestAnimationFrame(glide);
    })();
  };
  rail.addEventListener('pointerup', release);
  rail.addEventListener('pointercancel', release);
  rail.addEventListener('click', e => { if (moved) e.preventDefault(); }, true);
  let railPrev = rail.scrollLeft, tilt = 0;
  (function tiltLoop() {
    const d = rail.scrollLeft - railPrev; railPrev = rail.scrollLeft;
    tilt = lerp(tilt, reduced ? 0 : clamp(d * .12, -4, 4), .12);
    if (Math.abs(tilt) > .01 || Math.abs(d) > 0) sectors.forEach(s => s.style.setProperty('--tilt', tilt.toFixed(2) + 'deg'));
    requestAnimationFrame(tiltLoop);
  })();

  /* ---------- Magnetic buttons + click ripple ---------- */
  $$('.btn').forEach(btn => {
    btn.addEventListener('pointerdown', e => {
      const r = btn.getBoundingClientRect();
      const dot = document.createElement('span');
      dot.className = 'ripple';
      dot.style.left = e.clientX - r.left + 'px'; dot.style.top = e.clientY - r.top + 'px';
      btn.append(dot);
      setTimeout(() => dot.remove(), 800);
    });
  });
  if (finePointer && !reduced) $$('[data-magnetic]').forEach(btn => {
    const label = btn.firstElementChild;
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * .18}px, ${y * .3}px)`;
      label.style.transform = `translate(${x * .1}px, ${y * .14}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; label.style.transform = ''; });
  });

  /* ---------- Contact form ---------- */
  const form = $('[data-form]');
  const err = $('[data-form-error]', form);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.elements.name, email = form.elements.email;
    const bad = [];
    [name, email].forEach(f => f.closest('.field').classList.remove('is-bad'));
    if (!name.value.trim()) bad.push(name);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) bad.push(email);
    if (bad.length) {
      bad.forEach(f => f.closest('.field').classList.add('is-bad'));
      err.textContent = bad.length === 2 ? 'Add your name and a work email so we can reply.'
        : bad[0] === name ? 'Add your name so we know who to reply to.' : 'Enter a work email like name@company.com.';
      bad[0].focus();
      return;
    }
    err.textContent = '';
    // No backend yet: hand the message to the visitor's mail client so nothing is lost.
    const needs = $$('input[name="need"]:checked', form).map(i => i.value).join(', ') || 'Not specified';
    const body = `Name: ${name.value}\nEmail: ${email.value}\nOrganization: ${form.elements.org.value}\nNeeds: ${needs}\n\n${form.elements.message.value}`;
    location.href = `mailto:hello@asiinnovexa.com?subject=${encodeURIComponent('New enquiry from ' + name.value)}&body=${encodeURIComponent(body)}`;
    $('[data-form-done]', form).hidden = false;
  });

  /* ---------- Hero parallax + one scroll loop for everything scroll-linked ---------- */
  const heroImg = $('.hero__img');
  const onScroll = () => {
    const y = scrollY;
    onScrollNav(y);
    updateWords();
    updateApproach();
    if (!reduced && y < innerHeight * 1.2 && hero.classList.contains('is-done')) heroImg.style.transform = `translate3d(0, ${y * .18}px, 0) scale(1.02)`;
  };
  if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { sizeApproach(); onScroll(); });
  addEventListener('load', () => { sizeApproach(); onScroll(); lenis && lenis.resize(); });
  sizeApproach(); onScroll();

  $('[data-year]').textContent = new Date().getFullYear();
})();
