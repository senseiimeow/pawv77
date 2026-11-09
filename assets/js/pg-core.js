/* =========================================================
   PAWGRAM v3 · CORE ENGINE  (window.PG)
   ---------------------------------------------------------
   One file, no dependencies. Everything is defensive: any
   element that is missing is simply skipped.

   Modules
   0. utils / storage / device
   1. theme (night ⇄ day) + reduce-motion
   2. sound (tiny WebAudio synth, off by default)
   3. loader (battery 4% → 100%)
   4. paw cursor + petal trail + tap ripples
   5. nav (hide on scroll, drawer, page transitions)
   6. scroll progress + reveals + counters + magnetic
   7. toasts + achievements + confetti
   8. easter eggs (logo×5 storm, Konami rain, type "mochi")
   9. story data (chapters, progress, reactions) + misc
   ========================================================= */
(function (w, d) {
  'use strict';

  /* ================= 0 · utils ================= */
  var $  = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var on = function (el, ev, fn, opt) { if (el) el.addEventListener(ev, fn, opt || false); };
  var raf = w.requestAnimationFrame.bind(w);
  var now = function () { return performance.now(); };
  var reduceQuery = w.matchMedia('(prefers-reduced-motion: reduce)');
  var touch = w.matchMedia('(hover: none)').matches;

  /* safe storage (sandboxed iframes may block it) */
  var mem = {};
  var store = {
    get: function (k, fb) {
      try { var v = localStorage.getItem(k); if (v !== null) return v; } catch (e) {}
      return k in mem ? mem[k] : fb;
    },
    set: function (k, v) {
      mem[k] = String(v);
      try { localStorage.setItem(k, v); } catch (e) {}
    },
    getJSON: function (k, fb) {
      try { return JSON.parse(store.get(k, '')) || fb; } catch (e) { return fb; }
    },
    setJSON: function (k, v) { store.set(k, JSON.stringify(v)); }
  };

  var PG = w.PG = {
    $: $, $$: $$, clamp: clamp, lerp: lerp, rnd: rnd, on: on,
    store: store, touch: touch,
    reduce: reduceQuery.matches || store.get('pg-rm', '0') === '1',
    haptic: function (ms) { try { if (navigator.vibrate && store.get('pg-sound-th', '') !== 'off') navigator.vibrate(ms || 12); } catch (e) {} }
  };

  /* ================= 1 · theme + motion prefs ================= */
  function applyTheme(t) {
    d.documentElement.setAttribute('data-theme', t === 'day' ? 'day' : 'night');
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'day' ? '#fdf4ec' : '#0a0710');
    $$('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', t === 'day' ? 'true' : 'false');
      b.title = t === 'day' ? 'Switch to Tokyo 2 AM' : 'Switch to sakura afternoon';
    });
  }
  applyTheme(store.get('pg-theme', 'night'));
  PG.setTheme = function (t) { store.set('pg-theme', t); applyTheme(t); PG.storm(t === 'day' ? 26 : 18); };
  PG.toggleTheme = function () { PG.setTheme(d.documentElement.getAttribute('data-theme') === 'day' ? 'night' : 'day'); };

  function applyMotion() {
    d.documentElement.classList.toggle('reduce-motion', !!PG.reduce);
    $$('[data-motion-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', PG.reduce ? 'true' : 'false');
    });
  }
  applyMotion();
  PG.setReduce = function (v) {
    PG.reduce = !!v; store.set('pg-rm', v ? '1' : '0'); applyMotion();
    PG.toast(v ? 'Calm mode on' : 'Motion on', v ? 'animations eased for comfort' : 'bouncy again', '🌙');
  };
  PG.toggleReduce = function () { PG.setReduce(!PG.reduce); };

  /* ================= 2 · sound (synth, opt-in) ================= */
  var actx = null, soundOn = store.get('pg-sound', '0') === '1';
  function ac() {
    if (!actx) {
      var C = w.AudioContext || w.webkitAudioContext;
      if (!C) return null;
      actx = new C();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  var SOUNDS = {
    pop:    [[520, 0.06, 'triangle'], [780, 0.07, 'sine']],
    click:  [[300, 0.045, 'square']],
    chime:  [[880, 0.09, 'sine'], [1320, 0.16, 'sine']],
    petal:  [[1200, 0.05, 'sine'], [1600, 0.05, 'sine']],
    coin:   [[988, 0.06, 'square'], [1319, 0.12, 'square']],
    splash: [[180, 0.12, 'sawtooth']],
    win:    [[660, 0.1, 'triangle'], [880, 0.1, 'triangle'], [1320, 0.22, 'triangle']],
    error:  [[220, 0.09, 'sawtooth'], [160, 0.14, 'sawtooth']]
  };
  PG.sfx = function (name) {
    if (!soundOn) return;
    var ctx = ac(); if (!ctx) return;
    var seq = SOUNDS[name] || SOUNDS.click, t = ctx.currentTime;
    seq.forEach(function (n, i) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = n[2]; o.frequency.value = n[0];
      var st = t + i * 0.055;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.11, st + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, st + n[1] + 0.12);
      o.connect(g); g.connect(ctx.destination);
      o.start(st); o.stop(st + n[1] + 0.16);
    });
  };
  PG.soundOn = function () { return soundOn; };
  PG.setSound = function (v) {
    soundOn = !!v; store.set('pg-sound', v ? '1' : '0');
    $$('[data-sound-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', v ? 'true' : 'false');
      b.classList.toggle('on', !!v);
    });
    if (v) { ac(); PG.sfx('chime'); }
    PG.toast(v ? 'Sound on' : 'Sound off', v ? 'konbini door chime, gently' : 'silent mode', v ? '🔊' : '🔇');
  };
  PG.toggleSound = function () { PG.setSound(!soundOn); };
  $$('[data-sound-toggle]').forEach(function (b) {
    b.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    b.classList.toggle('on', soundOn);
  });

  /* ================= 3 · loader ================= */
  function bootLoader() {
    var el = $('#loader'); if (!el) return;
    var cells = $$('.lcell', el), pct = $('.lpct', el), msg = $('.lmsg', el), walk = $('.lpawwalk', el);
    var MSGS = [
      'loading the city… it is 2:47 AM',
      'charging a phone that is at 4%',
      'untangling the coral thread',
      'waking up Mochi (dangerous)',
      'stocking machine #12 with corn soup',
      'warming the vending machines',
      'counting 27 frames, no deletes',
      'putting paw stickers on everything',
      'asking the sakura to hurry up'
    ];
    var i = 0, mi = Math.floor(Math.random() * MSGS.length), p = 0, done = false;
    if (walk) {
      for (var k = 0; k < 7; k++) {
        var pz = d.createElement('i');
        pz.style.animationDelay = (-k * 0.49) + 's';
        pz.style.bottom = (k % 2 ? 8 : 0) + 'px';
        walk.appendChild(pz);
      }
    }
    if (msg) msg.textContent = MSGS[mi];
    var msgTimer = setInterval(function () {
      mi = (mi + 1) % MSGS.length;
      if (msg) { msg.style.opacity = 0; setTimeout(function () { msg.textContent = MSGS[mi]; msg.style.opacity = 1; }, 220); }
    }, 1150);

    function paint(v) {
      v = clamp(Math.round(v), 0, 100);
      if (pct) pct.textContent = v + '%';
      var lit = Math.round(v / 100 * cells.length);
      cells.forEach(function (c, idx) {
        c.classList.toggle('on', idx < lit);
        c.classList.toggle('low', v < 22);
      });
    }
    var timer = setInterval(function () {
      p = Math.min(p + (p < 62 ? 7.5 : p < 90 ? 3.2 : 1.1), 97);
      paint(p);
    }, 95);

    function finish() {
      if (done) return; done = true;
      clearInterval(timer); clearInterval(msgTimer);
      paint(100);
      if (msg) msg.textContent = 'see you offline.';
      setTimeout(function () {
        el.classList.add('done');
        d.documentElement.classList.remove('pg-lock');
        d.body.style.overflow = '';
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
        PG.emit('pg:loaded');
      }, 460);
    }
    d.documentElement.classList.add('pg-lock');
    PG.stopLoader = finish;
    if (d.readyState === 'complete') setTimeout(finish, 820);
    else { w.addEventListener('load', function () { setTimeout(finish, 420); }); }
    setTimeout(finish, 5200);                       /* never trap anyone */
    on($('.lskip', el), 'click', finish);
  }

  /* tiny event bus */
  var listeners = {};
  PG.onEvt = function (n, f) { (listeners[n] = listeners[n] || []).push(f); };
  PG.emit = function (n, v) { (listeners[n] || []).forEach(function (f) { try { f(v); } catch (e) {} }); };

  /* ================= 4 · cursor ================= */
  var PAW_SVG = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#ff5f7e"/><stop offset="1" stop-color="#ffd166"/></linearGradient></defs>' +
    '<ellipse cx="12" cy="15.4" rx="5.1" ry="4.1" fill="url(#cg)"/>' +
    '<ellipse cx="5.6" cy="10.2" rx="2.05" ry="2.6" fill="url(#cg)"/>' +
    '<ellipse cx="9.7" cy="6.6" rx="2" ry="2.55" fill="url(#cg)"/>' +
    '<ellipse cx="14.6" cy="6.6" rx="2" ry="2.55" fill="url(#cg)"/>' +
    '<ellipse cx="18.5" cy="10.2" rx="2.05" ry="2.6" fill="url(#cg)"/></svg>';

  function bootCursor() {
    if (touch || PG.reduce) return;
    d.documentElement.classList.add('has-cursor');
    var cur = d.createElement('div');
    cur.id = 'cursor'; cur.innerHTML = PAW_SVG + '<span class="lbl">read</span>';
    d.body.appendChild(cur);
    var trailLayer = d.createElement('div'); trailLayer.id = 'cursor-trail';
    d.body.appendChild(trailLayer);

    var mx = w.innerWidth / 2, my = w.innerHeight / 2, cx = mx, cy = my, lastPetal = 0;
    var label = $('.lbl', cur);

    on(w, 'mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      var t = e.target, mode = '';
      var host = t.closest && t.closest('[data-cursor]');
      if (host) mode = host.getAttribute('data-cursor');
      else if (t.closest && (t.closest('a,button,.btn,.chip,.chip-st'))) mode = '';
      if (mode !== (cur.dataset.mode || '')) {
        cur.dataset.mode = mode;
        if (mode && mode !== 'heart') { label.textContent = mode; cur.classList.add('show-lbl'); }
        else cur.classList.remove('show-lbl');
      }
      /* petal trail */
      var t2 = now();
      if (t2 - lastPetal > 58 && !PG.reduce) {
        lastPetal = t2;
        var p = d.createElement('i');
        p.style.left = mx + rnd(-6, 6) + 'px';
        p.style.top = my + rnd(-6, 6) + 'px';
        var sz = rnd(5, 11);
        p.style.width = p.style.height = sz + 'px';
        p.style.background = ['#ffb7c5', '#ff5f7e', '#ffd166', '#b9a7ff'][Math.floor(Math.random() * 4)];
        trailLayer.appendChild(p);
        var st = now(), dx = rnd(-26, 26), dy = rnd(10, 44), sc = rnd(.3, .9);
        (function fall(t0) {
          var k = (now() - t0) / 720;
          if (k >= 1) { p.remove(); return; }
          p.style.transform = 'translate(' + dx * k + 'px,' + dy * k + 'px) rotate(' + k * 320 + 'deg) scale(' + (1 - sc * k) + ')';
          p.style.opacity = (1 - k) * 0.85;
          raf(function () { fall(t0); });
        })(st);
      }
    }, { passive: true });

    on(d, 'mousedown', function () { cur.style.scale = '.82'; PG.sfx('click'); });
    on(d, 'mouseup', function () { cur.style.scale = ''; });

    (function loop() {
      cx = lerp(cx, mx, 0.32); cy = lerp(cy, my, 0.32);
      cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      raf(loop);
    })();

    /* tap ripples everywhere (also used on touch devices) */
    on(d, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && !e.target.closest('[data-cursor="play"],.btn')) return;
      var r = d.createElement('span');
      r.className = 'ripple';
      r.style.left = (e.clientX - 6) + 'px'; r.style.top = (e.clientY - 6) + 'px';
      r.style.borderColor = ['#ffb7c5', '#7ef0d0', '#ffd166'][Math.floor(Math.random() * 3)];
      d.body.appendChild(r);
      setTimeout(function () { r.remove(); }, 640);
    }, { passive: true });
  }

  /* ================= 5 · nav ================= */
  function bootNav() {
    var nav = $('header.nav'), burger = $('.burger'), drawer = $('#drawer');
    var lastY = w.scrollY, ticking = false;
    function onScroll() {
      var y = w.scrollY, dy = y - lastY;
      if (nav) {
        nav.classList.toggle('solid', y > 60);
        if (Math.abs(dy) > 6) {
          nav.classList.toggle('hide', dy > 0 && y > 220 && !(drawer && drawer.classList.contains('open')));
          lastY = y;
        }
      }
      ticking = false;
    }
    on(w, 'scroll', function () { if (!ticking) { ticking = true; raf(onScroll); } }, { passive: true });
    onScroll();

    function setDrawer(open) {
      if (!drawer) return;
      drawer.classList.toggle('open', open);
      if (burger) { burger.classList.toggle('open', open); burger.setAttribute('aria-expanded', open ? 'true' : 'false'); }
      d.documentElement.classList.toggle('pg-lock', open);
      d.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        PG.sfx('pop'); PG.haptic(10);
        var first = $('a.dlink', drawer); if (first) setTimeout(function () { first.focus(); }, 320);
      }
    }
    PG.closeDrawer = function () { setDrawer(false); };
    on(burger, 'click', function () { setDrawer(!drawer.classList.contains('open')); });
    on(drawer, 'click', function (e) {
      if (e.target.closest('a') || e.target.classList.contains('dclose')) setDrawer(false);
    });
    on(d, 'keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });

    /* page transition: petal/thread wipe before internal navigation */
    var veil = d.createElement('div');
    veil.id = 'veil';
    veil.innerHTML = '<span class="veil-paw">🐾</span>';
    d.body.appendChild(veil);
    var inPages = /\/|index\.html$/;
    on(d, 'click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || a.target === '_blank' || a.hasAttribute('download')) return;
      if (/^(#|mailto:|tel:|javascript:)/.test(href) || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (!/\.html/.test(href)) return;
      if (PG.reduce) return;
      e.preventDefault();
      d.documentElement.classList.add('veil-on');
      veil.classList.add('on');
      PG.sfx('petal');
      setTimeout(function () { w.location.href = href; }, 420);
    });
    w.addEventListener('pageshow', function () { veil.classList.remove('on'); d.documentElement.classList.remove('veil-on'); });
  }

  /* ================= 6 · scroll systems ================= */
  function bootScroll() {
    var prog = $('#prog');
    var io = 'IntersectionObserver' in w ? new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }) : null;

    PG.observeReveals = function (root) {
      var els = $$('.rv', root || d);
      els.forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); });
      return els;
    };
    PG.observeReveals();

    /* progress bar */
    var raf2 = null;
    on(w, 'scroll', function () {
      if (raf2) return;
      raf2 = raf(function () {
        raf2 = null;
        var h = d.documentElement.scrollHeight - w.innerHeight;
        if (prog) prog.style.width = (h > 0 ? (w.scrollY / h) * 100 : 0) + '%';
      });
    }, { passive: true });

    /* count-up */
    var counters = $$('[data-count]');
    if (counters.length && 'IntersectionObserver' in w) {
      var cio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target, target = parseFloat(el.dataset.count) || 0, t0 = now();
          if (PG.reduce) { el.textContent = target; cio.unobserve(el); return; }
          (function step(t) {
            var k = clamp((t - t0) / 1200, 0, 1), ez = 1 - Math.pow(1 - k, 3);
            el.textContent = Math.round(target * ez);
            if (k < 1) raf(step); else el.textContent = target;
          })(t0);
          cio.unobserve(el);
        });
      }, { threshold: 0.5 });
      counters.forEach(function (c) { cio.observe(c); });
    }

    /* magnetic buttons */
    if (!touch && !PG.reduce) {
      $$('[data-magnet],.btn').forEach(function (b) {
        on(b, 'mousemove', function (e) {
          var r = b.getBoundingClientRect();
          var dx = (e.clientX - r.left - r.width / 2) / r.width;
          var dy = (e.clientY - r.top - r.height / 2) / r.height;
          b.style.transform = 'translate(' + (dx * 9).toFixed(1) + 'px,' + (dy * 6).toFixed(1) + 'px)';
        });
        on(b, 'mouseleave', function () { b.style.transform = ''; });
      });
      /* 3D tilt */
      $$('[data-tilt]').forEach(function (card) {
        var base = card.dataset.tilt || 8;
        on(card, 'mousemove', function (e) {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
          card.style.transform = 'perspective(1000px) rotateY(' + (px * base) + 'deg) rotateX(' + (-py * base) + 'deg) translateY(-4px)';
        });
        on(card, 'mouseleave', function () { card.style.transform = ''; });
      });
    }

    /* click sfx for interactive bits */
    on(d, 'click', function (e) {
      if (e.target.closest('.btn,.chip,.chip-st,.iconbtn,.sticker,.qopt,.kitem')) PG.sfx('pop');
    });
  }

  /* ================= 7 · toasts / achievements / confetti ================= */
  function toast(title, sub, icon, cls) {
    var host = $('#toasts');
    if (!host) { host = d.createElement('div'); host.id = 'toasts'; d.body.appendChild(host); }
    var t = d.createElement('div');
    t.className = 'toast in' + (cls ? ' ' + cls : '');
    t.innerHTML = '<span class="ti">' + (icon || '🐾') + '</span><span>' + title +
      (sub ? '<small>' + sub + '</small>' : '') + '</span>';
    host.appendChild(t);
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 500); }, 3600);
  }
  PG.toast = toast;

  var BADGES = {
    'night-owl':    { icon: '🌙', title: 'Night Owl',        sub: 'reading after 1 AM. of course.' },
    'first-read':   { icon: '📖', title: 'Chapter 1 opened', sub: 'the thread starts here' },
    'thread-weaver':{ icon: '🧵', title: 'Thread Weaver',    sub: 'you replied in the chat' },
    'mochi-lover':  { icon: '🐱', title: 'Mochi Lover',      sub: 'the cat approves' },
    'frames27':     { icon: '🎞️', title: '27 Frames',        sub: 'you played Frame 27' },
    'arcade':       { icon: '🕹️', title: 'Arcade Rat',       sub: 'all six cabinets touched' },
    'archivist':    { icon: '🏆', title: 'Thread Archivist', sub: 'a perfect quiz score' },
    'seasonal':     { icon: '🌸', title: 'Season Changer',   sub: 'you dragged Sept → April' },
    'explorer':     { icon: '🐾', title: 'Sticker Maker',    sub: 'you threw every motif sticker' },
    'streak':       { icon: '🔥', title: 'Streak Builder',   sub: 'five right taps in a row' },
    'paw-fav':      { icon: '🏮', title: 'Cabinet Full',     sub: '13 frames of the show' },
    'hanabi':       { icon: '🎆', title: 'Word You Know',    sub: 'you typed hanabi' },
    'monogatari':   { icon: '🎇', title: 'Waited for the Finale', sub: 'you stayed through Act X' }
  };
  PG.unlock = function (id) {
    var got = store.getJSON('pg-badges', []);
    if (got.indexOf(id) > -1) return false;
    got.push(id); store.setJSON('pg-badges', got);
    var b = BADGES[id] || { icon: '🐾', title: id, sub: '' };
    toast(b.title, b.sub, b.icon, 'badge');
    PG.sfx('win'); PG.haptic([12, 40, 12]);
    PG.confetti(28);
    PG.emit('pg:badge', id);
    return true;
  };
  PG.badges = function () { return store.getJSON('pg-badges', []); };
  PG.BADGES = BADGES;

  function confetti(n) {
    if (PG.reduce) return;
    var cv = $('#confetti');
    if (!cv) { cv = d.createElement('canvas'); cv.id = 'confetti'; d.body.appendChild(cv); }
    cv.width = w.innerWidth; cv.height = w.innerHeight;
    cv.classList.add('on');
    var ctx = cv.getContext('2d');
    var parts = [], COUNT = n || 90, colors = ['#ff5f7e', '#ffd166', '#7ef0d0', '#b9a7ff', '#ffb7c5', '#ffffff'];
    for (var i = 0; i < COUNT; i++) {
      parts.push({
        x: w.innerWidth / 2 + rnd(-120, 120), y: w.innerHeight * 0.55 + rnd(-40, 40),
        vx: rnd(-9, 9), vy: rnd(-16, -6), g: rnd(.28, .5), r: rnd(3, 8),
        c: colors[Math.floor(Math.random() * colors.length)], rot: rnd(0, 6.28), vr: rnd(-.3, .3), life: 1
      });
    }
    var t0 = now();
    (function frame() {
      var k = (now() - t0) / 1600;
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach(function (p) {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= .995; p.rot += p.vr; p.life = 1 - k;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = clamp(p.life, 0, 1); ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6); ctx.restore();
      });
      if (k < 1) raf(frame);
      else { ctx.clearRect(0, 0, cv.width, cv.height); cv.classList.remove('on'); }
    })();
  }
  PG.confetti = confetti;

  /* ================= 8 · easter eggs ================= */
  function storm(n) {
    var host = $('#petals');
    if (!host) { host = d.createElement('div'); host.id = 'petals'; host.className = 'petals-fx'; d.body.appendChild(host); }
    for (var i = 0; i < (n || 30); i++) {
      var p = d.createElement('i');
      p.className = 'storm-petal';
      p.style.left = rnd(0, 100) + 'vw';
      p.style.animationDelay = rnd(0, .6) + 's';
      p.style.animationDuration = rnd(2.4, 4.6) + 's';
      p.style.background = ['#ffb7c5', '#ffd9df', '#ff5f7e', '#b9a7ff'][Math.floor(Math.random() * 4)];
      var s = rnd(8, 16); p.style.width = s + 'px'; p.style.height = s + 'px';
      host.appendChild(p);
      setTimeout(function (el) { return function () { el.remove(); }; }(p), 5200);
    }
    PG.sfx('petal');
  }
  PG.storm = storm;


  /* the Konami scene is generated: a rainy Tokyo rooftop with one clear
     umbrella and a paw sticker on the handle (chapter 7, page 66) */
  function buildRainSecret() {
    var el = d.createElement('div');
    el.id = 'rainsecret';
    el.setAttribute('aria-hidden', 'true');
    var drops = '';
    for (var i = 0; i < 46; i++) {
      drops += '<i style="left:' + (Math.random() * 100).toFixed(2) + '%;animation-delay:' +
        (-Math.random() * 2.2).toFixed(2) + 's;animation-duration:' + (1.1 + Math.random() * 1.5).toFixed(2) +
        's;opacity:' + (.25 + Math.random() * .6).toFixed(2) + '"></i>';
    }
    el.innerHTML =
      '<div class="rs-rain">' + drops + '</div>' +
      '<div class="rs-moon"></div>' +
      '<div class="rs-sky"></div>' +
      '<div class="rs-card">' +
      '<svg class="rs-um" viewBox="0 0 120 120" fill="none" aria-hidden="true">' +
      '<defs><linearGradient id="rsg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#ff5f7e"/><stop offset=".5" stop-color="#ffb25e"/>' +
      '<stop offset="1" stop-color="#b9a7ff"/></linearGradient></defs>' +
      '<path d="M6 62c0-30 24-52 54-52s54 22 54 52c-9-9-18-9-27 0-9-9-18-9-27 0-9-9-18-9-27 0-9-9-18-9-27 0z" fill="url(#rsg)" opacity=".9"/>' +
      '<path d="M60 62v38c0 8 10 8 10 0" stroke="url(#rsg)" stroke-width="3.4" stroke-linecap="round"/>' +
      '</svg>' +
      '<p class="rs-k">▲ ▲ ▼ ▼ ◀ ▶ ◀ ▶ B A</p>' +
      '<h4>It is raining in chapter 7.</h4>' +
      '<p>One clear umbrella. Two people under it. A coral paw sticker still on the handle — ' +
      '“...he kept them.”</p>' +
      '<div class="rs-btns"><a class="btn" href="readers/Chapter_7_Reader.html">Read that page</a>' +
      '<button class="btn ghost" type="button" data-rs-close>Back to the story</button></div>' +
      '</div>';
    d.body.appendChild(el);
    on(el.querySelector('[data-rs-close]'), 'click', function () { el.classList.remove('on'); });
    on(el, 'click', function (e) { if (e.target === el) el.classList.remove('on'); });
    return el;
  }

  function bootEggs() {
    /* logo ×5 → sakura storm */
    var clicks = 0, ct = null;
    $$('.logo').forEach(function (l) {
      on(l, 'click', function (e) {
        clicks++;
        clearTimeout(ct);
        ct = setTimeout(function () { clicks = 0; }, 1400);
        if (clicks >= 5) {
          clicks = 0; e.preventDefault();
          storm(90); PG.toast('SAKURA STORM', 'you clicked the paw five times', '🌸');
          PG.unlock('explorer');
        }
      });
    });

    /* Konami → secret rainy umbrella scene */
    var seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    var pos = 0;
    on(d, 'keydown', function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === seq[pos]) {
        pos++;
        if (pos === seq.length) {
          pos = 0;
          var r = $('#rainsecret') || buildRainSecret();
          if (r) {
            r.classList.toggle('on');
            PG.toast(r.classList.contains('on') ? 'Secret: chapter 7 rain' : 'Rain stopped',
              r.classList.contains('on') ? 'a clear umbrella, and one paw sticker' : 'back to the story', '☂️');
          }
          PG.sfx('splash');
        }
      } else pos = (k === seq[0]) ? 1 : 0;
    });

    /* typing "mochi" → cat runs across */
    var typed = '';
    on(d, 'keydown', function (e) {
      if (e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-8);
      if (typed.indexOf('mochi') > -1) {
        typed = '';
        var cat = d.createElement('div');
        cat.className = 'mochi-run';
        cat.textContent = '🐈';
        cat.setAttribute('aria-hidden', 'true');
        d.body.appendChild(cat);
        setTimeout(function () { cat.remove(); }, 4600);
        PG.toast('Mochi ran across the screen', 'she does that', '🐾');
        PG.unlock('mochi-lover');
      }
    });
  }

  /* ================= 9 · story data + shared helpers ================= */
  PG.CHAPTERS = [
    { n: 1, slug: 'Low Battery',            when: 'September 5',  tag: 'Sept',  pages: 10, reader: 'readers/Chapter_1_Reader.html', wash: 'linear-gradient(160deg,#243b6b,#6b3f8f 60%,#ff6b6b)', emoji: '🔋' },
    { n: 2, slug: 'New Member',             when: 'September',    tag: 'Sept',  pages: 9,  reader: 'readers/Chapter_2_Reader.html', wash: 'linear-gradient(160deg,#7a4a1e,#e0a45a 65%,#ffd9a0)', emoji: '🐾' },
    { n: 3, slug: 'Direct Message',         when: 'October',      tag: 'Oct',   pages: 10, reader: 'readers/Chapter_3_Reader.html', wash: 'linear-gradient(160deg,#8a3b1e,#e07b3c 65%,#ffc08a)', emoji: '💬' },
    { n: 4, slug: 'Two Months of Midnight', when: 'November',     tag: 'Nov',   pages: 10, reader: 'readers/Chapter_4_Reader.html', wash: 'linear-gradient(160deg,#6b2f1f,#d99a3c 60%,#ffcf8f)', emoji: '🌙' },
    { n: 5, slug: 'Winter, Held Together',  when: 'Dec – Jan',    tag: 'Dec',   pages: 10, reader: 'readers/Chapter_5_Reader.html', wash: 'linear-gradient(160deg,#1d3a5c,#8fc7e8 65%,#ffe0b0)', emoji: '❄️' },
    { n: 6, slug: 'Counting Down to Spring',when: 'Feb – March',  tag: 'Feb',   pages: 10, reader: 'readers/Chapter_6_Reader.html', wash: 'linear-gradient(160deg,#5c2440,#e58ba8 65%,#ffd2dd)', emoji: '🌸' },
    { n: 7, slug: 'See You Offline',        when: 'April 4',      tag: 'Apr',   pages: 10, reader: 'readers/Chapter_7_Reader.html', wash: 'linear-gradient(160deg,#7a3550,#ffb7c5 60%,#bfe4ff)', emoji: '☂️' }
  ];
  PG.TOTAL_PAGES = PG.CHAPTERS.reduce(function (s, c) { return s + c.pages; }, 0);

  /* reading progress: { ch: percent } */
  PG.progress = function () { return store.getJSON('pg-progress', {}); };
  PG.setProgress = function (ch, pct) {
    var p = PG.progress(); p[ch] = Math.max(p[ch] || 0, Math.round(pct));
    store.setJSON('pg-progress', p);
  };
  PG.continueTarget = function () {
    var p = PG.progress(), best = null;
    PG.CHAPTERS.forEach(function (c) {
      var v = p[c.n] || 0;
      if (v > 2 && v < 97) best = { ch: c, pct: v };
    });
    if (best) return best;
    /* else the first unread chapter */
    for (var i = 0; i < PG.CHAPTERS.length; i++) if (!(p[PG.CHAPTERS[i].n] > 90)) return { ch: PG.CHAPTERS[i], pct: 0 };
    return { ch: PG.CHAPTERS[0], pct: 0 };
  };

  /* reaction counts (local, cosmetic) */
  PG.react = function (key) {
    var r = store.getJSON('pg-reactions', {});
    r[key] = (r[key] || 0) + 1; store.setJSON('pg-reactions', r);
    return r[key];
  };


  /* ================= 10 · the coral thread =================
     The signature motif: one SVG path pinned to the viewport that
     draws itself as you scroll and carries a paw bead at its head.
     Desktop only (phones get the section dividers instead). */
  function bootThread() {
    if (PG.reduce || w.innerWidth < 900 || d.body.dataset.thread === 'off') return;
    var NS = 'http://www.w3.org/2000/svg';
    var svg = d.createElementNS(NS, 'svg');
    svg.setAttribute('id', 'threadsvg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('preserveAspectRatio', 'none');
    var defs = d.createElementNS(NS, 'defs');
    defs.innerHTML = '<linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#ff5f7e"/><stop offset=".35" stop-color="#ffb25e"/>' +
      '<stop offset=".65" stop-color="#ffd166"/><stop offset=".85" stop-color="#7ef0d0"/>' +
      '<stop offset="1" stop-color="#b9a7ff"/></linearGradient>' +
      '<filter id="tglow" x="-50%" y="-10%" width="200%" height="120%">' +
      '<feGaussianBlur stdDeviation="2.4" result="b"/><feMerge>' +
      '<feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    var path = d.createElementNS(NS, 'path');
    path.setAttribute('d', 'M 76 0 C 22 180, 132 320, 70 520 S 12 820, 78 980 S 138 1180, 60 1400');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'url(#tg)');
    path.setAttribute('stroke-width', '2.2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('filter', 'url(#tglow)');
    path.setAttribute('opacity', '.85');
    var bead = d.createElementNS(NS, 'g');
    bead.innerHTML = '<circle r="7" fill="#fff" opacity=".9"/>' +
      '<circle r="12" fill="none" stroke="#ffb7c5" stroke-width="1.4" opacity=".7"/>' +
      '<text x="0" y="4" font-size="9" text-anchor="middle">🐾</text>';
    svg.appendChild(defs); svg.appendChild(path); svg.appendChild(bead);
    d.body.appendChild(svg);

    var len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    var p0 = path.getPointAtLength(0);
    bead.setAttribute('transform', 'translate(' + p0.x + ',' + p0.y + ')');

    function size() {
      svg.setAttribute('viewBox', '0 0 160 1400');
      svg.setAttribute('width', '160');
      svg.setAttribute('height', '100%');
    }
    size();
    w.addEventListener('resize', size);

    var rafT = null;
    function paint() {
      rafT = null;
      var h = d.documentElement.scrollHeight - w.innerHeight;
      var k = h > 0 ? clamp(w.scrollY / h, 0, 1) : 0;
      path.style.strokeDashoffset = len * (1 - k);
      var pt = path.getPointAtLength(len * k);
      bead.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
      bead.style.opacity = k > .01 && k < .999 ? 1 : 0;
    }
    w.addEventListener('scroll', function () {
      if (!rafT) rafT = raf(function () { paint(); });
    }, { passive: true });
    paint();
  }

  /* ================= boot ================= */
  function boot() {
    bootLoader();
    bootCursor();
    bootNav();
    bootScroll();
    bootEggs();
    bootThread();

    /* wire the chrome toggles that exist in the markup */
    $$('[data-theme-toggle]').forEach(function (b) { on(b, 'click', function () { PG.toggleTheme(); }); });
    $$('[data-sound-toggle]').forEach(function (b) { on(b, 'click', function () { PG.toggleSound(); }); });
    $$('[data-motion-toggle]').forEach(function (b) { on(b, 'click', function () { PG.toggleReduce(); }); });
    $$('[data-share]').forEach(function (b) {
      on(b, 'click', function () {
        var data = { title: b.dataset.shareTitle || d.title, text: b.dataset.shareText || '', url: b.dataset.shareUrl || w.location.href };
        if (navigator.share) navigator.share(data).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(data.url).then(function () { toast('Link copied', 'go make someone read it', '🔗'); });
      });
    });

    /* night owl badge */
    var h = new Date().getHours();
    if (h >= 1 && h < 5) setTimeout(function () { PG.unlock('night-owl'); }, 2600);

    /* install prompt (kept from v2) */
    var deferred = null;
    w.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); deferred = e;
      $$('#installBtn,[data-install]').forEach(function (b) {
        b.hidden = false;
        on(b, 'click', function () { b.hidden = true; if (deferred) deferred.prompt(); });
      });
    });

    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      w.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
    }
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* publish after boot for modules that load later */
  PG.ready = boot;
})(window, document);
