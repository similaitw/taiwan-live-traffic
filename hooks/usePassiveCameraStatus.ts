'use client';

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { Camera } from '@/types/camera';
import {
  CAMERA_STATUS_STALE_AFTER_MS,
  initialCameraStatusObservation,
} from '@/lib/camera-status';
import {
  getRegisteredCameraStatus,
  refreshCameraStatusFreshness,
  reportCameraSnapshotFailure,
  reportCameraSnapshotSuccess,
  subscribeCameraStatus,
} from '@/lib/camera-status-registry';

export function usePassiveCameraStatus(camera: Camera) {
  const fallback = useMemo(
    () => initialCameraStatusObservation(camera),
    [camera.id, camera.lastCheckedAt, camera.lastFrameAt, camera.status],
  );

  const subscribe = useCallback(
    (listener: () => void) => subscribeCameraStatus(camera.id, listener),
    [camera.id],
  );

  const getSnapshot = useCallback(
    () => getRegisteredCameraStatus(camera.id) ?? fallback,
    [camera.id, fallback],
  );

  const observation = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

  useEffect(() => {
    if (observation.status !== 'online' || !observation.lastFrameAt) return;

    const lastFrameTime = Date.parse(observation.lastFrameAt);
    if (!Number.isFinite(lastFrameTime)) return;

    const remaining = CAMERA_STATUS_STALE_AFTER_MS - (Date.now() - lastFrameTime);
    if (remaining <= 0) {
      refreshCameraStatusFreshness(camera.id, fallback);
      return;
    }

    const timer = window.setTimeout(() => {
      refreshCameraStatusFreshness(camera.id, fallback);
    }, remaining + 25);

    return () => window.clearTimeout(timer);
  }, [camera.id, fallback, observation.lastFrameAt, observation.status]);

  const markSnapshotSuccess = useCallback(() => {
    reportCameraSnapshotSuccess(camera.id, fallback);
  }, [camera.id, fallback]);

  const markSnapshotFailure = useCallback(() => {
    reportCameraSnapshotFailure(camera.id, fallback);
  }, [camera.id, fallback]);

  return {
    observation,
    markSnapshotSuccess,
    markSnapshotFailure,
  };
}
