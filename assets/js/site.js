/* Linkaro – linkaro.se
   Liten förbättring ovanpå HTML:en. Allt innehåll fungerar utan JavaScript.
   1. Enkelt läge (växel, sparas i localStorage – ingen cookie)
   2. Mobilmenyn (<dialog>)
   3. E-postmallar: lägger in mallen i mailto-länken och knappen "Kopiera mallen" */
(function () {
  'use strict';
  var root = document.documentElement;
  var KEY = 'lk-enkelt';

  /* ---------- 1. Enkelt läge ---------- */
  function syncToggles() {
    var on = root.classList.contains('enkelt');
    document.querySelectorAll('[data-enkelt-toggle]').forEach(function (b) {
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  syncToggles();

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-enkelt-toggle]');
    if (!btn) return;
    var on = !root.classList.contains('enkelt');
    root.classList.toggle('enkelt', on);
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (err) { /* privat läge – valet gäller bara den här sidan */ }
    syncToggles();
    if (menu && menu.open) menu.close();
    // Behåll fokus på växeln i sidhuvudet så att skärmläsaren läser upp det nya läget.
    var first = document.querySelector('.util [data-enkelt-toggle]');
    window.scrollTo(0, 0);
    if (first) first.focus();
  });

  /* ---------- 2. Mobilmeny ---------- */
  var menu = document.getElementById('mobilmeny');
  var openBtn = document.querySelector('[data-menu-open]');
  if (menu && openBtn && typeof menu.showModal === 'function') {
    openBtn.addEventListener('click', function () {
      menu.showModal();
      openBtn.setAttribute('aria-expanded', 'true');
    });
    menu.querySelector('[data-menu-close]').addEventListener('click', function () { menu.close(); });
    menu.addEventListener('close', function () {
      openBtn.setAttribute('aria-expanded', 'false');
      if (getComputedStyle(openBtn).display !== 'none') openBtn.focus();
    });
    // Stäng om fönstret blir brett nog för den vanliga menyn.
    if (window.matchMedia) {
      var mq = window.matchMedia('(min-width: 1024px)');
      var onChange = function (ev) { if (ev.matches && menu.open) menu.close(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
    }
  } else if (openBtn) {
    // Äldre webbläsare utan <dialog>: visa den vanliga menyn i stället.
    root.classList.remove('js');
  }

  /* ---------- 3. E-postmallar ---------- */
  // <a data-mail-body="#id"> får mallens text som brödtext i mailto-länken.
  document.querySelectorAll('a[data-mail-body]').forEach(function (a) {
    var src = document.querySelector(a.getAttribute('data-mail-body'));
    if (!src) return;
    var body = src.textContent.replace(/^\s+|\s+$/g, '');
    // Medan e-postadressen inte är aktiv står länken i data-mailto (ingen href).
    var attr = a.hasAttribute('href') ? 'href' : 'data-mailto';
    var url = a.getAttribute(attr);
    if (!url) return;
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    a.setAttribute(attr, url + sep + 'body=' + encodeURIComponent(body));
  });

  // <button data-copy="#id"> kopierar mallen till urklipp och meddelar resultatet.
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var src = document.querySelector(btn.getAttribute('data-copy'));
    var status = document.getElementById(btn.getAttribute('data-status') || '');
    btn.addEventListener('click', function () {
      if (!src) return;
      var text = src.textContent.replace(/^\s+|\s+$/g, '');
      var done = function (ok) {
        if (status) status.textContent = ok
          ? 'Mallen är kopierad. Klistra in den i ett nytt e-postmeddelande.'
          : 'Det gick inte att kopiera. Markera texten i rutan och kopiera den själv.';
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
  });
})();
