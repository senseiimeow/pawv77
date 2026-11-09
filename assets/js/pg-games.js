/* =========================================================
   PAWGRAM v3 · PAWFUN ARCADE
   Six vanilla-JS cabinets. Shared helpers first, then:
     1 Paw Catch   2 Konbini Rush   3 Thread Quiz
     4 Umbrella Dash   5 Frame 27 (new)   6 Mochi Clicker (new)
   Scores persist in localStorage under pf-<key> with a safe
   in-memory fallback for sandboxed previews.
   ========================================================= */
(function (w, d) {
  'use strict';
  var PG = w.PG, $ = PG.$, $$ = PG.$$;
  if (!$('#pawfun')) return;

  var reduce = function () { return PG.reduce; };
  var MEM = {};
  var BEST = {
    get: function (k) {
      try { var v = localStorage.getItem('pf-' + k); if (v !== null) return parseInt(v, 10) || 0; } catch (e) {}
      return MEM[k] || 0;
    },
    set: function (k, v) {
      var prev = this.get(k);
      if (v <= prev) { MEM[k] = prev; return false; }
      MEM[k] = v;
      try { localStorage.setItem('pf-' + k, v); } catch (e) {}
      return true;
    }
  };
  function paintBests() {
    $$('[data-best]').forEach(function (el) {
      var v = BEST.get(el.dataset.best);
      el.textContent = v > 0 ? v : '—';
    });
  }
  paintBests();
  PG.paintBests = paintBests;

  function juice(host, text) {
    var j = d.createElement('div');
    j.className = 'juice on'; j.textContent = text;
    host.appendChild(j);
    setTimeout(function () { j.remove(); }, 1000);
  }
  function shake(el) { el.classList.add('shot'); setTimeout(function () { el.classList.remove('shot'); }, 240); }

  /* ---------------- icon set (inline SVG, gradient paw branding) ---------------- */
  var GRAD = '<defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#ff8f7a"/><stop offset="1" stop-color="#ffc46a"/></linearGradient></defs>';
  var ICON = {
    petal: '<svg viewBox="0 0 24 24" width="100%" height="100%">' + GRAD +
      '<path d="M12 3c4.6 2.2 7.4 5.4 7.4 9.1 0 4.3-3.3 7.9-7.4 7.9s-7.4-3.6-7.4-7.9C4.6 8.4 7.4 5.2 12 3Z" fill="#ffb7c5"/>' +
      '<path d="M12 3.6c3.4 1.8 5.6 4.6 5.6 8 0 3.4-2.5 6.3-5.6 6.3" fill="#ffd3dc" opacity=".85"/>' +
      '<path d="M12 4.4V19" stroke="#e08a9c" stroke-width=".8" opacity=".7"/></svg>',
    paw: '<svg viewBox="0 0 24 24" width="100%" height="100%">' + GRAD +
      '<ellipse cx="12" cy="15.6" rx="5" ry="4" fill="url(#gg)"/>' +
      '<ellipse cx="5.8" cy="10.4" rx="2" ry="2.55" fill="url(#gg)"/>' +
      '<ellipse cx="9.8" cy="6.9" rx="1.95" ry="2.5" fill="url(#gg)"/>' +
      '<ellipse cx="14.6" cy="6.9" rx="1.95" ry="2.5" fill="url(#gg)"/>' +
      '<ellipse cx="18.4" cy="10.4" rx="2" ry="2.55" fill="url(#gg)"/></svg>',
    camera: '<svg viewBox="0 0 24 24" width="100%" height="100%">' + GRAD +
      '<rect x="2.2" y="6.4" width="19.6" height="13.4" rx="3" fill="url(#gg)"/>' +
      '<rect x="8.6" y="3.6" width="6.8" height="3.4" rx="1.4" fill="#2a1214" opacity=".55"/>' +
      '<circle cx="12" cy="13.1" r="4.4" fill="#241018"/><circle cx="12" cy="13.1" r="3" fill="#ffd9a0"/>' +
      '<circle cx="17.9" cy="9.4" r="1.1" fill="#2a1214" opacity=".6"/></svg>',
    coffee: '<svg viewBox="0 0 24 24" width="100%" height="100%">' +
      '<path d="M4.4 8.2h13v6.4a6.5 6.5 0 0 1-6.5 6.5h0a6.5 6.5 0 0 1-6.5-6.5V8.2Z" fill="#5a4a4a"/>' +
      '<path d="M17.8 9.6h1.7a2.6 2.6 0 0 1 0 5.2h-1.7" stroke="#5a4a4a" stroke-width="1.9" fill="none"/>' +
      '<path d="M4.4 8.2h13" stroke="#3a2e2e" stroke-width="1.6"/>' +
      '<path d="M8.6 5.4c0-1 .9-1 .9-2M12.2 5.4c0-1 .9-1 .9-2" stroke="#8a7a7a" stroke-width="1.2" ' +
      'stroke-linecap="round" opacity=".55"/></svg>',
    soup: '<svg viewBox="0 0 24 24" width="100%" height="100%">' + GRAD +
      '<path d="M3 11.6h18c0 5-4 8.4-9 8.4s-9-3.4-9-8.4Z" fill="url(#gg)"/>' +
      '<path d="M3 11.6h18" stroke="#2a1214" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M8.4 8.2c0-1.2 1.1-1.4 1.1-2.8M12 8.2c0-1.2 1.1-1.4 1.1-2.8M15.6 8.2c0-1.2 1.1-1.4 1.1-2.8" ' +
      'stroke="#8a7a7a" stroke-width="1.2" stroke-linecap="round" opacity=".55"/></svg>',
    onigiri: '<svg viewBox="0 0 24 24" width="100%" height="100%">' + GRAD +
      '<path d="M12 3.2 21.4 19.4a1.4 1.4 0 0 1-1.2 2.1H3.8a1.4 1.4 0 0 1-1.2-2.1L12 3.2Z" fill="#f4ecdf"/>' +
      '<rect x="9.2" y="14.2" width="5.6" height="6.4" rx="1" fill="#243b2c"/>' +
      '<path d="M12 3.2 15 8.6h-6L12 3.2Z" fill="url(#gg)" opacity=".9"/></svg>',
    cake: '<svg viewBox="0 0 24 24" width="100%" height="100%">' + GRAD +
      '<path d="M3.4 12.4h17.2v7.4a1.4 1.4 0 0 1-1.4 1.4H4.8a1.4 1.4 0 0 1-1.4-1.4v-7.4Z" fill="#f0c48a"/>' +
      '<path d="M3.4 12.4h17.2v2.2H3.4Z" fill="#fff" opacity=".85"/>' +
      '<circle cx="12" cy="8.4" r="1.7" fill="#e0576b"/></svg>',
    rain: '<svg viewBox="0 0 24 24" width="100%" height="100%">' + GRAD +
      '<path d="M2.6 11.4a9.4 9.4 0 0 1 18.8 0Z" fill="url(#gg)"/>' +
      '<path d="M12 11.4v6.6a2.2 2.2 0 0 1-4.4 0" stroke="#cfc6d8" stroke-width="1.5" fill="none"/>' +
      '<g stroke="#7fb2e0" stroke-width="1.1" stroke-linecap="round" opacity=".75">' +
      '<path d="M3.5 15.4 2.6 18M7.5 16.2 6.6 19M18 15.4l-.9 2.6M20.6 17l-.9 2.4"/></g></svg>'
  };

  /* =========================================================
     1 · PAW CATCH
     ========================================================= */
  (function catchGame() {
    var wrap = $('#catchwrap'); if (!wrap) return;
    var basket = $('#basket'), hudScore = $('#cScore'), hudLives = $('#cLives'),
        tline = $('#tline'), over = $('#cOver'), overTitle = $('#cOverTitle'),
        overSub = $('#cOverSub'), startBtn = $('#cStart');

    var ITEMS = [
      { e: ICON.petal, pts: 1, w: 60, cls: '' },
      { e: ICON.paw, pts: 2, w: 22, cls: 'paw' },
      { e: ICON.camera, pts: 5, w: 9, cls: 'gold' },
      { e: ICON.coffee, pts: -1, w: 9, cls: 'rock' }
    ];
    var LINES = ['machine #12 dispenses warm corn soup. it has saved lives',
                 'you name everything, don\'t you', 'only things worth keeping.',
                 'your photos look like the city finally telling the truth.',
                 'seven months to say hello.', '27 frames. no deletes.'];
    var running = false, score = 0, lives = 3, items = [], last = 0, spawnT = 0,
        speed = 1, basketX = .5, targetX = .5, raf = null, lineIdx = 0;

    function reset() {
      score = 0; lives = 3; items.forEach(function (i) { i.el.remove(); }); items = [];
      speed = 1; spawnT = 0; targetX = basketX = .5;
      basket.style.transform = 'translate(0,0)';
      hudScore.textContent = '0'; hudLives.textContent = '3';
      tline.classList.remove('on');
    }
    function pick() {
      var r = Math.random() * 100, acc = 0;
      for (var i = 0; i < ITEMS.length; i++) { acc += ITEMS[i].w; if (r <= acc) return ITEMS[i]; }
      return ITEMS[0];
    }
    function spawn() {
      var it = pick();
      var el = d.createElement('div');
      el.className = 'petal-p ' + it.cls;
      el.innerHTML = it.e;
      var W = wrap.clientWidth;
      var x = 24 + Math.random() * Math.max(1, W - 48);
      wrap.appendChild(el);
      items.push({ el: el, x: x, y: -30, vy: (1.5 + Math.random() * .9) * speed, pts: it.pts });
    }
    function pop(x, y, txt, col) {
      var p = d.createElement('div');
      p.className = 'pop'; p.textContent = txt;
      if (col) p.style.color = col;
      p.style.left = x + 'px'; p.style.top = y + 'px';
      wrap.appendChild(p);
      setTimeout(function () { p.remove(); }, 820);
    }
    function loop(ts) {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      var dt = Math.min((ts - (last || ts)) / 16.67, 2.4); last = ts;
      var H = wrap.clientHeight, W = wrap.clientWidth;

      basketX += (targetX - basketX) * Math.min(1, .18 * dt);
      basket.style.transform = 'translate(' + (basketX * W - 37) + 'px,0)';

      spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = Math.max(16, 40 - speed * 5); }

      var bx = basketX * W, by = H - 38, hw = 42;
      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        it.y += it.vy * dt;
        it.el.style.transform = 'translate(' + it.x + 'px,' + it.y + 'px) rotate(' + (it.y * .6) + 'deg)';
        if (it.y > by - 30 && it.y < by + 24 && Math.abs(it.x - bx) < hw) {
          if (it.pts < 0) {
            lives--; pop(it.x, it.y, '−1 life', '#ff8a8a');
            hudLives.textContent = lives;
            shake(wrap); PG.sfx('error'); PG.haptic(18);
            if (lives <= 0) { end(); return; }
          } else {
            score += it.pts; hudScore.textContent = score;
            pop(it.x, it.y, '+' + it.pts);
            PG.sfx(it.pts >= 5 ? 'coin' : 'petal');
            if (score % 12 < it.pts && LINES.length) {
              tline.textContent = '"' + LINES[lineIdx++ % LINES.length] + '"';
              tline.classList.add('on');
              setTimeout(function () { tline.classList.remove('on'); }, 2400);
            }
          }
          it.el.remove(); items.splice(i, 1); continue;
        }
        if (it.y > H + 40) { it.el.remove(); items.splice(i, 1); }
      }
      speed = Math.min(2.6, 1 + score * .012);
    }
    function end() {
      running = false; cancelAnimationFrame(raf);
      var isBest = BEST.set('catch', score); paintBests();
      overTitle.textContent = score >= 40 ? 'Frame 27. Perfect.' :
                              score >= 20 ? 'Good eye, professor.' : 'The city got away.';
      startBtn.textContent = 'Play again';
      overSub.innerHTML = 'You caught <em>' + score + ' points</em>' +
        (isBest ? ' — <b style="color:#7ef0d0">new personal best</b>' : '') +
        '.<br>Petals +1 · paws +2 · camera +5 · burnt coffee −1 life.';
      over.classList.remove('hide');
      if (isBest) { juice(wrap, 'NEW BEST'); PG.confetti(40); }
    }
    function start() {
      reset(); over.classList.add('hide');
      running = true; last = 0; raf = requestAnimationFrame(loop);
      PG.sfx('chime'); PG.haptic(10);
    }
    function moveTo(clientX) {
      var r = wrap.getBoundingClientRect();
      targetX = Math.max(.06, Math.min(.94, (clientX - r.left) / r.width));
    }
    PG.on(wrap, 'pointermove', function (e) { if (running) moveTo(e.clientX); });
    PG.on(wrap, 'pointerdown', function (e) { moveTo(e.clientX); });
    PG.on(w, 'keydown', function (e) {
      if (!running) return;
      if (e.key === 'ArrowLeft') targetX = Math.max(.06, targetX - .07);
      if (e.key === 'ArrowRight') targetX = Math.min(.94, targetX + .07);
    });
    PG.on(startBtn, 'click', start);
  })();

  /* =========================================================
     2 · KONBINI RUSH  (the 'card reader' order bug is fixed:
        'cos' is a real, tappable item)
     ========================================================= */
  (function konbiniGame() {
    var root = $('#konbinibox'); if (!root) return;
    var ticketEl = $('#kTicket'), clockEl = $('#kClock'), servedEl = $('#kServed'),
        streakEl = $('#kStreak'), timerBar = $('#kTimer'), pad = $('#kPad'), msgEl = $('#kMsg'),
        over = $('#kOver'), overTitle = $('#kOverTitle'), overSub = $('#kOverSub'), startBtn = $('#kStart');

    var ITEMS = {
      soup:    { icon: ICON.soup,    label: 'corn soup',    cls: 'hot'  },
      onigiri: { icon: ICON.onigiri, label: 'onigiri',      cls: 'warm' },
      coffee:  { icon: ICON.coffee,  label: 'coffee',       cls: 'hot'  },
      cake:    { icon: ICON.cake,    label: 'cake',         cls: 'cold' },
      drink:   { icon: ICON.paw,     label: 'sports drink', cls: 'cold' },
      camera:  { icon: ICON.camera,  label: 'film',         cls: 'cold' },
      cos:     { icon: ICON.paw,     label: 'card reader',  cls: 'pay'  }
    };
    var KEYS = ['soup', 'onigiri', 'coffee', 'cake', 'drink', 'camera', 'cos'];

    var RUN_TIME = 45, order = [], served = 0, streak = 0, bestStreak = 0,
        timeLeft = RUN_TIME, playing = false, raf = null, last = 0;

    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }
    function newOrder() {
      var n = served < 2 ? 2 : served < 5 ? 3 : served < 9 ? 4 : 5;
      order = shuffle(KEYS.slice(0, 6)).slice(0, n);
      if (served % 4 === 3) order.push('cos');   /* pay · the card reader — always last */
      renderTicket();
    }
    function renderTicket() {
      if (!order.length) {
        ticketEl.innerHTML = '<div class="ktick done-all"><em>order complete — next customer…</em></div>';
        return;
      }
      ticketEl.innerHTML = order.map(function (k, i) {
        var it = ITEMS[k];
        return '<div class="ktick' + (i === 0 ? ' next' : '') + '" data-k="' + k + '">' +
               '<span class="ki">' + it.icon + '</span><em>' + it.label + '</em></div>';
      }).join('');
    }
    function renderPad() {
      pad.innerHTML = KEYS.map(function (k) {
        var it = ITEMS[k];
        return '<button class="kitem ' + it.cls + '" data-k="' + k + '" type="button" aria-label="' + it.label + '">' +
               it.icon + '<span>' + it.label + '</span></button>';
      }).join('');
    }
    function hit(k, btn) {
      if (!playing) return;
      if (order[0] === k) {
        btn.classList.add('ok');
        order.shift(); served++;
        streak++; if (streak > bestStreak) bestStreak = streak;
        streakEl.textContent = streak;
        servedEl.textContent = served;
        timeLeft = Math.min(RUN_TIME, timeLeft + 1.4);
        msgEl.textContent = streak >= 5 ? 'the queue loves you.' :
                            streak >= 3 ? 'fast hands.' : 'correct.';
        msgEl.className = 'kmsg on';
        setTimeout(function () { msgEl.className = 'kmsg'; }, 900);
        PG.sfx('coin'); PG.haptic(8);
        if (streak === 5) PG.unlock('streak');
        if (!order.length) newOrder(); else renderTicket();
        setTimeout(function () { btn.classList.remove('ok'); }, 300);
      } else {
        btn.classList.add('bad');
        streak = 0; streakEl.textContent = '0';
        timeLeft = Math.max(0, timeLeft - 2.2);
        msgEl.textContent = 'wrong item — she ordered ' + ITEMS[order[0]].label + '.';
        msgEl.className = 'kmsg on no';
        PG.sfx('error'); PG.haptic(20); shake(root);
        setTimeout(function () { btn.classList.remove('bad'); }, 330);
        setTimeout(function () { msgEl.className = 'kmsg'; }, 1200);
      }
    }
    PG.on(pad, 'click', function (e) {
      var b = e.target.closest('.kitem'); if (b) hit(b.dataset.k, b);
    });
    function tick(ts) {
      if (!playing) return;
      raf = requestAnimationFrame(tick);
      var dt = Math.min((ts - (last || ts)) / 1000, .12); last = ts;
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; paint(); end(); return; }
      paint();
    }
    function paint() {
      clockEl.textContent = Math.ceil(timeLeft);
      timerBar.style.width = (timeLeft / RUN_TIME * 100).toFixed(1) + '%';
      timerBar.className = 'ktimer-fill' + (timeLeft < 10 ? ' low' : '');
    }
    function start() {
      over.classList.add('hide');
      served = 0; streak = 0; bestStreak = 0; timeLeft = RUN_TIME; playing = true; last = 0;
      servedEl.textContent = '0'; streakEl.textContent = '0';
      renderPad(); newOrder(); paint();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
      PG.sfx('chime');
    }
    function end() {
      playing = false; cancelAnimationFrame(raf);
      var score = served * 10 + bestStreak * 5;
      var isBest = BEST.set('konbini', score); paintBests();
      overTitle.textContent = score >= 220 ? 'Shift of the year.' :
                              score >= 130 ? 'Machine #12 salutes you.' :
                              score >= 60  ? 'The queue moved.' : 'Rough shift.';
      startBtn.textContent = 'Work another shift';
      overSub.innerHTML = 'You rang up <em>' + served + ' items</em> · best streak ' + bestStreak +
        ' · score ' + score + (isBest ? ' — <b style="color:#7ef0d0">new best</b>' : '') +
        '.<br>Every tap is a warm corn soup, an onigiri, or a 2:47 AM coffee. Read Chapter 3 for the shift.';
      over.classList.remove('hide');
      if (isBest) { juice(root, 'NEW BEST'); PG.confetti(40); }
    }
    PG.on(startBtn, 'click', start);
    renderPad();
  })();

  /* =========================================================
     3 · THREAD QUIZ
     ========================================================= */
  (function quizGame() {
    var box = $('#quizbox'); if (!box) return;
    var Q = [
      { q: 'What arrives at Pragati\'s door when she is sick with the flu?',
        a: ['A hand-written letter', 'Ginger soup, rice porridge and a sports drink', 'A crate of konbini cakes', 'Nothing — he was too busy'],
        c: 1, f: 'He orders it from a delivery app with the note "eat. that\'s an order. — T".' },
      { q: 'How many frames does the film camera she mails him have?',
        a: ['12', '24', '27', '36'], c: 2,
        f: '"27 frames. no deletes, no overthinking. limitations are just style." — Ch 5.' },
      { q: 'Where do they finally meet, at 10:58 on April 4th?',
        a: ['Shibuya Sky rooftop', 'Meiji Jingū torii', 'The Hachikō statue', 'Yoyogi Park picnic blanket'], c: 2,
        f: '"Two minutes early. He\'d been here forty." — Ch 7, page 60.' },
      { q: 'What do the two ema wish plaques both say?',
        a: ['"Let spring come soon."', '"Please let this work."', '"I wish for more time."', '"Let the city be quiet."'], c: 0,
        f: 'Written apart, identical: "Same wish. Different handwriting." — Ch 7.' },
      { q: 'Which vending machine becomes "her favourite character"?',
        a: ['Machine #7', 'Machine #12', 'Machine #27', 'Machine #47'], c: 1,
        f: '"machine #12 dispenses warm corn soup. it has saved lives." — Ch 3.' },
      { q: 'Where does Tejas work the night shift?',
        a: ['A Kōenji bookstore', 'A Shibuya gallery café', 'A Nakano convenience store', 'A Setagaya print shop'], c: 2,
        f: 'Nakano konbini — the reason "night shift built different" is his umbrella excuse.' },
      { q: 'What is written inside the first copy of his zine?',
        a: ['"For the city that finally told the truth."', '"For P — who taught my city to talk."', '"27 frames, no regrets."', '"To the girl behind the screen."'], c: 1,
        f: '"first copy, signed. as promised. — T" · kept from a November promise.' },
      { q: 'What is still stuck to the handle of the clear umbrella in the spring rain?',
        a: ['A sakura petal', 'A konbini receipt', 'A coral paw sticker', 'A purikura strip'], c: 2,
        f: '"...he kept them." — the paw stickers she mailed with the camera, Ch 7.' },
      { q: 'What does Mochi sit on that ruins the plan?',
        a: ['The printed itinerary', 'The zine proofs', 'Her laptop keyboard', 'The bento box'], c: 0,
        f: '"fine. you\'re coming too. spiritually."' },
      { q: 'What does Pragati write at the top of her final letter?',
        a: ['"Dear Tejas,"', '"Dear favorite notification—"', '"To the boy at 2:47 AM,"', '"Dear stranger,"'], c: 1,
        f: 'Five crossed-out openings later — "Dear favorite notification—" · Ch 6.' }
    ];
    var qi = 0, correct = 0, answered = false,
        qtext = $('#qtext'), qopts = $('#qopts'), qfb = $('#qfb'), qprog = $('#qprogFill'),
        qdots = $('#qdots'), over = $('#qOver'), overTitle = $('#qOverTitle'),
        overSub = $('#qOverSub'), startBtn = $('#qStart'), nextBtn = $('#qNext');

    function start() {
      qi = 0; correct = 0;
      over.classList.add('hide');
      over.style.display = 'none';
      qdots.innerHTML = Q.map(function () { return '<i></i>'; }).join('');
      render();
      PG.sfx('chime');
    }
    function render() {
      answered = false;
      var item = Q[qi];
      if (!item) return;
      qtext.textContent = (qi + 1) + '. ' + item.q;
      qfb.textContent = '';
      qprog.style.width = (qi / Q.length * 100) + '%';
      nextBtn.style.display = 'none';
      qopts.innerHTML = '';
      item.a.forEach(function (txt, i) {
        var b = d.createElement('button');
        b.type = 'button'; b.className = 'qopt';
        b.innerHTML = '<span class="k">' + 'ABCD'[i] + '</span><span>' + txt + '</span>';
        PG.on(b, 'click', function () { answer(i, b); });
        qopts.appendChild(b);
      });
      $$('#qdots i').forEach(function (dd, i) { dd.className = i === qi ? 'now' : (dd.dataset.r || ''); });
    }
    function answer(i, btn) {
      if (answered) return; answered = true;
      var item = Q[qi];
      $$('.qopt', qopts).forEach(function (b, k) {
        b.classList.add('locked');
        if (k === item.c) b.classList.add('right');
        if (k === i && i !== item.c) b.classList.add('wrong');
      });
      var ok = i === item.c;
      if (ok) correct++;
      var dot = $$('#qdots i')[qi];
      dot.className = ok ? 'ok' : 'no'; dot.dataset.r = ok ? 'ok' : 'no';
      qfb.innerHTML = (ok ? '✅ ' : '📖 ') + item.f;
      qprog.style.width = ((qi + 1) / Q.length * 100) + '%';
      PG.sfx(ok ? 'coin' : 'error'); PG.haptic(ok ? 8 : 16);
      if (qi < Q.length - 1) { nextBtn.style.display = 'inline-flex'; }
      else setTimeout(finish, 900);
    }
    function finish() {
      var isBest = BEST.set('quiz', correct); paintBests();
      overTitle.textContent = correct >= 9 ? 'Thread archivist' :
                              correct >= 7 ? 'You were paying attention.' :
                              correct >= 4 ? 'Half-read. Like a group chat.' : 'Time for a re-read.';
      overSub.innerHTML = 'You scored <em>' + correct + ' / ' + Q.length + '</em>' +
        (isBest ? ' — <b style="color:#7ef0d0">new best</b>' : '') +
        '.<br>Every answer is a page from Season 1.';
      over.style.display = 'grid';
      over.classList.remove('hide');
      startBtn.textContent = 'Play again';
      if (correct >= 9) { PG.unlock('archivist'); PG.confetti(80); PG.sfx('win'); }
      else if (isBest) { PG.confetti(30); }
    }
    PG.on(startBtn, 'click', start);
    PG.on(nextBtn, 'click', function () { if (qi < Q.length - 1) { qi++; render(); } });
  })();

  /* =========================================================
     4 · UMBRELLA DASH
     ========================================================= */
  (function dashGame() {
    var wrap = $('#dashwrap'); if (!wrap) return;
    var runner = $('#runner'), scoreEl = $('#dScore'), distEl = $('#dDist'),
        bestEl = $('#dBest'), over = $('#dOver'), overTitle = $('#dOverTitle'),
        overSub = $('#dOverSub'), startBtn = $('#dStart'), tipEl = $('#dTip');

    var PUDDLE = '<svg viewBox="0 0 60 22" width="100%" height="100%"><ellipse cx="30" cy="11" rx="28" ry="9" fill="#3a6f9e" opacity=".75"/>' +
      '<ellipse cx="27" cy="9" rx="17" ry="5" fill="#7fb2e0" opacity=".5"/></svg>';

    var playing = false, raf = null, last = 0, speed = 1, dist = 0, stickers = 0, lives = 3,
        jumpY = 0, jumpV = 0, grounded = true, spawnT = 0, prizeT = 0, obstacles = [], prizes = [];
    var W = 0, H = 0;
    function measure() { W = wrap.clientWidth; H = wrap.clientHeight; }
    measure();
    w.addEventListener('resize', measure, { passive: true });

    function reset() {
      obstacles.forEach(function (o) { o.el.remove(); }); obstacles = [];
      prizes.forEach(function (p) { p.el.remove(); }); prizes = [];
      dist = 0; stickers = 0; lives = 3; jumpY = 0; jumpV = 0; grounded = true;
      speed = 1; spawnT = 58; prizeT = 46;
      scoreEl.textContent = '0'; distEl.textContent = '0';
      tipEl.className = 'dtip';
    }
    function jump() {
      if (!playing || !grounded) return;
      jumpV = 14.6; grounded = false;
      PG.sfx('pop'); PG.haptic(6);
    }
    PG.on(w, 'keydown', function (e) {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        if (playing) { e.preventDefault(); jump(); }
      }
    });
    PG.on(wrap, 'pointerdown', function (e) { if (playing) { e.preventDefault(); jump(); } });
    PG.on(startBtn, 'click', start);

    function spawnObstacle() {
      var el = d.createElement('div');
      el.className = 'haz'; el.innerHTML = PUDDLE;
      wrap.appendChild(el);
      obstacles.push({ el: el, x: W + 20, w: 52, h: 20, hit: false });
    }
    function spawnPrize() {
      var el = d.createElement('div');
      el.className = 'prize'; el.innerHTML = ICON.paw;
      wrap.appendChild(el);
      var y = Math.random() < .55 ? 2 + Math.random() * 8 : 34 + Math.random() * 26;
      prizes.push({ el: el, x: W + 20, y: y, got: false });
    }
    function loop(ts) {
      if (!playing) return;
      raf = requestAnimationFrame(loop);
      var dt = Math.min((ts - (last || ts)) / 16.67, 2.2); last = ts;

      if (!grounded) {
        jumpY += jumpV * dt * .62;
        jumpV -= .95 * dt;
        if (jumpY <= 0) { jumpY = 0; jumpV = 0; grounded = true; }
      }
      runner.style.transform = 'translateY(' + (-jumpY) + 'px)';

      speed = 1 + dist * .0009;
      dist += 1.6 * dt * speed;
      distEl.textContent = Math.round(dist);

      spawnT -= dt;
      if (spawnT <= 0) { spawnObstacle(); spawnT = Math.max(46, 92 - dist * .04); }
      prizeT -= dt;
      if (prizeT <= 0) { spawnPrize(); prizeT = 52 + Math.random() * 40; }

      for (var i = obstacles.length - 1; i >= 0; i--) {
        var o = obstacles[i];
        o.x -= 5.4 * dt * speed;
        o.el.style.transform = 'translateX(' + o.x + 'px)';
        if (!o.hit && o.x < 92 && o.x + o.w > 54 && jumpY < 12) {
          o.hit = true;
          lives--;
          tipEl.textContent = lives > 0 ? 'splash — ' + lives + ' umbrella' + (lives === 1 ? '' : 's') + ' left' : 'the rain wins.';
          tipEl.className = 'dtip on';
          shake(wrap); PG.sfx('splash'); PG.haptic(22);
          setTimeout(function () { tipEl.className = 'dtip'; }, 1300);
          if (lives <= 0) { end(); return; }
        }
        if (o.x < -80) { o.el.remove(); obstacles.splice(i, 1); }
      }
      for (var j = prizes.length - 1; j >= 0; j--) {
        var p = prizes[j];
        p.x -= 5.4 * dt * speed;
        p.el.style.transform = 'translate(' + p.x + 'px,' + (-p.y) + 'px)';
        var uLo = 14 + jumpY, uHi = 54 + jumpY;
        if (!p.got && p.x < 104 && p.x + 26 > 40 && (p.y + 26) > uLo - 8 && p.y < uHi + 8) {
          p.got = true; stickers++;
          scoreEl.textContent = stickers;
          p.el.classList.add('got');
          PG.sfx('petal'); PG.haptic(6);
          setTimeout(function (el) { return function () { el.remove(); }; }(p.el), 320);
          prizes.splice(j, 1);
          continue;
        }
        if (p.x < -40) { p.el.remove(); prizes.splice(j, 1); }
      }
    }
    function start() {
      over.classList.add('hide');
      reset(); playing = true; last = 0;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      PG.sfx('chime');
    }
    function end() {
      playing = false; cancelAnimationFrame(raf);
      var isBest = BEST.set('dash', stickers); paintBests();
      overTitle.textContent = stickers >= 18 ? 'Not one sticker lost.' :
                              stickers >= 10 ? 'The rain never touched them.' :
                              stickers >= 4  ? 'Mostly dry.' : 'Soaked, but you kept going.';
      startBtn.textContent = 'Run again';
      overSub.innerHTML = 'You kept <em>' + stickers + ' of the coral paw stickers</em> dry · ' +
        Math.round(dist) + ' m of Tokyo rain' + (isBest ? ' — <b style="color:#7ef0d0">new best</b>' : '') +
        '.<br>He kept them, all along. That is the whole of Chapter 7.';
      over.classList.remove('hide');
      if (isBest) { juice(wrap, 'NEW BEST'); PG.confetti(40); }
    }
    runner.innerHTML = ICON.rain;
  })();

  /* =========================================================
     5 · FRAME 27  (new)
     ========================================================= */
  (function frameGame() {
    var wrap = $('#framewrap'); if (!wrap) return;
    var flash = $('#fFlash'), leftEl = $('#fLeft'), scoreEl = $('#fScore'),
        perfectEl = $('#fPerfect'), comboEl = $('#fCombo'),
        over = $('#fOver'), overTitle = $('#fOverTitle'), overSub = $('#fOverSub'), startBtn = $('#fStart');

    var FRAMES = 27;
    var playing = false, left = FRAMES, score = 0, perfect = 0, combo = 0, bestCombo = 0;
    var raf = null, last = 0, tgt = null, W = 0, H = 0;

    function measure() { W = wrap.clientWidth; H = wrap.clientHeight; }
    measure();
    w.addEventListener('resize', measure, { passive: true });

    function makeTarget() {
      var el = d.querySelector('.target');
      if (el) el.remove();
      el = d.createElement('div');
      el.className = 'target';
      el.innerHTML = '<span class="ring"></span><span class="ring2"></span><span class="dot"></span>' +
        '<span class="lab">subject</span>';
      wrap.appendChild(el);
      var speedX = (1.1 + Math.random() * 1.9) * (Math.random() > .5 ? 1 : -1);
      var speedY = (0.6 + Math.random() * 1.4) * (Math.random() > .5 ? 1 : -1);
      tgt = {
        el: el, x: PG.rnd(W * .2, W * .8), y: PG.rnd(H * .2, H * .8),
        vx: speedX, vy: speedY, r: 30, size: 78
      };
      tgt.el.style.width = tgt.size + 'px'; tgt.el.style.height = tgt.size + 'px';
      place();
    }
    function place() {
      if (!tgt) return;
      tgt.el.style.transform = 'translate(' + tgt.x + 'px,' + tgt.y + 'px) translate(-50%,-50%)';
    }
    function loop(ts) {
      if (!playing) return;
      raf = requestAnimationFrame(loop);
      var dt = Math.min((ts - (last || ts)) / 16.67, 2.2); last = ts;
      if (!tgt) return;
      tgt.x += tgt.vx * dt; tgt.y += tgt.vy * dt;
      var pad = tgt.size / 2 + 8;
      if (tgt.x < pad) { tgt.x = pad; tgt.vx *= -1; }
      if (tgt.x > W - pad) { tgt.x = W - pad; tgt.vx *= -1; }
      if (tgt.y < pad) { tgt.y = pad; tgt.vy *= -1; }
      if (tgt.y > H - pad) { tgt.y = H - pad; tgt.vy *= -1; }
      place();
    }
    function shoot() {
      if (!playing || !tgt) return;
      flash.classList.remove('fire'); void flash.offsetWidth; flash.classList.add('fire');
      var cx = W / 2, cy = H / 2;
      var d0 = Math.hypot(tgt.x - cx, tgt.y - cy);
      var near = Math.max(0, 1 - d0 / (Math.max(W, H) * .62));      /* 0..1 */
      var hits = d0 < tgt.size * .55;
      left--;
      if (hits) {
        var pts = Math.round(6 + near * 20) + combo * 2;
        score += pts;
        combo++; if (combo > bestCombo) bestCombo = combo;
        if (near > .82) { perfect++; PG.sfx('win'); }
        else PG.sfx('coin');
        juice(wrap, hits && near > .82 ? 'PERFECT' : '+' + pts);
        PG.haptic(10);
      } else {
        combo = 0;
        PG.sfx('error'); PG.haptic(16);
        juice(wrap, 'MISSED');
      }
      leftEl.textContent = left;
      scoreEl.textContent = score;
      perfectEl.textContent = perfect;
      comboEl.textContent = combo;
      tgt.el.remove(); tgt = null;
      if (left <= 0) { end(); return; }
      setTimeout(makeTarget, 320);
    }
    function start() {
      over.classList.add('hide');
      left = FRAMES; score = 0; perfect = 0; combo = 0; bestCombo = 0;
      leftEl.textContent = left; scoreEl.textContent = '0';
      perfectEl.textContent = '0'; comboEl.textContent = '0';
      playing = true; last = 0;
      makeTarget();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      PG.sfx('chime');
    }
    function end() {
      playing = false; cancelAnimationFrame(raf);
      if (tgt) { tgt.el.remove(); tgt = null; }
      var isBest = BEST.set('frame27', score); paintBests();
      overTitle.textContent = perfect >= 12 ? 'You understood the assignment.' :
                              perfect >= 6  ? 'Good eye, professor.' :
                              score > 0 ? 'The city kept the rest.' : 'Out of film.';
      startBtn.textContent = 'Load another roll';
      overSub.innerHTML = 'You developed <em>' + score + ' points</em> · ' + perfect +
        ' perfect frames · best combo ' + bestCombo +
        (isBest ? ' — <b style="color:#7ef0d0">new best</b>' : '') +
        '.<br>27 frames. No deletes. Just like Chapter 5.';
      over.classList.remove('hide');
      PG.unlock('frames27');
      if (isBest) { juice(wrap, 'NEW BEST'); PG.confetti(50); }
    }
    PG.on(startBtn, 'click', start);
    PG.on(wrap, 'pointerdown', function (e) {
      if (!playing) return;
      if (e.target.closest('button')) return;
      e.preventDefault();
      shoot();
    });
    PG.on(w, 'keydown', function (e) {
      if (!playing) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); shoot(); }
    });
  })();

  /* =========================================================
     6 · MOCHI CLICKER  (new)
     ========================================================= */
  (function mochiGame() {
    var box = $('#mochiwrap'); if (!box) return;
    var cat = $('#mochiCat'), ptsEl = $('#mPoints'), tapsEl = $('#mTaps'), perEl = $('#mPer'),
        stickersEl = $('#mStickers'), upsEl = $('#mUps');

    var STICKERS = [
      { id: 'paw',    ic: '🐾', at: 10,  name: 'paw sticker' },
      { id: 'sakura', ic: '🌸', at: 40,  name: 'sakura petal' },
      { id: 'camera', ic: '📷', at: 90,  name: 'film camera' },
      { id: 'soup',   ic: '🥤', at: 180, name: 'corn soup' },
      { id: 'umbrella', ic: '☂️', at: 320, name: 'clear umbrella' },
      { id: 'thread', ic: '🧵', at: 520, name: 'coral thread' }
    ];
    var UPS = [
      { id: 'nap',    name: 'Mochi naps',      desc: '+1 per tap',  cost: 25,  per: 1 },
      { id: 'treats', name: 'Konbini treats',  desc: '+3 per tap',  cost: 120, per: 3 },
      { id: 'sunbeam',name: 'Sunbeam spot',    desc: '+8 per tap',  cost: 400, per: 8 }
    ];
    var state = PG.store.getJSON('pg-mochi', { pts: 0, taps: 0, per: 1, ups: [], got: [] });

    function save() { PG.store.setJSON('pg-mochi', state); }
    function render() {
      ptsEl.textContent = state.pts;
      tapsEl.textContent = state.taps;
      perEl.textContent = state.per;
      stickersEl.innerHTML = STICKERS.map(function (s) {
        var got = state.pts >= s.at;
        if (got && state.got.indexOf(s.id) < 0) {
          state.got.push(s.id);
          PG.toast('Sticker unlocked', s.name, s.ic);
          PG.confetti(24);
        }
        return '<span class="mst' + (got ? ' got' : '') + '" title="' + s.name + ' — ' + s.at + ' points">' + s.ic + '</span>';
      }).join('');
      upsEl.innerHTML = UPS.map(function (u) {
        var owned = state.ups.indexOf(u.id) > -1;
        var can = state.pts >= u.cost && !owned;
        return '<button type="button" data-up="' + u.id + '"' + (owned || !can ? ' disabled' : '') + '>' +
          u.name + '<small>' + (owned ? 'owned ✓' : u.desc + ' · ' + u.cost) + '</small></button>';
      }).join('');
      save();
    }
    function tap() {
      state.pts += state.per; state.taps++;
      cat.classList.remove('pop'); void cat.offsetWidth; cat.classList.add('pop');
      var f = d.createElement('div');
      f.className = 'emoji-float'; f.textContent = '+ ' + state.per;
      var r = cat.getBoundingClientRect();
      f.style.left = (r.left + r.width / 2 + PG.rnd(-20, 20)) + 'px';
      f.style.top = (r.top + 20) + 'px';
      f.style.fontSize = '18px';
      d.body.appendChild(f);
      setTimeout(function () { f.remove(); }, 1500);
      PG.sfx('pop'); PG.haptic(6);
      render();
      if (state.pts >= 520) PG.unlock('mochi-lover');
      var best = BEST.get('mochi');
      if (state.pts > best) { BEST.set('mochi', state.pts); paintBests(); }
    }
    /* Bind the tap to the wrapping playfield and test the target with
       closest(): a mid-animation transform on the cat (scale + rotate)
       makes Chromium's hit-testing drop the button for ~300 ms, which
       used to eat every second tap. */
    PG.on(box, 'click', function (e) {
      if (e.target.closest('#mochiCat')) tap();
    });
    PG.on(cat, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } });
    PG.on(upsEl, 'click', function (e) {
      var b = e.target.closest('[data-up]'); if (!b) return;
      var u = UPS.filter(function (x) { return x.id === b.dataset.up; })[0];
      if (!u || state.pts < u.cost || state.ups.indexOf(u.id) > -1) return;
      state.pts -= u.cost; state.ups.push(u.id); state.per = u.per;
      PG.confetti(30); PG.sfx('win');
      render();
    });
    render();
  })();

  /* =========================================================
     deep links  #play=catch|konbini|quiz|dash|frame27|mochi
     ========================================================= */
  var GMAP = { catch: 'catch', konbini: 'konbini', quiz: 'quiz', dash: 'dash',
               frame27: 'frame27', frame: 'frame27', mochi: 'mochi',
               memory: 'konbini', thread: 'dash' };
  var GB = { catch: '#cStart', konbini: '#kStart', quiz: '#qStart', dash: '#dStart',
             frame27: '#fStart', mochi: '#mochiCat' };
  var started = {}, timer = null;
  function deal(hash) {
    var raw = (hash || '').replace('#play=', '');
    var key = GMAP[raw];
    if (!key) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      var btn = $(GB[key]);
      if (!btn) return;
      if (!started[raw]) { started[raw] = 1; if (key !== 'mochi') btn.click(); }
      var card = btn.closest('.gamecard') || btn;
      card.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'center' });
      $$('.dock .dchip').forEach(function (el, i) { el.classList.remove('on'); });
    }, 500);
  }
  deal(location.hash);
  w.addEventListener('hashchange', function () { deal(location.hash); });

  /* dock highlight on scroll */
  if ('IntersectionObserver' in w) {
    var cards = $$('.gamecard');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = cards.indexOf(e.target);
        $$('.dock .dchip').forEach(function (el, k) { el.classList.toggle('on', k === i); });
      });
    }, { threshold: .4 });
    cards.forEach(function (c) { io.observe(c); });
  }

  /* umbrella CTA */
  var ctab = $('#ctabox');
  if (ctab) {
    var rain = $('.rainlayer', ctab);
    if (rain) for (var i = 0; i < 24; i++) {
      var el = d.createElement('i');
      el.style.left = (Math.random() * 100) + '%';
      el.style.animationDelay = (-Math.random() * 2.4) + 's';
      el.style.animationDuration = (1.4 + Math.random() * 1.4) + 's';
      el.style.opacity = (.3 + Math.random() * .5).toFixed(2);
      rain.appendChild(el);
    }
    if ('IntersectionObserver' in w) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) ctab.classList.add('open');
      }, { threshold: .3 }).observe(ctab);
    } else ctab.classList.add('open');
  }
})(window, document);
