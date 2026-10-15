import 'dotenv/config';
import { connectDB, db } from '../src/db.js';

await connectDB();
const c = db().collection('working_set');
const count = await c.countDocuments();
if (!count) { console.log('No working-set documents. Run npm run working-set:seed first.'); process.exit(1); }

let previous = null;
console.log('Monitoring WiredTiger cache. Press Ctrl+C to stop. The hit ratio is calculated from successive deltas and is therefore approximate.');

setInterval(async () => {
  const s = await db().admin().command({ serverStatus: 1 });
  const cache = s.wiredTiger?.cache || {};
  const bytes = Number(cache['bytes currently in the cache'] || 0);
  const max = Number(cache['maximum bytes configured'] || 0);
  const read = Number(cache['pages read into cache'] || 0);
  const requested = Number(cache['pages requested from the cache'] || 0);
  const readDelta = previous ? Math.max(0, read - previous.read) : 0;
  const requestedDelta = previous ? Math.max(0, requested - previous.requested) : 0;
  const hit = requestedDelta > 0 ? ((requestedDelta - readDelta) / requestedDelta) * 100 : 0;
  previous = { read, requested };

  const seq = Math.floor(Math.random() * count);
  await c.findOne({ seq });
  console.log(
    new Date().toLocaleTimeString(),
    `cache utilization=${max ? (bytes / max * 100).toFixed(2) : 'n/a'}%`,
    `approximate cache-hit ratio=${hit.toFixed(2)}%`,
    `pages read delta=${readDelta}`,
    `pages requested delta=${requestedDelta}`,
    `randomRead=${seq}`
  );
}, 10000);
