import 'dotenv/config';
import { connectDB, db } from '../src/db.js';
import mongoose from 'mongoose';
await connectDB();
const c = db().collection('working_set');
await c.createIndex({ seq: 1 });
let count = await c.countDocuments();
console.log(`Existing documents: ${count}`);
for (let start = count; start < 100000; start += 1000) {
  const docs = [];
  for (let i = start; i < Math.min(start + 1000, 100000); i++) docs.push({ seq: i, title: `Threat report ${i}`, payload: 'X'.repeat(1700), tags: ['lab7', 'working-set'], createdAt: new Date() });
  await c.insertMany(docs, { ordered: false });
  if ((start + docs.length) % 10000 === 0) console.log(`Inserted ${start + docs.length}/100000`);
}
console.log('Working-set seed complete.');
await mongoose.disconnect();
