import 'dotenv/config';
import { connectDB, db } from '../src/db.js';
await connectDB();
const c = db().collection('working_set');
const count = await c.countDocuments();
if (!count) { console.log('No working-set documents. Run npm run working-set:seed first.'); process.exit(1); }
console.log('Monitoring WiredTiger cache. Press Ctrl+C to stop.');
setInterval(async () => {
  const s = await db().admin().command({ serverStatus: 1 });
  const cache = s.wiredTiger?.cache || {};
  const bytes = Number(cache['bytes currently in the cache'] || 0);
  const max = Number(cache['maximum bytes configured'] || 0);
  const read = Number(cache['pages read into cache'] || 0);
  const requested = Number(cache['pages requested from the cache'] || 0);
  const hit = requested ? ((requested - read) / requested) * 100 : 100;
  const seq = Math.floor(Math.random() * count);
  await c.findOne({ seq });
  console.log(new Date().toLocaleTimeString(), `cache=${hit.toFixed(2)}%`, `used=${max ? (bytes / max * 100).toFixed(2) : 'n/a'}%`, `randomRead=${seq}`);
}, 10000);
