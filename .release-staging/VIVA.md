# CTI Verify — Viva Script

## 60-second introduction

"Our project is CTI Verify, a MongoDB-powered Cyber Threat Intelligence platform. It stores threat reports, reusable intelligence sources, indicators and classification data. Lab 7.1 demonstrates embedding versus referencing and BSON document-size analysis. Lab 7.2 demonstrates a 100,000-document working set and WiredTiger cache behavior using serverStatus metrics."

## Lab 7.1

**Q: What is embedded?**
A: Indicators, techniques, tags and classification evidence. They are small and belong to a single threat.

**Q: What is referenced?**
A: Threats reference Source documents using ObjectId values.

**Q: Why not embed Source?**
A: One source can publish many reports. Referencing avoids duplication and makes source metadata easier to update.

**Q: What happens if Source is embedded?**
A: A complete threat read can be simpler, but updates to the source have to be propagated to every report containing that source copy.

**Q: What is `$bsonSize`?**
A: An aggregation expression that measures the BSON size of a document in bytes.

**Q: Why 16 MB?**
A: MongoDB has a 16 MB maximum BSON document size. Our analysis verifies that the stored threat documents are comfortably below that limit.

## Lab 7.2

**Q: What is the working set?**
A: The data and indexes that are actively used by the workload.

**Q: Why 100,000 × 2 KB?**
A: It creates an approximately 200 MB dataset, making cache-fit behavior easier to observe.

**Q: Which command provides WiredTiger metrics?**
A: `db.serverStatus()`.

**Q: What metrics did you use?**
A: Bytes currently in cache, maximum configured cache bytes, pages requested from cache, and pages read into cache. From requested/read values we derive an approximate cache-hit ratio.

**Q: Why random reads?**
A: Random reads spread access across the collection and make cache pressure visible compared with repeatedly reading a tiny hot subset.

## Schema trade-off answer

"Embedding optimizes locality and reduces application-side lookups, while referencing reduces duplication and is better for independently managed, high-cardinality or shared entities. The correct choice depends on access patterns, update frequency, cardinality and document-size constraints."
