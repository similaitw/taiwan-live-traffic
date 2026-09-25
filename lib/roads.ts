import type { Camera } from '@/types/camera';

export interface RoadGroup {
  roadNumber: string;
  count: number;
  cameras: Camera[];
}

export interface RoadNeighbors {
  roadNumber?: string;
  direction?: string;
  previous?: Camera;
  next?: Camera;
  position: number;
  total: number;
}

const ROAD_PATTERN = /(?:國|台|縣道|鄉道)\d+(?:甲|乙|丙|丁)?/;

export function getCameraRoadNumber(camera: Camera): string | undefined {
  if (camera.roadNumber) return normalizeRoadNumber(camera.roadNumber);
  return normalizeRoadNumber(camera.road) ?? normalizeRoadNumber(camera.name);
}

export function normalizeRoadNumber(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value
    .normalize('NFKC')
    .replace(/臺/g, '台')
    .replace(/國道\s*/g, '國')
    .replace(/(國|台|縣道|鄉道)\s*(\d+)(?:\s*號)?/g, '$1$2')
    .replace(/(\d)\s+([甲乙丙丁])/g, '$1$2');
  return normalized.match(ROAD_PATTERN)?.[0];
}

function roadSortKey(roadNumber: string): [number, number, number] {
  const prefix = roadNumber.startsWith('國')
    ? 0
    : roadNumber.startsWith('台')
      ? 1
      : roadNumber.startsWith('縣道')
        ? 2
        : 3;
  const number = Number(roadNumber.match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER);
  const branch = roadNumber.endsWith('甲') ? 1
    : roadNumber.endsWith('乙') ? 2
      : roadNumber.endsWith('丙') ? 3
        : roadNumber.endsWith('丁') ? 4
          : 0;
  return [prefix, number, branch];
}

export function cameraMileValue(camera: Camera): number {
  if (typeof camera.mile === 'number') {
    return Number.isFinite(camera.mile) ? camera.mile : Number.POSITIVE_INFINITY;
  }

  const text = camera.mile == null ? '' : String(camera.mile).trim();
  const stake = text.match(/(\d+)\s*[kK]?\s*\+\s*(\d{1,3})/);
  if (stake) return Number(stake[1]) + Number(stake[2]) / 1000;

  const decimal = text.match(/\d+(?:\.\d+)?/);
  return decimal ? Number(decimal[0]) : Number.POSITIVE_INFINITY;
}

export function sortRoadCameras(cameras: Camera[]): Camera[] {
  return [...cameras].sort((a, b) => {
    const mileDifference = cameraMileValue(a) - cameraMileValue(b);
    if (Number.isFinite(mileDifference) && mileDifference !== 0) return mileDifference;
    if (Number.isFinite(cameraMileValue(a)) !== Number.isFinite(cameraMileValue(b))) {
      return Number.isFinite(cameraMileValue(a)) ? -1 : 1;
    }
    return a.name.localeCompare(b.name, 'zh-Hant', { numeric: true }) || a.id.localeCompare(b.id);
  });
}

export function getRoadNeighbors(cameras: Camera[], camera: Camera): RoadNeighbors {
  const roadNumber = getCameraRoadNumber(camera);
  if (!roadNumber) return { position: 0, total: 0 };

  const sameRoad = cameras.filter((item) => getCameraRoadNumber(item) === roadNumber);
  const direction = camera.direction?.trim() || undefined;
  const sameDirection = direction
    ? sameRoad.filter((item) => item.direction?.trim() === direction)
    : [];
  const sequence = sortRoadCameras(sameDirection.length > 1 ? sameDirection : sameRoad);
  const index = sequence.findIndex((item) => item.id === camera.id);

  if (index < 0) {
    return { roadNumber, direction, position: 0, total: sequence.length };
  }

  return {
    roadNumber,
    direction,
    previous: index > 0 ? sequence[index - 1] : undefined,
    next: index < sequence.length - 1 ? sequence[index + 1] : undefined,
    position: index + 1,
    total: sequence.length,
  };
}

export function groupCamerasByRoad(cameras: Camera[]): RoadGroup[] {
  const groups = new Map<string, Camera[]>();

  for (const camera of cameras) {
    const roadNumber = getCameraRoadNumber(camera);
    if (!roadNumber) continue;
    const group = groups.get(roadNumber);
    if (group) group.push(camera);
    else groups.set(roadNumber, [camera]);
  }

  return [...groups.entries()]
    .map(([roadNumber, roadCameras]) => ({
      roadNumber,
      count: roadCameras.length,
      cameras: roadCameras,
    }))
    .sort((a, b) => {
      const aKey = roadSortKey(a.roadNumber);
      const bKey = roadSortKey(b.roadNumber);
      return aKey[0] - bKey[0] || aKey[1] - bKey[1] || aKey[2] - bKey[2];
    });
}
