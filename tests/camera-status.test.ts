import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAMERA_STATUS_STALE_AFTER_MS,
  effectiveCameraStatus,
  initialCameraStatusObservation,
  observeSnapshotFailure,
  observeSnapshotSuccess,
} from '../lib/camera-status';

test('camera status starts unknown when the API has no observation', () => {
  assert.deepEqual(initialCameraStatusObservation({}), { status: 'unknown' });
});

test('snapshot success marks the camera online and records check/frame timestamps', () => {
  const observed = observeSnapshotSuccess({ status: 'unknown' }, 1_000);
  assert.equal(observed.status, 'online');
  assert.equal(observed.lastCheckedAt, new Date(1_000).toISOString());
  assert.equal(observed.lastFrameAt, new Date(1_000).toISOString());
});

test('snapshot failure with no previous frame is offline but remains a passive observation', () => {
  const observed = observeSnapshotFailure({ status: 'unknown' }, 2_000);
  assert.equal(observed.status, 'offline');
  assert.equal(observed.lastCheckedAt, new Date(2_000).toISOString());
  assert.equal(observed.lastFrameAt, undefined);
});

test('snapshot failure after a successful frame becomes stale and preserves last frame time', () => {
  const online = observeSnapshotSuccess({ status: 'unknown' }, 1_000);
  const stale = observeSnapshotFailure(online, 2_000);
  assert.equal(stale.status, 'stale');
  assert.equal(stale.lastFrameAt, new Date(1_000).toISOString());
  assert.equal(stale.lastCheckedAt, new Date(2_000).toISOString());
});

test('an online observation becomes stale after the freshness window', () => {
  const online = observeSnapshotSuccess({ status: 'unknown' }, 1_000);
  assert.equal(
    effectiveCameraStatus(online, 1_000 + CAMERA_STATUS_STALE_AFTER_MS - 1),
    'online',
  );
  assert.equal(
    effectiveCameraStatus(online, 1_000 + CAMERA_STATUS_STALE_AFTER_MS),
    'stale',
  );
});

test('initial API online status is downgraded when lastFrameAt is already old', () => {
  const lastFrameAt = new Date(1_000).toISOString();
  const observed = initialCameraStatusObservation(
    { status: 'online', lastFrameAt, lastCheckedAt: lastFrameAt },
    1_000 + CAMERA_STATUS_STALE_AFTER_MS,
  );
  assert.equal(observed.status, 'stale');
});
