/* PID Tuner — a small motor-model simulator so you can feel how PIDF gains
 * shape a response before you write real FTC code. Pure client-side. */
(function () {
  const PRESETS = {
    safe: {
      label: 'Gentle / conservative',
      kP: 0.35, kI: 0, kD: 0.4, kF: 0.01
    },
    tuned: {
      label: 'Nicely tuned',
      kP: 0.45, kI: 0.02, kD: 0.35, kF: 0.01
    },
    oscillate: {
      label: 'Too much kP (oscillates)',
      kP: 1.6, kI: 0, kD: 0.02, kF: 0.01
    },
    windup: {
      label: 'Integral windup (overshoot)',
      kP: 0.4, kI: 1.3, kD: 0.15, kF: 0.01
    }
  };

  const DT = 0.01;
  const STEPS = 600; // 6 seconds
  const MAX_ACCEL = 45;
  const MAX_VEL = 32;
  const DRAG = 0.45; // per-second velocity drag so kF*setpoint ≈ target speed
  const STEP_AT = 0.5;
  const TARGETS = { pos: 30, vel: 20 };

  let gains = { kP: 0.45, kI: 0.02, kD: 0.35, kF: 0.01 };
  let mode = 'pos';
  let series = null;
  let metrics = null;

  function $id(id) { return document.getElementById(id); }

  function simulate(g) {
    let pos = 0, vel = 0, integral = 0, prevErr = 0, prevRate = 0;
    const target = [];
    const actual = [];
    const targetStep = TARGETS[mode];
    for (let i = 0; i < STEPS; i++) {
      const t = i * DT;
      let setpoint;
      if (mode === 'vel') {
        // Ramp the reference so kD doesn't eat a hard step (real motors limit accel).
        const t0 = STEP_AT, t1 = STEP_AT + 0.5;
        setpoint = t < t0 ? 0 : (t >= t1 ? targetStep : targetStep * (t - t0) / (t1 - t0));
      } else {
        setpoint = t < STEP_AT ? 0 : targetStep;
      }
      const err = setpoint - (mode === 'pos' ? pos : vel);
      integral = Math.max(-40, Math.min(40, integral + err * DT));
      const rawRate = (err - prevErr) / DT;
      prevErr = err;
      const errRate = rawRate * 0.2 + prevRate * 0.8; // low-pass so kD stays calm
      prevRate = errRate;
      const feedforward = mode === 'vel' ? g.kF * setpoint : 0;
      let out = g.kP * err + g.kI * integral + g.kD * errRate + feedforward;
      out = Math.max(-1, Math.min(1, out));
      const accel = out * MAX_ACCEL;
      vel = vel + (accel - vel * DRAG) * DT;
      vel = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel));
      pos = pos + vel * DT;
      target.push(setpoint);
      actual.push(mode === 'pos' ? pos : vel);
    }
    return { target, actual, targetStep };
  }

  function analyze(series) {
    const targetStep = series.targetStep;
    const startIdx = Math.ceil(STEP_AT / DT);
    const actual = series.actual;
    let peak = -Infinity, peakIdx = startIdx;
    for (let i = startIdx; i < actual.length; i++) {
      if (actual[i] > peak) { peak = actual[i]; peakIdx = i; }
    }
    const overshootPct = ((peak - targetStep) / targetStep) * 100;
    const band = targetStep * 0.05;
    let settleIdx = actual.length - 1;
    for (let i = startIdx; i < actual.length; i++) {
      if (Math.abs(actual[i] - targetStep) > band) settleIdx = i;
    }
    const settleTime = settleIdx >= actual.length - 1 ? null : (settleIdx * DT - STEP_AT);
    const ssErr = Math.abs(actual[actual.length - 1] - targetStep);
    return { overshootPct, settleTime, ssErr };
  }

  function draw() {
    const canvas = $id('tuner-canvas');
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || canvas.parentElement.clientWidth;
    const cssH = 280;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.height = cssH + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const pad = { left: 46, right: 14, top: 16, bottom: 30 };
    const plotW = cssW - pad.left - pad.right;
    const plotH = cssH - pad.top - pad.bottom;
    const targetStep = series.targetStep;
    const maxY = Math.max(targetStep, ...series.actual) * 1.15 || 1;

    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border') || '#d8e3ee';
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted') || '#5c7288';
    ctx.lineWidth = 1;
    ctx.font = '11px sans-serif';

    for (let g = 0; g <= 4; g++) {
      const gy = pad.top + plotH - (g / 4) * plotH;
      const val = (g / 4) * maxY;
      ctx.beginPath();
      ctx.moveTo(pad.left, gy);
      ctx.lineTo(cssW - pad.right, gy);
      ctx.stroke();
      ctx.fillText(val.toFixed(0), 4, gy + 4);
    }

    const xFor = (i) => pad.left + (i / (STEPS - 1)) * plotW;
    const yFor = (v) => pad.top + plotH - (v / maxY) * plotH;

    function drawSeries(values, color, dash) {
      ctx.strokeStyle = color;
      ctx.lineWidth = dash ? 1.5 : 2;
      ctx.setLineDash(dash || []);
      ctx.beginPath();
      for (let i = 0; i < values.length; i++) {
        const x = xFor(i);
        const y = yFor(values[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    drawSeries(series.target, getVar('--muted'), [4, 4]);
    drawSeries(series.actual, getVar('--primary-2'), null);

    ctx.fillStyle = getVar('--muted');
    ctx.fillText('target (dashed)', pad.left, cssH - 6);
    const labelX = pad.left + (xFor(STEPS - 1) - pad.left) * 0.55;
    ctx.fillStyle = getVar('--primary-2');
    ctx.fillText('robot response', labelX, cssH - 6);
  }

  function getVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#235986';
  }

  function updateReadouts() {
    $id('r-overshoot').textContent = (metrics.overshootPct <= 0 ? '0.0' : metrics.overshootPct.toFixed(1)) + '%';
    $id('r-settle').textContent = metrics.settleTime === null ? 'never settled' : metrics.settleTime.toFixed(2) + 's';
    $id('r-sserr').textContent = metrics.ssErr.toFixed(2) + ' in' + (mode === 'vel' ? '/s' : '');
  }

  function syncSliders() {
    $id('kp').value = gains.kP;
    $id('ki').value = gains.kI;
    $id('kd').value = gains.kD;
    $id('kf').value = gains.kF;
    $id('kp-val').textContent = gains.kP.toFixed(2);
    $id('ki-val').textContent = gains.kI.toFixed(2);
    $id('kd-val').textContent = gains.kD.toFixed(2);
    $id('kf-val').textContent = gains.kF.toFixed(2);
  }

  function run() {
    series = simulate(gains);
    metrics = analyze(series);
    draw();
    updateReadouts();
  }

  function setMode(next) {
    mode = next;
    document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
    run();
  }

  function copyJava() {
    const snippet = `// Copied from RoboCodex PID tuner
final double kP = ${gains.kP.toFixed(3)};
final double kI = ${gains.kI.toFixed(3)};
final double kD = ${gains.kD.toFixed(3)};
final double kF = ${gains.kF.toFixed(3)};
PIDFCoefficients pidf = new PIDFCoefficients(kP, kI, kD, kF);`;
    navigator.clipboard.writeText(snippet).then(() => {
      const btn = $id('tuner-copy');
      const old = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = old; }, 1400);
    });
  }

  function wire() {
    document.querySelectorAll('.mode-btn').forEach((b) => {
      b.addEventListener('click', () => setMode(b.dataset.mode));
    });
    ['kp', 'ki', 'kd', 'kf'].forEach((name) => {
      const input = $id(name);
      input.addEventListener('input', () => {
        gains[name] = Number(input.value);
        $id(name + '-val').textContent = Number(input.value).toFixed(2);
        run();
      });
    });
    Object.keys(PRESETS).forEach((key) => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary preset-btn';
      btn.type = 'button';
      btn.textContent = PRESETS[key].label;
      btn.addEventListener('click', () => {
        gains = { ...PRESETS[key] };
        syncSliders();
        run();
      });
      $id('preset-list').appendChild(btn);
    });
    $id('tuner-copy').addEventListener('click', copyJava);
    window.addEventListener('resize', draw);
  }

  document.addEventListener('DOMContentLoaded', () => {
    wire();
    syncSliders();
    run();
  });
})();
