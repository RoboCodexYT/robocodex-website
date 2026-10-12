// helpers shared by the youtube and instagram sync scripts

import { readFile, writeFile } from 'node:fs/promises';

export function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

const CATEGORY_RULES = [
  ['Interviews', /(interview|co-?founder|podcast|q&a|shares advice)/i],
  ['FIRST News', /(lego|\bfll\b|firstlegoleague|partnership|first's vision|mission \d|map reveal|followers)/i],
  ['Programming', /(cod(e|ing)|program|pathing|pedro|roadrunner|autonomous|sensor|simulator|\bpid\b|odometry|vision|limelight)/i],
  ['Robot Mechanics', /(gyro|motor|mechanic|build|design|drivetrain|suspension|\bcad\b|servo|encoder|wheel|swerve|intake|shooter|prototype|sorting)/i],
  ['Strategy', /(scor(e|ing|ed)|strategy|points|corners|game|match|alliance)/i],
  ['FTC Basics', /(guide|tutorial|beginner|basics|intro|lesson|starter|setup|rookie)/i],
];

// title wins over description, since descriptions are full of generic hashtags
export function inferCategory(title, description) {
  const cleanTitle = (title || '').replace(/#\S+/g, ' ');
  for (const text of [cleanTitle, `${title} ${description}`]) {
    const hit = CATEGORY_RULES.find(([, pattern]) => pattern.test(text));
    if (hit) return hit[0];
  }
  return 'Strategy';
}

export async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

// only rewrite the file when the actual items changed, so the hourly job
// doesn't make a commit just to bump a timestamp
export async function writeIfChanged(file, key, items, extra = {}) {
  const previous = await readJson(file, null);
  const before = JSON.stringify(previous?.[key] ?? null);
  const after = JSON.stringify(items);
  if (before === after) return false;
  const payload = { lastUpdated: new Date().toISOString(), ...extra, [key]: items };
  await writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return true;
}
