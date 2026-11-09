/* =========================================================
   PAWGRAM v3 · PAWFAV · hanabi night (花火 Fav)
   Canvas fireworks engine + 10-act show + participation layers.
   ES5-flavoured vanilla JS, prefixed pf- / PF / pg-pawfav-*.
   Depends on window.PG (pg-core.js). Zero external assets.
   ========================================================= */
(function (w, d, PG) {
  'use strict';
  if (!PG) return;

  var $ = PG.$, $$ = PG.$$, on = PG.on, clamp = PG.clamp, lerp = PG.lerp, rnd = PG.rnd;
  var store = PG.store, sfx = PG.sfx, toast = PG.toast, unlock = PG.unlock, confetti = PG.confetti;
  var reduce = PG.reduce, haptic = PG.haptic, observeReveals = PG.observeReveals;

  /* ---------- config / tokens ---------- */
  var PF = w.PF = {};
  PF.SECTION_ID = 'pawfav';
  PF.STORAGE_KEY = 'pg-pawfav';
  PF.FRAMES_KEY = 'pg-pawfav-frames';
  PF.WISHES_KEY = 'pg-pawfav-wishes';
  PF.MAX_FRAMES = 27;
  PF.TOTAL_ACTS = 10;
  PF.SHOW_DURATION_MS = 12 * 60 * 1000; /* target ~12-13 min */

  /* brand palette */
  var C = {
    gold: ['#ffd166', '#ffb25e'],
    coral: ['#ff5f7e', '#e0435f'],
    sakura: ['#ffb7c5', '#ffd9df'],
    lav: ['#b9a7ff', '#8fd0ff'],
    mint: ['#7ef0d0', '#4fd1c5'],
    sky: ['#8fd0ff', '#6fb4e8'],
    white: ['#fff8f0', '#e8e2d8']
  };

  /* ---------- device / tier ---------- */
  var isTouch = w.matchMedia('(hover: none)').matches;
  var isMobile = w.innerWidth <= 820;
  var MAX_PARTS = isTouch ? 700 : 1800;
  var DPR = Math.min(w.devicePixelRatio || 1, 1.6);
  var wind = { x: 0, y: 0 };
  var gravity = 0.16;

  /* ---------- audio synth (lazy, user gesture only) ---------- */
  var actx = null, master = null;
  function audioCtx() {
    if (!actx) {
      var Ctx = w.AudioContext || w.webkitAudioContext;
      if (!Ctx) return null;
      actx = new Ctx();
      master = actx.createGain();
      master.gain.value = 0.22;
      master.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, dur, type, when, vol) {
    var ctx = audioCtx(); if (!ctx) return;
    var t = when || ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function sfxLaunch() {
    if (!PG.soundOn()) return;
    var ctx = audioCtx(); if (!ctx) return;
    var t = ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(500, t);
    o.frequency.exponentialRampToValueAtTime(1500, t + 0.8);
    g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.85);
  }
  function sfxBoom(size) {
    if (!PG.soundOn()) return;
    var ctx = audioCtx(); if (!ctx) return;
    var t = ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(35, t + 0.35);
    g.gain.setValueAtTime(0.12 * (size || 1), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.4);
  }
  function sfxCrackle(dur) {
    if (!PG.soundOn()) return;
    var ctx = audioCtx(); if (!ctx) return;
    var t = ctx.currentTime, end = t + dur;
    (function pop() {
      if (ctx.currentTime >= end) return;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(rnd(400, 1600), ctx.currentTime);
      g.gain.setValueAtTime(0.02, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      o.connect(g); g.connect(master);
      o.start(); o.stop(ctx.currentTime + 0.05);
      setTimeout(pop, rnd(40, 140));
    })();
  }
  function actFlourish() {
    if (!PG.soundOn()) return;
    var ctx = audioCtx(); if (!ctx) return;
    var t = ctx.currentTime;
    [660, 880, 1320].forEach(function (f, i) {
      tone(f, 0.18, 'sine', t + i * 0.09, 0.09);
    });
  }

  /* ---------- particle pool ---------- */
  var pool = [], poolUsed = 0;
  function getParticle() {
    var p;
    if (poolUsed < pool.length) { p = pool[poolUsed]; }
    else { p = { x:0,y:0,vx:0,vy:0,life:1,maxlife:1,c:'#fff',g:0.16,r:2,tw:0,phase:0 }; pool.push(p); }
    poolUsed++;
    return p;
  }
  function resetPool() { poolUsed = 0; }

  /* ---------- shell registry ---------- */
  var SHELLS = {};

  function burst(x, y, type, colors, count, opts) {
    opts = opts || {};
    var i, p, angle, sp, life, r;
    for (i = 0; i < count; i++) {
      p = getParticle();
      p.x = x; p.y = y;
      p.c = colors[i % colors.length];
      p.r = opts.r || rnd(1.5, 3);
      p.life = 1; p.maxlife = opts.life || rnd(1.2, 2.6);
      p.g = opts.gravity || gravity;
      p.tw = opts.twinkle ? rnd(0, 6.28) : 0;
      p.phase = rnd(0, 6.28);
      if (type === 'kiku') {
        angle = rnd(0, 6.28); sp = rnd(1.2, 3.4);
        p.vx = Math.cos(angle) * sp; p.vy = Math.sin(angle) * sp;
      } else if (type === 'botan') {
        angle = rnd(0, 6.28); sp = rnd(1.6, 4.2);
        p.vx = Math.cos(angle) * sp * 0.9; p.vy = Math.sin(angle) * sp * 0.9;
        p.twinkle = true;
      } else if (type === 'yanagi') {
        angle = rnd(0, 6.28); sp = rnd(0.9, 1.8);
        p.vx = Math.cos(angle) * sp * 0.5; p.vy = Math.sin(angle) * sp * 1.4;
        p.life = 1; p.maxlife = rnd(3.4, 5.2); p.g = gravity * 0.45; p.r = rnd(2.2, 4);
      } else if (type === 'kamuro') {
        angle = rnd(0, 6.28); sp = rnd(0.7, 1.4);
        p.vx = Math.cos(angle) * sp * 0.4; p.vy = Math.sin(angle) * sp * 0.8;
        p.life = 1; p.maxlife = rnd(4.2, 6.4); p.g = gravity * 0.3; p.r = rnd(1.4, 2.4); p.tw = rnd(0, 6.28);
      } else if (type === 'crossette') {
        angle = rnd(0, 6.28); sp = rnd(2.4, 4.6);
        p.vx = Math.cos(angle) * sp; p.vy = Math.sin(angle) * sp;
        p.split = true; p.splitTime = rnd(0.4, 0.7);
      } else if (type === 'palm') {
        angle = rnd(-0.8, 0.8); sp = rnd(2.0, 3.6);
        p.vx = Math.cos(angle) * sp; p.vy = Math.sin(angle) * sp * 0.6;
        p.r = rnd(2.6, 4.2);
      } else if (type === 'ring' || type === 'heart' || type === 'star') {
        p.shape = type; p.vx = 0; p.vy = 0;
      }
      p.strobe = type === 'strobo';
    }
  }

  /* ---------- shell instances ---------- */
  var shells = [], rockets = [];
  function launch(x, y, toX, toY, type, colors, opts) {
    var r = { x: x, y: y, tx: toX, ty: toY, vx: 0, vy: 0, life: 1, type: type, colors: colors, opts: opts || {} };
    var dx = toX - x, dy = toY - y, dist = Math.sqrt(dx * dx + dy * dy);
    var t = dist / 11;
    r.vx = dx / t; r.vy = dy / t;
    r.ttl = t;
    rockets.push(r);
    sfxLaunch();
  }

  /* ---------- stage elements (drawn by JS on canvas) ---------- */
  var stars = [];
  function initStars() {
    stars = [];
    var n = isTouch ? 40 : 90;
    for (var i = 0; i < n; i++) {
      stars.push({ x: rnd(0, w.innerWidth), y: rnd(0, w.innerHeight * 0.55), r: rnd(0.5, 1.6), p: rnd(0, 6.28) });
    }
  }

  /* ---------- director state ---------- */
  var state = {
    act: 0,           /* 0 = not started, 1..10 = acts, 11 = encore */
    acted: [],        /* acts watched */
    visits: 0,
    lastSeen: 0,
    launchedByUser: 0,
    cameraFrames: store.getJSON(PF.FRAMES_KEY, []),
    wishes: store.getJSON(PF.WISHES_KEY, []),
    started: false,
    paused: false,
    clock: 0,
    actStart: 0,
    actTimeLeft: 0,
    moonTaps: 0,
    moonGold: false,
    hanabiEgg: false,
    mochiEgg: false,
    cinema: false,
    poster: reduce
  };

  /* ---------- programme data ---------- */
  PF.programme = [
    { id: 1, jp: '点灯', name: 'TENJŌ', kicker: 'The Lighting', dur: 70,
      mix: ['kiku', 'botan'], colors: [C.amber ? ['#ffb25e', '#ffd166'] : ['#ffb25e', '#ffd166']],
      palette: ['#ffb25e', '#ffd166'] },
    { id: 2, jp: '五月雨', name: 'SAMAYAME', kicker: 'A Drizzle of Short Moments', dur: 75,
      mix: ['kiku', 'botan', 'crossette'], colors: [C.coral], palette: ['#ff5f7e', '#ffd166'] },
    { id: 3, jp: '野分', name: 'NOWAKI', kicker: 'Garage-wind Willows', dur: 90,
      mix: ['yanagi', 'kamuro'], colors: [C.gold], palette: ['#ffd166', '#fff8f0'] },
    { id: 4, jp: '山桜', name: 'YAMAZAKURA', kicker: 'Sakura Out of Season', dur: 75,
      mix: ['botan', 'strobo'], colors: [C.sakura], palette: ['#ffb7c5', '#ff5f7e'] },
    { id: 5, jp: '金銀', name: 'KINGIN', kicker: 'Gold & Silver Brocade', dur: 95,
      mix: ['kamuro', 'strobo'], colors: [C.gold, ['#cfd8ff']], palette: ['#ffd166', '#cfd8ff'] },
    { id: 6, jp: 'こくご', name: 'KOKORO', kicker: 'Written in the Sky', dur: 85,
      mix: ['heart', 'star', 'ring'], colors: [C.coral, C.lav], palette: ['#ff5f7e', '#b9a7ff'] },
    { id: 7, jp: '三重', name: 'MITSU', kicker: 'Three, Together', dur: 75,
      mix: ['crossette'], colors: [C.mint, C.lav], palette: ['#7ef0d0', '#b9a7ff'] },
    { id: 8, jp: '静音', name: 'SHIZUNE', kicker: 'The Quiet Act', dur: 65,
      mix: ['yanagi'], colors: [['#fff8f0']], palette: ['#fff8f0', '#e8e2d8'] },
    { id: 9, jp: '常夜', name: 'TOKYO', kicker: 'The Night That Stays', dur: 80,
      mix: ['kamuro'], colors: [C.gold], palette: ['#ffd166', '#ff5f7e'] },
    { id: 10, jp: '記憶', name: 'MONOGATARI', kicker: 'The Story Finale', dur: 100,
      mix: ['kiku', 'botan', 'kamuro', 'crossette', 'strobo'], colors: [C.gold, C.coral, C.lav, C.mint, C.sakura],
      palette: ['#ffd166', '#ff5f7e', '#b9a7ff', '#7ef0d0'] }
  ];

  /* dialogue script (in-character, lower-case, short) */
  PF.dialogue = {
    1: [
      { who: 'pragati', say: 'they start small. so you\'ll stay.' },
      { who: 'tejas', say: 'already staying.' }
    ],
    2: [
      { who: 'pragati', say: 'a hundred small endings, one after another — and nobody\'s sad.' },
      { who: 'tejas', say: 'that\'s the trick of it.' }
    ],
    3: [
      { who: 'pragati', say: 'the gold ones hang for four seconds. i read that on a festival poster.' },
      { who: 'tejas', say: 'you read everything the way you read me.' }
    ],
    4: [
      { who: 'pragati', say: 'pink. because april is the point.' },
      { who: 'tejas', say: 'you planned this colour.' },
      { who: 'pragati', say: 'i planned nothing. i just pay attention.' }
    ],
    5: [
      { who: 'tejas', say: '27 frames. the camera\'s full.' },
      { who: 'pragati', say: 'then keep them in your head. paper remembers what servers forget.' }
    ],
    6: [
      { who: 'pragati', say: 'that one wasn\'t in the programme.' },
      { who: 'tejas', say: 'read it twice.' }
    ],
    7: [
      { who: 'pragati', say: 'three at once. like the strays typing at 2 AM.' },
      { who: 'tejas', say: 'minus the panic.' }
    ],
    8: [
      { who: 'pragati', say: 'now the quiet one. my favourite.' },
      { who: 'tejas', say: 'you always pick the quiet one.' },
      { who: 'pragati', say: 'it\'s the one you can\'t screenshot.' }
    ],
    9: [
      { who: 'tejas', say: 'gold means stay. that\'s tonight\'s rule.' },
      { who: 'pragati', say: 'stay, then.' }
    ],
    10: [
      { who: 'pragati', say: 'next summer. same bridge.' },
      { who: 'tejas', say: 'it\'s a date. offline.' }
    ]
  };

  /* ---------- DOM refs (lazy) ---------- */
  var el = {
    section: null, stage: null, sky: null, water: null,
    actJp: null, actName: null, actProg: null, actTimer: null,
    dialog: null, chip: null, say: null, launch: null, launchDot: null,
    film: null, notes: null, camBtn: null, cinemaBtn: null, soundBtn: null, exitBtn: null
  };

  /* ---------- rendering ---------- */
  var skyCtx, waterCtx, skyW, skyH, waterH;
  var rafId = null, lastT = 0, showStartedT = 0;

  function resize() {
    if (!el.sky) return;
    var r = el.stage.getBoundingClientRect();
    skyW = r.width; skyH = r.height * 0.78; /* sky occupies top ~78% */
    waterH = r.height - skyH;
    var dpr = DPR;
    el.sky.width = Math.round(skyW * dpr); el.sky.height = Math.round(skyH * dpr);
    el.sky.style.width = skyW + 'px'; el.sky.style.height = skyH + 'px';
    skyCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    el.water.width = Math.round(skyW * dpr); el.water.height = Math.round(waterH * dpr);
    el.water.style.width = skyW + 'px'; el.water.style.height = waterH + 'px';
    el.water.style.top = skyH + 'px';
    waterCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initStars();
  }

  function drawSkyBg() {
    skyCtx.clearRect(0, 0, skyW, skyH);
    /* gradient sky */
    var g = skyCtx.createLinearGradient(0, 0, 0, skyH);
    g.addColorStop(0, '#0b1030'); g.addColorStop(0.55, '#1c1030'); g.addColorStop(1, '#2a1020');
    skyCtx.fillStyle = g; skyCtx.fillRect(0, 0, skyW, skyH);
    /* moon */
    var mx = skyW * 0.78, my = skyH * 0.22, mr = skyH * 0.07;
    var mg = skyCtx.createRadialGradient(mx, my, 0, mx, my, mr);
    mg.addColorStop(0, 'rgba(255,248,240,0.55)'); mg.addColorStop(1, 'rgba(255,248,240,0)');
    skyCtx.fillStyle = mg; skyCtx.beginPath(); skyCtx.arc(mx, my, mr, 0, 6.283); skyCtx.fill();
    skyCtx.strokeStyle = 'rgba(255,248,240,0.35)'; skyCtx.lineWidth = 1.5;
    skyCtx.beginPath(); skyCtx.arc(mx, my, mr * 1.05, 0, 6.283); skyCtx.stroke();
    /* stars */
    skyCtx.fillStyle = '#fff8f0';
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = 0.35 + Math.abs(Math.sin((lastT / 1000) * 1.2 + s.p)) * 0.5;
      skyCtx.globalAlpha = a;
      skyCtx.beginPath(); skyCtx.arc(s.x, s.y, s.r, 0, 6.283); skyCtx.fill();
    }
    skyCtx.globalAlpha = 1;
    /* skyline silhouette */
    skyCtx.fillStyle = '#0a0710';
    var base = skyH * 0.92, x = -40;
    while (x < skyW + 60) {
      var bw = 30 + Math.random() * 70;
      var bh = 40 + Math.random() * skyH * 0.28;
      skyCtx.fillRect(x, base - bh, bw, bh);
      x += bw + 4 + Math.random() * 12;
    }
    /* Skytree on right */
    var tx = skyW * 0.86, ty = base, th = skyH * 0.42;
    skyCtx.strokeStyle = '#ffb25e'; skyCtx.lineWidth = 2;
    skyCtx.beginPath();
    skyCtx.moveTo(tx - 20, ty); skyCtx.lineTo(tx - 6, ty - th * 0.75);
    skyCtx.moveTo(tx + 20, ty); skyCtx.lineTo(tx + 6, ty - th * 0.75);
    skyCtx.moveTo(tx, ty - th * 0.75); skyCtx.lineTo(tx, ty - th);
    skyCtx.stroke();
    skyCtx.fillStyle = '#ff5f7e';
    skyCtx.beginPath(); skyCtx.arc(tx, ty - th, 3, 0, 6.283); skyCtx.fill();
  }

  function drawWater() {
    waterCtx.clearRect(0, 0, skyW, waterH);
    /* surface gradient */
    var g = waterCtx.createLinearGradient(0, 0, 0, waterH);
    g.addColorStop(0, 'rgba(126,240,208,0.05)'); g.addColorStop(1, 'rgba(185,167,255,0.04)');
    waterCtx.fillStyle = g; waterCtx.fillRect(0, 0, skyW, waterH);
    /* ripple line */
    var t2 = lastT / 1000;
    waterCtx.strokeStyle = 'rgba(126,240,208,0.25)'; waterCtx.lineWidth = 1.2;
    waterCtx.beginPath();
    for (var x = 0; x <= skyW; x += 20) {
      var y = waterH * 0.35 + Math.sin(x * 0.015 + t2 * 1.8) * 6 + Math.cos(x * 0.022 + t2) * 4;
      if (x === 0) waterCtx.moveTo(x, y); else waterCtx.lineTo(x, y);
    }
    waterCtx.stroke();
  }

  function reflectBreak(x, y, colors) {
    if (y > skyH * 0.78) return;
    var wy = skyH + (skyH * 0.78 - y) * 0.55;
    var wx = x;
    for (var i = 0; i < (colors.length || 1); i++) {
      var c = colors[i % colors.length];
      waterCtx.globalAlpha = 0.18;
      waterCtx.fillStyle = c;
      waterCtx.beginPath(); waterCtx.arc(wx, wy, rnd(14, 28), 0, 6.283); waterCtx.fill();
    }
    waterCtx.globalAlpha = 1;
  }

  function drawParticles() {
    resetPool();
    /* update rockets */
    for (var i = rockets.length - 1; i >= 0; i--) {
      var r = rockets[i];
      r.x += r.vx; r.y += r.vy; r.vy += gravity * 0.5; r.ttl--;
      skyCtx.strokeStyle = '#fff8f0'; skyCtx.lineWidth = 1.4;
      skyCtx.beginPath(); skyCtx.moveTo(r.x, r.y); skyCtx.lineTo(r.x - r.vx * 0.6, r.y - r.vy * 0.6); skyCtx.stroke();
      if (r.ttl <= 0) {
        var cols = r.colors;
        var count = r.opts.count || (isTouch ? 60 : 110);
        burst(r.x, r.y, r.type, cols, count, r.opts);
        sfxBoom(r.opts.size || 1);
        if (r.type === 'crossette' || r.type === 'strobo') sfxCrackle(0.4);
        reflectBreak(r.x, r.y, cols);
        rockets.splice(i, 1);
      }
    }
    /* update particles */
    for (i = 0; i < poolUsed; i++) {
      var p = pool[i];
      var k = 1 - p.life / p.maxlife;
      if (k >= 1) continue;
      p.x += p.vx + wind.x * 0.4; p.y += p.vy + wind.y * 0.4; p.vy += p.g; p.vx *= 0.975;
      p.life -= 1 / 60;
      var a = clamp(p.life, 0, 1);
      var size = p.r * a;
      skyCtx.globalAlpha = a * 0.85;
      if (p.strobe) skyCtx.globalAlpha *= (Math.sin(lastT * 0.02 + p.phase) > 0 ? 1 : 0.25);
      if (p.tw) skyCtx.globalAlpha *= (0.5 + 0.5 * Math.sin(lastT * 0.015 + p.tw));
      skyCtx.fillStyle = p.c;
      if (p.shape === 'heart' || p.shape === 'star' || p.shape === 'ring') {
        /* parametric shapes drawn at burst center */
        continue;
      }
      skyCtx.beginPath(); skyCtx.arc(p.x, p.y, size, 0, 6.283); skyCtx.fill();
    }
    skyCtx.globalAlpha = 1;
  }

  function frame() {
    if (state.paused || !state.started) { rafId = w.requestAnimationFrame(frame); return; }
    var now = w.performance.now();
    var dt = Math.min((now - (lastT || now)) / 16.67, 2.4); lastT = now;
    if (!showStartedT) showStartedT = now;

    skyCtx.globalCompositeOperation = 'source-over';
    skyCtx.fillStyle = 'rgba(6, 4, 11, 0.13)';
    skyCtx.fillRect(0, 0, skyW, skyH);

    drawSkyBg();
    drawParticles();

    skyCtx.globalCompositeOperation = 'lighter';
    /* particle glow pass handled in drawParticles via alpha */
    skyCtx.globalCompositeOperation = 'source-over';

    drawWater();
    waterCtx.globalCompositeOperation = 'lighter';
    /* reflections drawn per break above */
    waterCtx.globalCompositeOperation = 'source-over';

    rafId = w.requestAnimationFrame(frame);
  }

  /* ---------- show timing ---------- */
  var actIndex = 0;
  function actDurationMs(act) { return act * 1000; }

  function startAct(n) {
    if (n > PF.TOTAL_ACTS) { startEncore(); return; }
    state.act = n;
    state.acted.push(n);
    state.actStart = w.performance.now();
    state.actTimeLeft = actDurationMs(actDurationMs(n) / 1000);
    var a = PF.programme[n - 1];
    updateActUI(a);
    playActFlourish(a);
    startDialogue(n);
    saveState();
    /* unlock finale badge */
    if (n === 10) unlock('monogatari');
    scheduleActShells(n);
  }

  function updateActUI(a) {
    if (!el.actJp) return;
    el.actJp.textContent = '「' + a.jp + '」';
    el.actName.textContent = a.kicker + ' · ' + a.name;
    if (el.actProg) {
      var i = el.actProg.querySelector('i');
      if (i) i.style.width = '0%';
    }
    if (el.actTimer) el.actTimer.textContent = 'Act ' + a.id + ' / ' + PF.TOTAL_ACTS;
  }

  function playActFlourish(a) {
    actFlourish();
    /* tint sky gradient by act palette - via custom prop on stage */
    if (el.stage) {
      el.stage.style.setProperty('--pf-tint', a.palette[0]);
    }
  }

  /* dialogue */
  var dialIdx = 0, dialTimer = null;
  function startDialogue(actNum) {
    stopDialogue();
    var lines = PF.dialogue[actNum] || [];
    if (!lines.length) return;
    dialIdx = 0;
    showDialogueLine(lines[0]);
    dialTimer = setInterval(function () {
      dialIdx++;
      if (dialIdx >= lines.length) { stopDialogue(); return; }
      showDialogueLine(lines[dialIdx]);
    }, 3900); /* 2.8s hold + 1.1s gap */
  }
  function showDialogueLine(line) {
    if (!el.dialog || !el.say) return;
    el.chip.className = 'pf-chip ' + line.who;
    el.chip.textContent = line.who === 'tejas' ? 'TEJAS' : 'PRAGATI';
    el.say.textContent = '';
    var text = line.say, ci = 0;
    function type() {
      if (ci < text.length) {
        el.say.textContent = text.slice(0, ci + 1);
        ci++;
        setTimeout(type, 24);
      }
    }
    type();
  }
  function stopDialogue() {
    if (dialTimer) { clearInterval(dialTimer); dialTimer = null; }
  }

  /* schedule shells for an act */
  function scheduleActShells(n) {
    var a = PF.programme[n - 1];
    var dur = a.dur * 1000;
    var t0 = w.performance.now();
    var scheduled = 0;
    var totalShells = n <= 3 ? 8 : n <= 6 ? 14 : n <= 8 ? 10 : 22;
    (function tick() {
      if (state.paused || state.act !== n) return;
      var elapsed = w.performance.now() - t0;
      if (elapsed >= dur) {
        /* act end */
        if (el.actProg) { var i = el.actProg.querySelector('i'); if (i) i.style.width = '100%'; }
        setTimeout(function () { startAct(n + 1); }, 900);
        return;
      }
      /* progress bar */
      if (el.actProg) { var i = el.actProg.querySelector('i'); if (i) i.style.width = (elapsed / dur * 100) + '%'; }
      if (el.actTimer) {
        var left = Math.ceil((dur - elapsed) / 1000);
        el.actTimer.textContent = 'Act ' + a.id + ' / ' + PF.TOTAL_ACTS + ' · ' + left + 's';
      }
      /* launch a shell */
      var type = a.mix[Math.floor(Math.random() * a.mix.length)];
      var colors = a.colors && a.colors[Math.floor(Math.random() * (a.colors.length || 1))] || ['#ffd166'];
      var x = rnd(skyW * 0.18, skyW * 0.82);
      var y = skyH * 0.62 + rnd(0, skyH * 0.18);
      var toY = skyH * 0.28 + rnd(0, skyH * 0.14);
      var isSig = (scheduled % 5 === 0);
      launch(x, skyH + 40, x, toY, type, colors, { count: isSig ? 140 : 90, size: isSig ? 1.3 : 1, sig: isSig });
      scheduled++;
      var nextGap = rnd(700, 1900);
      setTimeout(tick, nextGap);
    })();
  }

  function startEncore() {
    state.act = 11;
    if (el.actJp) el.actJp.textContent = '「安可」';
    if (el.actName) el.actName.textContent = 'ENCORE · the sky remembers you';
    if (el.actTimer) el.actTimer.textContent = 'Encore · minute 0';
    state.clock = 0;
    encCore();
  }
  var encMinute = 0, encTimer = null;
  function encCore() {
    if (encTimer) clearInterval(encTimer);
    encTimer = setInterval(function () {
      encMinute++;
      if (el.actTimer) el.actTimer.textContent = 'Encore · minute ' + encMinute;
      /* seed shift per minute */
    }, 60000);
    encLoop();
  }
  function encLoop() {
    if (state.paused || state.act !== 11) return;
    var seed = Date.now() + encMinute * 1000;
    var seeded = function () { var s = seed; return function () { s = (s * 16807 + 0) % 2147483647; return (s % 1000) / 1000; }; }();
    var typeList = ['kiku', 'botan', 'yanagi', 'kamuro', 'crossette', 'palm', 'strobo'];
    var type = typeList[Math.floor(seeded() * typeList.length)];
    var colors = [C.gold[Math.floor(seeded() * C.gold.length)], C.coral[Math.floor(seeded() * C.coral.length)], C.lav[Math.floor(seeded() * C.lav.length)]];
    colors = [colors[Math.floor(seeded() * colors.length)]];
    var x = rnd(skyW * 0.12, skyW * 0.88);
    var toY = skyH * 0.2 + rnd(0, skyH * 0.3);
    launch(x, skyH + 40, x, toY, type, colors, { count: 100, size: 1 });
    var gap = rnd(6000, 14000);
    setTimeout(encLoop, gap);
  }

  /* ---------- participation: free launch ---------- */
  var launchCooldown = false;
  function setupLaunch() {
    if (!el.launch) return;
    on(el.launch, 'click', function () {
      if (launchCooldown) return;
      launchCooldown = true;
      el.launch.classList.add('cool');
      el.launchDot.classList.add('hidden'); /* dot hidden during cooldown visually handled by class */
      /* launch from user tap point - use center of sky as target */
      var tx = skyW * 0.5, ty = skyH * 0.35;
      var fx = skyW * 0.5, fy = skyH + 40;
      var type = 'kiku';
      if (Math.random() < 0.2) type = 'botan';
      else if (Math.random() < 0.35) type = 'yanagi';
      else if (Math.random() < 0.5) type = 'crossette';
      launch(fx, fy, tx, ty, type, ['#ffd166', '#ff5f7e', '#b9a7ff'], { count: 100, size: 1 });
      state.launchedByUser++;
      saveState();
      if (state.launchedByUser === 3 && !state.mochiEgg) {
        toast('you\'re better at this than you think.', 'pragati noticed', '🐾');
      }
      setTimeout(function () {
        launchCooldown = false;
        el.launch.classList.remove('cool');
        if (!el.launch.classList.contains('hidden')) el.launchDot.classList.remove('hidden');
      }, 2400);
    });
    on(w, 'keydown', function (e) {
      if (e.key === 'Enter' && el.launch && document.activeElement === el.launch) {
        el.launch.click();
      }
    });
  }

  /* ---------- participation: Frame 27 camera ---------- */
  var signatureShells = [];
  function markSignature(x, y) {
    signatureShells.push({ x: x, y: y, t: w.performance.now() });
    setTimeout(function () {
      signatureShells = signatureShells.filter(function (s) { return s.t > w.performance.now() - 1500; });
    }, 1500);
  }
  function isNearSignature(x, y) {
    for (var i = 0; i < signatureShells.length; i++) {
      var s = signatureShells[i];
      if (Math.abs(s.x - x) < 90 && Math.abs(s.y - y) < 90 && w.performance.now() - s.t < 1500) return true;
    }
    return false;
  }
  function captureFrame() {
    if (!el.sky) return;
    var cx = skyW / 2, cy = skyH / 2;
    var near = isNearSignature(cx, cy);
    var img = new Image();
    img.src = el.sky.toDataURL('image/png');
    img.onload = function () {
      var c = d.createElement('canvas'); c.width = 96; c.height = 72;
      var cc = c.getContext('2d');
      cc.drawImage(img, 0, 0, 96, 72);
      var data = c.toDataURL('image/png');
      var frames = state.cameraFrames;
      frames.push({ src: data, t: new Date().toISOString() });
      if (frames.length > PF.MAX_FRAMES) frames.shift();
      state.cameraFrames = frames;
      store.setJSON(PF.FRAMES_KEY, frames);
      toast(near ? 'PERFECT — frame ' + frames.length + '/27' : 'caught — frame ' + frames.length + '/27',
        near ? 'mint flash' : 'bloom saved', near ? '✨' : '🎞️');
      if (near) sfx('coin'); else sfx('pop');
      if (frames.length >= 13) unlock('paw-fav');
      renderFilmStrip();
    };
  }
  function renderFilmStrip() {
    /* drawer content updated on open */
  }

  /* ---------- participation: tanzaku wishes ---------- */
  var wishesCanvas = null;
  function addTanzaku(text) {
    var w = d.createElement('div');
    w.className = 'pf-tanzaku';
    w.setAttribute('aria-hidden', 'true');
    var span = d.createElement('span');
    span.textContent = text;
    span.style.writingMode = 'vertical-rl';
    span.style.fontFamily = 'var(--font-hand)';
    span.style.fontSize = '14px';
    span.style.color = '#fff8f0';
    span.style.whiteSpace = 'pre';
    w.appendChild(span);
    el.stage.appendChild(w);
    var x = rnd(40, skyW - 120);
    w.style.left = x + 'px';
    w.style.top = (skyH + 40) + 'px';
    var ty = skyH * 0.35;
    var k = 0;
    (function float() {
      k += 0.022;
      w.style.top = (skyH + 40 - k * 60) + 'px';
      w.style.transform = 'translateX(' + Math.sin(k) * 12 + 'px)';
      if (skyH + 40 - k * 60 <= ty) {
        /* burst */
        var c = ['#ffd166', '#ff5f7e'];
        burst(x, ty, 'kamuro', c, 28, { count: 28, size: 2 });
        w.style.transition = 'top 1.6s var(--ease), opacity 1.6s';
        w.style.top = (skyH * 0.78) + 'px';
        w.style.opacity = 0;
        setTimeout(function () { w.remove(); }, 1600);
        return;
      }
      w.requestAnimationFrame ? w.requestAnimationFrame(float) : setTimeout(float, 16);
    })();
    /* store wish */
    var wishes = state.wishes;
    wishes.push({ text: text, t: new Date().toISOString() });
    if (wishes.length > 50) wishes.shift();
    state.wishes = wishes;
    store.setJSON(PF.WISHES_KEY, wishes);
  }

  /* ---------- cinema mode ---------- */
  function enterCinema() {
    state.cinema = true;
    el.section.classList.add('pf-cinema');
    el.exitBtn.style.display = 'block';
    if (el.stage.requestFullscreen) el.stage.requestFullscreen();
    w.addEventListener('keydown', escCinema);
    var idle = null;
    function resetIdle() { clearTimeout(idle); idle = setTimeout(function () { el.section.style.cursor = 'none'; }, 3000); }
    resetIdle();
    el.section.addEventListener('mousemove', function () { el.section.style.cursor = ''; resetIdle(); });
  }
  function exitCinema() {
    state.cinema = false;
    el.section.classList.remove('pf-cinema');
    el.exitBtn.style.display = 'none';
    if (d.exitFullscreen) d.exitFullscreen();
    w.removeEventListener('keydown', escCinema);
    el.section.style.cursor = '';
  }
  function escCinema(e) { if (e.key === 'Escape') exitCinema(); }

  /* ---------- eggs ---------- */
  function setupEggs() {
    /* hanabi typed egg */
    var typed = '';
    on(d, 'keydown', function (e) {
      if (e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-10);
      if (typed.indexOf('hanabi') > -1 && !state.hanabiEgg) {
        typed = ''; state.hanabiEgg = true;
        for (var i = 0; i < 6; i++) {
          var px = rnd(0, skyW), py = rnd(skyH * 0.2, skyH * 0.6);
          burst(px, py, 'strobo', [C.sakura[0], C.coral[0]], 30, { count: 30, size: 2 });
        }
        PG.storm(40);
        toast('HANABI!', 'you know the word', '🌸');
        unlock('hanabi');
      }
    });
    /* moon tap 3x */
    var moonTap = 0;
    /* moon is drawn on sky canvas; detect via click zone approx */
    on(el.sky, 'click', function (e) {
      var r = el.sky.getBoundingClientRect();
      var mx = (e.clientX - r.left) * DPR, my = (e.clientY - r.top) * DPR;
      var mmx = skyW * 0.78 * DPR, mmy = skyH * 0.22 * DPR, mr = skyH * 0.07 * DPR;
      if (Math.sqrt((mx - mmx) * (mx - mmx) + (my - mmy) * (my - mmy)) < mr * 1.5) {
        moonTap++;
        if (moonTap >= 3) {
          state.moonGold = true;
          toast('the moon approves', 'gold forever tonight', '🌕');
          setTimeout(function () { state.moonGold = false; }, 60000);
        }
      }
    }, { passive: true });
    /* mochi tap */
    on(el.stage, 'click', function (e) {
      var target = e.target.closest('.pf-mochi');
      if (target) {
        if (!state.mochiEgg) {
          state.mochiEgg = true;
          toast('that itinerary is mine.', 'mochi yawned', '🐱');
        }
      }
    }, { passive: true });
  }

  /* ---------- boot / init ---------- */
  function boot() {
    el.section = d.getElementById(PF.SECTION_ID);
    if (!el.section) return;
    el.stage = el.section.querySelector('.pf-stage');
    el.sky = el.section.querySelector('#pf-sky');
    el.water = el.section.querySelector('#pf-water');
    el.actJp = el.section.querySelector('.pf-act-jp');
    el.actName = el.section.querySelector('.pf-act-name');
    el.actProg = el.section.querySelector('.pf-act-prog');
    el.actTimer = el.section.querySelector('.pf-act-timer');
    el.dialog = el.section.querySelector('.pf-dialog');
    el.chip = el.section.querySelector('.pf-chip');
    el.say = el.section.querySelector('.pf-say');
    el.launch = el.section.querySelector('.pf-launch');
    el.launchDot = el.section.querySelector('.pf-dot');
    el.film = el.section.querySelector('.pf-film');
    el.notes = el.section.querySelector('.pf-notes');
    el.camBtn = el.section.querySelector('[data-pf="camera"]');
    el.cinemaBtn = el.section.querySelector('[data-pf="cinema"]');
    el.soundBtn = el.section.querySelector('[data-pf="sound"]');
    el.exitBtn = el.section.querySelector('[data-pf="exit"]');

    if (!el.sky || !el.water) return;

    skyCtx = el.sky.getContext('2d');
    waterCtx = el.water.getContext('2d');
    resize();

    setupLaunch();
    setupEggs();
    if (el.camBtn) on(el.camBtn, 'click', captureFrame);
    if (el.cinemaBtn) on(el.cinemaBtn, 'click', enterCinema);
    if (el.exitBtn) on(el.exitBtn, 'click', exitCinema);

    /* keyboard map */
    on(d, 'keydown', function (e) {
      if (state.paused) return;
      if (e.key === 'c' || e.key === 'C') { if (el.camBtn) captureFrame(); }
      if (e.key === 'f' || e.key === 'F') { if (state.cinema) exitCinema(); else enterCinema(); }
      if (e.key === 'Escape') { if (state.cinema) exitCinema(); }
    });

    /* on screen / visibility */
    var io = new w.IntersectionObserver(function (es) {
      var vis = es[0].isIntersecting;
      if (vis && !state.started) { state.started = true; state.visits++; state.lastSeen = Date.now(); saveState(); startAct(1); rafId = w.requestAnimationFrame(frame); }
      else if (!vis) { state.paused = true; }
      else { state.paused = false; rafId = w.requestAnimationFrame(frame); }
    }, { rootMargin: '180px' });
    io.observe(el.section);

    on(w, 'visibilitychange', function () {
      if (d.hidden) { state.paused = true; saveState(); }
      else { state.paused = false; rafId = w.requestAnimationFrame(frame); }
    });

    w.addEventListener('resize', function () { clearTimeout(w.pfResize); w.pfResize = setTimeout(resize, 200); }, { passive: true });

    /* resume logic */
    var saved = store.getJSON(PF.STORAGE_KEY, null);
    if (saved) {
      state.visits = saved.visits || 0;
      state.acted = saved.acted || [];
      state.cameraFrames = saved.cameraFrames || [];
      state.wishes = saved.wishes || [];
      state.lastSeen = saved.lastSeen || 0;
      var now = Date.now();
      if (now - state.lastSeen > 45000 && state.acted.length > 0 && state.acted.indexOf(10) < 0) {
        /* resume last unfinished act */
        var last = state.acted[state.acted.length - 1];
        toast('welcome back to the bridge', 'resuming Act ' + last, '🏮');
        /* note: actual resume starts act on next visibility + in-view */
      } else if (state.acted.indexOf(10) > -1) {
        /* already finished - start encore on entry */
      }
    }
    state.visits++;
    saveState();
  }

  function saveState() {
    state.lastSeen = Date.now();
    store.setJSON(PF.STORAGE_KEY, {
      act: state.act, acted: state.acted, visits: state.visits, lastSeen: state.lastSeen,
      launchedByUser: state.launchedByUser, cameraFrames: state.cameraFrames, wishes: state.wishes
    });
  }

  /* expose */
  PF.boot = boot;
  PF.resize = resize;
  PF.captureFrame = captureFrame;
  PF.enterCinema = enterCinema;
  PF.exitCinema = exitCinema;
  PF.addTanzaku = addTanzaku;

  /* auto-boot when DOM ready */
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window, document, window.PG);
