#!/usr/bin/env node
// one place for everything search engines and link previews see:
//  - rewrites the <head> SEO block on every page (title, description, canonical,
//    open graph / twitter cards, robots, structured data)
//  - builds a crawlable, written guide page for every Robot Doctor symptom in fix/
//  - writes sitemap.xml and robots.txt
// re-run with `npm run seo` after adding pages or editing js/doctor-data.js.

import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
globalThis.window = {};
require(path.join(root, 'js/doctor-data.js'));
const D = globalThis.window.DOCTOR;

const SITE = 'https://robocodexyt.github.io/robocodex-website/';
const YOUTUBE = 'https://www.youtube.com/@RoboCodex';
const TODAY = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// per-page metadata. noindex pages stay reachable but out of search results.
// ---------------------------------------------------------------------------
const PAGES = {
  'index.html': {
    path: '',
    title: 'RoboCodex — FTC Robotics Videos, Guides & Free Tools',
    description: 'Free FIRST Tech Challenge help: FTC robotics videos, practical guides, Robot Doctor troubleshooting, and calculators, a PID tuner, and a path visualizer.',
    priority: '1.0',
    schema: () => [
      { '@context': 'https://schema.org', '@type': 'WebSite', name: 'RoboCodex', url: SITE, description: 'FTC robotics videos, guides, and free tools.' },
      { '@context': 'https://schema.org', '@type': 'Organization', name: 'RoboCodex', url: SITE, logo: `${SITE}images/logo-512.png`, sameAs: [YOUTUBE] },
    ],
  },
  'doctor.html': {
    title: 'Robot Doctor: FTC Robot Troubleshooting Tool | RoboCodex',
    description: 'FTC robot drifting, disconnecting, or jittering? Describe the symptom, answer a few questions, and get the likely causes and fixes, sourced from FIRST, REV, and GM0.',
    image: 'images/og-doctor.png',
    priority: '0.9',
    schema: () => [{
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Robot Doctor',
      url: `${SITE}doctor.html`,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any (web browser)',
      description: 'An interactive troubleshooting tool for FIRST Tech Challenge robots.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'RoboCodex', url: SITE },
    }],
  },
  'content.html': {
    title: 'FTC Robotics Videos & Shorts | RoboCodex',
    description: 'Every RoboCodex FTC video, Short, and Instagram carousel in one searchable library: robot mechanics, programming, strategy, and interviews with top FTC builders.',
    priority: '0.8',
  },
  'guides.html': {
    title: 'FTC Guides: Encoders, PID, Autonomous & More | RoboCodex',
    description: 'Beginner-friendly FIRST Tech Challenge guides on the control system, motor encoders, PID tuning, autonomous programming, and CAD — with an interactive knowledge map.',
    priority: '0.8',
  },
  'calculators.html': {
    title: 'FTC Calculators: Gear Ratio, Drivetrain Speed & Encoders | RoboCodex',
    description: 'Free FTC engineering calculators: gear ratio and torque, drivetrain top speed, and encoder ticks for a target distance. Check the math before you build.',
    priority: '0.7',
    schema: (p) => [appSchema('FTC Engineering Calculators', p)],
  },
  'path-viz.html': {
    title: 'FTC Path Visualizer: Plan Autonomous Routes | RoboCodex',
    description: 'Plan an FTC autonomous route on a 12×12 field, paste your own points, and watch a robot run the path. Free and in your browser.',
    priority: '0.7',
    schema: (p) => [appSchema('FTC Path Visualizer', p)],
  },
  'tuner.html': {
    title: 'FTC PID Tuner: Simulate and Tune PIDF Gains | RoboCodex',
    description: 'Tune PIDF gains on a simulated FTC motor, see the response curve live, then copy a ready-to-paste PIDFCoefficients line into Android Studio.',
    priority: '0.7',
    schema: (p) => [appSchema('FTC PID Tuner', p)],
  },
  'resources.html': {
    title: 'Best FTC Resources: Docs, Libraries, CAD & Scouting | RoboCodex',
    description: 'A curated list of the FIRST Tech Challenge resources worth using: official FIRST docs, programming libraries, CAD parts, scouting sites, and channels.',
    priority: '0.7',
  },
  'about.html': {
    title: 'About RoboCodex — Free FTC Help from Jose Laurencio',
    description: 'RoboCodex is a free FTC learning resource built by Jose Laurencio: the videos, guides, and tools he wishes someone had handed him as a rookie.',
    priority: '0.5',
  },
  'contact.html': {
    title: 'Contact RoboCodex',
    description: 'Questions, ideas, or feedback about RoboCodex and its FTC resources? Get in touch.',
    priority: '0.3',
  },
  'bookmarks.html': { title: 'Bookmarks • RoboCodex', description: 'Your saved RoboCodex videos, guides, and resources.', noindex: true },
  'stats.html': { title: 'Team 24813 Stats • RoboCodex', description: 'Private team stats.', noindex: true },
  'course.html': { title: 'FTC Transition Course • RoboCodex', description: 'Coming soon.', noindex: true },
  '404.html': { title: 'Page not found • RoboCodex', description: 'This page does not exist.', noindex: true },
};

