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
    '.hero-copy',
    '.hero-preview',
    '.feature-row',
    '.status-card'
  ];

  function decorate(node) {
    var scope = node || document;
    var els = scope.querySelectorAll(AUTO_SELECTORS.join(','));
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.closest('.guide-reader') || el.closest('[hidden]') || el.hasAttribute('data-animate')) continue;
      el.setAttribute('data-animate', '');
    }
  }

  function reveal(el, index) {
    if (!el.classList.contains('is-visible')) {
      el.classList.add('is-visible');
      if (index) el.style.transitionDelay = Math.min(index * 60, 600) + 'ms';
    }
  }

  function observe(root) {
    if (REDUCED) return;
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          observer.unobserve(el);
          var siblings = Array.prototype.filter.call(el.parentNode ? el.parentNode.children : [], function (s) {
            return s !== el && s.hasAttribute('data-animate');
          });
          var index = siblings.indexOf(el) + 1;
          requestAnimationFrame(function () { reveal(el, index); });
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }

    var targets = (root || document).querySelectorAll('[data-animate]:not(.is-visible)');
    for (var i = 0; i < targets.length; i++) observer.observe(targets[i]);
  }

  function init() {
    if (REDUCED) {
      decorate();
      document.querySelectorAll('[data-animate]').forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
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
