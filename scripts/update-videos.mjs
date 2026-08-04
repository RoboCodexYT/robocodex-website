#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, '..', 'data', 'videos.json');

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

function inferCategory(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (/(gyro|motor|mechanic|build|design|drivetrain|suspension|cad|servo|encoder|wheel)/i.test(text)) {
    return 'Robot Mechanics';
  }
  if (/(guide|tutorial|beginner|basics|intro|lesson|starter|setup)/i.test(text)) {
    return 'FTC Basics';
  }
  return 'Strategy';
}

function getFeedUrl() {
  const channelId = process.env.YOUTUBE_CHANNEL_ID?.trim() || 'UCh8_Svg38qlhjtEVjOb4-MQ';
  const username = process.env.YOUTUBE_USERNAME?.trim();
  const handle = process.env.YOUTUBE_HANDLE?.trim();

  if (channelId) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  }

  if (username) {
    return `https://www.youtube.com/feeds/videos.xml?user=${encodeURIComponent(username)}`;
  }

  if (handle) {
    return `https://www.youtube.com/feeds/videos.xml?handle=${encodeURIComponent(handle)}`;
  }

  return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
}

function extractEntries(feed) {
  const matches = [...feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
  return matches.map((match) => {
    const entry = match[1];
    const title = decodeEntities([...entry.matchAll(/<title>([\s\S]*?)<\/title>/g)][0]?.[1] || 'Untitled video');
    const videoId = [...entry.matchAll(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/g)][0]?.[1] || '';
    const published = [...entry.matchAll(/<published>([\s\S]*?)<\/published>/g)][0]?.[1] || '';
    const description = decodeEntities([...entry.matchAll(/<media:description>([\s\S]*?)<\/media:description>/g)][0]?.[1] || '');
    const date = published ? published.split('T')[0] : new Date().toISOString().split('T')[0];

    return {
      id: videoId,
      youtubeId: videoId,
      title,
      description,
      date,
      category: inferCategory(title, description),
      duration: 'Video',
      source: 'youtube',
    };
  }).filter((entry) => entry.youtubeId);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const feedUrl = getFeedUrl();

  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Unable to fetch YouTube feed (${response.status})`);
    }

    const feed = await response.text();
    const videos = extractEntries(feed);

    if (!videos.length) {
      throw new Error('No videos were found in the YouTube feed.');
    }

    const payload = {
      lastUpdated: new Date().toISOString(),
      source: 'youtube',
      videos,
    };

    if (dryRun) {
      console.log(`Dry run complete. Found ${videos.length} videos from ${feedUrl}`);
      return;
    }

    await writeFile(dataFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`Updated ${dataFile} with ${videos.length} videos from ${feedUrl}`);
  } catch (error) {
    const fallback = await readFile(dataFile, 'utf8').catch(() => null);
    if (fallback) {
      console.warn('YouTube sync failed; keeping the existing library data.', error.message);
      if (!dryRun) {
        process.exitCode = 0;
      }
      return;
    }

    console.error('Unable to refresh the video library.', error.message);
    process.exitCode = 1;
  }
}

main();
