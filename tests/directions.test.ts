import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDirectionOptions,
  directionMatches,
  normalizeTravelDirection,
  travelDirectionLabel,
} from '../lib/directions';

test('normalizes Chinese and English direction aliases', () => {
  assert.equal(normalizeTravelDirection('北向'), 'north');
  assert.equal(normalizeTravelDirection('北上'), 'north');
  assert.equal(normalizeTravelDirection('往北'), 'north');
  assert.equal(normalizeTravelDirection('NB'), 'north');
  assert.equal(normalizeTravelDirection('northbound'), 'north');
  assert.equal(normalizeTravelDirection('南下'), 'south');
  assert.equal(normalizeTravelDirection('EB'), 'east');
  assert.equal(normalizeTravelDirection('westbound'), 'west');
});

test('returns undefined for unknown direction metadata', () => {
  assert.equal(normalizeTravelDirection(undefined), undefined);
  assert.equal(normalizeTravelDirection(''), undefined);
  assert.equal(normalizeTravelDirection('順行'), undefined);
});

test('direction matcher compares aliases in the same canonical direction', () => {
  assert.equal(directionMatches('north', '北上'), true);
  assert.equal(directionMatches('南向', 'SB'), true);
  assert.equal(directionMatches('north', '南下'), false);
});

test('direction matcher conservatively includes missing metadata by default', () => {
  assert.equal(directionMatches('north', undefined), true);
  assert.equal(directionMatches('north', undefined, false), false);
});

test('buildDirectionOptions groups aliases and returns stable cardinal order', () => {
  assert.deepEqual(
    buildDirectionOptions(['南下', 'NB', '北向', 'EB', '未知', undefined]),
    [
      { value: 'north', label: '北向', count: 2 },
      { value: 'south', label: '南向', count: 1 },
      { value: 'east', label: '東向', count: 1 },
    ],
  );
  assert.equal(travelDirectionLabel('west'), '西向');
});
