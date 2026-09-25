import { directionMatches, normalizeTravelDirection, type TravelDirection } from '@/lib/directions';
import { getCameraRoadNumber, normalizeRoadNumber, sortRoadCameras } from '@/lib/roads';
import type { Camera } from '@/types/camera';

export interface CameraSequenceSegment {
  id: string;
  roadNumber: string;
  direction?: TravelDirection;
  cameras: Camera[];
}

export interface CameraSequence {
  id: string;
  segments: CameraSequenceSegment[];
  cameras: Camera[];
}

export interface CameraSequencePosition {
  camera?: Camera;
  previous?: Camera;
  next?: Camera;
  index: number;
  position: number;
  total: number;
}

export function buildRoadCameraSequence(
  cameras: Camera[],
  roadValue: string,
  directionValue?: string | null,
): CameraSequenceSegment {
  const roadNumber = normalizeRoadNumber(roadValue);
  if (!roadNumber) {
    return { id: 'road:unknown', roadNumber: roadValue, cameras: [] };
  }

  const direction = normalizeTravelDirection(directionValue);
  let ordered = sortRoadCameras(
    cameras.filter((camera) => (
      getCameraRoadNumber(camera) === roadNumber
      && (!direction || directionMatches(direction, camera.direction, false))
    )),
  );

  if (direction === 'north' || direction === 'west') {
    ordered = [...ordered].reverse();
  }

  return {
    id: `road:${roadNumber}:${direction ?? 'all'}`,
    roadNumber,
    direction,
    cameras: ordered,
  };
}

export function composeCameraSequence(segments: CameraSequenceSegment[]): CameraSequence {
  const cameras: Camera[] = [];
  const seen = new Set<string>();

  for (const segment of segments) {
    for (const camera of segment.cameras) {
      if (seen.has(camera.id)) continue;
      seen.add(camera.id);
      cameras.push(camera);
    }
  }

  return {
    id: segments.map((segment) => segment.id).join('|') || 'empty',
    segments,
    cameras,
  };
}

export function getCameraSequencePosition(
  sequence: CameraSequence | CameraSequenceSegment,
  cameraId?: string | null,
): CameraSequencePosition {
  const cameras = sequence.cameras;
  if (cameras.length === 0) return { index: -1, position: 0, total: 0 };

  const requestedIndex = cameraId ? cameras.findIndex((camera) => camera.id === cameraId) : -1;
  const index = requestedIndex >= 0 ? requestedIndex : 0;

  return {
    camera: cameras[index],
    previous: index > 0 ? cameras[index - 1] : undefined,
    next: index < cameras.length - 1 ? cameras[index + 1] : undefined,
    index,
    position: index + 1,
    total: cameras.length,
  };
}
