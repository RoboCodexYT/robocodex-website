// robot doctor diagnosis engine. no DOM in here so it can be tested on its own.
//
// each symptom starts every cause at its prior. each answer multiplies a cause by
// how likely that answer is if the cause were the real problem:
//   P(yes | cause) = yes[cause] / (yes[cause] + no[cause])   (missing = 1)
// so 0 rules a cause out and big numbers point straight at it. the next question
// is whichever one is expected to shrink the uncertainty (entropy) the most,
// with a small penalty for slow checks so cheap ones come first.

(function (root) {
  const COST_PENALTY = 0.035;
  const MAX_QUESTIONS = 7;
  // keep asking a couple of questions even when one cause jumps ahead early
  const MIN_QUESTIONS = 3;
  const CONFIDENT = 0.9;
  const MIN_GAIN = 0.02;
  const RULED_OUT = 0.02;

  // the "healthy" answer to an observation question is the side that argues
  // against the causes it's about
  const normalCache = new WeakMap();
  function normalAnswer(q) {
    if (normalCache.has(q)) return normalCache.get(q);
    const weight = (side) => Object.values(q[side]).reduce((t, m) => t + Math.log(Math.max(m, 1e-3)), 0);
    const normal = weight('yes') < weight('no') ? 'y' : 'n';
    normalCache.set(q, normal);
    return normal;
  }

  const UNRELATED_NORMAL = 0.8;
  // people misread or mis-check things, so one answer never fully rules a cause out
  const ANSWER_SLIP = 0.03;

  function likelihood(q, causeId, answer) {
    if (answer !== 'y' && answer !== 'n') return 1;
    const mentioned = causeId in q.yes || causeId in q.no;
    if (!mentioned) {
      if (q.fact) return 0.5;
      return answer === normalAnswer(q) ? UNRELATED_NORMAL : 1 - UNRELATED_NORMAL;
    }
    const yes = causeId in q.yes ? q.yes[causeId] : 1;
    const no = causeId in q.no ? q.no[causeId] : 1;
    const total = yes + no;
    if (total === 0) return 0.5;
    const p = (answer === 'y' ? yes : no) / total;
    return ANSWER_SLIP + (1 - 2 * ANSWER_SLIP) * p;
  }

  function normalize(weights) {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    const out = {};
    for (const [k, v] of Object.entries(weights)) out[k] = sum > 0 ? v / sum : 0;
    return { probs: out, sum };
  }

  // answers: [{ q: 'q_id', a: 'y' | 'n' | 'u' }]
  function posterior(data, symptom, answers) {
    const weights = {};
    for (const [id, prior] of Object.entries(symptom.causes)) {
      let w = prior;
      for (const { q, a } of answers) w *= likelihood(data.questions[q], id, a);
      weights[id] = w;
    }
    const { probs, sum } = normalize(weights);
    // contradictory answers can rule everything out; fall back to priors
    if (sum === 0) return { probs: normalize({ ...symptom.causes }).probs, conflict: true };
    return { probs, conflict: false };
  }

  function entropy(probs) {
    let h = 0;
    for (const p of Object.values(probs)) if (p > 0) h -= p * Math.log2(p);
    return h;
  }

  function updated(data, probs, qid, answer) {
    const q = data.questions[qid];
    const w = {};
    for (const [id, p] of Object.entries(probs)) w[id] = p * likelihood(q, id, answer);
    return normalize(w);
  }

  function scoreQuestion(data, probs, qid) {
    let expected = 0;
    for (const a of ['y', 'n']) {
      const { probs: next, sum } = updated(data, probs, qid, a);
      expected += sum * entropy(next); // sum here is P(answer)
    }
    const gain = entropy(probs) - expected;
    return { gain, score: gain - COST_PENALTY * (data.questions[qid].cost || 1) };
  }

  function ranked(probs) {
    return Object.entries(probs).sort((a, b) => b[1] - a[1]);
  }

  function nextQuestion(data, symptom, answers) {
    const asked = new Set(answers.map((x) => x.q));
    const { probs } = posterior(data, symptom, answers);
    const decisive = answers.filter((x) => x.a !== 'u').length;
    const top = ranked(probs)[0];
    if (decisive >= MAX_QUESTIONS || (decisive >= MIN_QUESTIONS && top && top[1] >= CONFIDENT)) return null;

    let best = null;
    for (const qid of symptom.questions) {
      if (asked.has(qid)) continue;
      const s = scoreQuestion(data, probs, qid);
      if (s.gain < MIN_GAIN) continue;
      if (!best || s.score > best.score) best = { qid, ...s };
    }
    return best ? best.qid : null;
  }

  function confidence(p, isTop) {
    if (p < RULED_OUT) return { key: 'out', label: 'Ruled out' };
    if (p >= 0.5 || (isTop && p >= 0.35)) return { key: 'likely', label: 'Likely' };
    if (p >= 0.12) return { key: 'possible', label: 'Possible' };
    return { key: 'unlikely', label: 'Unlikely' };
  }

  // which answers pushed a cause up or down, for the "why" line on results
  function evidence(data, causeId, answers) {
    const out = [];
    for (const { q, a } of answers) {
      if (a === 'u') continue;
      const question = data.questions[q];
      if (!(causeId in question.yes || causeId in question.no)) continue;
      const mine = likelihood(question, causeId, a);
      const neutral = 0.5;
      const ratio = mine / neutral;
      if (ratio >= 1.35 || ratio <= 0.6) out.push({ q, a, text: question.text, dir: ratio > 1 ? 'up' : 'down', strength: ratio });
    }
    return out.sort((x, y) => Math.abs(Math.log(y.strength)) - Math.abs(Math.log(x.strength)));
  }

  // rough count of how many more questions this path will probably take
  function remainingEstimate(data, symptom, answers) {
    let n = 0;
    const sim = answers.slice();
    for (let i = 0; i < MAX_QUESTIONS; i++) {
      const q = nextQuestion(data, symptom, sim);
      if (!q) break;
      // assume the more likely answer, just for the estimate
      const { probs } = posterior(data, symptom, sim);
      const pYes = updated(data, probs, q, 'y').sum;
      sim.push({ q, a: pYes >= 0.5 ? 'y' : 'n' });
      n++;
    }
    return n;
  }

  const api = { RULED_OUT, likelihood, normalAnswer, posterior, entropy, nextQuestion, confidence, evidence, ranked, remainingEstimate, MAX_QUESTIONS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DoctorEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
