import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/db.js';
import { Threat, Source, Report } from '../src/models.js';
import { classifyThreat } from '../src/classifier.js';

await connectDB();
await Promise.all([Threat.deleteMany({}), Source.deleteMany({}), Report.deleteMany({})]);

const sources = await Source.insertMany([
  { name: 'Check Point Research', url: 'https://research.checkpoint.com/', status: 'active' },
  { name: 'We Live Security', url: 'https://www.welivesecurity.com/', status: 'active' },
  { name: 'Troy Hunt', url: 'https://www.troyhunt.com/', status: 'active' },
  { name: 'Dark Reading', url: 'https://www.darkreading.com/', status: 'active' },
  { name: 'Schneier on Security', url: 'https://www.schneier.com/', status: 'active' }
]);

const raw = [
  ['Shattering the Dream — Operation Dream Job', 'Since early 2026, researchers tracked a campaign targeting the defense sector using social engineering and malware.', 'threat-actors', 'high', 0, ['203.0.113.44', 'dreamjob.example'], ['T1566', 'T1059'], ['phishing', 'malware']],
  ['Breaking the Seal: JSCeal Bytecode', 'A stealer delivered as compiled V8 bytecode targets cryptocurrency applications and uses obfuscation.', 'malware', 'high', 0, ['jsc.example', '44d88612fea8a8f36de82e1278abb02f'], ['T1059', 'T1027'], ['stealer', 'obfuscation']],
  ['Thousands of WordPress Sites Hit by StopAndProtect', 'A ransomware operation compromises WordPress installations and uses extortion tactics.', 'ransomware', 'critical', 3, ['198.51.100.27', 'stopandprotect.example'], ['T1486', 'T1190'], ['ransomware', 'wordpress']],
  ['Gaming the System: SEO Weaponization', 'A Chinese-speaking actor used compromised Brazilian government sites as part of a sustained campaign.', 'threat-actors', 'medium', 0, ['gov.example', '198.51.100.8'], ['T1584', 'T1190'], ['campaign', 'compromised']],
  ['AI-Driven OSINT in the Wrong Hands', 'New fraud workflows make social engineering and victim research cheaper for attackers.', 'iot', 'medium', 1, ['osint.example'], ['T1593'], ['osint', 'fraud']],
  ['Weekly Breach and Data Integrity Update', 'Recent incidents include data exposure claims and verification challenges.', 'patches', 'low', 2, ['breach.example'], ['T1565'], ['breach', 'data-integrity']]
];

for (const row of raw) {
  const [title, summary, category, severity, sourceIndex, indicators, techniques, tags] = row;
  const source = sources[sourceIndex];
  const classification = classifyThreat(`${title} ${summary} ${tags.join(' ')}`);
  await Threat.create({
    title, summary, category, severity, status: severity === 'critical' ? 'active' : 'monitoring',
    publishedAt: new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000), sourceIds: [source._id],
    sourceName: source.name, articleUrl: source.url,
    indicators: indicators.map((value, i) => ({ type: value.includes('.') && value.split('.').length === 4 ? 'ip' : value.length >= 32 ? 'hash' : 'domain', value, confidence: 70 + i * 10 })),
    techniques, tags, classification
  });
  await Source.updateOne({ _id: source._id }, { $inc: { articleCount: 1 }, $set: { lastChecked: new Date() } });
}

await Report.insertMany(raw.map((r, i) => ({ title: r[0], sourceName: sources[r[4]].name, category: r[2], url: `${sources[r[4]].url}report-${i + 1}`, publishedAt: new Date(Date.now() - i * 86400000), summary: r[1] })));

console.log('Seed complete.');
await mongoose.disconnect();
