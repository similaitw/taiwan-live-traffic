import type { Camera } from '@/types/camera';

export type CameraSearchField =
  | 'name'
  | 'id'
  | 'road'
  | 'roadNumber'
  | 'county'
  | 'district'
  | 'mile'
  | 'direction'
  | 'tag';

export interface CameraSearchMatch {
  matched: boolean;
  matchedFields: CameraSearchField[];
  score: number;
}

interface SearchEntry {
  field: CameraSearchField;
  value: string;
}

export function normalizeCameraSearchText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/臺/g, '台')
    .replace(/\s+/g, ' ')
    .trim();
}

function compact(value: string): string {
  return value.replace(/[\s._/\\-]+/g, '');
}

function trimNumber(value: number, digits = 3): string {
  return value.toFixed(digits).replace(/\.?0+$/, '');
}

function parseMile(value: Camera['mile']): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : undefined;
  if (value === undefined || value === null) return undefined;

  const text = normalizeCameraSearchText(value);
  const stake = text.match(/(\d+(?:\.\d+)?)\s*k?\s*\+\s*(\d{1,3})/i);
  if (stake) return Number(stake[1]) + Number(stake[2]) / 1000;

  const decimal = text.match(/\d+(?:\.\d+)?/);
  if (!decimal) return undefined;
  const parsed = Number(decimal[0]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function mileAliases(value: Camera['mile']): string[] {
  const aliases = new Set<string>();
  if (value !== undefined && value !== null) {
    const raw = normalizeCameraSearchText(value);
    if (raw) aliases.add(raw);
  }

  const km = parseMile(value);
  if (km === undefined) return [...aliases];

  const roundedMeters = Math.round(km * 1000);
  const kilometer = Math.floor(roundedMeters / 1000);
  const meter = roundedMeters % 1000;
  const kmText = trimNumber(roundedMeters / 1000);

  aliases.add(kmText);
  aliases.add(`${kmText}k`);
  aliases.add(`${kilometer}k`);
  aliases.add(`${kilometer}+${String(meter).padStart(3, '0')}`);
  aliases.add(`${kilometer}k+${String(meter).padStart(3, '0')}`);

  return [...aliases];
}

function cameraEntries(camera: Camera): SearchEntry[] {
  const entries: SearchEntry[] = [];
  const add = (field: CameraSearchField, value: unknown) => {
    const normalized = normalizeCameraSearchText(value);
    if (normalized) entries.push({ field, value: normalized });
  };

  add('name', camera.name);
  add('id', camera.id);
  add('road', camera.road);
  add('roadNumber', camera.roadNumber);
  add('county', camera.county);
  add('district', camera.district);
  add('direction', camera.direction);
  for (const tag of camera.tags ?? []) add('tag', tag);
  for (const alias of mileAliases(camera.mile)) add('mile', alias);

  return entries;
}

function entryScore(entry: SearchEntry, token: string): number {
  const value = entry.value;
  const valueCompact = compact(value);
  const tokenCompact = compact(token);

  if (value === token || valueCompact === tokenCompact) return 100;
  if (value.startsWith(token) || valueCompact.startsWith(tokenCompact)) return 80;
  if (value.includes(token) || valueCompact.includes(tokenCompact)) return 60;
  return 0;
}

export function matchCameraSearch(camera: Camera, query: string): CameraSearchMatch {
  const normalizedQuery = normalizeCameraSearchText(query);
  if (!normalizedQuery) return { matched: true, matchedFields: [], score: 0 };

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  const entries = cameraEntries(camera);
  const matchedFields = new Set<CameraSearchField>();
  let score = 0;

  for (const token of tokens) {
    let bestScore = 0;
    let bestField: CameraSearchField | undefined;

    for (const entry of entries) {
      const candidateScore = entryScore(entry, token);
      if (candidateScore > bestScore) {
        bestScore = candidateScore;
        bestField = entry.field;
      }
    }

    if (bestScore === 0 || !bestField) {
      return { matched: false, matchedFields: [], score: 0 };
    }

    matchedFields.add(bestField);
    score += bestScore;
  }

  // Prefer an exact / prefix whole-query hit when suggestions are ranked later.
  for (const entry of entries) {
    const wholeScore = entryScore(entry, normalizedQuery);
    if (wholeScore >= 80) {
      score += wholeScore === 100 ? 40 : 20;
      matchedFields.add(entry.field);
      break;
    }
  }

  return { matched: true, matchedFields: [...matchedFields], score };
}

export function matchesCameraSearch(camera: Camera, query: string): boolean {
  return matchCameraSearch(camera, query).matched;
}

export function searchCameras(cameras: Camera[], query: string): Array<{ camera: Camera; match: CameraSearchMatch }> {
  const normalizedQuery = normalizeCameraSearchText(query);
  if (!normalizedQuery) {
    return cameras.map((camera) => ({ camera, match: { matched: true, matchedFields: [], score: 0 } }));
  }

  return cameras
    .map((camera) => ({ camera, match: matchCameraSearch(camera, normalizedQuery) }))
    .filter((result) => result.match.matched)
    .sort((a, b) => b.match.score - a.match.score || a.camera.name.localeCompare(b.camera.name, 'zh-Hant', { numeric: true }));
}
