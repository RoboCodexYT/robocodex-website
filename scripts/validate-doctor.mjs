#!/usr/bin/env node
// checks the robot doctor knowledge base: every reference resolves, every cause can
// actually be confirmed or ruled out by a question, and the engine still finds the
// right cause when a team answers honestly. run after editing js/doctor-data.js.

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.window = {};
require(path.join(root, 'js/doctor-data.js'));
const E = require(path.join(root, 'js/doctor-engine.js'));
const D = globalThis.window.DOCTOR;

const errors = [];
const warnings = [];

for (const [id, c] of Object.entries(D.causes)) {
  if (!D.areas[c.area]) errors.push(`cause ${id}: unknown area "${c.area}"`);
  for (const s of c.sources) if (!D.sources[s]) errors.push(`cause ${id}: unknown source "${s}"`);
  if (!c.fix?.length) errors.push(`cause ${id}: no fix steps`);
}
for (const [id, q] of Object.entries(D.questions)) {
  for (const side of ['yes', 'no']) {
    for (const c of Object.keys(q[side] || {})) if (!D.causes[c]) errors.push(`question ${id}: unknown cause "${c}"`);
  }
}
for (const s of D.symptoms) {
  if (!D.areas[s.area]) errors.push(`symptom ${s.id}: unknown area`);
  for (const c of Object.keys(s.causes)) {
    if (!D.causes[c]) errors.push(`symptom ${s.id}: unknown cause "${c}"`);
    else if (!s.questions.some((q) => D.questions[q] && (c in D.questions[q].yes || c in D.questions[q].no))) {
      warnings.push(`symptom ${s.id}: no question can confirm or rule out "${c}"`);
    }
  }
  for (const q of s.questions) if (!D.questions[q]) errors.push(`symptom ${s.id}: unknown question "${q}"`);
}

// simulate a team whose robot really has each cause, answering honestly
let total = 0;
let top1 = 0;
let top2 = 0;
for (const s of D.symptoms) {
  for (const truth of Object.keys(s.causes)) {
    const answers = [];
    for (let i = 0; i < 12; i++) {
      const qid = E.nextQuestion(D, s, answers);
      if (!qid) break;
      const q = D.questions[qid];
      const mentioned = truth in q.yes || truth in q.no;
      const py = E.likelihood(q, truth, 'y');
      const a = mentioned && py !== 0.5 ? (py > 0.5 ? 'y' : 'n') : E.normalAnswer(q);
      answers.push({ q: qid, a });
    }
    const ranked = E.ranked(E.posterior(D, s, answers).probs);
    total++;
    if (ranked[0][0] === truth) top1++;
    if (ranked[0][0] === truth || ranked[1]?.[0] === truth) top2++;
  }
}
const pct = (n) => Math.round((n / total) * 100);
if (pct(top2) < 95) errors.push(`accuracy dropped: right cause in the top 2 only ${pct(top2)}% of the time (want 95%+)`);

for (const w of warnings) console.log(`! ${w}`);
for (const e of errors) console.log(`x ${e}`);
console.log(`✓ ${D.symptoms.length} symptoms, ${Object.keys(D.causes).length} causes, ${Object.keys(D.questions).length} questions`);
console.log(`✓ simulated diagnoses: right cause first ${pct(top1)}%, in top 2 ${pct(top2)}%`);
process.exitCode = errors.length ? 1 : 0;
