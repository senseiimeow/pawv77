/* =========================================================
   PAWGRAM v3 · CAST PAGE
   tap-to-talk portraits · height comparison · stray cards
   ========================================================= */
(function (w, d) {
  'use strict';
  var PG = w.PG, $ = PG.$, $$ = PG.$$;

  /* tap a portrait → speech bubble (idle-breathing feel) */
  $$('.talk').forEach(function (t) {
    var bub = d.createElement('div');
    bub.className = 'saybub';
    t.appendChild(bub);
    var flip = false, timer;
    PG.on(t, 'click', function () {
      flip = !flip;
      bub.textContent = flip ? (t.dataset.say2 || t.dataset.say) : t.dataset.say;
      bub.classList.add('on');
      clearTimeout(timer);
      timer = setTimeout(function () { bub.classList.remove('on'); }, 3000);
      PG.sfx('pop'); PG.haptic(8);
    });
  });

  /* height comparison animates in view */
  if ('IntersectionObserver' in w) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: .35 });
    $$('[data-hc],.bars').forEach(function (el) { io.observe(el); });
  }

  /* height numbers count up when visible */
  $$('.hc-bar .lbl').forEach(function (el) {
    var target = parseFloat(el.textContent) || 0;
    el.textContent = '0';
    if ('IntersectionObserver' in w) {
      new IntersectionObserver(function (es, obs) {
        if (!es[0].isIntersecting) return;
        obs.disconnect();
        var t0 = performance.now();
        (function step(t) {
          var k = Math.min(1, (t - t0) / 1100), ez = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(target * ez);
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      }, { threshold: .5 }).observe(el);
    } else el.textContent = target;
  });

  /* Konami-friendly footer note already exists in core */
})(window, document);
