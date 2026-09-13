import assert from 'node:assert/strict';
import test from 'node:test';
import { CAMERA_STATUS_STALE_AFTER_MS, type CameraStatusObservation } from '../lib/camera-status';
import {
  clearCameraStatusRegistry,
  getRegisteredCameraStatus,
  refreshCameraStatusFreshness,
  reportCameraSnapshotFailure,
  reportCameraSnapshotSuccess,
  subscribeCameraStatus,
} from '../lib/camera-status-registry';

const fallback: CameraStatusObservation = { status: 'unknown' };

test('registry shares a successful snapshot observation by camera id', () => {
  clearCameraStatusRegistry();
  reportCameraSnapshotSuccess('camera-a', fallback, 1_000);

  const stored = getRegisteredCameraStatus('camera-a');
  assert.equal(stored?.status, 'online');
  assert.equal(stored?.lastFrameAt, new Date(1_000).toISOString());
  clearCameraStatusRegistry();
});

test('registry notifies subscribers when another surface reports a snapshot', () => {
  clearCameraStatusRegistry();
  let notifications = 0;
  const unsubscribe = subscribeCameraStatus('camera-a', () => {
    notifications += 1;
  });

  reportCameraSnapshotSuccess('camera-a', fallback, 1_000);
  reportCameraSnapshotFailure('camera-a', fallback, 2_000);

  assert.equal(notifications, 2);
  assert.equal(getRegisteredCameraStatus('camera-a')?.status, 'stale');
  unsubscribe();
  clearCameraStatusRegistry();
});

test('different camera ids keep independent passive observations', () => {
  clearCameraStatusRegistry();
  reportCameraSnapshotSuccess('camera-a', fallback, 1_000);
  reportCameraSnapshotFailure('camera-b', fallback, 1_000);

  assert.equal(getRegisteredCameraStatus('camera-a')?.status, 'online');
  assert.equal(getRegisteredCameraStatus('camera-b')?.status, 'offline');
  clearCameraStatusRegistry();
});

test('freshness refresh turns an old shared online frame stale', () => {
  clearCameraStatusRegistry();
  reportCameraSnapshotSuccess('camera-a', fallback, 1_000);
  refreshCameraStatusFreshness('camera-a', fallback, 1_000 + CAMERA_STATUS_STALE_AFTER_MS);

  assert.equal(getRegisteredCameraStatus('camera-a')?.status, 'stale');
  clearCameraStatusRegistry();
});
