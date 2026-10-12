#!/usr/bin/env node
// pulls instagram carousel posts (only carousels, no single photos or reels) into
// data/instagram.json. instagram's image urls expire after a while, so every slide
// gets downloaded into images/instagram/<post id>/ and the site serves its own copy.
//
// needs IG_ACCESS_TOKEN: a long-lived token from the "Instagram API with Instagram
// Login" (professional/creator account). without it this script just skips.

import { mkdir, access } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { inferCategory, readJson, writeIfChanged } from './lib/feed-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dataFile = path.join(root, 'data', 'instagram.json');
const imageDir = path.join(root, 'images', 'instagram');
const token = process.env.IG_ACCESS_TOKEN?.trim();
const MAX_POSTS = 60;
const MAX_SLIDES = 20;

const FIELDS = 'id,caption,media_type,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}';

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    throw new Error(body.error?.message || `instagram returned ${res.status}`);
  }
  return body;
}

async function fetchCarousels() {
  const posts = [];
  let url = `https://graph.instagram.com/me/media?fields=${encodeURIComponent(FIELDS)}&limit=50&access_token=${token}`;
  let scanned = 0;
  while (url && posts.length < MAX_POSTS && scanned < 300) {
    const page = await getJson(url);
    for (const item of page.data || []) {
      scanned++;
      if (item.media_type === 'CAROUSEL_ALBUM') posts.push(item);
    }
    url = page.paging?.next;
  }
  return posts.slice(0, MAX_POSTS);
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function download(url, file) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok || !res.body) throw new Error(`image download failed (${res.status})`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
}

// caption → short title: first line, hashtags and mentions stripped
function titleFrom(caption) {
  const first = (caption || '').split('\n').map((l) => l.trim()).find(Boolean) || 'RoboCodex carousel';
  const clean = first.replace(/[#@]\S+/g, '').replace(/\s{2,}/g, ' ').trim() || 'RoboCodex carousel';
  return clean.length > 90 ? `${clean.slice(0, 87).trimEnd()}…` : clean;
}

async function savePost(post) {
  const dir = path.join(imageDir, post.id);
  await mkdir(dir, { recursive: true });
  const children = (post.children?.data || []).slice(0, MAX_SLIDES);
  const slides = [];
  for (const [i, child] of children.entries()) {
    // video slides only have a still via thumbnail_url
    const src = child.media_type === 'VIDEO' ? child.thumbnail_url : child.media_url;
    if (!src) continue;
    const file = path.join(dir, `${String(i + 1).padStart(2, '0')}.jpg`);
    if (!(await exists(file))) await download(src, file);
    slides.push({
      src: path.relative(root, file).split(path.sep).join('/'),
      video: child.media_type === 'VIDEO',
    });
  }
  const caption = post.caption || '';
  return {
    id: post.id,
    title: titleFrom(caption),
    caption,
    permalink: post.permalink,
    date: post.timestamp ? post.timestamp.split('T')[0] : null,
    publishedAt: post.timestamp || null,
    category: inferCategory(titleFrom(caption), caption),
    slides,
    source: 'instagram',
    format: 'carousel',
  };
}

async function main() {
  if (!token) {
    console.log('IG_ACCESS_TOKEN not set, skipping Instagram sync.');
    return;
  }

  const saved = await readJson(dataFile, { posts: [] });
  const byId = new Map((saved.posts || []).map((p) => [p.id, p]));

  let carousels;
  try {
    carousels = await fetchCarousels();
  } catch (error) {
    console.warn(`Instagram sync failed, keeping saved posts: ${error.message}`);
    return;
  }

  for (const post of carousels) {
    try {
      byId.set(post.id, await savePost(post));
    } catch (error) {
      console.warn(`Skipping post ${post.id}: ${error.message}`);
    }
  }

  const posts = [...byId.values()]
    .filter((p) => p.slides?.length)
    .sort((a, b) => new Date(b.publishedAt || b.date) - new Date(a.publishedAt || a.date));

  const changed = await writeIfChanged(dataFile, 'posts', posts, { source: 'instagram' });
  console.log(changed ? `Updated instagram.json: ${posts.length} carousels` : 'Instagram carousels already up to date.');
}

main();
