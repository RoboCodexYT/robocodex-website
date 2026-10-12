/* Animated FTC field — a small reusable SVG component.
 * Draws a 12ft x 12ft FTC field and can animate a robot driving along a path.
 * Zero dependencies, plain SVG + requestAnimationFrame. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';

  // A default "scoring cycle" demo path (in 0..144 field units).
  const DEFAULT_PATH = [
    [20, 122],
    [40, 118],
    [40, 88],
    [72, 72],
    [104, 56],
    [116, 36],
    [122, 20]
  ];

  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  function drawField(svg) {
    svg.appendChild(el('rect', { x: 0, y: 0, width: 144, height: 144, class: 'field-tiles' }));

    for (let i = 1; i < 4; i++) {
      svg.appendChild(el('line', { x1: 36 * i, y1: 0, x2: 36 * i, y2: 144, class: 'field-grid' }));
      svg.appendChild(el('line', { x1: 0, y1: 36 * i, x2: 144, y2: 36 * i, class: 'field-grid' }));
    }

    svg.appendChild(el('line', { x1: 72, y1: 0, x2: 72, y2: 144, class: 'field-center' }));

    // Alliance hints (subtle red / blue strips on the left and right edges).
    svg.appendChild(el('rect', { x: 2, y: 2, width: 6, height: 140, class: 'field-alliance-red' }));
    svg.appendChild(el('rect', { x: 136, y: 2, width: 6, height: 140, class: 'field-alliance-blue' }));

    // A scoring element placeholder in the center.
    svg.appendChild(el('circle', { cx: 72, cy: 72, r: 5, class: 'field-goal' }));
  }

  function FTCField(container, opts) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) return;
    opts = opts || {};

    this.svg = el('svg', {
      viewBox: '0 0 144 144',
      class: 'ftc-field-svg',
      role: 'img',
      'aria-label': 'FTC field diagram'
    });
    drawField(this.svg);

    this.robotSize = opts.robotSize || 10;
    this.speed = opts.speed || 0.55;
    this.loop = opts.loop !== false;

    this.trail = el('polyline', { fill: 'none', class: 'field-trail' });
    this.robot = el('g', { class: 'field-robot' });
    this.robot.appendChild(el('rect', { x: -this.robotSize / 2, y: -this.robotSize / 2, width: this.robotSize, height: this.robotSize, rx: 1.5 }));
    this.robot.appendChild(el('line', { x1: 0, y1: 0, x2: this.robotSize / 2 + 2, y2: 0, class: 'field-robot-heading' }));

    this.svg.appendChild(this.trail);
    this.svg.appendChild(this.robot);
    this.container.appendChild(this.svg);

    this.points = (opts.path || DEFAULT_PATH).slice();
    this.seg = 0;
    this.t = 0;
    this.playing = false;
    this._frame = null;

    this.renderTrail();
    this.position(0);
    if (opts.animate !== false) this.start();
  }

  FTCField.prototype.start = function () {
    if (this.playing || !this.points.length) return;
    this.playing = true;
    this.loopRAF();
  };

  FTCField.prototype.stop = function () {
    this.playing = false;
    if (this._frame) cancelAnimationFrame(this._frame);
    this._frame = null;
  };

  FTCField.prototype.loopRAF = function () {
    const tick = () => {
      if (!this.playing) return;
      this.advance();
      this._frame = requestAnimationFrame(tick);
    };
    this._frame = requestAnimationFrame(tick);
  };

  FTCField.prototype.setPath = function (points) {
    this.points = (points || []).slice();
    this.seg = 0;
    this.t = 0;
    this.renderTrail();
    this.position(0);
    if (!this.points.length) this.stop();
  };

  FTCField.prototype.advance = function () {
    const pts = this.points;
    if (!pts.length) return;
    if (pts.length === 1) { this.position(0); return; }

    let remaining = this.speed;
    let guard = 0;
    while (remaining > 0 && guard < 400) {
      guard++;
      if (this.seg >= pts.length - 1) {
        if (this.loop) { this.seg = 0; this.t = 0; continue; }
        this.playing = false;
        return;
      }
      const a = pts[this.seg];
      const b = pts[this.seg + 1];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const step = Math.min(remaining, len - this.t);
      this.t += step;
      remaining -= step;
      if (this.t >= len - 1e-6) {
        this.seg++;
        this.t = 0;
      } else {
        break;
      }
    }
    this.position(this.seg);
  };

  FTCField.prototype.position = function (seg) {
    const pts = this.points;
    if (!pts.length) return;
    const i = Math.max(0, Math.min(seg, pts.length - 1));
    const a = pts[i];
    const b = pts[Math.min(i + 1, pts.length - 1)];
    const total = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const t = seg >= pts.length - 1 ? 1 : this.t / total;
    const cx = a[0] + (b[0] - a[0]) * t;
    const cy = a[1] + (b[1] - a[1]) * t;
    const angle = i < pts.length - 1 ? Math.atan2(b[1] - a[1], b[0] - a[0]) : 0;
    this.robot.setAttribute('transform', `translate(${cx} ${cy}) rotate(${angle * 180 / Math.PI})`);
  };

  FTCField.prototype.renderTrail = function () {
    const attr = this.points.map((p) => p.join(',')).join(' ');
    this.trail.setAttribute('points', attr);
  };

  FTCField.prototype.segmentLengths = function () {
    const pts = this.points;
    if (!this._lengths || this._lengthsFor !== pts) {
      this._lengths = [];
      this._lengthsFor = pts;
      for (let i = 0; i < pts.length - 1; i++) {
        this._lengths.push(Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]));
      }
    }
    return this._lengths;
  };

  FTCField.prototype.totalLength = function () {
    return this.segmentLengths().reduce((sum, l) => sum + l, 0) || 0;
  };

  FTCField.prototype.getProgress = function () {
    const total = this.totalLength();
    if (!total) return 0;
    let traveled = 0;
    const lens = this.segmentLengths();
    for (let i = 0; i < this.seg && i < lens.length; i++) traveled += lens[i];
    if (this.seg < lens.length) traveled += Math.min(this.t, lens[this.seg]);
    return Math.max(0, Math.min(1, traveled / total));
  };

  FTCField.prototype.seek = function (progress) {
    const pts = this.points;
    if (pts.length < 2) { this.seg = 0; this.t = 0; this.position(this.seg); return; }
    const p = Math.max(0, Math.min(1, progress));
    const target = p * this.totalLength();
    const lens = this.segmentLengths();
    let traveled = 0;
    for (let i = 0; i < lens.length; i++) {
      if (traveled + lens[i] >= target) {
        this.seg = i;
        this.t = target - traveled;
        this.position(this.seg);
        return;
      }
      traveled += lens[i];
    }
    this.seg = pts.length - 1;
    this.t = 0;
    this.position(this.seg);
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.ftc-field').forEach((node) => {
      const path = node.getAttribute('data-path');
      const opts = path ? { path: JSON.parse(path), loop: false } : {};
      // only drive while the field is on screen, so it starts when you scroll to it
      if (!('IntersectionObserver' in window)) {
        new FTCField(node, opts);
        return;
      }
      opts.animate = false;
      const field = new FTCField(node, opts);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) field.start();
          else field.stop();
        });
      }, { threshold: 0.35 }).observe(node);
    });
  });

  window.FTCField = FTCField;
})();
