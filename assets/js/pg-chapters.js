/* =========================================================
   PAWGRAM v3 · CHAPTERS PAGE
   - chapter rows built from PG.CHAPTERS (single source of truth)
   - saved reading progress + "continue" state
   - reaction bar per chapter (localStorage, floating emoji)
   - month filter chips, page art strips, umbrella CTA
   ========================================================= */
(function (w, d) {
  'use strict';
  var PG = w.PG, $ = PG.$, $$ = PG.$$;

  var DETAIL = [
    { pages: ['hero_city', 'call'],  c1: '2:47 AM',       c2: '4% battery',
      line: "2:47 AM. A broke design student with 4% battery meets a stranger's post in the dark. Fourteen million people are asleep. Almost." },
    { pages: ['dm', 'hi'],          c1: 'the group chat', c2: 'added 🐾',
      line: "@yuki.psd adds a new member to Midnight Strays 🐾. Somebody says hello. Somebody says nothing and screenshots it." },
    { pages: ['day01', 'zine'],      c1: 'October',       c2: 'first DM',
      line: 'The post that made the city tell the truth becomes a private thread. Two handles become two people who wait for a notification.' },
    { pages: ['call', 'frames27'],   c1: 'November',      c2: 'day 61',
      line: 'Days built from small messages: morning, survive-til-6, eat something real, good night professor. Then a call arrives by accident.' },
    { pages: ['xmas', 'frames27'],   c1: 'December',      c2: '27 frames',
      line: 'Rent notices, a shattered lens, one-word replies — and a cheap film camera with 27 frames and no deletes.' },
    { pages: ['zine', 'ema'],        c1: 'February',      c2: 'spring, waiting',
      line: 'One note, two cursors. An itinerary typed in real time, a zine bound by hand, and a country waiting for flowers while two people wait for a person.' },
    { pages: ['meet', 'picnic'],     c1: 'April 4',       c2: 'Shibuya',
      line: "Twelve steps, two 'hi's, one purikura strip torn in half, and a clear umbrella that still has the paw sticker on the handle." }
  ];
  var EMO = ['❤️', '🥹', '🌸', '😭', '🐾'];

  function esc(s) { return String(s).replace(/[<>&"]/g, function (c) {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }); }

  var host = $('#chList');
  if (host) {
    var prog = PG.progress();
    var reactions = PG.store.getJSON('pg-reactions', {});

    host.innerHTML = PG.CHAPTERS.map(function (c, i) {
      var de = DETAIL[i], pct = prog[c.n] || 0;
      var label = pct > 90 ? 'finished ✓' : pct > 2 ? pct + '% read' : 'not started';
      var strip = de.pages.map(function (a, k) {
        return '<div class="rowart" style="background-image:var(--im-' + a + ')" role="img" ' +
          'aria-label="Art from chapter ' + c.n + '"></div>';
      }).join('');
      var reacts = EMO.map(function (em) {
        var key = 'ch' + c.n + '-' + em, n = reactions[key] || 0;
        return '<button type="button" data-react="' + key + '" data-emo="' + em + '">' + em +
          (n ? ' ' + n : '') + '</button>';
      }).join('');
      return '<article class="chrow rv" id="ch' + c.n + '" style="--wash:' + c.wash + '">' +
        '<div class="wash" aria-hidden="true"></div>' +
        '<div class="n">' + String(c.n).padStart(2, '0') + '<small>' + c.emoji + ' ' + c.tag + '</small></div>' +
        '<div class="chmain">' +
          '<h3>' + esc(c.slug) + '</h3>' +
          '<div class="when">' + esc(c.when) + ' · ' + c.pages + ' pages · ' + esc(de.c2) + '</div>' +
          '<p>' + esc(de.line) + '</p>' +
          '<div class="rowarts">' + strip + '</div>' +
        '</div>' +
        '<div class="end">' +
          '<small>' + label + '</small>' +
          '<div class="mini"><i style="width:' + pct + '%"></i></div>' +
          '<div class="reactbar" aria-label="React to chapter ' + c.n + '">' + reacts + '</div>' +
          '<a class="btn sm" href="' + c.reader + '" data-cursor="read">' +
            (pct > 2 ? 'Continue' : 'Read') + ' →</a>' +
        '</div>' +
      '</article>';
    }).join('');
    PG.observeReveals(host);

    /* reactions */
    PG.on(host, 'click', function (e) {
      var b = e.target.closest('[data-react]');
      if (!b) return;
      var key = b.dataset.react, em = b.dataset.emo;
      var n = PG.react(key);
      b.innerHTML = em + ' ' + n;
      b.classList.add('picked');
      var r = b.getBoundingClientRect();
      var f = d.createElement('div');
      f.className = 'emoji-float'; f.textContent = em;
      f.style.left = (r.left + r.width / 2) + 'px';
      f.style.top = (r.top - 8) + 'px';
      d.body.appendChild(f);
      setTimeout(function () { f.remove(); }, 1600);
      PG.sfx('petal'); PG.haptic(8);
    });

    /* month chips */
    $$('[data-jump]').forEach(function (b) {
      PG.on(b, 'click', function () {
        var t = $('#ch' + b.dataset.jump);
        if (t) t.scrollIntoView({ behavior: PG.reduce ? 'auto' : 'smooth', block: 'center' });
        PG.sfx('pop');
      });
    });

    /* saved state line */
    var save = $('#saveState'), total = PG.TOTAL_PAGES, done = 0;
    PG.CHAPTERS.forEach(function (c) { done += Math.round(c.pages * ((prog[c.n] || 0) / 100)); });
    var next = PG.continueTarget();
    if (save) save.innerHTML =
      '<span>📖 ' + done + ' / ' + total + ' pages read on this device</span>' +
      '<span class="sp"><i style="width:' + Math.round(done / total * 100) + '%"></i></span>' +
      '<a class="chip-st mint" href="' + next.ch.reader + '">Continue Ch. ' +
        String(next.ch.n).padStart(2, '0') + ' →</a>';
  }

  /* umbrella CTA opens when visible */
  var box = $('#ctabox');
  if (box) {
    var rain = $('.rainlayer', box);
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
        if (es[0].isIntersecting) box.classList.add('open');
      }, { threshold: .3 }).observe(box);
    } else box.classList.add('open');
  }
})(window, document);
