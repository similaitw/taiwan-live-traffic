import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRouteCameraSequence } from '../lib/camera-sequence';
import type { Camera } from '../types/camera';

function camera(id: string, lat: number, lng: number): Camera {
  return { id, name: id, type: 'provincial', lat, lng, streamUrl: 'https://cctv.thb.gov.tw/test.jpg' };
}

test('planned route sequence keeps nearby cameras and orders them along travel', () => {
  const geometry: Array<[number, number]> = [[24.60,121.75],[24.75,121.75],[24.90,121.75],[25.05,121.75]];
  const sequence = buildRouteCameraSequence([
    camera('late',25.04,121.751),
    camera('far-away',24.80,121.90),
    camera('early',24.61,121.751),
    camera('middle',24.82,121.749),
  ], geometry, 2000, '羅東 → 台北');
  assert.equal(sequence.roadNumber, '羅東 → 台北');
  assert.deepEqual(sequence.cameras.map((item) => item.id), ['early','middle','late']);
});

test('planned route sequence returns empty for invalid geometry', () => {
  assert.equal(buildRouteCameraSequence([camera('a',24.6,121.7)], [[24.6,121.7]], 1500).cameras.length, 0);
});
