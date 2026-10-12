// robot doctor UI. routes live in the hash so every diagnosis can be shared:
//   #/                      browse + search
//   #/s/<symptom>?a=q.y,…   diagnosing (y / n / u answers)
//   #/s/<symptom>/result?a= results
//   #/lights, #/checkup     side tools

(function () {
  const D = window.DOCTOR;
  const E = window.DoctorEngine;
  if (!D || !E) return;

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const view = $('#doc-view');
  const root = $('#doctor');
  const symptomById = Object.fromEntries(D.symptoms.map((s) => [s.id, s]));
  const POPULAR = {
    drift: 'Drifts when driving',
    disconnect: 'Disconnects mid-match',
    servo_jitter: 'Servo jitters',
    slides_sag: 'Slides sag',
    auto_inconsistent: 'Inconsistent auto',
    moves_alone: 'Moves on its own',
  };
  const ANSWER_LABEL = { y: 'Yes', n: 'No', u: 'Not sure' };

  let current = { route: null, symptom: null, answers: [] };
  const tried = new Set();

  // must match slugFor() in scripts/seo.mjs, which builds the fix/ pages
  function guideSlug(symptom) {
    return `ftc-${symptom.title.toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------------------------------------------------------------------------
  // routing
  // ---------------------------------------------------------------------------
  function parseHash() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, query = ''] = raw.split('?');
    const params = new URLSearchParams(query);
    const parts = path.split('/').filter(Boolean);
    const answers = (params.get('a') || '').split(',').filter(Boolean).map((pair) => {
      const i = pair.lastIndexOf('.');
      return { q: pair.slice(0, i), a: pair.slice(i + 1) };
    }).filter((x) => D.questions[x.q] && ['y', 'n', 'u'].includes(x.a));

    if (parts[0] === 's' && symptomById[parts[1]]) {
      return { name: parts[2] === 'result' ? 'result' : 'diagnose', symptom: symptomById[parts[1]], answers };
    }
    if (parts[0] === 'lights') return { name: 'lights' };
    if (parts[0] === 'checkup') return { name: 'checkup' };
    return { name: 'browse' };
  }

  function hashFor(name, symptom, answers) {
    const a = answers.map((x) => `${x.q}.${x.a}`).join(',');
    const base = name === 'result' ? `#/s/${symptom.id}/result` : `#/s/${symptom.id}`;
    return a ? `${base}?a=${a}` : base;
  }

  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  function render() {
    const route = parseHash();
    const prev = current;
    current = { route: route.name, symptom: route.symptom || null, answers: route.answers || [] };

    const diagnosing = route.name === 'diagnose' || route.name === 'result';
    root.classList.toggle('is-diagnosing', diagnosing);
    setTab(route.name === 'lights' ? 'lights' : route.name === 'checkup' ? 'checkup' : 'diagnose');

    if (route.name === 'diagnose') {
      const next = E.nextQuestion(D, route.symptom, route.answers);
      if (!next) {
        // nothing left worth asking: straight to results
        history.replaceState(null, '', hashFor('result', route.symptom, route.answers));
        return transitionTo(() => renderResult(route.symptom, route.answers), prev.route === 'diagnose');
      }
      // stay on the same DOM while answering so the suspects can animate
      if (prev.route === 'diagnose' && prev.symptom === route.symptom && $('.dx', view)) {
        const back = route.answers.length < prev.answers.length;
        return updateDiagnose(route.symptom, route.answers, next, back ? 'back' : 'forward');
      }
      return transitionTo(() => renderDiagnose(route.symptom, route.answers, next));
    }
    if (route.name === 'result') return transitionTo(() => renderResult(route.symptom, route.answers), prev.route === 'diagnose');
    if (route.name === 'lights') return transitionTo(renderLights);
    if (route.name === 'checkup') return transitionTo(renderCheckup);
    return transitionTo(renderBrowse);
  }

  function transitionTo(build, fromDiagnose) {
    const doIt = () => {
      view.innerHTML = '';
      build();
      view.classList.remove('view-enter');
      void view.offsetWidth;
      view.classList.add('view-enter');
      const scrollTarget = root.classList.contains('is-diagnosing') ? $('.doc-tabs').offsetTop - 80 : 0;
      if (window.scrollY > scrollTarget + 40 || root.classList.contains('is-diagnosing')) {
        window.scrollTo({ top: Math.max(0, scrollTarget), behavior: REDUCED ? 'auto' : 'smooth' });
      }
    };
    // a short "analyzing" beat before results feels like the doctor is thinking
    if (fromDiagnose && !REDUCED) {
      const panel = $('.dx-suspects', view);
      if (panel) {
        panel.classList.add('is-analyzing');
        $('.dx-question', view)?.classList.add('is-leaving');
        return setTimeout(doIt, 750);
      }
    }
    doIt();
  }

  function setTab(name) {
    const tabs = $('#doc-tabs');
    $$('[data-tab]', tabs).forEach((t) => {
      const on = t.dataset.tab === name;
      t.classList.toggle('active', on);
      if (on) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
    moveInk();
  }

  function moveInk() {
    const tabs = $('#doc-tabs');
    const active = $('.active', tabs);
    const ink = $('.doc-tab-ink', tabs);
    if (!active || !ink) return;
    ink.style.width = `${active.offsetWidth}px`;
    ink.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  // ---------------------------------------------------------------------------
  // browse + search
  // ---------------------------------------------------------------------------
  let areaFilter = 'all';

  function renderBrowse() {
    const counts = {};
    D.symptoms.forEach((s) => { counts[s.area] = (counts[s.area] || 0) + 1; });
    view.innerHTML = `
      <div class="doc-browse">
        <div class="doc-browse-head">
          <div>
            <span class="eyebrow">Or browse by area</span>
            <h2>Pick the closest symptom</h2>
          </div>
          <div class="doc-areas" role="tablist" aria-label="Filter by area">
            <button type="button" class="doc-area" data-area="all" role="tab">All <span>${D.symptoms.length}</span></button>
            ${Object.entries(D.areas).map(([id, a]) => `
              <button type="button" class="doc-area" data-area="${id}" role="tab"><i class="fa-solid ${a.icon}"></i> ${esc(a.label)} <span>${counts[id] || 0}</span></button>`).join('')}
          </div>
        </div>
        <div class="doc-symptoms" id="doc-symptoms"></div>
        <div class="doc-triage card">
          <div class="icon-tile"><i class="fa-solid fa-lightbulb"></i></div>
          <div>
            <h3>Before anything else: the 60-second triage</h3>
            <p>A huge share of "mystery" problems disappear after these: swap in a fully charged battery, power the robot off for at least 5 seconds before turning it back on, push every plug in firmly, and make sure the right configuration is active.</p>
          </div>
        </div>
      </div>`;
    $$('.doc-area', view).forEach((b) => b.addEventListener('click', () => {
      areaFilter = b.dataset.area;
      paintSymptoms(true);
    }));
    paintSymptoms(false);
  }

  function paintSymptoms(animate) {
    $$('.doc-area', view).forEach((b) => b.classList.toggle('active', b.dataset.area === areaFilter));
    const grid = $('#doc-symptoms', view);
    const list = D.symptoms.filter((s) => areaFilter === 'all' || s.area === areaFilter);
    grid.innerHTML = list.map((s, i) => `
      <a class="doc-symptom" href="#/s/${s.id}" style="--i:${i}">
        <span class="doc-symptom-icon"><i class="fa-solid ${s.icon}"></i></span>
        <span class="doc-symptom-text">
          <span class="doc-symptom-area">${esc(D.areas[s.area].label)}</span>
          <strong>${esc(s.title)}</strong>
          <span class="doc-symptom-sub">${esc(s.sub)}</span>
        </span>
        <i class="fa-solid fa-arrow-right doc-symptom-go" aria-hidden="true"></i>
      </a>`).join('');
    if (animate || !REDUCED) {
      grid.classList.remove('stagger-in');
      void grid.offsetWidth;
      grid.classList.add('stagger-in');
    }
  }

  // tiny fuzzy search over titles, subtitles and keywords
  const index = D.symptoms.map((s) => ({
    s,
    title: tokens(s.title),
    words: tokens(`${s.title} ${s.sub} ${s.keywords} ${D.areas[s.area].label}`),
  }));

  function tokens(text) {
    return text.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 1);
  }

  function editDistanceAtMost1(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0;
    let j = 0;
    let edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }

  const STOP = new Set(['my', 'the', 'is', 'it', 'its', 'robot', 'and', 'when', 'to', 'of', 'a', 'on', 'in', 'keeps', 'our', 'we', 'doesnt', 'dont', 'wont', 'not', 'very', 'really', 'help']);

  function search(query) {
    const q = tokens(query).filter((w) => !STOP.has(w));
    if (!q.length) return [];
    return index.map((entry) => {
      let score = 0;
      for (const w of q) {
        let best = 0;
        for (const t of entry.words) {
          if (t === w) best = Math.max(best, 3);
          else if (t.startsWith(w) || w.startsWith(t)) best = Math.max(best, w.length >= 3 ? 2 : 0.5);
          else if (w.length >= 4 && t.includes(w)) best = Math.max(best, 1.2);
          else if (w.length >= 4 && editDistanceAtMost1(w, t)) best = Math.max(best, 1.5);
        }
        if (entry.title.includes(w)) best += 0.75;
        score += best;
      }
      return { s: entry.s, score: score / q.length };
    }).filter((r) => r.score >= 1).sort((a, b) => b.score - a.score).slice(0, 6);
  }

  function highlight(text, query) {
    const words = tokens(query).filter((w) => !STOP.has(w) && w.length > 2);
    let out = esc(text);
    for (const w of words) out = out.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*)`, 'ig'), '<mark>$1</mark>');
    return out;
  }

  function setupSearch() {
    const input = $('#doc-search');
    const list = $('#doc-search-results');
    const box = input.closest('.doc-search');
    let results = [];
    let active = 0;

    const paint = () => {
      const q = input.value.trim();
      results = search(q);
      active = 0;
      if (!q) {
        list.hidden = true;
        box.setAttribute('aria-expanded', 'false');
        return;
      }
      list.hidden = false;
      box.setAttribute('aria-expanded', 'true');
      list.innerHTML = results.length
        ? results.map((r, i) => `
          <li role="option" id="doc-opt-${i}" class="${i === 0 ? 'active' : ''}" data-id="${r.s.id}" aria-selected="${i === 0}">
            <i class="fa-solid ${r.s.icon}"></i>
            <span><strong>${highlight(r.s.title, q)}</strong><small>${esc(D.areas[r.s.area].label)}</small></span>
          </li>`).join('')
        : `<li class="doc-search-empty">No close match — try different words, or browse by area below.</li>`;
      input.setAttribute('aria-activedescendant', results.length ? 'doc-opt-0' : '');
    };

    const choose = (id) => {
      if (!id) return;
      input.value = '';
      list.hidden = true;
      go(`#/s/${id}`);
    };

    input.addEventListener('input', paint);
    input.addEventListener('focus', paint);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!results.length) return;
        e.preventDefault();
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
        $$('li', list).forEach((li, i) => {
          li.classList.toggle('active', i === active);
          li.setAttribute('aria-selected', String(i === active));
        });
        input.setAttribute('aria-activedescendant', `doc-opt-${active}`);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        choose(results[active]?.s.id);
      } else if (e.key === 'Escape') {
        list.hidden = true;
        input.blur();
      }
    });
    list.addEventListener('mousedown', (e) => {
      const li = e.target.closest('li[data-id]');
      if (li) {
        e.preventDefault();
        choose(li.dataset.id);
      }
    });
    document.addEventListener('click', (e) => {
      if (!box.contains(e.target)) list.hidden = true;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== input && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) {
        e.preventDefault();
        go('#/');
        input.focus();
      }
    });

    $('#doc-popular').innerHTML = `<span>Common:</span>${Object.entries(POPULAR)
      .map(([id, label]) => `<a href="#/s/${id}">${esc(label)}</a>`).join('')}`;
  }

  // ---------------------------------------------------------------------------
  // diagnose
  // ---------------------------------------------------------------------------
  function renderDiagnose(symptom, answers, next) {
    view.innerHTML = `
      <div class="dx">
        <div class="dx-head">
          <div class="dx-crumb">
            <span class="doc-symptom-icon small"><i class="fa-solid ${symptom.icon}"></i></span>
            <div>
              <span class="eyebrow">${esc(D.areas[symptom.area].label)} · diagnosing</span>
              <h2>${esc(symptom.title)}</h2>
            </div>
          </div>
          <div class="dx-actions">
            <a class="btn btn-secondary btn-sm" href="#/">Start over</a>
            <a class="btn btn-secondary btn-sm" data-skip href="${hashFor('result', symptom, answers)}">Skip to results <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </div>
        <div class="dx-grid">
          <section class="dx-question card" aria-labelledby="dx-q-text">
            <div class="dx-q-inner"></div>
          </section>
          <aside class="dx-suspects card" aria-label="Current suspects">
            <div class="dx-suspects-head">
              <span class="live-dot" aria-hidden="true"></span>
              <h3>Suspects</h3>
              <span class="dx-suspects-note">updates as you answer</span>
            </div>
            <ol class="dx-list"></ol>
            <div class="dx-scan" aria-hidden="true"><span></span></div>
          </aside>
        </div>
        <div class="dx-history" aria-label="Your answers"></div>
      </div>`;
    paintQuestion(symptom, answers, next, null);
    paintSuspects(symptom, answers, false);
    paintHistory(symptom, answers);
  }

  function updateDiagnose(symptom, answers, next, dir) {
    $('[data-skip]', view).setAttribute('href', hashFor('result', symptom, answers));
    paintQuestion(symptom, answers, next, dir);
    paintSuspects(symptom, answers, true);
    paintHistory(symptom, answers);
  }

  function paintQuestion(symptom, answers, qid, dir) {
    const card = $('.dx-question', view);
    const q = D.questions[qid];
    const n = answers.length + 1;
    const left = E.remainingEstimate(D, symptom, answers);
    const html = `
      <div class="dx-q-top">
        <span class="dx-step">Question ${n}</span>
        <span class="dx-remaining">${left <= 1 ? 'almost there' : `about ${left} to go`}</span>
      </div>
      <div class="dx-progress" aria-hidden="true"><span style="width:${Math.min(100, (answers.length / (answers.length + left)) * 100 || 4)}%"></span></div>
      <h2 id="dx-q-text" tabindex="-1">${esc(q.text)}</h2>
      <details class="dx-help">
        <summary><i class="fa-solid fa-circle-question"></i> How do I check?</summary>
        <p>${esc(q.help)}</p>
      </details>
      <div class="dx-answers">
        <button type="button" class="dx-answer yes" data-a="y"><span class="dx-answer-key">Y</span> Yes</button>
        <button type="button" class="dx-answer no" data-a="n"><span class="dx-answer-key">N</span> No</button>
        <button type="button" class="dx-answer unsure" data-a="u"><span class="dx-answer-key">?</span> Not sure</button>
      </div>
      <div class="dx-q-foot">
        ${answers.length ? '<button type="button" class="dx-back"><i class="fa-solid fa-arrow-left"></i> Back</button>' : '<span></span>'}
        <span class="dx-cost">${'<i class="fa-solid fa-clock"></i>'} ${q.cost >= 3 ? 'takes a few minutes' : q.cost === 2 ? 'quick test' : 'just look'}</span>
      </div>`;

    const inner = $('.dx-q-inner', card);
    const swap = () => {
      inner.innerHTML = html;
      $$('.dx-answer', inner).forEach((b) => b.addEventListener('click', () => answer(b.dataset.a, b)));
      $('.dx-back', inner)?.addEventListener('click', () => history.back());
      if (dir) $('#dx-q-text', inner).focus({ preventScroll: true });
    };

    if (!dir || REDUCED) return swap();
    inner.classList.remove('q-out-left', 'q-out-right', 'q-in-left', 'q-in-right');
    inner.classList.add(dir === 'back' ? 'q-out-right' : 'q-out-left');
    setTimeout(() => {
      swap();
      inner.classList.remove('q-out-left', 'q-out-right');
      void inner.offsetWidth;
      inner.classList.add(dir === 'back' ? 'q-in-left' : 'q-in-right');
    }, 170);
  }

  function answer(a, btn) {
    if (!current.symptom) return;
    const qid = E.nextQuestion(D, current.symptom, current.answers);
    if (!qid) return;
    btn?.classList.add('is-picked');
    const answers = [...current.answers, { q: qid, a }];
    go(hashFor('diagnose', current.symptom, answers));
  }

  document.addEventListener('keydown', (e) => {
    if (current.route !== 'diagnose' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/input|textarea|select/i.test(document.activeElement?.tagName || '')) return;
    const key = e.key.toLowerCase();
    const map = { y: 'y', n: 'n', '?': 'u', u: 'u', 1: 'y', 2: 'n', 3: 'u' };
    if (map[key]) {
      e.preventDefault();
      answer(map[key], $(`.dx-answer[data-a="${map[key]}"]`, view));
    } else if (key === 'backspace' && current.answers.length) {
      e.preventDefault();
      history.back();
    }
  });

  function paintSuspects(symptom, answers, animate) {
    const list = $('.dx-list', view);
    const { probs } = E.posterior(D, symptom, answers);
    const ranked = E.ranked(probs);

    // FLIP: remember where each row was before re-ordering
    const before = {};
    $$('li', list).forEach((li) => { before[li.dataset.id] = li.getBoundingClientRect().top; });
    const oldPct = {};
    $$('li', list).forEach((li) => { oldPct[li.dataset.id] = Number(li.dataset.p) || 0; });

    const existing = Object.fromEntries($$('li', list).map((li) => [li.dataset.id, li]));
    ranked.forEach(([id, p], i) => {
      const cause = D.causes[id];
      const conf = E.confidence(p, i === 0);
      let li = existing[id];
      if (!li) {
        li = document.createElement('li');
        li.dataset.id = id;
        li.innerHTML = `
          <div class="dx-row">
            <span class="dx-name">${esc(cause.title)}</span>
            <span class="dx-pct">0%</span>
          </div>
          <div class="dx-bar"><span></span></div>
          <span class="dx-tag"></span>`;
      }
      li.className = `dx-item conf-${conf.key}${i === 0 ? ' is-top' : ''}${i >= 6 ? ' is-extra' : ''}`;
      li.dataset.p = String(p);
      $('.dx-bar span', li).style.width = `${Math.max(1.5, p * 100)}%`;
      $('.dx-tag', li).textContent = i === 0 && p >= 0.35 ? 'Leading suspect' : conf.label;
      tween($('.dx-pct', li), oldPct[id] || 0, p, animate);
      list.appendChild(li);
    });

    // only the top six by default; the rest are one tap away
    let more = $('.dx-more', view);
    const extra = ranked.length - 6;
    if (extra > 0 && !more) {
      more = document.createElement('button');
      more.type = 'button';
      more.className = 'dx-more';
      more.addEventListener('click', () => {
        list.classList.toggle('show-all');
        more.textContent = list.classList.contains('show-all') ? 'Show fewer' : `Show ${extra} more`;
      });
      list.after(more);
    }
    if (more) more.textContent = list.classList.contains('show-all') ? 'Show fewer' : `Show ${extra} more`;

    if (!animate || REDUCED) return;
    $$('li', list).forEach((li) => {
      const prev = before[li.dataset.id];
      if (prev === undefined) return;
      const delta = prev - li.getBoundingClientRect().top;
      if (!delta) return;
      li.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }], { duration: 520, easing: 'cubic-bezier(.22,.61,.36,1)' });
    });
  }

  function tween(el, from, to, animate) {
    const fmt = (v) => `${Math.round(v * 100)}%`;
    if (!animate || REDUCED || Math.abs(to - from) < 0.005) {
      el.textContent = fmt(to);
      return;
    }
    const start = performance.now();
    const dur = 480;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function paintHistory(symptom, answers) {
    const wrap = $('.dx-history', view);
    if (!answers.length) {
      wrap.innerHTML = '';
      return;
    }
    wrap.innerHTML = `<span class="dx-history-label">Your answers</span>${answers.map((x, i) => `
      <a class="dx-chip ans-${x.a}" href="${hashFor('diagnose', symptom, answers.slice(0, i))}" title="Change this answer">
        <span>${esc(D.questions[x.q].text)}</span><strong>${ANSWER_LABEL[x.a]}</strong>
      </a>`).join('')}`;
  }

  // ---------------------------------------------------------------------------
  // results
  // ---------------------------------------------------------------------------
  function renderResult(symptom, answers) {
    const { probs, conflict } = E.posterior(D, symptom, answers);
    const ranked = E.ranked(probs);
    const live = ranked.filter(([, p]) => p >= E.RULED_OUT);
    const out = ranked.filter(([, p]) => p < E.RULED_OUT);
    const top = live[0];
    const topCause = D.causes[top[0]];
    const topConf = E.confidence(top[1], true);
    const moreToAsk = symptom.questions.some((q) => !answers.find((x) => x.q === q));

    view.innerHTML = `
      <div class="rx">
        <div class="rx-head">
          <div class="dx-crumb">
            <span class="doc-symptom-icon small"><i class="fa-solid ${symptom.icon}"></i></span>
            <div>
              <span class="eyebrow">Diagnosis · ${esc(D.areas[symptom.area].label)}</span>
              <h2>${esc(symptom.title)}</h2>
            </div>
          </div>
          <div class="dx-actions">
            <a class="btn btn-secondary btn-sm" href="fix/${guideSlug(symptom)}.html"><i class="fa-regular fa-file-lines"></i> Full guide</a>
            <button type="button" class="btn btn-secondary btn-sm" data-copy-summary><i class="fa-regular fa-copy"></i> Copy summary</button>
            <button type="button" class="btn btn-secondary btn-sm" data-share><i class="fa-solid fa-share-nodes"></i> Share</button>
            <a class="btn btn-secondary btn-sm" href="#/">New diagnosis</a>
          </div>
        </div>

        <div class="rx-verdict card">
          <div class="rx-pulse" aria-hidden="true"><i class="fa-solid fa-stethoscope"></i></div>
          <div>
            <span class="rx-verdict-label">${topConf.key === 'likely' ? 'Most likely cause' : 'Best lead so far'}</span>
            <h3>${esc(topCause.title)}</h3>
            <p>${answers.filter((a) => a.a !== 'u').length
              ? `Based on your ${answers.length} answer${answers.length === 1 ? '' : 's'}, this is the strongest suspect${live.length > 1 ? `, followed by ${esc(D.causes[live[1][0]].title.toLowerCase())}` : ''}.`
              : 'You skipped the questions, so these are ranked by how often they cause this problem.'}
              ${conflict ? ' Some answers contradicted each other, so this falls back to how common each cause is.' : ''}</p>
          </div>
          ${moreToAsk && topConf.key !== 'likely' ? `<a class="btn btn-primary" href="${hashFor('diagnose', symptom, answers)}">Answer more</a>` : ''}
        </div>

        <div class="rx-causes">
          ${live.map(([id, p], i) => causeCard(id, p, i, answers)).join('')}
        </div>

        ${out.length ? `
          <details class="rx-ruled">
            <summary>Ruled out (${out.length})</summary>
            <ul>${out.map(([id]) => `<li><i class="fa-solid fa-xmark"></i> ${esc(D.causes[id].title)}</li>`).join('')}</ul>
          </details>` : ''}

        <div class="rx-stuck card">
          <div class="icon-tile"><i class="fa-solid fa-life-ring"></i></div>
          <div>
            <h3>Still stuck?</h3>
            <p>Copy the summary — it has every answer and suspect — and post it on the
              <a href="https://ftc-community.firstinspires.org/" target="_blank" rel="noopener noreferrer">FTC Community forum</a>
              or your Discord. At an event, the FTA and CSA are there to help with control system problems.</p>
          </div>
          <button type="button" class="btn btn-primary" data-copy-summary><i class="fa-regular fa-copy"></i> Copy summary</button>
        </div>
      </div>`;

    $$('[data-copy-summary]', view).forEach((b) => b.addEventListener('click', () => copySummary(symptom, answers)));
    $('[data-share]', view).addEventListener('click', () => share(symptom));
    wireCauseCards(symptom, answers);
  }

  function causeCard(id, p, i, answers) {
    const c = D.causes[id];
    const conf = E.confidence(p, i === 0);
    const why = E.evidence(D, id, answers).slice(0, 3);
    const open = i === 0 ? ' open' : '';
    const doneKey = (n) => `fix:${id}:${n}`;
    return `
      <details class="rx-cause conf-${conf.key}${tried.has(id) ? ' is-tried' : ''}" data-id="${id}"${open} style="--i:${i}">
        <summary>
          <span class="rx-rank">${i + 1}</span>
          <span class="rx-title">
            <strong>${esc(c.title)}</strong>
            <span>${esc(c.short)}</span>
          </span>
          <span class="rx-meter" title="${Math.round(p * 100)}%">
            <span class="rx-chip">${tried.has(id) ? 'Tried' : conf.label}</span>
            <span class="rx-meter-bar"><span style="width:${Math.max(3, p * 100)}%"></span></span>
          </span>
          <i class="fa-solid fa-chevron-right rx-caret" aria-hidden="true"></i>
        </summary>
        <div class="rx-body">
          ${why.length ? `
            <div class="rx-why">
              <h4>Why it's on the list</h4>
              <ul>${why.map((w) => `<li class="${w.dir}"><i class="fa-solid ${w.dir === 'up' ? 'fa-arrow-up' : 'fa-arrow-down'}"></i> ${esc(w.text)} <strong>${ANSWER_LABEL[w.a]}</strong></li>`).join('')}</ul>
            </div>` : ''}
          <div class="rx-fix">
            <div class="rx-fix-head">
              <h4>How to fix it</h4>
              <span class="rx-time"><i class="fa-regular fa-clock"></i> ${esc(c.time)}</span>
            </div>
            <ol class="rx-steps">
              ${c.fix.map((step, n) => `
                <li>
                  <label>
                    <input type="checkbox" data-step="${doneKey(n)}">
                    <span class="rx-check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
                    <span class="rx-step-text">${esc(step)}</span>
                  </label>
                </li>`).join('')}
            </ol>
            <div class="rx-steps-progress" aria-hidden="true"><span></span></div>
          </div>
          ${c.code ? `
            <div class="rx-code">
              <div class="rx-code-head"><span><i class="fa-solid fa-code"></i> ${esc(c.code.label)}</span><button type="button" class="rx-copy" data-copy-code><i class="fa-regular fa-copy"></i> Copy</button></div>
              <pre><code>${esc(c.code.snippet)}</code></pre>
            </div>` : ''}
          <div class="rx-sources">
            <span>Sources</span>
            ${c.sources.map((k) => `<a href="${D.sources[k][1]}" target="_blank" rel="noopener noreferrer">${esc(D.sources[k][0])} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`).join('')}
          </div>
          <div class="rx-outcome">
            <span>Tried it?</span>
            <button type="button" class="btn btn-primary btn-sm" data-fixed><i class="fa-solid fa-check"></i> This fixed it</button>
            <button type="button" class="btn btn-secondary btn-sm" data-not-fixed>Still broken — next suspect <i class="fa-solid fa-arrow-right"></i></button>
          </div>
        </div>
      </details>`;
  }

  function wireCauseCards(symptom, answers) {
    const store = loadStore('robocodex-doctor-steps');
    $$('.rx-cause', view).forEach((card) => {
      const steps = $$('input[data-step]', card);
      const bar = $('.rx-steps-progress span', card);
      const paintProgress = () => {
        const done = steps.filter((s) => s.checked).length;
        bar.style.width = `${(done / steps.length) * 100}%`;
        card.classList.toggle('all-done', done === steps.length);
      };
      steps.forEach((s) => {
        s.checked = !!store[s.dataset.step];
        s.addEventListener('change', () => {
          store[s.dataset.step] = s.checked;
          saveStore('robocodex-doctor-steps', store);
          paintProgress();
        });
      });
      paintProgress();

      $('[data-copy-code]', card)?.addEventListener('click', (e) => {
        copyText($('pre', card).textContent, 'Code copied');
        flash(e.currentTarget);
      });

      $('[data-fixed]', card).addEventListener('click', (e) => {
        celebrate(e.currentTarget);
        card.classList.add('is-fixed');
        toast(`Fixed! ${D.causes[card.dataset.id].title} — nice work.`);
      });

      $('[data-not-fixed]', card).addEventListener('click', () => {
        tried.add(card.dataset.id);
        card.classList.add('is-tried');
        $('.rx-chip', card).textContent = 'Tried';
        card.open = false;
        const next = $$('.rx-cause', view).find((c) => !tried.has(c.dataset.id));
        if (next) {
          next.open = true;
          next.classList.add('is-spotlight');
          setTimeout(() => next.classList.remove('is-spotlight'), 1400);
          next.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
        } else {
          $('.rx-stuck', view).scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
          $('.rx-stuck', view).classList.add('is-spotlight');
        }
      });
    });
  }

  function summaryText(symptom, answers) {
    const { probs } = E.posterior(D, symptom, answers);
    const ranked = E.ranked(probs).filter(([, p]) => p >= E.RULED_OUT).slice(0, 4);
    const lines = [`🩺 Robot Doctor — ${symptom.title}`, ''];
    if (answers.length) {
      lines.push('What we checked:');
      answers.forEach((x) => lines.push(`• ${D.questions[x.q].text} → ${ANSWER_LABEL[x.a]}`));
      lines.push('');
    }
    lines.push('Top suspects:');
    ranked.forEach(([id, p], i) => {
      const conf = E.confidence(p, i === 0);
      lines.push(`${i + 1}. ${D.causes[id].title} — ${tried.has(id) ? 'tried, not fixed' : `${conf.label.toLowerCase()} (${Math.round(p * 100)}%)`}`);
    });
    lines.push('', location.href);
    return lines.join('\n');
  }

  function copySummary(symptom, answers) {
    copyText(summaryText(symptom, answers), 'Summary copied — paste it anywhere');
  }

  function share(symptom) {
    const data = { title: `Robot Doctor: ${symptom.title}`, url: location.href };
    if (navigator.share) navigator.share(data).catch(() => {});
    else copyText(location.href, 'Link copied');
  }

  // ---------------------------------------------------------------------------
  // status light decoder
  // ---------------------------------------------------------------------------
  function renderLights() {
    view.innerHTML = `
      <div class="lights">
        <div class="section-head">
          <span class="eyebrow">REV Control & Expansion Hub</span>
          <h2>What is the status light telling you?</h2>
          <p>Pick the color and pattern you see on the hub. Based on REV's blink code chart (Control Hub on Robot Controller app 6.0+, Expansion Hub firmware 1.7.0+).</p>
        </div>
        <div class="lights-grid">
          ${D.led.map((l, i) => `
            <button type="button" class="light-card tone-${l.tone}" data-i="${i}" style="--i:${i}">
              <span class="led led-${l.color} led-${l.pattern}"></span>
              <span class="light-name">${l.pattern === 'off' ? 'Off' : `${cap(l.pattern)} ${l.color}`}</span>
              <span class="light-title">${esc(l.title)}</span>
            </button>`).join('')}
        </div>
        <div class="light-detail card" id="light-detail" hidden></div>
        <div class="light-address card">
          <div>
            <h3>Counting an Expansion Hub's address</h3>
            <p>A connected Expansion Hub glows green and flashes blue every ~5 seconds. Count the blue flashes — that's its address. Two hubs with the same address will conflict.</p>
          </div>
          <div class="address-demo" aria-hidden="true">
            <span class="led led-green led-address"></span>
            <span class="address-count">address <strong>2</strong></span>
          </div>
        </div>
        <p class="lights-source">Source: <a href="${D.sources.rev_led[1]}" target="_blank" rel="noopener noreferrer">${D.sources.rev_led[0]}</a></p>
      </div>`;
    $$('.light-card', view).forEach((b) => b.addEventListener('click', () => {
      $$('.light-card', view).forEach((x) => x.classList.toggle('active', x === b));
      const l = D.led[Number(b.dataset.i)];
      const detail = $('#light-detail', view);
      detail.hidden = false;
      detail.className = `light-detail card tone-${l.tone}`;
      detail.innerHTML = `
        <span class="led led-${l.color} led-${l.pattern} big"></span>
        <div>
          <span class="eyebrow">${esc(l.hub)}</span>
          <h3>${esc(l.title)}</h3>
          <p>${esc(l.meaning)}</p>
          ${l.symptom ? `<a class="btn btn-primary btn-sm" href="#/s/${l.symptom}">Diagnose: ${esc(symptomById[l.symptom].title)} <i class="fa-solid fa-arrow-right"></i></a>` : ''}
        </div>`;
      detail.classList.remove('pop');
      void detail.offsetWidth;
      detail.classList.add('pop');
    }));
  }

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ---------------------------------------------------------------------------
  // pre-match checkup
  // ---------------------------------------------------------------------------
  function renderCheckup() {
    const store = loadStore('robocodex-doctor-checkup');
    const total = D.checkup.reduce((n, g) => n + g.items.length, 0);
    view.innerHTML = `
      <div class="checkup">
        <div class="checkup-head">
          <div class="section-head">
            <span class="eyebrow">Before every match</span>
            <h2>Pre-match checkup</h2>
            <p>The checks pit crews swear by, from FIRST and REV best practices. Ticks are saved on this device.</p>
          </div>
          <div class="checkup-ring" aria-live="polite">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle class="ring-track" cx="60" cy="60" r="52"></circle>
              <circle class="ring-fill" cx="60" cy="60" r="52"></circle>
            </svg>
            <div class="ring-label"><strong id="ring-count">0</strong><span>of ${total}</span></div>
          </div>
        </div>
        <div class="checkup-groups">
          ${D.checkup.map((g, gi) => `
            <section class="checkup-group card" style="--i:${gi}">
              <h3>${esc(g.group)}</h3>
              <ul>
                ${g.items.map((item, ii) => `
                  <li>
                    <label>
                      <input type="checkbox" data-key="${gi}-${ii}">
                      <span class="rx-check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
                      <span>${esc(item)}</span>
                    </label>
                  </li>`).join('')}
              </ul>
            </section>`).join('')}
        </div>
        <div class="checkup-foot">
          <button type="button" class="btn btn-secondary" data-reset><i class="fa-solid fa-rotate-left"></i> Reset for the next match</button>
        </div>
      </div>`;

    const boxes = $$('input[data-key]', view);
    const ring = $('.ring-fill', view);
    const circumference = 2 * Math.PI * 52;
    ring.style.strokeDasharray = `${circumference}`;
    const paint = (celebrateIfDone) => {
      const done = boxes.filter((b) => b.checked).length;
      $('#ring-count', view).textContent = done;
      ring.style.strokeDashoffset = `${circumference * (1 - done / boxes.length)}`;
      const complete = done === boxes.length;
      $('.checkup-ring', view).classList.toggle('complete', complete);
      if (complete && celebrateIfDone) {
        celebrate($('.checkup-ring', view));
        toast('Robot cleared for the match. Good luck out there!');
      }
    };
    boxes.forEach((b) => {
      b.checked = !!store[b.dataset.key];
      b.addEventListener('change', () => {
        store[b.dataset.key] = b.checked;
        saveStore('robocodex-doctor-checkup', store);
        paint(b.checked);
      });
    });
    $('[data-reset]', view).addEventListener('click', () => {
      boxes.forEach((b) => { b.checked = false; });
      saveStore('robocodex-doctor-checkup', {});
      paint(false);
    });
    paint(false);
  }

  // ---------------------------------------------------------------------------
  // little helpers: storage, clipboard, toast, confetti, monitor
  // ---------------------------------------------------------------------------
  function loadStore(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }

  function saveStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // private mode etc. — the checklist still works for this visit
    }
  }

  function copyText(text, message) {
    const done = () => toast(message);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* nothing else to try */ }
    ta.remove();
    done();
  }

  function flash(el) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  let toastTimer;
  function toast(message) {
    const el = $('#doc-toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function celebrate(origin) {
    if (REDUCED) return;
    const canvas = $('#doc-confetti');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const r = origin.getBoundingClientRect();
    const ox = r.left + r.width / 2;
    const oy = r.top + r.height / 2;
    const colors = ['#8FB6DD', '#3A8BC8', '#1E5A8C', '#F3F5F8', '#A9C8E6'];
    const parts = Array.from({ length: 90 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const speed = 5 + Math.random() * 7;
      return {
        x: ox, y: oy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        w: 4 + Math.random() * 5, h: 6 + Math.random() * 8, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        color: colors[(Math.random() * colors.length) | 0], life: 0,
      };
    });
    canvas.classList.add('on');
    const tick = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      let alive = 0;
      for (const p of parts) {
        p.life++;
        p.vy += 0.22;
        p.vx *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        const fade = Math.max(0, 1 - p.life / 90);
        if (fade <= 0 || p.y > innerHeight + 20) continue;
        alive++;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) requestAnimationFrame(tick);
      else {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        canvas.classList.remove('on');
      }
    };
    requestAnimationFrame(tick);
  }

  function startMonitor() {
    $('#stat-symptoms').textContent = D.symptoms.length;
    $('#stat-causes').textContent = Object.keys(D.causes).length;
    $('#stat-sources').textContent = Object.keys(D.sources).length;
    const readings = ['12.8 V', 'ping 6 ms', 'loop 14 ms', 'IMU 0.0°', 'hub ● ok'];
    const el = $('#monitor-reading');
    let i = 0;
    if (REDUCED) return;
    setInterval(() => {
      if (document.hidden) return;
      i = (i + 1) % readings.length;
      el.classList.add('swap');
      setTimeout(() => {
        el.textContent = readings[i];
        el.classList.remove('swap');
      }, 220);
    }, 2600);
  }

  // ---------------------------------------------------------------------------
  setupSearch();
  startMonitor();
  window.addEventListener('hashchange', render);
  window.addEventListener('resize', moveInk);
  if (document.fonts?.ready) document.fonts.ready.then(moveInk);
  render();
})();
