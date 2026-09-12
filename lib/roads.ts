import type { Camera } from '@/types/camera';

export interface RoadGroup {
  roadNumber: string;
  count: number;
  cameras: Camera[];
}

const ROAD_PATTERN = /(?:國|台|縣道|鄉道)\d+(?:甲|乙|丙|丁)?/;

export function getCameraRoadNumber(camera: Camera): string | undefined {
  if (camera.roadNumber) return normalizeRoadNumber(camera.roadNumber);
  return normalizeRoadNumber(camera.road) ?? normalizeRoadNumber(camera.name);
}

function normalizeRoadNumber(value?: string): string | undefined {
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
