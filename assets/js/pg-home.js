/* =========================================================
   PAWGRAM v3 · HOME  (depends on pg-core.js → window.PG)
   Sections: hero · season cinema · cast · thread chat
             chapters rail · motif sticker board · arcade
             gallery + lightbox · character quiz · CTA
   ========================================================= */
(function (w, d) {
  'use strict';
  var PG = w.PG, $ = PG.$, $$ = PG.$$;
  var reduce = function () { return PG.reduce; };
  var touch = PG.touch;

  /* ---------------------------------------------------------
     0 · tiny helpers
     --------------------------------------------------------- */
  function css(el, o) { for (var k in o) el.style[k] = o[k]; }
  function px(n) { return n + 'px'; }
  function artURL(name) { return '../art/' + name + '.webp'; }

  /* =========================================================
     1 · HERO — letters, sky, live chat, parallax
     ========================================================= */
  (function hero() {
    var h1 = $('.hero h1');
    if (h1) {
      var l1 = $('.line1', h1), l2 = $('.line2', h1);
      var word1 = 'SEE YOU', word2 = 'OFFLINE';
      [].forEach.call(word1.split(''), function (c, i) {
        var s = d.createElement('span');
        s.className = 'ltr'; s.style.setProperty('--i', i);
        s.textContent = c === ' ' ? '\u00A0' : c;
        l1.appendChild(s);
      });
      [].forEach.call(word2.split(''), function (c, i) {
        var s = d.createElement('span');
        s.className = 'ltr' + (i === word2.length - 1 ? ' flick' : '');
        s.style.setProperty('--i', i + 4);
        s.textContent = c;
        l2.appendChild(s);
      });
      /* letters react to the pointer (desktop only) */
      if (!touch && !reduce()) {
        var ltrs = $$('.ltr', h1);
        h1.addEventListener('mousemove', function (e) {
          var r = h1.getBoundingClientRect();
          ltrs.forEach(function (el) {
            var b = el.getBoundingClientRect();
            var dx = e.clientX - (b.left + b.width / 2);
            var dy = e.clientY - (b.top + b.height / 2);
            var dist = Math.hypot(dx, dy);
            var f = Math.max(0, 1 - dist / 240);
            el.style.translate = (dx * f * .10).toFixed(1) + 'px ' + (dy * f * .10).toFixed(1) + 'px';
            el.style.rotate = (dx * f * .05).toFixed(1) + 'deg';
          });
        });
        h1.addEventListener('mouseleave', function () {
          ltrs.forEach(function (el) { el.style.translate = ''; el.style.rotate = ''; });
        });
      }
    }

    /* ---- skyline canvas (Tokyo 2 AM / sakura afternoon) ---- */
    var cv = $('#sky');
    if (cv && !reduce()) {
      var ctx = cv.getContext('2d');
      var W, H, DPR, blds = [], stars = [], t = 0, vis = true, last = 0;
      var day = d.documentElement.getAttribute('data-theme') === 'day';
      var FPS = (w.innerWidth < 760) ? 24 : 40, STEP = 1000 / FPS;

      function build() {
        DPR = Math.min(w.devicePixelRatio || 1, 1.75);
        W = cv.clientWidth || w.innerWidth; H = cv.clientHeight || w.innerHeight;
        cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        blds = []; stars = [];
        var base = H * .99, x = -40;
        while (x < W + 60) {
          var bw = 26 + Math.random() * 62;
          var bh = 60 + Math.random() * H * .30;
          blds.push({ x: x, w: bw, h: bh, back: Math.random() > .58, hue: Math.random() });
          x += bw + 3 + Math.random() * 9;
        }
        for (var i = 0; i < (W < 760 ? 36 : 70); i++) {
          stars.push({ x: Math.random() * W, y: Math.random() * H * .52, r: Math.random() * 1.2 + .3, p: Math.random() * 6.28 });
        }
      }
      function draw(ts) {
        requestAnimationFrame(draw);
        if (!vis || d.hidden) return;
        if (ts - last < STEP) return;
        last = ts; t += .032;
        day = d.documentElement.getAttribute('data-theme') === 'day';
        ctx.clearRect(0, 0, W, H);
        /* atmosphere */
        var g = ctx.createLinearGradient(0, 0, 0, H);
        if (day) { g.addColorStop(0, 'rgba(255,220,225,0)'); g.addColorStop(1, 'rgba(255,170,190,.16)'); }
        else { g.addColorStop(0, 'rgba(70,34,80,0)'); g.addColorStop(.7, 'rgba(255,110,130,.06)'); g.addColorStop(1, 'rgba(255,170,120,.13)'); }
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        /* stars (night only) */
        if (!day) for (var i = 0; i < stars.length; i++) {
          var s = stars[i];
          ctx.fillStyle = 'rgba(255,240,246,' + (.12 + Math.abs(Math.sin(t * .8 + s.p)) * .34).toFixed(2) + ')';
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
        }
        /* buildings */
        for (i = 0; i < blds.length; i++) {
          var b = blds[i];
          if (!b.back) continue;
          ctx.fillStyle = day ? 'rgba(196,150,170,.35)' : 'rgba(30,20,44,.8)';
          ctx.fillRect(b.x, b.base || (H - b.h * .8), b.w, b.h * .8);
        }
        for (i = 0; i < blds.length; i++) {
          b = blds[i]; if (b.back) continue;
          var by = H - b.h;
          ctx.fillStyle = day ? 'rgba(255,214,222,.55)' : 'rgba(13,9,20,.96)';
          ctx.fillRect(b.x, by, b.w, b.h);
          /* windows */
          var cols = Math.max(1, Math.floor(b.w / 15)), rows = Math.max(2, Math.floor(b.h / 18));
          for (var c = 0; c < cols; c++) for (var r2 = 0; r2 < rows; r2++) {
            if (Math.random() > .35) continue;
            var lx = b.x + 6 + c * (b.w - 10) / cols;
            var ly = by + 10 + r2 * (b.h - 14) / rows;
            if (day) ctx.fillStyle = 'rgba(255,255,255,.55)';
            else {
              var warm = Math.random();
              ctx.fillStyle = warm > .72 ? 'rgba(255,214,150,' + (.25 + Math.random() * .45).toFixed(2) + ')' :
                (warm > .4 ? 'rgba(140,220,255,.4)' : 'rgba(255,170,160,.4)');
            }
            ctx.fillRect(lx, ly, 3.4, 4.6);
          }
        }
        /* Tokyo Tower */
        var tx = W * .78, ty = H * .99, th = H * .42;
        ctx.strokeStyle = day ? 'rgba(200,90,110,.55)' : 'rgba(255,120,95,.9)';
        ctx.lineWidth = W < 760 ? 1.5 : 2.1;
        ctx.beginPath();
        ctx.moveTo(tx - 26, ty); ctx.lineTo(tx - 7, ty - th * .8);
        ctx.moveTo(tx + 26, ty); ctx.lineTo(tx + 7, ty - th * .8);
        for (var k = 0; k < 6; k++) {
          var y1 = ty - th * .8 * (k / 6), y2 = ty - th * .8 * ((k + 1) / 6);
          var w1 = 20 * (1 - k / 6) + 3, w2 = 20 * (1 - (k + 1) / 6) + 3;
          ctx.moveTo(tx - w1, y1); ctx.lineTo(tx + w2, y2);
          ctx.moveTo(tx + w1, y1); ctx.lineTo(tx - w2, y2);
        }
        ctx.moveTo(tx, ty - th * .8); ctx.lineTo(tx, ty - th); ctx.stroke();
        /* tower tip pulse */
        ctx.fillStyle = day ? 'rgba(220,80,110,.7)' : 'rgba(255,90,90,' + (.5 + Math.abs(Math.sin(t * 1.6)) * .5).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(tx, ty - th, 2.6, 0, 6.283); ctx.fill();
      }
      if ('IntersectionObserver' in w) {
        new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: .01 }).observe(cv);
      }
      var rz; w.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(build, 200); });
      build(); requestAnimationFrame(draw);
    }

    /* ---- looping phone chat ---- */
    var log = $('#chatlog');
    if (log) {
      var script = [
        ['them', 'you still awake?', '02:44'],
        ['me', 'unfortunately. you?', '02:45'],
        ['them', 'the vending machine on my street is the only thing that looks at me kindly', '02:47'],
        ['me', 'then photograph it. make the city tell the truth.', '02:48'],
        ['them', '…that is the nicest thing anyone has typed to me at 3am', '02:49'],
        ['me', 'wait till you hear me at 4. 🐾', '02:50'],
        ['them', 'my phone is at 4%. if i vanish, that is why.', '02:51'],
        ['me', 'then i will wait for the 4% to come back.', '02:52']
      ];
      var i = 0, notif = $('#notif');
      function tick() {
        if (i >= script.length) {
          setTimeout(function () {
            log.innerHTML = ''; i = 0; tick();
          }, 3200); return;
        }
        var m = script[i++];
        var tp = d.createElement('div');
        tp.className = 'typing'; tp.innerHTML = '<i></i><i></i><i></i>';
        log.appendChild(tp); log.scrollTop = log.scrollHeight;
        setTimeout(function () {
          tp.remove();
          var el = d.createElement('div');
          el.className = 'msg ' + m[0];
          el.innerHTML = m[1] + '<small>' + m[2] +
            (m[0] === 'me' ? '<span class="tick">✓✓</span>' : '') + '</small>';
          log.appendChild(el); log.scrollTop = log.scrollHeight;
          if (i === 3 && notif) {
            notif.classList.add('on');
            setTimeout(function () { notif.classList.remove('on'); }, 3200);
          }
          setTimeout(tick, 1500 + Math.random() * 900);
        }, 900);
      }
      if (reduce()) {
        script.forEach(function (m) {
          var el = d.createElement('div');
          el.className = 'msg ' + m[0];
          el.innerHTML = m[1] + '<small>' + m[2] + '</small>';
          log.appendChild(el);
        });
      } else setTimeout(tick, 900);
    }

    /* ---- gentle parallax on hero layers ---- */
    if (!reduce()) {
      var fx = $('.hero-fx'), copy = $('.hero-copy'), phone = $('.hero-phone');
      var sy = 0;
      w.addEventListener('scroll', function () {
        sy = w.scrollY;
        if (sy > w.innerHeight * 1.4) return;
        if (fx) fx.style.transform = 'translate3d(0,' + (sy * .18).toFixed(1) + 'px,0)';
        if (copy) copy.style.transform = 'translate3d(0,' + (sy * -.06).toFixed(1) + 'px,0)';
        if (phone) phone.style.opacity = String(Math.max(0, 1 - sy / (w.innerHeight * .9)));
      }, { passive: true });
    }

    /* hero "Drag the seasons" jump */
    $$('[data-scroll]').forEach(function (b) {
      PG.on(b, 'click', function () {
        var t2 = $(b.getAttribute('data-scroll'));
        if (t2) t2.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' });
      });
    });
  })();

  /* =========================================================
     2 · SEASON CINEMA  (Sept → April, draggable)
     ========================================================= */
  (function season() {
    var root = $('[data-season]');
    if (!root) return;
    var S = [
      { m: 'Sept', emoji: '🔋', title: 'Low Battery', when: 'September 5 · humid indigo + neon',
        line: '2:47 AM. A broke design student with 4% battery meets a stranger\'s post in the dark.',
        wash: 'linear-gradient(180deg,rgba(36,59,107,.72),rgba(107,63,143,.34) 60%,rgba(10,7,16,.2))',
        sky: 'linear-gradient(180deg,#26355c,#4a2a66 62%,#120d1c)', fx: 'rain' },
      { m: 'Sept', emoji: '🐾', title: 'New Member', when: 'September · the group chat · warm amber',
        line: '@yuki.psd adds a new member to Midnight Strays 🐾. Somebody says hello. Somebody says nothing and screenshots it.',
        wash: 'linear-gradient(180deg,rgba(122,74,30,.7),rgba(224,164,90,.36) 60%,rgba(10,7,16,.2))',
        sky: 'linear-gradient(180deg,#3a2412,#7a4a1e 62%,#1a1008)', fx: 'dust' },
      { m: 'Oct', emoji: '💬', title: 'Direct Message', when: 'October · maple orange',
        line: 'The post that made the city tell the truth becomes a private thread. Two handles become two people who wait for a notification.',
        wash: 'linear-gradient(180deg,rgba(138,59,30,.72),rgba(224,123,60,.36) 60%,rgba(10,7,16,.2))',
        sky: 'linear-gradient(180deg,#4a2410,#a65226 60%,#1c0f08)', fx: 'leaf' },
      { m: 'Nov', emoji: '🌙', title: 'Two Months of Midnight', when: 'November · rust & gold · day 61',
        line: 'Days built from small messages: morning, survive-til-6, eat something real, good night professor. Then a call arrives by accident.',
        wash: 'linear-gradient(180deg,rgba(107,47,31,.74),rgba(217,154,60,.34) 60%,rgba(10,7,16,.2))',
        sky: 'linear-gradient(180deg,#3d1f14,#8a5a24 58%,#150d0a)', fx: 'leaf' },
      { m: 'Dec', emoji: '❄️', title: 'Winter, Held Together', when: 'December – January · ice blue + screen glow',
        line: 'Rent notices, a shattered lens, one-word replies — and a cheap film camera with 27 frames and no deletes.',
        wash: 'linear-gradient(180deg,rgba(29,58,92,.74),rgba(143,199,232,.32) 60%,rgba(10,7,16,.2))',
        sky: 'linear-gradient(180deg,#1b2c44,#4a6f92 58%,#0d1420)', fx: 'snow' },
      { m: 'Feb', emoji: '🌸', title: 'Counting Down to Spring', when: 'February – March · plum → bud pink',
        line: 'One note, two cursors. An itinerary typed in real time, a zine bound by hand, and a country waiting for flowers.',
        wash: 'linear-gradient(180deg,rgba(92,36,64,.74),rgba(229,139,168,.36) 60%,rgba(10,7,16,.2))',
        sky: 'linear-gradient(180deg,#47203a,#b86c88 58%,#1a0d16)', fx: 'bud' },
      { m: 'Apr', emoji: '☂️', title: 'See You Offline', when: 'April 4 · Shibuya · sakura pink + sky blue',
        line: 'Twelve steps, two \'hi\'s, one purikura strip torn in half, and a clear umbrella that still has the paw sticker on the handle.',
        wash: 'linear-gradient(180deg,rgba(122,53,80,.72),rgba(255,183,197,.4) 58%,rgba(10,7,16,.2))',
        sky: 'linear-gradient(180deg,#7a3550,#ffb7c5 62%,#bfe4ff)', fx: 'petal' }
    ];
    var when = $('[data-season-when]'), title = $('[data-season-title]'), line = $('[data-season-line]'),
        emoji = $('[data-season-emoji]'), sky = $('[data-season-sky]'), bg = $('.season-bg'),
        counter = $('[data-season-counter]'), track = $('[data-tl]'), fill = $('.tl-fill', root),
        knob = $('.tl-knob', root), hint = $('[data-tl-hint]'), cvs = $('[data-season-fx]');
    var idx = 0, touched = false;

    function apply(i, silent) {
      i = PG.clamp(i, 0, S.length - 1);
      idx = i;
      var s = S[i];
      when.textContent = s.when; title.textContent = s.title; line.textContent = s.line;
      emoji.textContent = s.emoji;
      emoji.style.animation = 'none'; void emoji.offsetWidth;
      emoji.style.animation = 'pop .5s var(--ease-back)';
      sky.style.background = s.sky;
      if (bg) bg.style.setProperty('--season-wash', s.wash);
      if (counter) counter.textContent = (i + 1) + ' / 7';
      root.style.setProperty('--p', (i / (S.length - 1) * 100) + '%');
      if (fill) fill.style.setProperty('--p', (i / (S.length - 1) * 100) + '%');
      if (track) track.setAttribute('aria-valuenow', i), track.setAttribute('aria-valuetext', s.m + ' — ' + s.title);
      $$('.tl-dots i', root).forEach(function (el, k) { el.classList.toggle('on', k === i); });
      if (!silent) { PG.sfx('petal'); PG.haptic(6); }
      if (!touched) { touched = true; }
      setWeather(s.fx);
      if (i === 6) PG.unlock('seasonal');
    }

    /* weather particles */
    var parts = [], wctx = null, wW = 0, wH = 0, cur = 'petal', raf2 = null;
    function setWeather(kind) { cur = kind; }
    function initCanvas() {
      if (!cvs) return;
      wctx = cvs.getContext('2d');
      resizeCanvas();
      w.addEventListener('resize', resizeCanvas);
      if (!reduce()) loopW();
    }
    function resizeCanvas() {
      if (!cvs) return;
      var r = cvs.getBoundingClientRect();
      var dpr = Math.min(w.devicePixelRatio || 1, 1.6);
      wW = r.width; wH = r.height;
      cvs.width = wW * dpr; cvs.height = wH * dpr;
      wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(kind) {
      var n = kind === 'rain' ? 90 : kind === 'snow' ? 60 : kind === 'petal' ? 44 : 34;
      parts = [];
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * wW, y: Math.random() * wH,
          vx: kind === 'rain' ? -1.1 + Math.random() * .3 : -1.6 + Math.random() * 1.4,
          vy: kind === 'rain' ? 9 + Math.random() * 5 : kind === 'snow' ? 1 + Math.random() * .9 : .7 + Math.random() * 1.3,
          r: kind === 'rain' ? 1.4 : kind === 'snow' ? 1.6 + Math.random() * 2.2 : 3 + Math.random() * 4,
          rot: Math.random() * 6.28, vr: (Math.random() - .5) * .1, hue: Math.random(), kind: kind
        });
      }
    }
    function loopW() {
      raf2 = requestAnimationFrame(loopW);
      if (!wctx || d.hidden) return;
      if (!parts.length) spawn(cur);
      wctx.clearRect(0, 0, wW, wH);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.kind !== cur) { spawn(cur); return; }
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y > wH + 12) { p.y = -12; p.x = Math.random() * wW; }
        if (p.x < -14) p.x = wW + 10;
        if (p.kind === 'rain') {
          wctx.strokeStyle = 'rgba(185,220,255,.42)'; wctx.lineWidth = 1.2;
          wctx.beginPath(); wctx.moveTo(p.x, p.y); wctx.lineTo(p.x + p.vx * 1.4, p.y + 9); wctx.stroke();
        } else if (p.kind === 'snow') {
          wctx.fillStyle = 'rgba(255,255,255,.72)';
          wctx.beginPath(); wctx.arc(p.x, p.y, p.r, 0, 6.283); wctx.fill();
        } else if (p.kind === 'leaf') {
          wctx.save(); wctx.translate(p.x, p.y); wctx.rotate(p.rot);
          wctx.fillStyle = p.hue > .5 ? 'rgba(224,123,60,.8)' : 'rgba(217,154,60,.75)';
          wctx.beginPath(); wctx.ellipse(0, 0, p.r * 1.5, p.r * .7, 0, 0, 6.283); wctx.fill(); wctx.restore();
        } else if (p.kind === 'bud') {
          wctx.save(); wctx.translate(p.x, p.y); wctx.rotate(p.rot);
          wctx.fillStyle = 'rgba(255,183,197,.85)';
          wctx.beginPath(); wctx.ellipse(0, 0, p.r, p.r * .66, 0, 0, 6.283); wctx.fill(); wctx.restore();
        } else if (p.kind === 'dust') {
          wctx.fillStyle = 'rgba(255,220,170,' + (.2 + p.hue * .4).toFixed(2) + ')';
          wctx.beginPath(); wctx.arc(p.x, p.y, p.r * .5, 0, 6.283); wctx.fill();
        } else {
          wctx.save(); wctx.translate(p.x, p.y); wctx.rotate(p.rot);
          wctx.fillStyle = p.hue > .55 ? 'rgba(255,183,197,.9)' : 'rgba(255,215,222,.8)';
          wctx.beginPath();
          wctx.moveTo(0, -p.r); wctx.quadraticCurveTo(p.r, 0, 0, p.r);
          wctx.quadraticCurveTo(-p.r, 0, 0, -p.r); wctx.fill(); wctx.restore();
        }
      }
    }

    /* drag / click / keyboard on the timeline */
    function fromX(clientX) {
      var r = track.getBoundingClientRect();
      var p = PG.clamp((clientX - r.left) / r.width, 0, 1);
      return Math.round(p * (S.length - 1));
    }
    if (track) {
      var dragging = false;
      PG.on(track, 'pointerdown', function (e) {
        dragging = true; track.setPointerCapture && track.setPointerCapture(e.pointerId);
        if (hint) hint.textContent = 'keep dragging — it is almost spring';
        apply(fromX(e.clientX));
      });
      PG.on(track, 'pointermove', function (e) { if (dragging) apply(fromX(e.clientX), true); });
      PG.on(track, 'pointerup', function () { dragging = false; });
      PG.on(track, 'pointercancel', function () { dragging = false; });
      PG.on(track, 'keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); apply(idx + 1); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); apply(idx - 1); }
        if (e.key === 'Home') { e.preventDefault(); apply(0); }
        if (e.key === 'End') { e.preventDefault(); apply(6); }
      });
      $$('.tl-dots i', root).forEach(function (el, i) {
        PG.on(el, 'click', function (ev) { ev.stopPropagation(); apply(i); });
      });
    }
    /* scroll a little → the season advances once (storytelling, subtle) */
    if ('IntersectionObserver' in w) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) apply(idx);
      }, { threshold: .35 }).observe(root);
    }
    apply(0, true);
    initCanvas();
  })();

  /* =========================================================
     3 · CAST — flip, bobbing bubble, bars, height compare
     ========================================================= */
  (function cast() {
    $$('[data-flip]').forEach(function (b) {
      PG.on(b, 'click', function (e) {
        e.stopPropagation();
        var card = b.closest('.flipcard');
        card.classList.toggle('flipped');
        PG.sfx('pop'); PG.haptic(8);
      });
    });
    $$('.flipcard').forEach(function (card) {
      PG.on(card, 'click', function (e) {
        if (e.target.closest('[data-flip]')) return;
        var bob = $('.avatar-bob', card);
        if (!bob) return;
        var say = bob.dataset.say;
        if (bob._n) say = bob.dataset.say2;
        bob._n = !bob._n;
        var bub = $('.bub', bob);
        if (!bub) { bub = d.createElement('div'); bub.className = 'bub'; bob.appendChild(bub); }
        bub.textContent = say;
        bub.classList.add('on');
        clearTimeout(bob._t);
        bob._t = setTimeout(function () { bub.classList.remove('on'); }, 2400);
        PG.sfx('pop');
      });
    });
    /* bars + height comparison animate when seen */
    if ('IntersectionObserver' in w) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          io.unobserve(e.target);
        });
      }, { threshold: .4 });
      $$('.bars').forEach(function (b) { io.observe(b); });
      var hc = $('[data-hc]');
      if (hc) io.observe(hc);
    }
  })();

  /* =========================================================
     4 · THREAD CHAT — staged reveal + reply + reactions
     ========================================================= */
  (function thread() {
    var wrap = $('#bubwrap');
    if (!wrap) return;
    var bubs = $$('.bub', wrap);
    if ('IntersectionObserver' in w) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var i = bubs.indexOf(e.target);
          e.target.style.transitionDelay = (Math.max(0, i) * .12) + 's';
          e.target.classList.add('in');
          io.unobserve(e.target);
        });
      }, { threshold: .2, rootMargin: '0px 0px -8% 0px' });
      bubs.forEach(function (b) { io.observe(b); });
    } else bubs.forEach(function (b) { b.classList.add('in'); });

    /* emoji reactions float up */
    PG.on(wrap, 'click', function (e) {
      var btn = e.target.closest('[data-emoji]');
      if (!btn) return;
      var em = btn.dataset.emoji;
      var r = btn.getBoundingClientRect();
      var f = d.createElement('div');
      f.className = 'emoji-float'; f.textContent = em;
      f.style.left = (r.left + r.width / 2) + 'px';
      f.style.top = (r.top - 6) + 'px';
      d.body.appendChild(f);
      setTimeout(function () { f.remove(); }, 1600);
      var n = PG.react('thread-' + em);
      btn.textContent = em + ' ' + (n + 11);
      btn.classList.add('picked');
      PG.sfx('petal');
    });

    /* user reply + cute auto answer */
    var REPLIES = [
      ['them', 'you are still here. good.'],
      ['them', 'read 02:48 ✓✓'],
      ['them', 'onigiri is on me next shift.'],
      ['them', 'that is such a tejas thing to type.'],
      ['them', 'okay. one frame. only because you asked.'],
      ['them', '19:07 · i typed this four times.'],
      ['them', 'go to sleep. i will still be here at 2:47.'],
      ['them', 'paw sticker on it.'],
      ['them', '…don\'t quote me on that.']
    ];
    var ri = 0, form = $('#chatreply'), input = $('#replyInput');
    function send(text) {
      text = (text || '').trim();
      if (!text) return;
      var mine = d.createElement('div');
      mine.className = 'bub me in';
      mine.innerHTML = String(text).replace(/[<>&]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]; }) +
        '<span class="t">you · ' + new Date().toTimeString().slice(0, 5) + '</span>';
      wrap.appendChild(mine);
      PG.sfx('pop'); PG.haptic(10);
      PG.unlock('thread-weaver');
      var tp = d.createElement('div');
      tp.className = 'bub them typing-b in';
      tp.innerHTML = '<i></i><i></i><i></i>';
      setTimeout(function () {
        wrap.appendChild(tp);
        mine.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'center' });
      }, 420);
      setTimeout(function () {
        tp.remove();
        var r = REPLIES[ri++ % REPLIES.length];
        var reply = d.createElement('div');
        reply.className = 'bub them in';
        reply.innerHTML = r[1] + '<span class="t">@pragati.pages · now</span>';
        wrap.appendChild(reply);
        PG.sfx('chime');
        reply.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'center' });
      }, 1900);
    }
    PG.on(form, 'submit', function (e) {
      e.preventDefault();
      send(input.value);
      input.value = '';
    });
    $$('[data-reply]').forEach(function (b) {
      PG.on(b, 'click', function () {
        send(b.dataset.reply);
        var box = $('.chatbox'); if (box) box.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'center' });
      });
    });
  })();

  /* =========================================================
     5 · CHAPTERS RAIL — cards, progress, drag momentum
     ========================================================= */
  (function chapters() {
    var rail = $('#rail');
    if (!rail) return;
    var PEEK = ['hero_city', 'dm', 'day01', 'call', 'xmas', 'zine', 'meet'];
    var LOGLINES = [
      "2:47 AM. A broke design student with 4% battery meets a stranger's post in the dark. Fourteen million people are asleep. Almost.",
      "@yuki.psd adds a new member to Midnight Strays 🐾. Somebody says hello. Somebody says nothing and screenshots it.",
      "The post that made the city tell the truth becomes a private thread. Two handles become two people who wait for a notification.",
      "Days built from small messages: morning, survive-til-6, eat something real, good night professor. Then a call arrives by accident.",
      "Rent notices, a shattered lens, one-word replies — and a cheap film camera with 27 frames and no deletes.",
      "One note, two cursors. An itinerary typed in real time, a zine bound by hand, and a country waiting for flowers.",
      "Twelve steps, two 'hi's, one purikura strip torn in half, and a clear umbrella that still has the paw sticker on the handle."
    ];
    var prog = PG.progress();
    rail.innerHTML = PG.CHAPTERS.map(function (c, i) {
      var pct = prog[c.n] || 0;
      var label = pct > 90 ? 'read ✓' : pct > 2 ? pct + '% read' : 'unread';
      return '<a class="chip rv" href="' + c.reader + '" data-cursor="read" style="--wash:' + c.wash + '">' +
        '<div class="wash"></div>' +
        '<div class="chip-top"><span class="pgnum">CHAPTER ' + String(c.n).padStart(2, '0') + '</span>' +
        '<span class="chip-emoji">' + c.emoji + '</span></div>' +
        '<h4>' + c.slug + '</h4>' +
        '<div class="when">' + c.when + ' · ' + c.pages + ' pages</div>' +
        '<p>' + LOGLINES[i] + '</p>' +
        '<div class="prog"><i style="width:' + pct + '%"></i></div>' +
        '<span class="go">' + (pct > 2 ? 'Continue' : 'Read') + ' <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true"><path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span>' +
        '<div class="peek" style="background-image:var(--im-' + PEEK[i] + ')"></div>' +
        '</a>';
    }).join('');
    PG.observeReveals(rail);

    /* drag with momentum */
    (function drag() {
      var down = false, startX = 0, startLeft = 0, moved = 0, lastX = 0, v = 0, rafId = null;
      PG.on(rail, 'pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        down = true; moved = 0; startX = lastX = e.clientX; startLeft = rail.scrollLeft; v = 0;
        rail.classList.add('dragging');
        cancelAnimationFrame(rafId);
      });
      PG.on(rail, 'pointermove', function (e) {
        if (!down) return;
        var dx = e.clientX - startX;
        moved = Math.max(moved, Math.abs(dx));
        rail.scrollLeft = startLeft - dx;
        v = lastX - e.clientX; lastX = e.clientX;
      });
      function end() {
        if (!down) return;
        down = false;
        rail.classList.remove('dragging');
        if (Math.abs(v) > 2) {
          (function glide() {
            v *= .94;
            rail.scrollLeft += v;
            if (Math.abs(v) > .4 && (rail.scrollLeft > 0 && rail.scrollLeft < rail.scrollWidth - rail.clientWidth)) rafId = requestAnimationFrame(glide);
          })();
        }
      }
      PG.on(rail, 'pointerup', end);
      PG.on(rail, 'pointercancel', end);
      PG.on(rail, 'pointerleave', end);
      /* swallow clicks that were really drags */
      PG.on(rail, 'click', function (e) {
        if (moved > 10) { e.preventDefault(); e.stopPropagation(); }
      }, true);
    })();

    /* arrows */
    function step(dir) {
      var card = $('.chip', rail);
      var amount = card ? card.offsetWidth + 16 : 300;
      rail.scrollBy({ left: dir * amount, behavior: reduce() ? 'auto' : 'smooth' });
      PG.sfx('pop');
    }
    PG.on($('[data-rail-prev]'), 'click', function () { step(-1); });
    PG.on($('[data-rail-next]'), 'click', function () { step(1); });

    /* continue reading pill */
    var target = PG.continueTarget();
    var pill = d.createElement('div');
    pill.className = 'continue-pill';
    pill.innerHTML = '<span>Continue <b>Ch. ' + String(target.ch.n).padStart(2, '0') + '</b>' +
      (target.pct ? ' · ' + target.pct + '%' : '') + '</span>' +
      '<a class="cp-btn" href="' + target.ch.reader + '">Open</a>' +
      '<button class="cp-x" type="button" aria-label="Dismiss">✕</button>';
    d.body.appendChild(pill);
    var dismissed = PG.store.get('pg-continue-x', '0') === '1';
    PG.on($('.cp-x', pill), 'click', function () { pill.classList.remove('on'); PG.store.set('pg-continue-x', '1'); });
    if (!dismissed) setTimeout(function () { pill.classList.add('on'); }, 5200);
  })();

  /* =========================================================
     6 · MOTIF STICKER BOARD — drag, throw, tap to reveal
     ========================================================= */
  (function board() {
    var host = $('#board');
    if (!host) return;
    var MOTIFS = [
      { ic: '🥤', t: 'Vending machines, 3 AM', pay: 'His loneliness → her first DM topic → the cover of his zine.' },
      { ic: '⭐', t: 'The starred message', pay: '"Your photos look like the city finally telling the truth." Quoted in the dedication.' },
      { ic: '📖', t: 'First copy, signed', pay: 'A dream promise in November, kept on a Yoyogi blanket in April.' },
      { ic: '🎞️', t: '27 frames', pay: 'A cheap film camera. No deletes. It becomes the zine — and a wall.' },
      { ic: '🐾', t: 'Paw stickers', pay: 'Mailed with the camera. Still on the umbrella handle in the rain.' },
      { ic: '🌱', t: '“Let spring come soon”', pay: 'Two wishes written apart. Two ema plaques, identical handwriting.' },
      { ic: '📏', t: '183 ÷ 140 cm', pay: 'Slowed strides, purikura crouches, umbrella angles. A gap turned tender.' },
      { ic: '🌧️', t: 'Rain', pay: 'Chapter 1 opens alone in the rain. Chapter 7 closes sharing an umbrella.' },
      { ic: '🐱', t: 'Mochi', pay: 'A chubby gray-white cat, the reason PawGram feels like home.' }
    ];
    var W = host.clientWidth, H = host.clientHeight;
    var nodes = [];

    function measure() {
      W = host.clientWidth; H = host.clientHeight;
      nodes.forEach(function (n) {
        n.x = PG.clamp(n.x, 0, W - n.w);
        n.y = PG.clamp(n.y, 0, H - n.h);
        place(n);
      });
    }

    MOTIFS.forEach(function (m, i) {
      var el = d.createElement('div');
      el.className = 'sticker';
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', m.t + ' — tap for the payoff');
      el.innerHTML = '<span class="ic">' + m.ic + '</span><b>' + m.t + '</b>' +
        '<span class="pay">' + m.pay + '</span>';
      host.appendChild(el);
      nodes.push({ el: el, x: 0, y: 0, vx: 0, vy: 0, w: el.offsetWidth, h: el.offsetHeight, drag: false });
    });

    /* scatter */
    var cols = w.innerWidth < 760 ? 2 : 3, rows = Math.ceil(nodes.length / cols);
    nodes.forEach(function (n, i) {
      var c = i % cols, r = Math.floor(i / cols);
      n.w = n.el.offsetWidth; n.h = n.el.offsetHeight;
      n.x = (W / cols) * c + (W / cols - n.w) / 2 + PG.rnd(-14, 14);
      n.y = (H / rows) * r + (H / rows - n.h) / 2 + PG.rnd(-10, 10);
      n.x = PG.clamp(n.x, 4, Math.max(4, W - n.w - 4));
      n.y = PG.clamp(n.y, 4, Math.max(4, H - n.h - 4));
      place(n);
    });

    function place(n) {
      var rot = PG.clamp(n.vx * 2.2, -16, 16);
      n.el.style.transform = 'translate3d(' + n.x.toFixed(1) + 'px,' + n.y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(1) + 'deg)';
    }

    /* physics loop */
    var rafId = null, active = false;
    function loop() {
      rafId = requestAnimationFrame(loop);
      var moving = false;
      nodes.forEach(function (n) {
        if (n.drag) return;
        n.x += n.vx; n.y += n.vy;
        n.vx *= .93; n.vy *= .93;
        var bounced = false;
        if (n.x < 0) { n.x = 0; n.vx = Math.abs(n.vx) * .5; bounced = true; }
        if (n.x > W - n.w) { n.x = W - n.w; n.vx = -Math.abs(n.vx) * .5; bounced = true; }
        if (n.y < 0) { n.y = 0; n.vy = Math.abs(n.vy) * .5; bounced = true; }
        if (n.y > H - n.h) { n.y = H - n.h; n.vy = -Math.abs(n.vy) * .5; bounced = true; }
        if (Math.abs(n.vx) > .06 || Math.abs(n.vy) > .06) moving = true;
        if (moving || bounced) place(n);
      });
      if (!moving && !active) { cancelAnimationFrame(rafId); rafId = null; }
    }
    function kick() { active = true; if (!rafId) loop(); }
    host.addEventListener('pointerup', function () { setTimeout(function () { active = false; }, 40); });
    host.addEventListener('pointerleave', function () { setTimeout(function () { active = false; }, 40); });

    /* drag */
    var cur = null, offX = 0, offY = 0, moved = 0, lastT = 0;
    nodes.forEach(function (n) {
      PG.on(n.el, 'pointerdown', function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        cur = n; n.drag = true; n.vx = n.vy = 0;
        var r = n.el.getBoundingClientRect(), br = host.getBoundingClientRect();
        offX = e.clientX - r.left; offY = e.clientY - r.top;
        moved = 0; lastT = performance.now();
        n.el.classList.add('drag');
        n.el.setPointerCapture && n.el.setPointerCapture(e.pointerId);
        host.classList.add('touched');
        kick();
      });
      PG.on(n.el, 'pointermove', function (e) {
        if (!n.drag) return;
        var br = host.getBoundingClientRect();
        var nx = e.clientX - br.left - offX, ny = e.clientY - br.top - offY;
        moved = Math.max(moved, Math.abs(nx - n.x) + Math.abs(ny - n.y));
        n.vx = (nx - n.x) * .55; n.vy = (ny - n.y) * .55;
        n.x = PG.clamp(nx, 0, W - n.w); n.y = PG.clamp(ny, 0, H - n.h);
        place(n); kick();
      });
      function release() {
        if (!n.drag) return;
        n.drag = false; n.el.classList.remove('drag');
        n.vx = PG.clamp(n.vx, -34, 34); n.vy = PG.clamp(n.vy, -34, 34);
        if (moved > 6) { n.el.classList.add('thrown'); setTimeout(function () { n.el.classList.remove('thrown'); }, 700); }
        kick();
        cur = null;
      }
      PG.on(n.el, 'pointerup', release);
      PG.on(n.el, 'pointercancel', release);
      PG.on(n.el, 'click', function (e) {
        if (moved > 8) return;
        nodes.forEach(function (o) { if (o !== n) o.el.classList.remove('on'); });
        n.el.classList.toggle('on');
        PG.sfx('pop'); PG.haptic(8);
        if ($$('.sticker.on').length >= 5) PG.unlock('explorer');
      });
      PG.on(n.el, 'keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); n.el.click(); }
      });
    });
    var rz; w.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(measure, 200); });
  })();

  /* =========================================================
     7 · ARCADE — best scores + leaderboard
     ========================================================= */
  (function arcade() {
    var KEYS = [['catch', 'Paw Catch'], ['konbini', 'Konbini Rush'], ['quiz', 'Thread Quiz'],
                ['dash', 'Umbrella Dash'], ['frame27', 'Frame 27'], ['mochi', 'Mochi Clicker']];
    function get(k) {
      try { var v = localStorage.getItem('pf-' + k); if (v !== null) return parseInt(v, 10) || 0; } catch (e) {}
      return parseInt(PG.store.get('pf-' + k, '0'), 10) || 0;
    }
    $$('[data-best]').forEach(function (el) {
      var v = get(el.dataset.best);
      el.textContent = v > 0 ? v : '—';
    });
    var lb = $('#leaderboard');
    if (lb) {
      var rows = KEYS.map(function (k) { return [k[1], get(k[0])]; }).filter(function (r) { return r[1] > 0; });
      rows.sort(function (a, b) { return b[1] - a[1]; });
      if (!rows.length) {
        lb.insertAdjacentHTML('beforeend',
          '<div class="lb-row"><span>no scores yet</span><b>play something →</b></div>');
      } else {
        rows.slice(0, 5).forEach(function (r, i) {
          lb.insertAdjacentHTML('beforeend',
            '<div class="lb-row"><span>' + (i + 1) + '. ' + r[0] + '</span><b>' + r[1] + '</b></div>');
        });
      }
    }
    /* badge shelf */
    var shelf = $('#badgesShelf');
    if (shelf) {
      var got = PG.badges();
      Object.keys(PG.BADGES).forEach(function (id) {
        var b = PG.BADGES[id];
        var el = d.createElement('span');
        el.className = 'bd' + (got.indexOf(id) > -1 ? ' got' : '');
        el.textContent = b.icon;
        el.title = b.title + ' — ' + b.sub;
        shelf.appendChild(el);
      });
    }
  })();

  /* =========================================================
     8 · GALLERY + LIGHTBOX
     ========================================================= */
  var GAL = [
    { a: 'hero_city',  cap: 'PAGE 01 · Low Battery, 2:47 AM', pg: 1 },
    { a: 'dm',         cap: 'PAGE 12 · Added to Midnight Strays', pg: 12 },
    { a: 'day01',      cap: 'PAGE 23 · Days Built From Messages', pg: 23 },
    { a: 'call',       cap: 'PAGE 30 · The Accidental Call', pg: 30 },
    { a: 'cast_tejas', cap: 'CAST · Tejas, @tejas.raw', pg: 0 },
    { a: 'cast_pragati', cap: 'CAST · Pragati, @pragati.pages', pg: 0 },
    { a: 'xmas',       cap: 'PAGE 45 · Christmas Eve Call', pg: 45 },
    { a: 'frames27',   cap: 'PAGE 47 · Winter, 27 Frames', pg: 47 },
    { a: 'mochi',      cap: 'PAGE 51 · Mochi, professional sabotage', pg: 51 },
    { a: 'zine',       cap: 'PAGE 58 · First copy, signed', pg: 58 },
    { a: 'hachiko',    cap: 'PAGE 60 · Hachikō, 10:58', pg: 60 },
    { a: 'meet',       cap: 'PAGE 61 · Twelve Steps', pg: 61 },
    { a: 'hi',         cap: 'PAGE 62 · Hi.', pg: 62 },
    { a: 'ema',        cap: 'PAGE 64 · Same Wish', pg: 64 },
    { a: 'picnic',     cap: 'PAGE 65 · The Exchange', pg: 65 },
    { a: 'sky',        cap: 'PAGE 67 · The City From Above', pg: 67 },
    { a: 'umbrella',   cap: 'PAGE 68 · The Umbrella', pg: 68 },
    { a: 'finale',     cap: 'PAGE 69 · To Be Continued', pg: 69 }
  ];

  (function gallery() {
    var film = $('#filmstrip'), mas = $('#masonry');
    if (!film || !mas) return;
    var html = GAL.map(function (g, i) {
      return '<figure class="gframe" data-i="' + i + '" data-cursor="read" tabindex="0" role="button" ' +
        'aria-label="Open ' + g.cap + '">' +
        '<div class="im" style="background-image:var(--im-' + g.a + ')"></div>' +
        '<span class="pg-tag">' + (g.pg ? 'p.' + g.pg : 'cast') + '</span>' +
        '<figcaption>' + g.cap + '</figcaption></figure>';
    }).join('');
    film.innerHTML = html; mas.innerHTML = html;

    /* view toggle */
    var gal = $('.gallery');
    $$('[data-view-btn]').forEach(function (b) {
      PG.on(b, 'click', function () {
        var v = b.dataset.viewBtn;
        gal.dataset.view = v;
        $$('[data-view-btn]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        PG.sfx('pop');
        if (v === 'masonry') PG.observeReveals(mas);
      });
    });
    PG.on($('[data-galbPrev]'), 'click', function () { film.scrollBy({ left: -420, behavior: 'smooth' }); });
    PG.on($('[data-galbNext]'), 'click', function () { film.scrollBy({ left: 420, behavior: 'smooth' }); });

    /* drag scroll for the film strip */
    (function () {
      var down = false, sx = 0, sl = 0, moved = 0;
      PG.on(film, 'pointerdown', function (e) { down = true; moved = 0; sx = e.clientX; sl = film.scrollLeft; });
      PG.on(film, 'pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); film.scrollLeft = sl - dx; });
      PG.on(film, 'pointerup', function () { down = false; });
      PG.on(film, 'pointerleave', function () { down = false; });
      PG.on(film, 'click', function (e) { if (moved > 10) { e.stopPropagation(); e.preventDefault(); } }, true);
    })();

    /* lightbox */
    var lb = $('#lb'), img = $('#lbImg'), cap = $('#lbCap'), ix = $('#lbIndex'),
        zoom = false, i = 0, scale = 1;
    function open(n) {
      i = (n + GAL.length) % GAL.length;
      var g = GAL[i];
      var cssval = getComputedStyle(d.documentElement).getPropertyValue('--im-' + g.a).trim();
      var url = cssval.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      img.src = url; img.alt = g.cap;
      cap.textContent = g.cap;
      ix.textContent = String(i + 1).padStart(2, '0') + ' / ' + GAL.length;
      scale = 1; img.style.transform = '';
      lb.classList.add('on');
      d.documentElement.classList.add('pg-lock');
      PG.sfx('pop');
    }
    function close() {
      lb.classList.remove('on');
      d.documentElement.classList.remove('pg-lock');
    }
    $$('.gframe').forEach(function (f) {
      PG.on(f, 'click', function () { open(+f.dataset.i); });
      PG.on(f, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(+f.dataset.i); } });
    });
    PG.on($('#lbClose'), 'click', close);
    PG.on(lb, 'click', function (e) { if (e.target === lb || e.target.classList.contains('lb-stage')) close(); });
    PG.on($('#lbPrev'), 'click', function (e) { e.stopPropagation(); open(i - 1); });
    PG.on($('#lbNext'), 'click', function (e) { e.stopPropagation(); open(i + 1); });
    PG.on($('#lbZoom'), 'click', function () {
      scale = scale === 1 ? 1.8 : 1;
      img.style.transform = 'scale(' + scale + ')';
      img.style.cursor = scale > 1 ? 'zoom-out' : 'zoom-in';
    });
    PG.on(d, 'keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') open(i + 1);
      if (e.key === 'ArrowLeft') open(i - 1);
    });
    /* swipe */
    var tx0 = 0, ty0 = 0;
    PG.on(lb, 'touchstart', function (e) { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; }, { passive: true });
    PG.on(lb, 'touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tx0, dy = e.changedTouches[0].clientY - ty0;
      if (Math.abs(dx) > 54 && Math.abs(dx) > Math.abs(dy)) open(i + (dx < 0 ? 1 : -1));
      else if (Math.abs(dy) > 90) close();
    }, { passive: true });
    PG.on($('#lbShare'), 'click', function () {
      var g = GAL[i], url = location.origin + location.pathname;
      if (navigator.share) navigator.share({ title: 'PAWGRAM — ' + g.cap, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { PG.toast('Link copied', g.cap, '🔗'); });
    });
  })();

  /* =========================================================
     9 · CHARACTER QUIZ + shareable canvas card
     ========================================================= */
  (function quiz() {
    var box = $('#quizbox');
    if (!box) return;
    var Q = [
      { q: 'It is 2:47 AM. What are you doing?',
        a: [['Scrolling a group chat, not typing', 'T'], ['Editing photos of an empty street', 'T'],
            ['Reading, with a cat on the keyboard', 'P'], ['Asleep. Like a coward.', 'M']] },
      { q: 'Someone is having a bad week. You…',
        a: [['Send soup. With a note that says “eat.”', 'P'], ['Say nothing, stay online all night', 'T'],
            ['Send 14 memes in a row', 'M'], ['Ask “do you want fixing or listening?”', 'P']] },
      { q: 'Your camera roll is mostly…',
        a: [['Vending machines, 3 AM, neon', 'T'], ['Bookshop spines and margin notes', 'P'],
            ['The same cat, 900 times', 'M'], ['Screenshots of conversations', 'T']] },
      { q: 'Pick a love language.',
        a: [['Small, consistent messages', 'P'], ['A gift with a story behind it', 'T'],
            ['Being left alone, together', 'M'], ['Sharing a 27-frame camera', 'T']] },
      { q: 'Rain starts on a walk home. You…',
        a: [['Open the clear umbrella, keep the sticker dry', 'P'], ['Stand still and photograph it', 'T'],
            ['Run. Splash. Regret.', 'M'], ['Text someone “it’s raining here”', 'P']] },
      { q: 'Someone says something kind. Your reply arrives…',
        a: [['Instantly, four messages deep', 'M'], ['Three days late, perfectly worded', 'P'],
            ['As a photo, no caption', 'T'], ['As “ok.” then a stare at the ceiling', 'T']] }
    ];
    var SCORE = { T: 0, P: 0, M: 0 }, qi = 0, picked = 0;
    var qEl = $('#quizQ'), optEl = $('#quizOpts'), prog = $('#quizProg'),
        resEl = $('#quizResult'), titleEl = $('#quizTitle'), blurbEl = $('#quizBlurb'),
        cv = $('#quizCanvas');

    var RESULTS = {
      T: { name: 'TEJAS', tag: 'the quiet one', line: 'You are 183 cm of unsaid sentences. You show love in frames, not paragraphs — and you will absolutely carry the umbrella at the wrong angle so she stays dry.',
           color: ['#ff5f7e', '#ffb25e'] },
      P: { name: 'PRAGATI', tag: 'the reader', line: 'You read everything twice and answer once. You send soup. You notice the thing nobody said out loud. Obviously the strongest character in the chat.',
           color: ['#b9a7ff', '#ffb7c5'] },
      M: { name: 'MOCHI', tag: 'the cat', line: 'You are chaos disguised as comfort. You sit on the itinerary. You are the reason anything in this story is funny. No notes.',
           color: ['#7ef0d0', '#ffd166'] }
    };

    function render() {
      if (qi >= Q.length) return finish();
      var q = Q[qi];
      prog.style.width = (qi / Q.length * 100) + '%';
      qEl.textContent = (qi + 1) + '. ' + q.q;
      optEl.innerHTML = '';
      q.a.forEach(function (o, i) {
        var b = d.createElement('button');
        b.type = 'button'; b.className = 'qopt';
        b.innerHTML = '<span class="k">' + 'ABCD'[i] + '</span><span>' + o[0] + '</span>';
        PG.on(b, 'click', function () {
          b.classList.add('picked');
          SCORE[o[1]] += 1;
          PG.sfx('pop'); PG.haptic(8);
          optEl.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
          setTimeout(function () { qi++; render(); }, 320);
        });
        optEl.appendChild(b);
      });
    }

    function draw(result) {
      if (!cv || !cv.getContext) return;
      var c = cv.getContext('2d'), W = cv.width, H = cv.height;
      var g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#160d20'); g.addColorStop(.55, '#241033'); g.addColorStop(1, '#0b0712');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      /* halftone */
      c.fillStyle = 'rgba(255,255,255,.05)';
      for (var y = 0; y < H; y += 16) for (var x = 0; x < W; x += 16) {
        c.beginPath(); c.arc(x, y, 1.6, 0, 6.28); c.fill();
      }
      /* glow blob */
      var rg = c.createRadialGradient(W * .78, H * .18, 20, W * .78, H * .18, W * .7);
      rg.addColorStop(0, result.color[0] + 'cc'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = rg; c.fillRect(0, 0, W, H);
      /* frame */
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 4;
      c.strokeRect(36, 36, W - 72, H - 72);
      /* labels */
      c.fillStyle = '#ffb7c5'; c.font = '600 30px Georgia, serif';
      c.fillText('PAWGRAM · SEE YOU OFFLINE', 84, 150);
      c.fillStyle = 'rgba(255,255,255,.62)'; c.font = '600 26px Helvetica, Arial, sans-serif';
      c.fillText('WHICH CHARACTER ARE YOU?', 84, 200);
      /* name */
      c.fillStyle = '#ffffff';
      c.font = '800 150px Georgia, serif';
      c.fillText(result.name, 80, 400);
      /* tag */
      c.fillStyle = result.color[1]; c.font = 'italic 44px Georgia, serif';
      c.fillText(result.tag, 84, 462);
      /* text */
      c.fillStyle = 'rgba(255,255,255,.86)'; c.font = '31px Helvetica, Arial, sans-serif';
      wrap(c, result.line, 84, 560, W - 168, 46);
      /* paw */
      c.save(); c.translate(W - 190, H - 210); c.scale(4.6, 4.6);
      var pg2 = c.createLinearGradient(0, 0, 24, 24);
      pg2.addColorStop(0, '#ff5f7e'); pg2.addColorStop(1, '#ffd166');
      c.fillStyle = pg2;
      c.beginPath(); c.ellipse(12, 15.4, 5.1, 4.1, 0, 0, 6.28); c.fill();
      [[5.6, 10.2, 2.05, 2.6], [9.7, 6.6, 2, 2.55], [14.6, 6.6, 2, 2.55], [18.5, 10.2, 2.05, 2.6]].forEach(function (p) {
        c.beginPath(); c.ellipse(p[0], p[1], p[2], p[3], 0, 0, 6.28); c.fill();
      });
      c.restore();
      /* footer */
      c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '600 24px Helvetica, Arial, sans-serif';
      c.fillText('69 pages · 7 chapters · 2:47 AM', 84, H - 110);
      c.fillStyle = '#ffd166'; c.font = '600 26px Helvetica, Arial, sans-serif';
      c.fillText('pawgram.studio', 84, H - 70);
    }
    function wrap(c, text, x, y, maxW, lh) {
      var words = text.split(' '), line = '', yy = y;
      for (var i = 0; i < words.length; i++) {
        var test = line + words[i] + ' ';
        if (c.measureText(test).width > maxW && line) { c.fillText(line, x, yy); line = words[i] + ' '; yy += lh; }
        else line = test;
      }
      c.fillText(line, x, yy);
    }

    function finish() {
      prog.style.width = '100%';
      qEl.textContent = '';
      optEl.innerHTML = '';
      var best = 'M', top = -1;
      ['T', 'P', 'M'].forEach(function (k) { if (SCORE[k] > top) { top = SCORE[k]; best = k; } });
      var r = RESULTS[best];
      titleEl.textContent = 'You are ' + r.name + ' — ' + r.tag;
      blurbEl.textContent = r.line;
      draw(r);
      resEl.classList.add('on');
      PG.confetti(50);
      PG.sfx('win');
      box.dataset.result = best;
    }

    render();

    PG.on($('#quizShare'), 'click', function () {
      var data = { title: 'PAWGRAM — Which character are you?', text: 'I got ' + (RESULTS[box.dataset.result] || RESULTS.P).name + '.', url: location.origin + location.pathname };
      if (navigator.share) navigator.share(data).catch(function () {});
      else if (cv && cv.toBlob) cv.toBlob(function (blob) {
        var a = d.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pawgram-result.png'; a.click();
        PG.toast('Card downloaded', 'screenshot or send it', '📸');
      });
      else PG.toast('Share', 'screenshot the card above', '📸');
    });
    PG.on($('#quizAgain'), 'click', function () {
      qi = 0; SCORE = { T: 0, P: 0, M: 0 };
      resEl.classList.remove('on');
      render();
    });
  })();

  /* =========================================================
     10 · CTA — umbrella opens + rain + notify
     ========================================================= */
  (function cta() {
    var box = $('#ctabox');
    if (box) {
      var rain = $('.rainlayer', box);
      if (rain) for (var i = 0; i < 26; i++) {
        var el = d.createElement('i');
        el.style.left = (Math.random() * 100) + '%';
        el.style.animationDelay = (-Math.random() * 2.4) + 's';
        el.style.animationDuration = (1.4 + Math.random() * 1.4) + 's';
        el.style.opacity = (.3 + Math.random() * .5).toFixed(2);
        rain.appendChild(el);
      }
      if ('IntersectionObserver' in w) {
        new IntersectionObserver(function (es) {
          if (es[0].isIntersecting) box.classList.add('open');
        }, { threshold: .35 }).observe(box);
      } else box.classList.add('open');
    }
    var form = $('#notifyForm');
    if (form) PG.on(form, 'submit', function (e) {
      e.preventDefault();
      var em = $('#notifyEmail').value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
        $('#notifyEmail').focus();
        $('#notifyEmail').style.borderColor = '#ff5f7e';
        PG.sfx('error');
        return;
      }
      PG.store.set('pg-notify', em);
      $('#notifyBox').classList.add('sent');
      PG.confetti(30); PG.sfx('win');
    });
  })();

  /* publish gallery data for the reader page to reuse if needed */
  PG.GAL = GAL;
})(window, document);