function appSchema(name, p) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url: p.url,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any (web browser)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function slugFor(symptom) {
  return `ftc-${symptom.title.toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function headBlock({ title, description, url, image = 'images/og-default.png', noindex, schema = [], type = 'website', prefix = '' }) {
  const lines = [
    '<!-- seo: generated by scripts/seo.mjs -->',
    `<meta name="description" content="${esc(description)}">`,
    noindex ? '<meta name="robots" content="noindex, follow">' : `<link rel="canonical" href="${url}">`,
    '<meta name="theme-color" content="#0B0B0C">',
    `<meta property="og:type" content="${type}">`,
    '<meta property="og:site_name" content="RoboCodex">',
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${SITE}${image}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${SITE}${image}">`,
    `<link rel="icon" type="image/png" href="${prefix}images/logo-96.png">`,
    ...schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`),
    '<!-- /seo -->',
  ];
  return lines.map((l) => `  ${l}`).join('\n');
}

// strip anything SEO-ish a page already has, so the generated block is the only copy
function cleanHead(html) {
  return html
    .replace(/\n?\s*<!-- seo: generated[\s\S]*?<!-- \/seo -->/g, '')
    .replace(/\n?\s*<!-- (Open Graph|Twitter)[^>]*-->/gi, '')
    .replace(/\n?\s*<meta (name|property)="(description|robots|theme-color|og:[^"]+|twitter:[^"]+)"[^>]*>/g, '')
    .replace(/\n?\s*<link rel="(canonical|icon)"[^>]*>/g, '');
}

function applyHead(html, meta) {
  let out = cleanHead(html);
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`);
  out = out.replace(/(<title>[\s\S]*?<\/title>)/, `$1\n${headBlock(meta)}`);
  // small logo in the header instead of the 1000px original
  out = out.replace(/<img src="(\.\.\/)?images\/logo\.png" alt="RoboCodex Logo" class="brand-logo">/g,
    (m, up = '') => `<img src="${up}images/logo-96.png" alt="RoboCodex" class="brand-logo" width="36" height="36">`);
  out = out.replace(/<link rel="apple-touch-icon" href="(\.\.\/)?images\/logo\.png">/g, (m, up = '') => `<link rel="apple-touch-icon" href="${up}images/logo-180.png">`);
  return out;
}

// ---------------------------------------------------------------------------
// robot doctor guide pages
// ---------------------------------------------------------------------------
function navHtml(prefix, active) {
  const link = (href, label) => `<a${active === href ? ' class="active"' : ''} href="${prefix}${href}">${label}</a>`;
  return `
  <header class="site-header">
    <div class="container navbar">
      <a class="brand" href="${prefix}index.html">
        <img src="${prefix}images/logo-96.png" alt="RoboCodex" class="brand-logo" width="36" height="36">
        <span>RoboCodex</span>
      </a>
      <nav class="nav-links" aria-label="Main navigation">
        ${link('index.html', 'Home')}
        ${link('content.html', 'Videos')}
        ${link('guides.html', 'Guides')}
        ${link('doctor.html', 'Robot Doctor')}
        ${link('resources.html', 'Resources')}
        ${link('about.html', 'About')}
      </nav>
      <div class="header-actions">
        <button id="theme-toggle" class="btn btn-ghost" type="button" aria-label="Switch color theme"><i class="fa-solid fa-moon"></i></button>
        <a class="btn btn-primary" href="${prefix}content.html">Explore Videos</a>
      </div>
    </div>
  </header>`;
}

