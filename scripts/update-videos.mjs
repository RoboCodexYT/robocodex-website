#!/usr/bin/env node
// pulls the latest youtube uploads (long videos + shorts) into data/videos.json.
// the public rss feed only lists the newest 15, so new items get merged into
// what's already saved instead of replacing it — the library keeps growing.

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { decodeEntities, inferCategory, readJson, writeIfChanged } from './lib/feed-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, '..', 'data', 'videos.json');
const channelId = process.env.YOUTUBE_CHANNEL_ID?.trim() || 'UCh8_Svg38qlhjtEVjOb4-MQ';
const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;

function pick(entry, pattern) {
  return entry.match(pattern)?.[1] ?? '';
}

function extractEntries(feed) {
  return [...feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, entry]) => {
    const youtubeId = pick(entry, /<yt:videoId>([\s\S]*?)<\/yt:videoId>/);
    const title = decodeEntities(pick(entry, /<title>([\s\S]*?)<\/title>/) || 'Untitled video');
    const description = decodeEntities(pick(entry, /<media:description>([\s\S]*?)<\/media:description>/));
    const published = pick(entry, /<published>([\s\S]*?)<\/published>/);
    const link = pick(entry, /<link rel="alternate" href="([^"]+)"/);
    const views = Number(pick(entry, /<media:statistics views="(\d+)"/)) || 0;
    return {
      id: youtubeId,
      youtubeId,
      title,
      description,
      date: published ? published.split('T')[0] : new Date().toISOString().split('T')[0],
      publishedAt: published || null,
      // the feed links shorts as /shorts/<id> and long videos as /watch?v=<id>
      format: link.includes('/shorts/') ? 'short' : 'video',
      views,
      category: inferCategory(title, description),
      source: 'youtube',
    };
  }).filter((video) => video.youtubeId);
}

// for older saved entries that predate the format field: /shorts/<id> answers 200
// for a short and redirects to /watch for a regular video
async function probeFormat(youtubeId) {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${youtubeId}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });
    res.body?.cancel();
    if (res.status === 200) return 'short';
    if ((res.headers.get('location') || '').includes('/watch')) return 'video';
  } catch {
    // network hiccup, leave it as unknown
  }
  return null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const saved = await readJson(dataFile, { videos: [] });
  const byId = new Map((saved.videos || []).map((v) => [v.id, v]));

  let fresh = [];
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`feed returned ${res.status}`);
    fresh = extractEntries(await res.text());
    if (!fresh.length) throw new Error('feed had no videos');
  } catch (error) {
    // keep the site working with whatever we already have
    console.warn(`YouTube sync failed, keeping the saved library: ${error.message}`);
    return;
  }

  for (const video of fresh) {
    const old = byId.get(video.id);
    // keep a hand-edited category if someone set one
    byId.set(video.id, { ...old, ...video, category: old?.categoryLocked ? old.category : video.category });
  }

  for (const video of byId.values()) {
    if (!video.categoryLocked) video.category = inferCategory(video.title, video.description || '');
    if (!video.format) video.format = (await probeFormat(video.youtubeId)) || 'video';
    delete video.duration;
    delete video.lastUpdated;
  }

  const videos = [...byId.values()].sort((a, b) =>
    new Date(b.publishedAt || b.date) - new Date(a.publishedAt || a.date));

  const counts = videos.reduce((acc, v) => ({ ...acc, [v.format]: (acc[v.format] || 0) + 1 }), {});
  if (dryRun) {
    console.log(`Dry run: ${videos.length} items (${counts.video || 0} videos, ${counts.short || 0} shorts)`);
    return;
  }

  const changed = await writeIfChanged(dataFile, 'videos', videos, { source: 'youtube' });
  console.log(changed
    ? `Updated videos.json: ${counts.video || 0} videos, ${counts.short || 0} shorts`
    : 'YouTube library already up to date.');
}

main();
