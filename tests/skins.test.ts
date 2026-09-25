import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SKIN, isSkinId, SKINS } from '../lib/skins';

test('ships multiple skins with obsidian default', () => {
  assert.equal(DEFAULT_SKIN,'obsidian');
  assert.ok(SKINS.length >= 4);
  assert.equal(new Set(SKINS.map((skin) => skin.id)).size, SKINS.length);
});

test('validates persisted skin ids', () => {
  assert.equal(isSkinId('forest'),true);
  assert.equal(isSkinId('plum'),true);
  assert.equal(isSkinId('unknown'),false);
});
