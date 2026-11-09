/* =========================================================
   PAWGRAM v3 · GALLERY
   Film-strip ⇄ masonry toggle, tilt cards, "load more pages"
   (all 69 manhwa pages appended lazily), and the shared #lb
   lightbox with swipe / pinch / ←→ / page-flip.
   Depends on window.PG (pg-core.js) for $, sfx, toast, lock.
   ========================================================= */
(function (d) {
  'use strict';

  var G = window.PG, $ = G.$, $$ = G.$$;
  var reduce = G.reduce;
  var fine = matchMedia('(pointer:fine)').matches;

  /* ---------- the shared lightbox ---------- */
  var lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbIndex = $('#lbIndex');
  var SET = [], cur = 0, scale = 1;

  function openSet(list, i) {
    if (!lb || !list.length) return;
    SET = list;
    show(i);
    lb.classList.add('on');
    d.documentElement.classList.add('pg-lock');
    G.sfx && G.sfx('pop');
  }
  function show(n) {
    cur = (n + SET.length) % SET.length;
    var it = SET[cur];
    lbImg.classList.remove('flip');
    /* page-flip: restart the animation without a reflow hack */
    void lbImg.offsetWidth;
    lbImg.classList.add('flip');
    lbImg.src = it.src;
    lbImg.alt = (it.cap || 'Manhwa page') + (it.sub ? ' — ' + it.sub : '');
    lbCap.textContent = (it.cap || '') + (it.sub ? '  ·  ' + it.sub : '');
    lbIndex.textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(SET.length).padStart(2, '0');
    scale = 1;
    lbImg.style.transform = '';
    /* keep the film strip / grid in sync when it is the same set */
  }
  function close() {
    if (!lb) return;
    lb.classList.remove('on');
    d.documentElement.classList.remove('pg-lock');
  }
  if (lb) {
    G.on($('#lbClose'), 'click', close);
    G.on($('#lbPrev'), 'click', function (e) { e.stopPropagation(); show(cur - 1); G.sfx && G.sfx('click'); });
    G.on($('#lbNext'), 'click', function (e) { e.stopPropagation(); show(cur + 1); G.sfx && G.sfx('click'); });
    G.on(lb, 'click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb-stage')) close();
    });
    G.on($('#lbZoom'), 'click', function () {
      scale = scale === 1 ? 2 : 1;
      lbImg.style.transform = 'scale(' + scale + ')';
      lbImg.style.cursor = scale > 1 ? 'zoom-out' : 'zoom-in';
    });
    G.on(d, 'keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') { show(cur + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { show(cur - 1); e.preventDefault(); }
    });
    /* swipe + pinch */
    var x0 = 0, y0 = 0, pinch0 = 0;
    G.on(lb, 'touchstart', function (e) {
      if (e.touches.length === 2) {
        pinch0 = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                            e.touches[0].clientY - e.touches[1].clientY);
        return;
      }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    G.on(lb, 'touchmove', function (e) {
      if (e.touches.length !== 2 || !pinch0) return;
      var dd = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                          e.touches[0].clientY - e.touches[1].clientY);
      scale = G.clamp(dd / pinch0, 1, 3);
      lbImg.style.transform = 'scale(' + scale.toFixed(2) + ')';
    }, { passive: true });
    G.on(lb, 'touchend', function (e) {
      if (e.touches.length === 2) return;
      pinch0 = 0;
      if (scale > 1.2) return;
      var dx = (e.changedTouches[0].clientX - x0), dy = (e.changedTouches[0].clientY - y0);
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
      else if (dy > 90) close();
    }, { passive: true });
  }

  /* ---------- 1 · film-strip ⇄ masonry ---------- */
  var film = $('#filmstrip'), mas = $('#masonry');
  function setMode(m) {
    if (!film || !mas) return;
    var gal = $('.gallery');
    if (gal) gal.dataset.view = (m === 'masonry' ? 'masonry' : 'film');
    $$('[data-gmode]').forEach(function (b) {
      var on = b.dataset.gmode === m;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    try { localStorage.setItem('pg-gmode', m); } catch (e) {}
    G.sfx && G.sfx('click');
  }
  $$('[data-gmode]').forEach(function (b) {
    G.on(b, 'click', function () { setMode(b.dataset.gmode); });
  });
  setMode((function () { try { return localStorage.getItem('pg-gmode') || 'strip'; } catch (e) { return 'strip'; } })());

  /* film-strip drag (mouse only — touch scrolls natively) */
  if (film) {
    var down = false, sx = 0, sl = 0, moved = 0;
    G.on(film, 'pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      down = true; moved = 0; sx = e.clientX; sl = film.scrollLeft;
      film.classList.add('grab');
    });
    G.on(film, 'pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      moved = Math.max(moved, Math.abs(dx));
      film.scrollLeft = sl - dx;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      G.on(film, ev, function () { down = false; film.classList.remove('grab'); });
    });
    G.on(film, 'click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    G.on($('[data-galbPrev]'), 'click', function () { film.scrollBy({ left: -430, behavior: reduce ? 'auto' : 'smooth' }); });
    G.on($('[data-galbNext]'), 'click', function () { film.scrollBy({ left: 430, behavior: reduce ? 'auto' : 'smooth' }); });
  }

  /* ---------- 2 · tilt + open helpers ---------- */
  function tilt(el) {
    if (reduce || !fine) return;
    G.on(el, 'pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      el.style.transform = 'perspective(900px) rotateY(' + (px * 8).toFixed(2) +
        'deg) rotateX(' + (-py * 8).toFixed(2) + 'deg)';
      el.style.setProperty('--mx', (px * 100 + 50).toFixed(1) + '%');
      el.style.setProperty('--my', (py * 100 + 50).toFixed(1) + '%');
    });
    G.on(el, 'pointerleave', function () { el.style.transform = ''; });
  }

  function itemsOf(host) {
    return Array.prototype.map.call(host.children, function (x) {
      return { src: x.dataset.src, cap: x.dataset.cap || '', sub: x.dataset.sub || '' };
    });
  }
  function wire(el, host) {
    G.on(el, 'click', function () {
      var list = itemsOf(host);
      var i = list.findIndex(function (o) { return o.src === el.dataset.src; });
      openSet(list, i < 0 ? 0 : i);
    });
    tilt(el);
  }

  /* ---------- the curated 18 art frames, painted into both hosts ---------- */
  var GAL = [
    ['hero_city', 'PAGE 01 · Low Battery, 2:47 AM', 'p1'],
    ['dm', 'PAGE 12 · Added to Midnight Strays', 'p12'],
    ['day01', 'PAGE 23 · Days Built From Messages', 'p23'],
    ['call', 'PAGE 30 · The Accidental Call', 'p30'],
    ['cast_tejas', 'CAST · Tejas, @tejas.raw', 'cast'],
    ['cast_pragati', 'CAST · Pragati, @pragati.pages', 'cast'],
    ['xmas', 'PAGE 45 · Christmas Eve Call', 'p45'],
    ['frames27', 'PAGE 47 · Winter, 27 Frames', 'p47'],
    ['mochi', 'PAGE 51 · Mochi, professional sabotage', 'p51'],
    ['zine', 'PAGE 58 · First copy, signed', 'p58'],
    ['hachiko', 'PAGE 60 · Hachikō, 10:58', 'p60'],
    ['meet', 'PAGE 61 · Twelve Steps', 'p61'],
    ['hi', 'PAGE 62 · Hi.', 'p62'],
    ['ema', 'PAGE 64 · Same Wish', 'p64'],
    ['picnic', 'PAGE 65 · The Exchange', 'p65'],
    ['sky', 'PAGE 67 · The City From Above', 'p67'],
    ['umbrella', 'PAGE 68 · The Umbrella', 'p68'],
    ['finale', 'PAGE 69 · To Be Continued', 'p69']
  ];
  var galHTML = GAL.map(function (g, i) {
    return '<figure class="gframe" data-i="' + i + '" data-tilt data-src="art/' + g[0] + '.webp" ' +
      'data-cap="' + g[1] + '" data-sub="' + (g[2] === 'cast' ? 'cast sheet' : 'page ' + g[2].slice(1)) + '">' +
      '<div class="im" style="background-image:var(--im-' + g[0] + ')"></div>' +
      '<span class="pg-tag">' + g[2] + '</span>' +
      '<figcaption>' + g[1] + '</figcaption></figure>';
  }).join('');
  if (film) film.innerHTML = galHTML;
  if (mas) mas.innerHTML = galHTML;

  $$('.gframe').forEach(function (f) {
    f.setAttribute('role', 'button');
    f.setAttribute('tabindex', '0');
    G.on(f, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f.click(); }
    });
    wire(f, f.parentElement);
  });

  /* ---------- 3 · all 69 pages, lazily appended ---------- */
  var CH = [
    { n: 1, t: 'Low Battery', c: 10, titles: ['2:47 AM', 'Low Battery', 'Register. Now.', 'Breakfast of Champions', 'The Group Chat', 'Midnight Strays', 'First Reply', 'Say Something', 'Weirdly Polite', 'Seen 02:48'] },
    { n: 2, t: 'New Member', c: 9, titles: ['New Member', 'Her Name', 'Bookshelf', 'Typo', 'Delete Delete', 'Send Anyway', 'Nine Pages In', 'Goodnight', 'Pinned'] },
    { n: 3, t: 'Direct Message', c: 10, titles: ['Direct Message', 'One To One', 'Voice Note', 'Screenshot', 'Pragati Typing…', 'Send', 'Read Twice', 'The Joke', 'Same Time Tomorrow', 'Starred'] },
    { n: 4, t: 'Two Months of Midnight', c: 10, titles: ['Two Months of Midnight', 'November', 'The Aisle', 'Ramen at 1', 'Hachikō Waits', 'Snow Watch', 'Map Pin', 'Not Alone', 'Almost', 'Four Weeks'] },
    { n: 5, t: 'Winter Held Together', c: 10, titles: ['Winter Held Together', 'First Snow', 'Winter Uniform', 'Cold Hands', 'Ema Board', 'Her Wish', 'His Wish', 'One Blanket', 'Dec 24', 'Still Here'] },
    { n: 6, t: 'Counting Down to Spring', c: 10, titles: ['Counting Down to Spring', 'February', 'Warmer', 'Picnic Planning', 'Cherry Forecast', 'Two Stops', 'Nervous', 'Countdown', 'Twenty Days', 'Tomorrow'] },
    { n: 7, t: 'See You Offline', c: 10, titles: ['See You Offline', 'April 4', 'Under the Sakura', 'Umbrella Down', 'The Sticker', 'Two Steps Closer', 'Say It', 'Offline', 'After Credits', 'See You, Season 2'] }
  ];
  var flat = [];
  CH.forEach(function (c) {
    for (var i = 1; i <= c.c; i++) {
      var f = 'p' + (i < 10 ? '0' + i : i);
      flat.push({
        ch: c.n, page: i, title: c.t,
        src: 'pages/ch' + c.n + '/' + f + '.webp',
        sub: 'Chapter ' + c.n + ' · ' + c.t + ' · page ' + i,
        cap: c.titles[i - 1] || ('Page ' + i)
      });
    }
  });

  var host = $('#gPages'), moreBtn = $('#gMore'), counter = $('#gMoreCount');
  var shown = 0, BATCH = 12;

  function tile(p) {
    return '<button class="gtile" type="button" data-glight data-src="' + p.src +
      '" data-cap="' + p.cap.replace(/"/g, '&quot;') + '" data-sub="' + p.sub + '">' +
      '<img loading="lazy" decoding="async" alt="' + p.title + ', page ' + p.page +
      ' — ' + p.cap + '" src="' + p.src + '">' +
      '<span class="gcap"><b>' + p.cap + '</b><i>Ch.' + p.ch + ' · p' + p.page + '</i></span>' +
      '</button>';
  }

  function paintCounter() {
    var left = flat.length - shown;
    if (moreBtn) moreBtn.hidden = left <= 0;
    if (counter) counter.textContent = left > 0 ? left + ' pages left' : 'all 69 pages shown';
  }

  function reveal() {
    if (!host) return;
    var batch = flat.slice(shown, shown + BATCH);
    var frag = d.createElement('div');
    frag.innerHTML = batch.map(tile).join('');
    Array.prototype.slice.call(frag.children).forEach(function (t) {
      host.appendChild(t);
      wire(t, host);
    });
    shown += batch.length;
    /* pad the final row so the grid never ends on a lonely tile */
    var host2 = host;
    var dummies = host2.querySelectorAll('.gp-dummy');
    Array.prototype.forEach.call(dummies, function (x) { x.remove(); });
    if (shown >= flat.length) {
      var cols = Math.max(1, Math.round(host2.clientWidth / (host2.firstElementChild ? host2.firstElementChild.getBoundingClientRect().width + 16 : 170)));
      var pad = (cols - (batch.length + (host2.children.length - batch.length)) % cols) % cols;
      for (var q = 1; q < pad; q++) {
        var dv = d.createElement('span');
        dv.className = 'gp-dummy';
        dv.setAttribute('aria-hidden', 'true');
        host2.appendChild(dv);
      }
    }
    paintCounter();
    G.sfx && G.sfx('petal');
    G.observeReveals && G.observeReveals(host);
  }

  if (moreBtn) {
    G.on(moreBtn, 'click', reveal);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); reveal(); }
      }, { rootMargin: '400px' });
      io.observe(moreBtn);
    } else reveal();
  }
  paintCounter();

  /* ---------- 4 · share ---------- */
  G.on($('#gShare'), 'click', function () {
    var data = { title: 'PAWGRAM — Gallery', text: 'Every page of See You Offline in one place.', url: location.href };
    if (navigator.share) navigator.share(data).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () {
      G.toast('Link copied', 'go on, spoil someone', '🔗');
    });
  });

  /* ---------- 5 · stat count-up ---------- */
  var stats = $$('[data-gcount]');
  if (stats.length && 'IntersectionObserver' in window) {
    var io3 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, to = +el.dataset.gcount, t0 = performance.now();
        (function step(t) {
          var k = G.clamp((t - t0) / 900, 0, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        })(t0);
        io3.unobserve(el);
      });
    }, { threshold: .4 });
    stats.forEach(function (e) { io3.observe(e); });
  }
  /* ---------- 6 · closing CTA: rain, umbrella opens, notify ---------- */
  (function cta() {
    var box = $('.ctabox');
    if (box) {
      var rain = $('.rainlayer', box);
      if (rain) {
        for (var i = 0; i < 26; i++) {
          var el = d.createElement('i');
          el.style.left = (Math.random() * 100) + '%';
          el.style.animationDelay = (-Math.random() * 2.4) + 's';
          el.style.animationDuration = (1.4 + Math.random() * 1.4) + 's';
          el.style.opacity = (.3 + Math.random() * .5).toFixed(2);
          rain.appendChild(el);
        }
      }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          if (es[0].isIntersecting) box.classList.add('open');
        }, { threshold: .3 }).observe(box);
      } else box.classList.add('open');
    }
    var form = $('#ntform');
    if (form) G.on(form, 'submit', function (e) {
      e.preventDefault();
      var input = $('#ntmail'), hint = $('#ntHint');
      var em = (input.value || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
        input.focus();
        hint.textContent = 'That email looks like a typo — try again?';
        hint.className = 'nthint bad';
        G.sfx && G.sfx('error');
        return;
      }
      G.store.set('pg-notify', em);
      hint.textContent = 'saved locally — you will be the first to know. 🐾';
      hint.className = 'nthint';
      G.confetti(34);
      G.sfx && G.sfx('win');
      G.unlock && G.unlock('season-two');
    });
  })();
})(document);
