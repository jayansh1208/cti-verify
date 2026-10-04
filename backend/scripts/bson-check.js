import 'dotenv/config';
import { connectDB, db } from '../src/db.js';
import mongoose from 'mongoose';
await connectDB();
const result = await db().collection('threats').aggregate([
  { $project: { size: { $bsonSize: '$$ROOT' } } },
  { $group: { _id: null, avg: { $avg: '$size' }, max: { $max: '$size' }, count: { $sum: 1 } } }
]).toArray();
const x = result[0] || { avg: 0, max: 0, count: 0 };
console.log(`Documents: ${x.count}`);
console.log(`Average BSON size: ${Math.round(x.avg)} bytes`);
console.log(`Maximum BSON size: ${x.max} bytes`);
console.log(`16 MB limit: ${16 * 1024 * 1024} bytes`);
console.log(`Maximum uses ${(x.max / (16 * 1024 * 1024) * 100).toFixed(4)}% of the limit`);
await mongoose.disconnect();
