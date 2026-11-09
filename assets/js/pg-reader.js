/* =========================================================
   PAWGRAM v3 · READER  (injected into every Chapter reader)
   - coral-thread progress bar with paw handle
   - site chrome: day/night, hide-ui (tap to hide), share
   - per-chapter progress + scroll position saved locally
   - "continue where you left off" restore
   - panel entrance animation (cheap, never hurts readability)
   - reactions at the end of the chapter
   Readability rules: no motion on the artwork itself, no
   layout shift, no animation while scrolling fast.
   ========================================================= */
(function (w, d) {
  'use strict';
  var CHAPTER = parseInt((d.body && d.body.dataset.chapter) || '1', 10);
  var KEY = 'pg-pos-' + CHAPTER, PKEY = 'pg-progress';

  /* ---------- storage with a memory fallback ---------- */
  var mem = {};
  function get(k) { try { var v = localStorage.getItem(k); if (v !== null) return v; } catch (e) {} return k in mem ? mem[k] : null; }
  function set(k, v) { mem[k] = String(v); try { localStorage.setItem(k, v); } catch (e) {} }

  var reduce = (w.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || get('pg-rm') === '1';

  /* ---------- progress bar (coral thread + paw handle) ---------- */
  var bar = d.getElementById('rp');
  var paw = d.createElement('div');
  paw.id = 'rpPaw';
  paw.setAttribute('aria-hidden', 'true');
  d.body.appendChild(paw);

  var doc = d.documentElement, ticking = false, lastPct = -1;
  function onScroll() {
    ticking = false;
    var h = doc.scrollHeight - w.innerHeight;
    var pct = h > 0 ? Math.min(100, Math.max(0, (w.scrollY / h) * 100)) : 0;
    if (bar) bar.style.width = pct.toFixed(2) + '%';
    paw.style.left = pct.toFixed(2) + '%';
    paw.style.transform = 'translate(-50%,-50%) rotate(' + (pct * 3.6).toFixed(0) + 'deg)';
    if (Math.abs(pct - lastPct) > 1.2) {
      lastPct = pct;
      saveProgress(pct);
    }
    /* back-to-top visibility */
    var top = d.getElementById('top');
    if (top) top.classList.toggle('on', w.scrollY > w.innerHeight * 1.2);
  }
  function saveProgress(pct) {
    set(KEY, Math.round(w.scrollY));
    var all = {};
    try { all = JSON.parse(get(PKEY) || '{}') || {}; } catch (e) { all = {}; }
    all[CHAPTER] = Math.max(all[CHAPTER] || 0, Math.round(pct));
    set(PKEY, JSON.stringify(all));
  }
  w.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    w.requestAnimationFrame(onScroll);
  }, { passive: true });

  /* ---------- resumed reading banner ---------- */
  (function resume() {
    var saved = parseInt(get(KEY) || '0', 10);
    if (!saved || saved < 400) return;
    var b = d.createElement('div');
    b.className = 'resume';
    b.innerHTML = '<span>Continue where you left off?</span><button type="button" class="rb go">Jump in</button>' +
      '<button type="button" class="rb x" aria-label="Dismiss">✕</button>';
    d.body.appendChild(b);
    setTimeout(function () { b.classList.add('on'); }, 900);
    b.querySelector('.go').addEventListener('click', function () {
      w.scrollTo({ top: saved, behavior: reduce ? 'auto' : 'smooth' });
      b.classList.remove('on');
    });
    b.querySelector('.x').addEventListener('click', function () { b.classList.remove('on'); });
    setTimeout(function () { b.classList.remove('on'); }, 12000);
  })();

  /* ---------- tap to hide the top bar ---------- */
  (function hideUI() {
    var top = d.querySelector('.topbar');
    if (!top) return;
    var hidden = false;
    var btn = d.createElement('button');
    btn.className = 'uibtn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Hide interface');
    btn.textContent = '⤢';
    var tools = d.querySelector('.tnav');
    if (tools) tools.appendChild(btn);
    function toggle() {
      hidden = !hidden;
      top.classList.toggle('faded', hidden);
      btn.textContent = hidden ? '⤡' : '⤢';
      btn.setAttribute('aria-label', hidden ? 'Show interface' : 'Hide interface');
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'h' || e.key === 'H') toggle();
    });
  })();

  /* ---------- day / night in the reader ---------- */
  (function theme() {
    var tools = d.querySelector('.tnav');
    if (!tools) return;
    var b = d.createElement('button');
    b.className = 'uibtn';
    b.type = 'button';
    b.setAttribute('aria-label', 'Toggle day or night reading');
    b.textContent = get('pg-theme') === 'day' ? '☾' : '☀';
    if (get('pg-theme') === 'day') d.documentElement.setAttribute('data-theme', 'day');
    b.addEventListener('click', function () {
      var day = d.documentElement.getAttribute('data-theme') === 'day';
      d.documentElement.setAttribute('data-theme', day ? 'night' : 'day');
      set('pg-theme', day ? 'night' : 'day');
      b.textContent = day ? '☀' : '☾';
      var meta = d.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', day ? '#0a0710' : '#fdf4ec');
    });
    tools.insertBefore(b, tools.firstChild);
  })();

  /* ---------- page entrance (opacity only, IO gated) ---------- */
  if (!reduce && 'IntersectionObserver' in w) {
    var figs = Array.prototype.slice.call(d.querySelectorAll('figure.pg'));
    figs.forEach(function (f) { f.classList.add('pg-anim'); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('seen');
        io.unobserve(e.target);
      });
    }, { threshold: 0.02, rootMargin: '200px 0px' });
    figs.forEach(function (f) { io.observe(f); });
  }

  /* ---------- image fade-in (keeps the LQIP visible until loaded) ---------- */
  Array.prototype.forEach.call(d.querySelectorAll('figure.pg img'), function (im) {
    if (im.complete && im.naturalWidth) { im.classList.add('ld'); return; }
    im.addEventListener('load', function () { im.classList.add('ld'); });
    im.addEventListener('error', function () { im.classList.add('ld'); });
  });

  /* ---------- reactions at the end ---------- */
  (function reactions() {
    var end = d.querySelector('.endcard');
    if (!end) return;
    var EMO = ['❤️', '🥹', '🌸', '😭', '🐾'];
    var row = d.createElement('div');
    row.className = 'rreact';
    row.innerHTML = '<div class="rr-label">react to this chapter</div>' +
      '<div class="rr-row">' + EMO.map(function (e) {
        return '<button type="button" data-emo="' + e + '">' + e + '</button>';
      }).join('') + '</div>';
    end.appendChild(row);
    var counts = {};
    try { counts = JSON.parse(get('pg-reactions') || '{}') || {}; } catch (e) { counts = {}; }
    row.addEventListener('click', function (e) {
      var b = e.target.closest('[data-emo]');
      if (!b) return;
      var em = b.dataset.emo, k = 'rch' + CHAPTER + '-' + em;
      counts[k] = (counts[k] || 0) + 1;
      set('pg-reactions', JSON.stringify(counts));
      b.classList.add('picked');
      b.innerHTML = em + ' ' + counts[k];
      var r = b.getBoundingClientRect();
      var f = d.createElement('div');
      f.className = 'emoji-float';
      f.textContent = em;
      f.style.left = (r.left + r.width / 2) + 'px';
      f.style.top = (r.top - 6) + 'px';
      d.body.appendChild(f);
      setTimeout(function () { f.remove(); }, 1500);
      if (navigator.vibrate) { try { navigator.vibrate(8); } catch (err) {} }
    });
  })();

  /* ---------- mark that chapter 1 was opened ---------- */
  if (CHAPTER === 1) set('pg-seen-1', '1');

  onScroll();
})(window, document);
