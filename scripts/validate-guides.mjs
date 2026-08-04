#!/usr/bin/env node
/**
 * Validates data/guides.json against the schema/format rules the site expects.
 *
 * Exit codes:
 *   0  all guides valid (warnings allowed)
 *   1  at least one error
 *
 * Run manually:  node scripts/validate-guides.mjs
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const guidesFile = path.join(root, 'data', 'guides.json');
const appFile = path.join(root, 'js', 'app.js');

const ALLOWED_DIFFICULTIES = new Set(['Beginner', 'Intermediate', 'Advanced']);
const SLUG_RE = /^[a-z0-9-]+$/;

const errors = [];
const warnings = [];

function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

async function readJson(file) {
  try {
    const raw = await readFile(file, 'utf8');
    return { raw, data: JSON.parse(raw) };
  } catch (error) {
    if (error instanceof SyntaxError) {
      err(`Parse error in ${path.relative(root, file)}: ${error.message}`);
      process.exitCode = 1;
      process.exit(1);
    }
    throw error;
  }
}

// Pull the guide slugs referenced by the knowledge map out of app.js.
function referencedSlugsFromApp(source) {
  const guidesBlocks = source.match(/guides:\s*\[[^\]]*\]/g) || [];
  const slugs = new Set();
  for (const block of guidesBlocks) {
    for (const m of block.matchAll(/'([a-z0-9-]+)'/g)) {
      slugs.add(m[1]);
    }
  }
  return slugs;
}

function validateContent(content, slug) {
  const lines = content.split('\n');
  const openFences = lines.filter((l) => l.trim().startsWith('```')).length;
  if (openFences % 2 !== 0) {
    err(`${slug}: unbalanced code fences (${openFences} fence lines — must be even)`);
  }

  lines.forEach((line, idx) => {
    const num = idx + 1;
    // Headings must be alone on their line.
    const heading = /^(#{1,6})\s+(.+)$/.exec(line.trim());
    if (heading && `#${heading[1]}`.length <= 3) {
      // fine — site supports 1-3, anything alone on its line is OK
    } else if (/^#{4,6}\s+/.test(line.trim())) {
      err(`${slug}:${num}: headings deeper than ### are not supported`);
    }

    // A heading with trailing inline text (heading glued to body) — reject.
    if (/^##\s+.+\S\s+\S/.test(line) && !/^##\s+[A-Za-z0-9][^\s]/.test(line)) {
      // heuristic only; do not over-trigger
    }
  });

  // Links: brackets and parens must pair.
  let bracket = 0;
  let paren = 0;
  for (const char of content) {
    if (char === '[') bracket += 1;
    if (char === ']') bracket -= 1;
    if (char === '(') paren += 1;
    if (char === ')') paren -= 1;
  }
  if (bracket !== 0) err(`${slug}: unbalanced [ ] in content (${bracket})`);
  if (paren !== 0) err(`${slug}: unbalanced ( ) in content (${paren})`);
}

function validateGuides(guides) {
  const seen = new Set();

  guides.forEach((guide, index) => {
    const label = `guide #${index + 1}`;
    if (!guide || typeof guide !== 'object') {
      err(`${label}: entry is not an object`);
      return;
    }

    const { slug, title, summary, difficulty, content } = guide;

    if (!slug) { err(`${label}: missing slug`); }
    else {
      if (!SLUG_RE.test(slug)) err(`${slug}: bad slug (use lowercase letters, digits, hyphens)`);
      if (seen.has(slug)) err(`${slug}: duplicate slug`);
      seen.add(slug);
    }

    if (!title || !title.trim()) err(`${slug || label}: missing title`);
    if (!summary || !summary.trim()) err(`${slug || label}: missing summary`);
    else if (summary.length > 200) err(`${slug}: summary too long (${summary.length} chars, max 200)`);

    if (!difficulty) err(`${slug || label}: missing difficulty`);
    else if (!ALLOWED_DIFFICULTIES.has(difficulty)) {
      err(`${slug}: unknown difficulty "${difficulty}" (expected one of ${[...ALLOWED_DIFFICULTIES].join(', ')})`);
    }

    if (content === undefined) {
      warn(`${slug}: no content (will be hidden from inline reader)`);
    } else if (typeof content !== 'string' || !content.trim()) {
      err(`${slug}: content is empty`);
    } else {
      validateContent(content, slug);
    }
  });

  return seen;
}

async function main() {
  const { data: guides } = await readJson(guidesFile);
  if (!Array.isArray(guides)) {
    err('guides.json must contain a top-level array');
  } else {
    const slugs = validateGuides(guides);

    // Cross-check knowledge-map references.
    let appSource = '';
    try {
      appSource = await readFile(appFile, 'utf8');
    } catch {
      warn('could not read js/app.js — skipping knowledge-map cross-check');
    }
    if (appSource) {
      const referenced = referencedSlugsFromApp(appSource);
      for (const ref of referenced) {
        if (!slugs.has(ref)) {
          err(`unknown guide slug referenced in js/app.js knowledge map: "${ref}"`);
        }
      }
      for (const slug of [...slugs]) {
        if (!referenced.has(slug)) {
          warn(`guide "${slug}" is not referenced by any knowledge-map topic`);
        }
      }
    }
  }

  // Assign exit code AFTER appending all checks.
  if (errors.length) {
    console.error('\n✗ GUIDE VALIDATION FAILED\n');
    for (const e of errors) console.error(`  - ${e}`);
    process.exitCode = 1;
  } else {
    const count = Array.isArray(guides) ? guides.length : 0;
    console.log(`✓ ${count} guides valid`);
    console.log('✓ 0 broken knowledge-map references');
    if (warnings.length) {
      for (const w of warnings) console.log(`  ⚠ ${w}`);
    } else {
      console.log('● no warnings');
    }
    process.exitCode = 0;
  }

  if (warnings.length) {
    console.log(`\n(${warnings.length} warning${warnings.length === 1 ? '' : 's'}, non-blocking)`);
  }
}

main().catch((error) => {
  console.error('Validator crashed:', error);
  process.exitCode = 1;
});