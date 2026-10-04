import mongoose from 'mongoose';

const indicatorSchema = new mongoose.Schema({
  type: { type: String, enum: ['ip', 'domain', 'url', 'hash', 'email'], required: true },
  value: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 100, default: 50 }
}, { _id: false });

const threatSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  summary: String,
  category: { type: String, index: true },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], index: true },
  status: { type: String, enum: ['active', 'monitoring', 'resolved'], default: 'active' },
  publishedAt: { type: Date, index: true },
  sourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Source' }],
  indicators: [indicatorSchema],
  techniques: [String],
  tags: [String],
  classification: {
    label: String,
    score: Number,
    reasons: [String]
  },
  articleUrl: String,
  sourceName: String
}, { timestamps: true });

threatSchema.index({ title: 'text', summary: 'text', tags: 'text', category: 'text' });
threatSchema.index({ severity: 1, publishedAt: -1 });

const sourceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  url: String,
  status: { type: String, enum: ['active', 'slow', 'error'], default: 'active' },
  lastChecked: Date,
  articleCount: { type: Number, default: 0 }
}, { timestamps: true });

const reportSchema = new mongoose.Schema({
  title: String,
  sourceName: String,
  category: String,
  url: { type: String, unique: true, sparse: true },
  publishedAt: Date,
  summary: String,
  isNew: { type: Boolean, default: true }
}, { timestamps: true });

export const Threat = mongoose.model('Threat', threatSchema);
export const Source = mongoose.model('Source', sourceSchema);
export const Report = mongoose.model('Report', reportSchema);
