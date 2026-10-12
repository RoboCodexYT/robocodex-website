(function () {
  if (!('IntersectionObserver' in window)) return;

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var observer = null;

  var AUTO_SELECTORS = [
    '.card',
    '.tool-card',
    '.start-card',
    '.stat-box',
    '.field-card',
    '.video-card',
    '.calc-card',
    '.section-title',
    '.section-head',
    '.feature-row',
    '.status-card',
    '.way',
    '.field-copy'
  ];

  function decorate(node) {
    var scope = node || document;
    var els = scope.querySelectorAll(AUTO_SELECTORS.join(','));
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.closest('.guide-reader') || el.closest('.hero') || el.closest('[hidden]') || el.querySelector('h1')) continue;
      if (el.hasAttribute('data-animate') || el.classList.contains('is-settled')) continue;
      el.setAttribute('data-animate', '');
    }
  }

  // after the reveal finishes, drop the reveal styles so hover transitions work normally
  function settle(el) {
    el.removeAttribute('data-animate');
    el.classList.remove('is-visible');
    el.classList.add('is-settled');
    el.style.transitionDelay = '';
  }

  function reveal(el, index) {
    if (el.classList.contains('is-visible')) return;
    var delay = index ? Math.min(index * 50, 300) : 0;
    if (delay) el.style.transitionDelay = delay + 'ms';
    el.classList.add('is-visible');
    setTimeout(function () { settle(el); }, delay + 550);
  }

  function observe(root) {
    if (REDUCED) return;
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        // stagger only the items that come into view together
        var batch = entries.filter(function (e) { return e.isIntersecting; });
        batch.forEach(function (entry, i) {
          observer.unobserve(entry.target);
          requestAnimationFrame(function () { reveal(entry.target, i); });
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    }

    var targets = (root || document).querySelectorAll('[data-animate]:not(.is-visible)');
    for (var i = 0; i < targets.length; i++) observer.observe(targets[i]);
  }

  function init() {
    if (REDUCED) return;
    decorate();
    observe();
  }

  window.RoboAnim = {
    refresh: function (root) {
      if (REDUCED) return;
      decorate(root);
      observe(root);
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
