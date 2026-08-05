/* Path Visualizer — preview a list of points as an animated FTC field path.
 * Accepts a JSON array of [x, y] pairs, a JSON array of {x, y} objects, or
 * plain "x, y" text lines. Coordinates are in inches on a 0..144 field. */
(function () {
  const SAMPLES_URL = 'data/paths.json';
  const field = new FTCField('#viz-field', { animate: false, loop: false });
  const state = {
    playing: false,
    sampleId: null
  };

  function $id(id) { return document.getElementById(id); }

  function parsePoints(raw) {
    const text = raw.trim();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        const pts = parsed.map((p) => {
          if (Array.isArray(p)) return [Number(p[0]), Number(p[1])];
          if (p && typeof p === 'object' && 'x' in p && 'y' in p) return [Number(p.x), Number(p.y)];
          return null;
        });
        if (pts.every(Boolean) && pts.length >= 2) return pts;
        return null;
      }
    } catch (_) { /* fall through to text lines */ }

    const lines = text.split(/\n/).map((line) => line.replace(/[()]/g, '').trim()).filter(Boolean);
    const pts = [];
    for (const line of lines) {
      const parts = line.split(/[,;\s]+/).map(Number);
      if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
        pts.push([parts[0], parts[1]]);
      }
    }
    return pts.length >= 2 ? pts : null;
  }

  function fmtPoints(pts) {
    return pts.map((p) => `(${Math.round(p[0])}, ${Math.round(p[1])})`).join(' ');
  }

  function applyPoints(pts, sourceLabel) {
    field.setPath(pts);
    $id('viz-points').textContent = `${pts.length} points`;
    $id('viz-coords').textContent = fmtPoints(pts);
    $id('viz-source').textContent = sourceLabel || 'custom input';
    updateScrubber();
    if (state.playing) field.start();
  }

  function togglePlay() {
    state.playing = !state.playing;
    if (state.playing) {
      if (field.getProgress() >= 1) field.seek(0);
      field.start();
      $id('viz-play').textContent = 'Pause';
    } else {
      field.stop();
      $id('viz-play').textContent = 'Play';
    }
  }

  function updateScrubber() {
    const scrubber = $id('viz-scrubber');
    if (scrubber && document.activeElement !== scrubber) {
      scrubber.value = Math.round(field.getProgress() * 1000);
    }
  }

  function loadSamples() {
    const select = $id('viz-sample');
    select.innerHTML = '<option value="">Pick a sample…</option>';
    fetch(SAMPLES_URL)
      .then((r) => r.json())
      .then((data) => {
        (data.samples || []).forEach((s, i) => {
          const opt = document.createElement('option');
          opt.value = String(i);
          opt.textContent = s.name;
          select.appendChild(opt);
        });
      })
      .catch(() => {
        select.innerHTML = '<option value="">No samples loaded</option>';
      });
  }

  function wire() {
    $id('viz-play').addEventListener('click', togglePlay);
    $id('viz-reset').addEventListener('click', () => {
      field.stop();
      field.seek(0);
      state.playing = false;
      $id('viz-play').textContent = 'Play';
      updateScrubber();
    });

    const speed = $id('viz-speed');
    speed.addEventListener('input', () => {
      field.speed = Number(speed.value);
      $id('viz-speed-value').textContent = speed.value;
    });

    const loop = $id('viz-loop');
    loop.addEventListener('change', () => { field.loop = loop.checked; });

    const scrubber = $id('viz-scrubber');
    scrubber.addEventListener('input', () => {
      const wasPlaying = state.playing;
      if (wasPlaying) { field.stop(); state.playing = false; $id('viz-play').textContent = 'Play'; }
      field.seek(Number(scrubber.value) / 1000);
      updateScrubber();
      if (wasPlaying) togglePlay();
    });

    const sample = $id('viz-sample');
    sample.addEventListener('change', () => {
      if (sample.value === '') return;
      fetch(SAMPLES_URL)
        .then((r) => r.json())
        .then((data) => {
          const s = data.samples[Number(sample.value)];
          if (!s) return;
          $id('viz-input').value = JSON.stringify(s.points, null, 2);
          $id('viz-sample-desc').textContent = s.description || '';
          applyPoints(s.points, s.name);
        });
    });

    const input = $id('viz-input');
    $id('viz-apply').addEventListener('click', () => {
      const pts = parsePoints(input.value);
      if (!pts) {
        $id('viz-error').textContent = 'Could not parse that. Use a JSON array of [x, y] pairs, or lines like "12, 100".';
        return;
      }
      $id('viz-error').textContent = '';
      $id('viz-sample').value = '';
      $id('viz-sample-desc').textContent = '';
      applyPoints(pts, 'custom input');
    });

    // Keep the scrubber in sync while the robot drives.
    setInterval(updateScrubber, 100);
  }

  document.addEventListener('DOMContentLoaded', () => {
    wire();
    loadSamples();
  });
})();
