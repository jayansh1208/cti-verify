import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { connectDB } from '../src/db.js';
import { Report, Source } from '../src/models.js';
import mongoose from 'mongoose';

const URL = 'https://ctidigest.com/';
await connectDB();
const html = (await axios.get(URL, { timeout: 15000, headers: { 'User-Agent': 'CTI-Verify-Lab/1.0' } })).data;
const $ = cheerio.load(html);
const found = [];
$('a[href]').each((_i, el) => {
  const href = $(el).attr('href');
  const title = $(el).text().replace(/\s+/g, ' ').trim();
  if (href && title && title.length > 8 && /^https?:\/\//.test(href)) found.push({ title, url: href });
});
const unique = [...new Map(found.map(x => [x.url, x])).values()].slice(0, 100);
let added = 0;
for (const item of unique) {
  const exists = await Report.exists({ url: item.url });
  if (!exists) {
    await Report.create({ title: item.title, sourceName: 'CTI Digest', category: 'unclassified', url: item.url, publishedAt: new Date(), summary: 'Discovered by the CTI Digest watcher.' });
    added++;
  }
}
await Source.updateOne({ name: 'CTI Digest' }, { $set: { url: URL, status: 'active', lastChecked: new Date() }, $setOnInsert: { articleCount: 0 } }, { upsert: true });
console.log(`Scanned ${unique.length} links; added ${added} new reports.`);
await mongoose.disconnect();
