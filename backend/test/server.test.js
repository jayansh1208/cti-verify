import test from 'node:test';
import assert from 'node:assert/strict';

import { app } from '../src/server.js';
import { Report } from '../src/models.js';

test('server exports an Express app', () => {
  assert.ok(app);
  assert.equal(typeof app.get, 'function');
  assert.equal(typeof app.use, 'function');
});

test('report schema avoids reserved mongoose field names', () => {
  const paths = Object.keys(Report.schema.paths);
  assert.ok(paths.includes('isFresh'));
  assert.equal(paths.includes('isNew'), false);
});
