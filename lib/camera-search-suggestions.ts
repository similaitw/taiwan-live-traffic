import { searchCameras } from '@/lib/camera-search';
import { getCameraRoadNumber } from '@/lib/roads';
import type { Camera } from '@/types/camera';

export interface RoadSearchSuggestion {
  kind: 'road';
  roadNumber: string;
  count: number;
  score: number;
}

export interface AreaSearchSuggestion {
  kind: 'area';
  value: string;
  label: string;
  areaType: 'county' | 'district';
  count: number;
  score: number;
}

export interface CameraSearchSuggestion {
  kind: 'camera';
  camera: Camera;
  score: number;
}

export interface CameraSearchSuggestions {
  roads: RoadSearchSuggestion[];
  areas: AreaSearchSuggestion[];
  cameras: CameraSearchSuggestion[];
}

interface SuggestionLimits {
  roads?: number;
  areas?: number;
  cameras?: number;
}

export function buildCameraSearchSuggestions(
  cameras: Camera[],
  query: string,
  limits: SuggestionLimits = {},
): CameraSearchSuggestions {
  const trimmed = query.trim();
  if (!trimmed) return { roads: [], areas: [], cameras: [] };

  const results = searchCameras(cameras, trimmed);
  const roadLimit = limits.roads ?? 4;
  const areaLimit = limits.areas ?? 4;
  const cameraLimit = limits.cameras ?? 5;

  const roadCounts = new Map<string, number>();
  for (const camera of cameras) {
    const roadNumber = getCameraRoadNumber(camera);
    if (roadNumber) roadCounts.set(roadNumber, (roadCounts.get(roadNumber) ?? 0) + 1);
  }

  const roads = new Map<string, RoadSearchSuggestion>();
  const areas = new Map<string, AreaSearchSuggestion>();

  for (const result of results) {
    const fields = new Set(result.match.matchedFields);
    const roadNumber = getCameraRoadNumber(result.camera);
    const roadRelevant = fields.has('road') || fields.has('roadNumber') || fields.has('name') || fields.has('tag');
    if (roadNumber && roadRelevant) {
      const existing = roads.get(roadNumber);
      if (!existing || result.match.score > existing.score) {
        roads.set(roadNumber, {
          kind: 'road',
          roadNumber,
          count: roadCounts.get(roadNumber) ?? 1,
          score: result.match.score,
        });
      }
    }

    if (fields.has('county') && result.camera.county) {
      const value = result.camera.county;
      const key = `county:${value}`;
      const existing = areas.get(key);
      const count = cameras.filter((camera) => camera.county === value).length;
      if (!existing || result.match.score > existing.score) {
        areas.set(key, { kind: 'area', value, label: value, areaType: 'county', count, score: result.match.score });
      }
    }

    if (fields.has('district') && result.camera.district) {
      const district = result.camera.district;
      const county = result.camera.county;
      const value = [county, district].filter(Boolean).join(' ');
      const label = [county, district].filter(Boolean).join(' · ');
      const key = `district:${county ?? ''}:${district}`;
      const existing = areas.get(key);
      const count = cameras.filter((camera) => camera.district === district && (!county || camera.county === county)).length;
      if (!existing || result.match.score > existing.score) {
        areas.set(key, { kind: 'area', value, label, areaType: 'district', count, score: result.match.score });
      }
    }
  }

  return {
    roads: [...roads.values()]
      .sort((a, b) => b.score - a.score || a.roadNumber.localeCompare(b.roadNumber, 'zh-Hant', { numeric: true }))
      .slice(0, roadLimit),
    areas: [...areas.values()]
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'zh-Hant', { numeric: true }))
      .slice(0, areaLimit),
    cameras: results
      .slice(0, cameraLimit)
      .map(({ camera, match }) => ({ kind: 'camera' as const, camera, score: match.score })),
  };
}
