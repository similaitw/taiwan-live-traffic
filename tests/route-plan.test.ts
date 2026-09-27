import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeTrafficMode,
  parseRouteViaParam,
  serializeRouteViaParam,
} from '../lib/route-plan';

test('normalizes V3 traffic modes', () => {
  assert.equal(normalizeTrafficMode('route'), 'route');
  assert.equal(normalizeTrafficMode('road'), 'road');
  assert.equal(normalizeTrafficMode('nearby'), 'nearby');
  assert.equal(normalizeTrafficMode('other'), undefined);
});

test('parses and serializes route via points', () => {
  assert.deepEqual(parseRouteViaParam('礁溪|坪林||南港'), ['礁溪', '坪林', '南港']);
  assert.equal(serializeRouteViaParam(['礁溪', '', '坪林']), '礁溪|坪林');
});
