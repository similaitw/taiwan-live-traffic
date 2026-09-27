import { directionMatches, normalizeTravelDirection, type TravelDirection } from '@/lib/directions';
import { getCameraRoadNumber, normalizeRoadNumber, sortRoadCameras } from '@/lib/roads';
import { getDistance } from '@/lib/geo';
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


const ROUTE_SAMPLE_LIMIT = 320;

function sampledRoutePoints(geometry: Array<[number, number]>): Array<{ lat: number; lng: number; order: number }> {
  if (geometry.length <= ROUTE_SAMPLE_LIMIT) return geometry.map(([lat, lng], order) => ({ lat, lng, order }));
  const result: Array<{ lat: number; lng: number; order: number }> = [];
  const step = (geometry.length - 1) / (ROUTE_SAMPLE_LIMIT - 1);
  for (let i = 0; i < ROUTE_SAMPLE_LIMIT; i += 1) {
    const order = Math.min(geometry.length - 1, Math.round(i * step));
    const point = geometry[order]!;
    result.push({ lat: point[0], lng: point[1], order });
  }
  return result;
}

export function buildRouteCameraSequence(
  cameras: Camera[],
  geometry: Array<[number, number]>,
  corridorMeters = 1500,
  label = '規畫路線',
): CameraSequenceSegment {
  if (geometry.length < 2) return { id: 'route:empty', roadNumber: label, cameras: [] };
  const samples = sampledRoutePoints(geometry);
  const matched = cameras
    .map((camera) => {
      let nearestDistance = Number.POSITIVE_INFINITY;
      let nearestOrder = 0;
      for (const sample of samples) {
        const distance = getDistance(camera.lat, camera.lng, sample.lat, sample.lng);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestOrder = sample.order;
        }
      }
      return { camera, nearestDistance, nearestOrder };
    })
    .filter((item) => item.nearestDistance <= corridorMeters)
    .sort((a, b) => a.nearestOrder - b.nearestOrder || a.nearestDistance - b.nearestDistance)
    .slice(0, 120)
    .map((item) => item.camera);

  return {
    id: `route:planned:${geometry.length}:${matched.length}`,
    roadNumber: label || '規畫路線',
    cameras: matched,
  };
}
