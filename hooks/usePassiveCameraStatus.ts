'use client';

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { Camera } from '@/types/camera';
import {
  CAMERA_STATUS_STALE_AFTER_MS,
  initialCameraStatusObservation,
  type CameraStatusObservation,
} from '@/lib/camera-status';
import {
  getRegisteredCameraStatus,
  refreshCameraStatusFreshness,
  reportCameraSnapshotFailure,
  reportCameraSnapshotSuccess,
  subscribeCameraStatus,
} from '@/lib/camera-status-registry';

const UNKNOWN_OBSERVATION: CameraStatusObservation = { status: 'unknown' };

export function usePassiveCameraStatus(camera: Camera | null) {
  const cameraId = camera?.id ?? '';
  const fallback = useMemo(
    () => camera ? initialCameraStatusObservation(camera) : UNKNOWN_OBSERVATION,
    [camera?.id, camera?.lastCheckedAt, camera?.lastFrameAt, camera?.status],
  );

  const subscribe = useCallback(
    (listener: () => void) => cameraId ? subscribeCameraStatus(cameraId, listener) : () => {},
    [cameraId],
  );

  const getSnapshot = useCallback(
    () => cameraId ? getRegisteredCameraStatus(cameraId) ?? fallback : fallback,
    [cameraId, fallback],
  );

  const observation = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

  useEffect(() => {
    if (!cameraId || observation.status !== 'online' || !observation.lastFrameAt) return;

    const lastFrameTime = Date.parse(observation.lastFrameAt);
    if (!Number.isFinite(lastFrameTime)) return;

    const remaining = CAMERA_STATUS_STALE_AFTER_MS - (Date.now() - lastFrameTime);
    if (remaining <= 0) {
      refreshCameraStatusFreshness(cameraId, fallback);
      return;
    }

    const timer = window.setTimeout(() => {
      refreshCameraStatusFreshness(cameraId, fallback);
    }, remaining + 25);

    return () => window.clearTimeout(timer);
  }, [cameraId, fallback, observation.lastFrameAt, observation.status]);

  const markSnapshotSuccess = useCallback(() => {
    if (cameraId) reportCameraSnapshotSuccess(cameraId, fallback);
  }, [cameraId, fallback]);

  const markSnapshotFailure = useCallback(() => {
    if (cameraId) reportCameraSnapshotFailure(cameraId, fallback);
  }, [cameraId, fallback]);

  return {
    observation,
    markSnapshotSuccess,
    markSnapshotFailure,
  };
}
