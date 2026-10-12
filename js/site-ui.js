// shared header behaviour: mobile menu, compact header on scroll, sliding nav underline
(function () {
  function init() {
    var header = document.querySelector('.site-header');
    var nav = header && header.querySelector('.nav-links');
    if (!header || !nav) return;

    // pages that don't load app.js still need a working theme toggle
    var toggle = document.getElementById('theme-toggle');
    if (toggle && typeof window.setTheme !== 'function') {
      var paint = function () {
        var light = document.documentElement.classList.contains('light');
        toggle.innerHTML = light ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        toggle.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
      };
      paint();
      toggle.addEventListener('click', function () {
        var light = !document.documentElement.classList.contains('light');
        document.documentElement.classList.toggle('light', light);
        try { localStorage.setItem('robocodex-theme', light ? 'light' : 'dark'); } catch (e) {}
        paint();
      });
    }

    // mobile menu button (added here so every page gets it without markup changes)
    var actions = header.querySelector('.header-actions');
    if (actions && !header.querySelector('.menu-toggle')) {
      var btn = document.createElement('button');
      btn.className = 'menu-toggle';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Open menu');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span></span>';
      actions.appendChild(btn);

      var setOpen = function (open) {
        header.classList.toggle('nav-open', open);
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      };
      btn.addEventListener('click', function () {
        setOpen(!header.classList.contains('nav-open'));
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) setOpen(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') setOpen(false);
      });
    }

    // header tightens up once you scroll
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // underline that slides to whichever link you hover, then back to the active one
    var indicator = document.createElement('span');
    indicator.className = 'nav-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    nav.appendChild(indicator);

    var moveTo = function (link) {
      if (!link) {
        indicator.style.opacity = '0';
        return;
      }
      indicator.style.opacity = '1';
      indicator.style.width = (link.offsetWidth - 26) + 'px';
      indicator.style.transform = 'translateX(' + (link.offsetLeft + 13) + 'px)';
    };
    var active = nav.querySelector('a.active');
    var place = function () { moveTo(active); };

    // jump into place on load without animating from 0
    indicator.style.transition = 'none';
    place();
    requestAnimationFrame(function () { indicator.style.transition = ''; });

    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('mouseenter', function () { moveTo(a); });
    });
    nav.addEventListener('mouseleave', place);
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