function footerHtml(prefix) {
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-contact">
        <span class="footer-contact-label">Questions? Reach out:</span>
        <a class="footer-email" href="mailto:robocode98@gmail.com"><i class="fa-solid fa-envelope"></i> robocode98@gmail.com</a>
      </div>
      <p>© 2026 RoboCodex. An independent educational resource.</p>
      <div class="footer-links">
        <a href="${prefix}about.html">About</a>
        <a href="${prefix}guides.html">Guides</a>
        <a href="${prefix}doctor.html">Robot Doctor</a>
        <a href="${prefix}resources.html">Resources</a>
        <a href="${prefix}content.html">Videos</a>
        <a href="${YOUTUBE}" target="_blank" rel="noopener noreferrer">YouTube</a>
      </div>
    </div>
  </footer>`;
}

function guidePage(symptom) {
  const slug = slugFor(symptom);
  const url = `${SITE}fix/${slug}.html`;
  const causes = Object.entries(symptom.causes).sort((a, b) => b[1] - a[1]).map(([id]) => ({ id, ...D.causes[id] }));
  const area = D.areas[symptom.area];
  const n = causes.length;
  const title = `${symptom.title}: ${n} Causes & Fixes (FTC) | RoboCodex`;
  let description = `${symptom.sub} The ${n} most common causes and how to fix each one, sourced from FIRST, REV, and GM0 — plus a free interactive diagnosis.`;
  if (description.length > 158) description = `${description.slice(0, 155).replace(/\s+\S*$/, '')}…`;
  const related = D.symptoms.filter((s) => s.area === symptom.area && s.id !== symptom.id);
  const prefix = '../';

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: `${symptom.title}: causes and fixes`,
      description,
      url,
      image: `${SITE}images/og-doctor.png`,
      dateModified: TODAY,
      author: { '@type': 'Person', name: 'Jose Laurencio' },
      publisher: { '@type': 'Organization', name: 'RoboCodex', logo: { '@type': 'ImageObject', url: `${SITE}images/logo-512.png` } },
      about: 'FIRST Tech Challenge robot troubleshooting',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'RoboCodex', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Robot Doctor', item: `${SITE}doctor.html` },
        { '@type': 'ListItem', position: 3, name: symptom.title, item: url },
      ],
    },
  ];

  const head = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>try{if(localStorage.getItem('robocodex-theme')==='light')document.documentElement.classList.add('light')}catch(e){}</script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
${headBlock({ title, description, url, image: 'images/og-doctor.png', schema, type: 'article', prefix })}
  <link rel="apple-touch-icon" href="${prefix}images/logo-180.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap">
  <link rel="stylesheet" href="${prefix}css/modern.css">
  <link rel="stylesheet" href="${prefix}css/doctor.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>`;

  const body = `
<body class="doctor-page">
${navHtml(prefix, 'doctor.html')}

  <main class="section fix-page">
    <div class="container fix-layout">
      <article class="fix-article">
        <nav class="fix-crumbs" aria-label="Breadcrumb">
          <a href="${prefix}doctor.html">Robot Doctor</a>
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          <span>${esc(area.label)}</span>
        </nav>
        <h1>${esc(symptom.title)}</h1>
        <p class="fix-lede">${esc(symptom.sub)} Below are the ${n} most common causes on FTC robots, ordered from most to least likely, with how to check and fix each one.</p>

        <a class="fix-cta" href="${prefix}doctor.html#/s/${symptom.id}">
          <span class="fix-cta-icon"><i class="fa-solid fa-stethoscope"></i></span>
          <span><strong>Skip the guesswork — run the interactive diagnosis</strong><small>About ${Math.min(symptom.questions.length, 6)} quick questions narrow this list down to your robot's actual problem.</small></span>
          <i class="fa-solid fa-arrow-right"></i>
        </a>

        <section class="fix-checks">
          <h2>Quick checks first</h2>
          <ul>
            ${symptom.questions.map((qid) => {
              const q = D.questions[qid];
              return `<li><strong>${esc(q.text)}</strong> <span>${esc(q.help)}</span></li>`;
            }).join('\n            ')}
          </ul>
        </section>

        <section class="fix-causes">
          <h2>Common causes and how to fix them</h2>
          ${causes.map((c, i) => `
          <section class="fix-cause" id="${c.id}">
            <h3><span class="rx-rank">${i + 1}</span> ${esc(c.title)}</h3>
            <p>${esc(c.short)}</p>
            <h4>How to fix it <span class="rx-time"><i class="fa-regular fa-clock"></i> ${esc(c.time)}</span></h4>
            <ol>
              ${c.fix.map((step) => `<li>${esc(step)}</li>`).join('\n              ')}
            </ol>
            ${c.code ? `<div class="rx-code"><div class="rx-code-head"><span><i class="fa-solid fa-code"></i> ${esc(c.code.label)}</span></div><pre><code>${esc(c.code.snippet)}</code></pre></div>` : ''}
            <p class="fix-sources">Sources: ${c.sources.map((k) => `<a href="${D.sources[k][1]}" target="_blank" rel="noopener noreferrer">${esc(D.sources[k][0])}</a>`).join(' · ')}</p>
          </section>`).join('\n')}
        </section>
      </article>

      <aside class="fix-side">
        <div class="card fix-side-card">
          <h2>Related problems</h2>
          <ul>
            ${related.map((s) => `<li><a href="${slugFor(s)}.html">${esc(s.title)}</a></li>`).join('\n            ')}
          </ul>
          <a class="link-arrow" href="${prefix}doctor.html">All ${D.symptoms.length} symptoms <i class="fa-solid fa-arrow-right"></i></a>
        </div>
      </aside>
    </div>
  </main>
${footerHtml(prefix)}

  <script src="${prefix}js/site-ui.js" defer></script>
</body>
</html>
`;
  return { slug, html: head + body };
}

