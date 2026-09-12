import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDateRange } from './date-utils';

test('resolveDateRange - custom dates', () => {
  const filter = resolveDateRange({ startDate: '2023-01-01', endDate: '2023-01-31' });
  assert.equal(filter.gte?.toISOString().startsWith('2023-01-01'), true);
  assert.equal(filter.lte?.toISOString().startsWith('2023-01-31'), true);
});

test('resolveDateRange - all time', () => {
  const filter = resolveDateRange({ preset: 'all' });
  assert.equal(filter.gte, undefined);
  assert.equal(filter.lte, undefined);
});
