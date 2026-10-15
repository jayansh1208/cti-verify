# CTI Verify — Cyber Threat Intelligence Platform

A full-stack MongoDB project for **Chapter 7 — Lab 7.1: Analyze a Production Schema** and **Lab 7.2: Working Set Analysis**.

## What this final project demonstrates

- Cyber Threat Intelligence dashboard
- Searchable threat intelligence feed
- Threat detail/investigation view
- Deterministic threat classification with confidence score
- Embedded indicators and classification evidence
- Referenced intelligence sources
- Schema Lab explaining embedding vs referencing
- `$bsonSize` average/min/max document analysis
- 16 MB MongoDB document-limit verification
- 100,000-document working-set generator (~2 KB/document)
- WiredTiger cache metrics via `db.serverStatus()`
- Random-read experiment and 10-second cache monitor
- New-report watcher for CTI Digest / configurable source URL
- MongoDB text and compound indexes
- Docker Compose MongoDB setup
- Viva/submission notes and command checklist

## Architecture

```text
React + Vite
    |
    | REST API
    v
Node.js + Express + Mongoose
    |
    v
MongoDB / WiredTiger

Collections:
  threats       -> threat-specific data + sourceIds references
  sources       -> reusable publisher/source documents
  reports       -> discovered report feed
  working_set   -> Lab 7.2 synthetic workload
```

## 1. Start MongoDB

### Option A — Docker (recommended)

```bash
docker compose up -d
```

### Option B — Local MongoDB

Make sure MongoDB is running on:

```text
mongodb://127.0.0.1:27017
```

## 2. Start backend

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

Linux/macOS:

```bash
cp .env.example .env
```

Set the backend environment variables for your deployment:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/cti_verify
CLIENT_URL=https://your-github-username.github.io
CTI_SOURCE_URL=https://ctidigest.com/
```

Backend:

```text
http://localhost:5000
```

## 3. Production deployment (GitHub Pages + hosted backend)

This project is static on GitHub Pages, so the Express API must run from a server that is reachable from the internet. A common setup is:

- Backend on Render or Railway with a MongoDB Atlas connection string
- Frontend published to GitHub Pages
- `VITE_API_URL` configured to the deployed backend URL, for example `https://cti-verify-api.onrender.com/api`
- `CLIENT_URL` configured to your GitHub Pages origin, for example `https://your-github-user.github.io`

```bash
# frontend/.env
VITE_API_URL=https://cti-verify-api.onrender.com/api

# backend/.env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cti_verify
CLIENT_URL=https://your-github-user.github.io
```

Rebuild the frontend after changing `VITE_API_URL`:

```bash
cd frontend
npm run build
```

## 4. Start frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## 5. Lab 7.1 commands

### Seed realistic CTI data

```bash
cd backend
npm run seed
```

### Check BSON sizes

```bash
npm run bson:check
```

The script uses MongoDB's `$bsonSize` and reports average, minimum and maximum document size against the 16 MB limit.

## 6. Lab 7.2 commands

### Insert 100,000 approximately 2 KB documents

```bash
npm run working-set:seed
```

### Run random reads and inspect WiredTiger cache

```bash
npm run cache:monitor
```

The monitor samples every 10 seconds, logs cache utilization and page-read deltas separately, and prints an approximate cache-hit ratio based on the difference between consecutive WiredTiger counters. This prevents the cumulative totals from misleading the experiment.

### Test one random read from the API

```text
GET http://localhost:5000/api/lab/working-set/random-read
```

## 7. New threat report watcher

```bash
npm run cti:watch
```

By default, the watcher runs once and exits. Set `WATCH_INTERVAL_MS` to a value such as `600000` to run on a polling schedule instead. It reads the configured `CTI_SOURCE_URL`, filters out navigation and unrelated links, extracts actual publication dates when available, deduplicates report URLs, and creates new `Report` records only if they are not already stored. It is a best-effort scraper for a feed-like source rather than a fully reliable threat-report ingestion pipeline.

Use external sources responsibly and follow their terms and robots rules.

## Lab 7.1 explanation

### Embedded

The following belong naturally inside a threat document:

- indicators/IOCs
- classification result
- classification reasons
- threat techniques
- tags

They are small, threat-specific, and commonly read with the parent threat.

### Referenced

`Threat.sourceIds[]` references `Source` documents.

A source is referenced because one publisher can produce many threat reports. Duplicating the same publisher metadata in every report would increase storage and make publisher updates more expensive.

### Embedded alternative for the activity

Instead of:

```js
sourceIds: [ObjectId("...")]
```

a threat could contain:

```js
source: {
  name: "Check Point Research",
  url: "https://research.checkpoint.com/",
  status: "active"
}
```

This can make a complete threat read simpler/faster, but source changes become harder because the duplicated source object must be updated across many threats.

## Lab 7.2 explanation

The working set is approximately:

```text
100,000 documents × ~2 KB ≈ ~200 MB
```

The experiment demonstrates that when the active working set is larger than the effective cache available to the workload, random reads cause more storage/page activity and cache behavior becomes less favorable. Exact results depend on the MongoDB/WiredTiger configuration and host resources.

## Important viva questions

### Why MongoDB for CTI?

Threat reports often have varying fields, nested indicators, tags and classification evidence. MongoDB documents model this naturally while still supporting indexes and aggregation.

### Why embed indicators?

They are tightly coupled to the threat and usually retrieved with it. Embedding avoids an extra lookup.

### Why reference sources?

A source can be shared by many reports. Referencing avoids duplication and keeps publisher metadata centralized.

### What does `$bsonSize` do?

It returns the BSON size in bytes of a document. The lab uses it to measure document sizes and verify they are far below MongoDB's 16 MB document limit.

### What is the working set?

The data and indexes that are actively accessed by the workload. If the working set fits comfortably in memory/cache, random reads generally have better cache behavior.

### What is WiredTiger?

WiredTiger is MongoDB's storage engine. Its cache holds frequently used data/pages in memory to reduce disk access.

### Why indexes?

Indexes make common filters/searches faster by avoiding a full collection scan for supported queries. The project uses text search plus severity/published-date and category indexes.

## Submission checklist

- [ ] Run `docker compose up -d`
- [ ] Run `backend/npm install`
- [ ] Create `.env`
- [ ] Run `npm run seed`
- [ ] Start backend
- [ ] Start frontend
- [ ] Verify search works
- [ ] Open a threat detail
- [ ] Demonstrate Schema Lab
- [ ] Run `npm run bson:check`
- [ ] Run `npm run working-set:seed`
- [ ] Run `npm run cache:monitor`
- [ ] Take screenshots of the dashboard, schema lab and working-set metrics
- [ ] Remove `.env` and `node_modules` before submission
- [ ] ZIP `frontend/`, `backend/`, `docker-compose.yml`, `README.md`, and documentation
- [ ] Ensure the final ZIP excludes `.git/`, `node_modules/`, local `.env` files, and build caches while preserving `package-lock.json` and `.env.example` files
- [ ] Include an evidence file or manifest inside the ZIP showing which files were kept and why
