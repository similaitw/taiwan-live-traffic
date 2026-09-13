import type { Camera, CameraStatus } from '@/types/camera';

export const CAMERA_STATUS_STALE_AFTER_MS = 2 * 60 * 1000;

export interface CameraStatusObservation {
  status: CameraStatus;
  lastCheckedAt?: string;
  lastFrameAt?: string;
}

function toIso(at: number): string {
  return new Date(at).toISOString();
}

function timestamp(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function effectiveCameraStatus(
  observation: CameraStatusObservation,
  now = Date.now(),
): CameraStatus {
  if (observation.status !== 'online') return observation.status;

  const lastFrame = timestamp(observation.lastFrameAt);
  if (lastFrame === undefined) return 'online';
  return now - lastFrame >= CAMERA_STATUS_STALE_AFTER_MS ? 'stale' : 'online';
}

export function initialCameraStatusObservation(
  camera: Pick<Camera, 'status' | 'lastCheckedAt' | 'lastFrameAt'>,
  now = Date.now(),
): CameraStatusObservation {
  const observation: CameraStatusObservation = {
    status: camera.status ?? 'unknown',
    ...(camera.lastCheckedAt ? { lastCheckedAt: camera.lastCheckedAt } : {}),
    ...(camera.lastFrameAt ? { lastFrameAt: camera.lastFrameAt } : {}),
  };

  return {
    ...observation,
    status: effectiveCameraStatus(observation, now),
  };
}

export function observeSnapshotSuccess(
  previous: CameraStatusObservation,
  at = Date.now(),
): CameraStatusObservation {
  const observedAt = toIso(at);
  return {
    ...previous,
    status: 'online',
    lastCheckedAt: observedAt,
    lastFrameAt: observedAt,
  };
}

export function observeSnapshotFailure(
  previous: CameraStatusObservation,
  at = Date.now(),
): CameraStatusObservation {
  return {
    ...previous,
    status: previous.lastFrameAt ? 'stale' : 'offline',
    lastCheckedAt: toIso(at),
  };
}
