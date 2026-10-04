import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB, db } from './db.js';
import { Threat, Source, Report } from './models.js';
import { classifyThreat } from './classifier.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || true }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  res.json({ ok: mongoose.connection.readyState === 1, database: mongoose.connection.name || null, time: new Date() });
});

app.get('/api/stats', async (_req, res) => {
  const [total, critical, high, sources, indicators] = await Promise.all([
    Threat.countDocuments(),
    Threat.countDocuments({ severity: 'critical' }),
    Threat.countDocuments({ severity: 'high' }),
    Source.countDocuments(),
    Threat.aggregate([{ $unwind: '$indicators' }, { $count: 'n' }])
  ]);
  res.json({ total, critical, high, sources, indicators: indicators[0]?.n || 0 });
});

app.get('/api/threats', async (req, res) => {
  const { q = '', severity, category, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (severity) filter.severity = severity;
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const [items, total] = await Promise.all([
    Threat.find(filter).populate('sourceIds', 'name url').sort({ publishedAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Threat.countDocuments(filter)
  ]);
  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

app.get('/api/threats/:id', async (req, res) => {
  const item = await Threat.findById(req.params.id).populate('sourceIds', 'name url status').lean();
  if (!item) return res.status(404).json({ error: 'Threat not found' });
  res.json(item);
});

app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);
  const results = await Threat.find({ $text: { $search: q } }).select('title summary category severity publishedAt sourceName').sort({ publishedAt: -1 }).limit(20).lean();
  res.json(results);
});

app.post('/api/classify', (req, res) => {
  const { title = '', description = '', tags = '' } = req.body;
  const result = classifyThreat(`${title} ${description} ${tags}`);
  res.json(result);
});

app.get('/api/sources', async (_req, res) => {
  res.json(await Source.find().sort({ articleCount: -1 }).lean());
});

app.get('/api/reports', async (_req, res) => {
  res.json(await Report.find().sort({ publishedAt: -1 }).limit(50).lean());
});

app.get('/api/lab/schema', (_req, res) => {
  res.json({
    reference: {
      threat: { sourceIds: 'ObjectId[] -> sources', indicators: 'embedded array', classification: 'embedded object' },
      source: { name: 'string', url: 'string', articleCount: 'number' }
    },
    embeddedAlternative: {
      threat: { source: '{ name, url, status, ... }', indicators: 'embedded array', classification: 'embedded object' },
      tradeoff: 'Reads become simpler for a complete threat, but repeated source data increases write/update cost and storage.'
    }
  });
});

app.get('/api/lab/bson-size', async (_req, res) => {
  const result = await db().collection('threats').aggregate([
    { $project: { bytes: { $bsonSize: '$$ROOT' } } },
    { $group: { _id: null, averageBytes: { $avg: '$bytes' }, maxBytes: { $max: '$bytes' }, minBytes: { $min: '$bytes' }, count: { $sum: 1 } } }
  ]).toArray();
  const x = result[0] || { averageBytes: 0, maxBytes: 0, minBytes: 0, count: 0 };
  res.json({ ...x, limitBytes: 16 * 1024 * 1024, percentOfLimit: x.maxBytes ? (x.maxBytes / (16 * 1024 * 1024)) * 100 : 0 });
});

app.get('/api/lab/cache', async (_req, res) => {
  try {
    const status = await db().admin().command({ serverStatus: 1 });
    const wt = status.wiredTiger || {};
    const cache = wt.cache || {};
    const bytesInCache = Number(cache['bytes currently in the cache'] || 0);
    const maxBytes = Number(cache['maximum bytes configured'] || 0);
    const pagesRead = Number(cache['pages read into cache'] || 0);
    const pagesRequested = Number(cache['pages requested from the cache'] || 0);
    res.json({
      bytesInCache,
      maxBytes,
      cacheUsedPercent: maxBytes ? (bytesInCache / maxBytes) * 100 : 0,
      pagesRead,
      pagesRequested,
      cacheHitRatio: pagesRequested ? ((pagesRequested - pagesRead) / pagesRequested) * 100 : 100,
      timestamp: new Date()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/lab/working-set/seed', async (_req, res) => {
  const collection = db().collection('working_set');
  const count = await collection.countDocuments();
  if (count >= 100000) return res.json({ inserted: 0, count, message: 'Working-set collection already has 100,000+ documents.' });
  const docs = [];
  for (let i = count; i < 100000; i++) {
    docs.push({ seq: i, title: `Threat report ${i}`, payload: 'X'.repeat(1700), tags: ['lab7', 'working-set'], createdAt: new Date() });
    if (docs.length === 1000) { await collection.insertMany(docs, { ordered: false }); docs.length = 0; }
  }
  if (docs.length) await collection.insertMany(docs, { ordered: false });
  res.json({ inserted: 100000 - count, count: await collection.countDocuments() });
});

app.get('/api/lab/working-set/random-read', async (_req, res) => {
  const collection = db().collection('working_set');
  const count = await collection.countDocuments();
  if (!count) return res.status(400).json({ error: 'Run the working-set seed first.' });
  const n = Math.floor(Math.random() * count);
  const doc = await collection.findOne({ seq: n });
  res.json({ seq: n, found: !!doc });
});

const PORT = Number(process.env.PORT || 5000);
connectDB().then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))).catch(err => { console.error(err); process.exit(1); });
