import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGoogleMapsDirectionsUrl,
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

test('builds a Google Maps directions URL without an API key', () => {
  const result = buildGoogleMapsDirectionsUrl({
    from: '羅東',
    to: '台北',
    via: ['礁溪', '坪林'],
  });
  assert.ok(result);
  const url = new URL(result!);
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.pathname, '/maps/dir/');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('origin'), '羅東');
  assert.equal(url.searchParams.get('destination'), '台北');
  assert.equal(url.searchParams.get('waypoints'), '礁溪|坪林');
  assert.equal(url.searchParams.has('key'), false);
});

test('does not build an incomplete Google Maps route', () => {
  assert.equal(buildGoogleMapsDirectionsUrl({ from: '羅東', to: '', via: [] }), null);
});
