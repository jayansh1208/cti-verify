import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { connectDB } from '../src/db.js';
import { Report, Source } from '../src/models.js';
import mongoose from 'mongoose';

const SOURCE_URL = process.env.CTI_SOURCE_URL || 'https://ctidigest.com/';
const WATCH_INTERVAL_MS = Number(process.env.WATCH_INTERVAL_MS || 0);
const SOURCE_NAME = 'CTI Digest';

function isNavigationUrl(url) {
  if (!url) return true;
  if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('javascript:') || url.startsWith('tel:')) return true;
  try {
    const { pathname } = new URL(url);
    return /(?:^\/($|\?|#)|(?:\/tag\/|\/category\/|\/search\/|\/author\/|\/feed\/|\/rss|\/wp-admin|\/privacy|\/terms|\/login|\/register|\/contact|\/about|\/archive))(?:$|[/?#])/i.test(pathname);
  } catch {
    return true;
  }
}

function normalizeUrl(baseUrl, href) {
  try {
    const next = new URL(href, baseUrl);
    if (!['http:', 'https:'].includes(next.protocol)) return null;
    if (new URL(baseUrl).origin === next.origin && next.pathname === new URL(baseUrl).pathname && next.hash) return null;
    return next.href.replace(/\?.*$/, '');
  } catch {
    return null;
  }
}

function extractDate($, el) {
  const timeNode = $(el).find('time').first();
  const dateText = timeNode.attr('datetime') || timeNode.text() || $(el).attr('datetime') || $(el).attr('data-published') || $(el).attr('data-date');
  const metaValues = [
    $('meta[property="article:published_time"]').attr('content'),
    $('meta[name="pubdate"]').attr('content'),
    $('meta[name="date"]').attr('content'),
    $('meta[property="article:modified_time"]').attr('content')
  ].filter(Boolean);
  const candidate = [dateText, ...metaValues].find(Boolean);
  if (!candidate) return null;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isReportCandidate(url, text) {
  const normalizedUrl = url.toLowerCase();
  const normalizedText = text.toLowerCase();
  if (normalizedUrl.includes('/wp-content') || normalizedUrl.includes('/assets/')) return false;
  if (!/^(https?:)/.test(normalizedUrl)) return false;
  if (isNavigationUrl(normalizedUrl)) return false;
  const reportTerms = ['article', 'report', 'threat', 'brief', 'analysis', 'blog', 'intel', 'advisory', 'research', 'incident'];
  return reportTerms.some(term => normalizedUrl.includes(term) || normalizedText.includes(term));
}

async function runWatcher() {
  try {
    const response = await axios.get(SOURCE_URL, { timeout: 15000, headers: { 'User-Agent': 'CTI-Verify-Lab/1.0' } });
    const $ = cheerio.load(response.data);
    const found = new Map();

    $('a[href]').each((_i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (!href || !text || text.length < 8) return;
      const normalized = normalizeUrl(SOURCE_URL, href);
      if (!normalized || isNavigationUrl(normalized) || !isReportCandidate(normalized, text)) return;
      const publishedAt = extractDate($, $(el)) ?? extractDate($, $('article').first()) ?? new Date();
      if (!found.has(normalized)) {
        found.set(normalized, { title: text, url: normalized, publishedAt });
      }
    });

    const unique = [...found.values()].slice(0, 100);
    let added = 0;
    for (const item of unique) {
      const exists = await Report.exists({ url: item.url });
      if (!exists) {
        await Report.create({
          title: item.title,
          sourceName: SOURCE_NAME,
          category: 'unclassified',
          url: item.url,
          publishedAt: item.publishedAt,
          summary: 'Discovered by the CTI Digest watcher.'
        });
        added++;
      }
    }

    await Source.updateOne(
      { name: SOURCE_NAME },
      { $set: { url: SOURCE_URL, status: 'active', lastChecked: new Date() }, $setOnInsert: { articleCount: 0 } },
      { upsert: true }
    );

    console.log(`Scanned ${unique.length} candidate links from ${SOURCE_URL}; added ${added} new reports.`);
  } catch (error) {
    console.error(`Watcher failed for ${SOURCE_URL}: ${error.message}`);
    await Source.updateOne({ name: SOURCE_NAME }, { $set: { url: SOURCE_URL, status: 'error', lastChecked: new Date() } }, { upsert: true });
  }
}

await connectDB();
if (WATCH_INTERVAL_MS > 0) {
  console.log(`CTI watcher is running on a ${WATCH_INTERVAL_MS} ms schedule for ${SOURCE_URL}.`);
  await runWatcher();
  setInterval(runWatcher, WATCH_INTERVAL_MS);
} else {
  console.log(`CTI watcher is running once for ${SOURCE_URL}. Set WATCH_INTERVAL_MS to run on a schedule.`);
  await runWatcher();
}

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});
