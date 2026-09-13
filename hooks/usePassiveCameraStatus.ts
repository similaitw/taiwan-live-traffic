'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Camera } from '@/types/camera';
import {
  CAMERA_STATUS_STALE_AFTER_MS,
  effectiveCameraStatus,
  initialCameraStatusObservation,
  observeSnapshotFailure,
  observeSnapshotSuccess,
  type CameraStatusObservation,
} from '@/lib/camera-status';

export function usePassiveCameraStatus(camera: Camera) {
  const [observation, setObservation] = useState<CameraStatusObservation>(() =>
    initialCameraStatusObservation(camera),
  );

  useEffect(() => {
    setObservation(initialCameraStatusObservation(camera));
  }, [camera.id, camera.lastCheckedAt, camera.lastFrameAt, camera.status]);

  useEffect(() => {
    if (observation.status !== 'online' || !observation.lastFrameAt) return;

    const lastFrameTime = Date.parse(observation.lastFrameAt);
    if (!Number.isFinite(lastFrameTime)) return;

    const remaining = CAMERA_STATUS_STALE_AFTER_MS - (Date.now() - lastFrameTime);
    if (remaining <= 0) {
      setObservation((current) => ({
        ...current,
        status: effectiveCameraStatus(current),
      }));
      return;
    }

    const timer = window.setTimeout(() => {
      setObservation((current) => ({
        ...current,
        status: effectiveCameraStatus(current),
      }));
    }, remaining + 25);

    return () => window.clearTimeout(timer);
  }, [observation.lastFrameAt, observation.status]);

  const markSnapshotSuccess = useCallback(() => {
    setObservation((current) => observeSnapshotSuccess(current));
  }, []);

  const markSnapshotFailure = useCallback(() => {
    setObservation((current) => observeSnapshotFailure(current));
  }, []);

  return {
    observation,
    markSnapshotSuccess,
    markSnapshotFailure,
  };
}
