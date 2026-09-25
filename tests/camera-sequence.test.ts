import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRoadCameraSequence, composeCameraSequence, getCameraSequencePosition } from '../lib/camera-sequence';
import type { Camera } from '../types/camera';

function camera(id: string, mile: number, direction: string, roadNumber = '國5'): Camera {
  return { id, name: id, type: 'freeway', lat: 24, lng: 121, roadNumber, mile, direction, streamUrl: 'https://cctvs.freeway.gov.tw/live-view/mjpg/video.cgi?camera=test' };
}

test('southbound road sequence uses ascending mileage', () => {
  const sequence = buildRoadCameraSequence([camera('k20',20,'南向'), camera('k10',10,'南向'), camera('north',30,'北向')], '國道5號', 'south');
  assert.deepEqual(sequence.cameras.map((item) => item.id), ['k10','k20']);
});

test('northbound road sequence uses descending mileage', () => {
  const sequence = buildRoadCameraSequence([camera('k10',10,'北向'), camera('k30',30,'北向'), camera('k20',20,'北向')], '國5', 'north');
  assert.deepEqual(sequence.cameras.map((item) => item.id), ['k30','k20','k10']);
});

test('selected direction excludes unknown direction cameras', () => {
  const unknown = { ...camera('unknown',15,''), direction: undefined };
  const sequence = buildRoadCameraSequence([camera('north',20,'北上'), unknown], '國5', 'north');
  assert.deepEqual(sequence.cameras.map((item) => item.id), ['north']);
});

test('composes segments without duplicate cameras', () => {
  const a = buildRoadCameraSequence([camera('a',1,'南向')], '國5', 'south');
  const b = buildRoadCameraSequence([camera('b',2,'東向','台9'), camera('a',1,'東向','台9')], '台9', 'east');
  assert.deepEqual(composeCameraSequence([a,b]).cameras.map((item) => item.id), ['a','b']);
});

test('returns previous and next positions', () => {
  const sequence = buildRoadCameraSequence([camera('a',10,'南向'), camera('b',20,'南向'), camera('c',30,'南向')], '國5', 'south');
  const position = getCameraSequencePosition(sequence, 'b');
  assert.equal(position.position,2);
  assert.equal(position.previous?.id,'a');
  assert.equal(position.next?.id,'c');
});
