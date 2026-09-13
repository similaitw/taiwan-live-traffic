import {
  effectiveCameraStatus,
  observeSnapshotFailure,
  observeSnapshotSuccess,
  type CameraStatusObservation,
} from '@/lib/camera-status';

type Listener = () => void;

const observations = new Map<string, CameraStatusObservation>();
const listeners = new Map<string, Set<Listener>>();

function publish(cameraId: string, next: CameraStatusObservation): CameraStatusObservation {
  observations.set(cameraId, next);
  for (const listener of listeners.get(cameraId) ?? []) listener();
  return next;
}

export function getRegisteredCameraStatus(cameraId: string): CameraStatusObservation | undefined {
  return observations.get(cameraId);
}

export function subscribeCameraStatus(cameraId: string, listener: Listener): () => void {
  const bucket = listeners.get(cameraId) ?? new Set<Listener>();
  bucket.add(listener);
  listeners.set(cameraId, bucket);

  return () => {
    bucket.delete(listener);
    if (bucket.size === 0) listeners.delete(cameraId);
  };
}

export function reportCameraSnapshotSuccess(
  cameraId: string,
  fallback: CameraStatusObservation,
  at = Date.now(),
): CameraStatusObservation {
  return publish(
    cameraId,
    observeSnapshotSuccess(observations.get(cameraId) ?? fallback, at),
  );
}

export function reportCameraSnapshotFailure(
  cameraId: string,
  fallback: CameraStatusObservation,
  at = Date.now(),
): CameraStatusObservation {
  return publish(
    cameraId,
    observeSnapshotFailure(observations.get(cameraId) ?? fallback, at),
  );
}

export function refreshCameraStatusFreshness(
  cameraId: string,
  fallback: CameraStatusObservation,
  now = Date.now(),
): CameraStatusObservation {
  const current = observations.get(cameraId) ?? fallback;
  const status = effectiveCameraStatus(current, now);
  if (status === current.status) return current;
  return publish(cameraId, { ...current, status });
}

export function clearCameraStatusRegistry(): void {
  observations.clear();
  for (const bucket of listeners.values()) {
    for (const listener of bucket) listener();
  }
}