// list of every guide, baked into doctor.html so crawlers can follow the links
function libraryHtml() {
  const groups = Object.entries(D.areas).map(([id, a]) => {
    const items = D.symptoms.filter((s) => s.area === id);
    if (!items.length) return '';
    return `
        <div class="doc-library-group">
          <h3><i class="fa-solid ${a.icon}"></i> ${esc(a.label)}</h3>
          <ul>
            ${items.map((s) => `<li><a href="fix/${slugFor(s)}.html">${esc(s.title)}</a></li>`).join('\n            ')}
          </ul>
        </div>`;
  }).join('');
  return `<!-- doctor-library: generated by scripts/seo.mjs -->
      <section class="doc-library" aria-labelledby="doc-library-title">
        <span class="eyebrow">Written guides</span>
        <h2 id="doc-library-title">Every symptom, with causes and fixes</h2>
        <div class="doc-library-grid">${groups}
        </div>
      </section>
      <!-- /doctor-library -->`;
}

// ---------------------------------------------------------------------------
async function main() {
  // 1. page heads
  for (const file of (await readdir(root)).filter((f) => f.endsWith('.html'))) {
    const meta = PAGES[file] || (file.startsWith('match-') ? { title: null, description: 'Private match breakdown.', noindex: true } : null);
    if (!meta) {
      console.warn(`! no SEO entry for ${file}`);
      continue;
    }
    let html = await readFile(path.join(root, file), 'utf8');
    const url = `${SITE}${meta.path ?? file}`;
    const title = meta.title || html.match(/<title>([\s\S]*?)<\/title>/)[1];
    html = applyHead(html, { ...meta, title, url, schema: meta.schema ? meta.schema({ url }) : [] });
    if (file === 'doctor.html') {
      html = html.replace(/<!-- doctor-library[\s\S]*?<!-- \/doctor-library -->|<!-- doctor-library-slot -->/, libraryHtml());
    }
    await writeFile(path.join(root, file), html);
  }

  // 2. guide pages
  const fixDir = path.join(root, 'fix');
  await rm(fixDir, { recursive: true, force: true });
  await mkdir(fixDir, { recursive: true });
  const guides = D.symptoms.map(guidePage);
  for (const g of guides) await writeFile(path.join(fixDir, `${g.slug}.html`), g.html);

  // 3. sitemap + robots
  const urls = Object.entries(PAGES).filter(([, m]) => !m.noindex).map(([file, m]) => ({ loc: `${SITE}${m.path ?? file}`, priority: m.priority || '0.5' }));
  guides.forEach((g) => urls.push({ loc: `${SITE}fix/${g.slug}.html`, priority: '0.7' }));
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${TODAY}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
  await writeFile(path.join(root, 'sitemap.xml'), sitemap);
  await writeFile(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);

  console.log(`✓ updated ${Object.keys(PAGES).length}+ page heads, wrote ${guides.length} guide pages and ${urls.length} sitemap urls`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
