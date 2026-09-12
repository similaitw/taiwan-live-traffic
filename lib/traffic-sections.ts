import { getTdxAccessToken } from '@/lib/tdx-auth';
import type { TrafficSection, TrafficSectionPath } from '@/types/traffic-section';

const FREEWAY_SECTION_URL = 'https://tdx.transportdata.tw/api/basic/v2/Road/Traffic/Section/Freeway?$format=JSON';
const FREEWAY_SECTION_SHAPE_URL = 'https://tdx.transportdata.tw/api/basic/v2/Road/Traffic/SectionShape/Freeway?$format=JSON';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function asName(value: unknown): string | undefined {
  const direct = asString(value);
  if (direct) return direct;
  const record = asRecord(value);
  if (!record) return undefined;
  return asString(record.Name)
    ?? asString(record.LocationName)
    ?? asString(record.Text)
    ?? asString(record.Zh_tw)
    ?? asString(record.ZhTw);
}

function findArray(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;

  const root = asRecord(payload);
  if (!root) return [];

  for (const key of keys) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }

  for (const containerKey of ['SectionList', 'SectionShapeList', 'Data', 'data']) {
    const container = asRecord(root[containerKey]);
    if (!container) continue;
    for (const key of keys) {
      if (Array.isArray(container[key])) return container[key] as unknown[];
    }
  }

  return [];
}

function parseCoordinateSequence(value: string): TrafficSectionPath {
  return value
    .split(',')
    .map((pair) => pair.trim().split(/\s+/).map(Number))
    .filter((numbers) => numbers.length >= 2 && Number.isFinite(numbers[0]) && Number.isFinite(numbers[1]))
    .map(([lng, lat]) => [lat!, lng!] as [number, number]);
}

export function parseSectionGeometry(value: unknown): TrafficSectionPath[] {
  const record = asRecord(value);
  const raw = asString(value)
    ?? asString(record?.WKT)
    ?? asString(record?.Geometry)
    ?? asString(record?.Value);
  if (!raw) return [];

  const normalized = raw.trim();
  const lineMatch = normalized.match(/^LINESTRING\s*(?:Z\s*)?\((.+)\)$/i);
  if (lineMatch) {
    const path = parseCoordinateSequence(lineMatch[1]!);
    return path.length >= 2 ? [path] : [];
  }

  const multiMatch = normalized.match(/^MULTILINESTRING\s*(?:Z\s*)?\(\s*(.+)\s*\)$/i);
  if (!multiMatch) return [];

  const body = multiMatch[1]!;
  const groups: string[] = [];
  let depth = 0;
  let start = -1;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (char === '(') {
      if (depth === 0) start = index + 1;
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        groups.push(body.slice(start, index));
        start = -1;
      }
    }
  }

  return groups
    .map(parseCoordinateSequence)
    .filter((path) => path.length >= 2);
}

interface SectionMeta {
  sectionId: string;
  roadId?: string;
  roadName?: string;
  roadDirection?: string;
  sectionName?: string;
  start?: string;
  end?: string;
}

export function normalizeTdxSectionMetadata(payload: unknown): SectionMeta[] {
  return findArray(payload, ['Sections', 'Section'])
    .map((value): SectionMeta | null => {
      const record = asRecord(value);
      if (!record) return null;
      const sectionId = asString(record.SectionID);
      if (!sectionId) return null;

      return {
        sectionId,
        roadId: asString(record.RoadID),
        roadName: asName(record.RoadName),
        roadDirection: asString(record.RoadDirection),
        sectionName: asName(record.SectionName),
        start: asName(record.Start),
        end: asName(record.End),
      };
    })
    .filter((section): section is SectionMeta => section !== null);
}

interface SectionShape {
  sectionId: string;
  paths: TrafficSectionPath[];
}

export function normalizeTdxSectionShapes(payload: unknown): SectionShape[] {
  return findArray(payload, ['SectionShapes', 'SectionShape'])
    .map((value): SectionShape | null => {
      const record = asRecord(value);
      if (!record) return null;
      const sectionId = asString(record.SectionID);
      if (!sectionId) return null;

      const geometry = record.Geometry ?? record.Shape ?? record.WKT;
      return {
        sectionId,
        paths: parseSectionGeometry(geometry),
      };
    })
    .filter((shape): shape is SectionShape => shape !== null);
}

export function joinFreewaySections(metadataPayload: unknown, shapePayload: unknown): TrafficSection[] {
  const metadata = normalizeTdxSectionMetadata(metadataPayload);
  const shapes = normalizeTdxSectionShapes(shapePayload);
  const metaById = new Map(metadata.map((item) => [item.sectionId, item]));
  const shapeById = new Map(shapes.map((item) => [item.sectionId, item.paths]));
  const ids = new Set([...metaById.keys(), ...shapeById.keys()]);

  return [...ids].map((sectionId): TrafficSection => {
    const meta = metaById.get(sectionId);
    return {
      sectionId,
      roadId: meta?.roadId,
      roadName: meta?.roadName,
      roadDirection: meta?.roadDirection,
      sectionName: meta?.sectionName,
      start: meta?.start,
      end: meta?.end,
      paths: shapeById.get(sectionId) ?? [],
      source: 'tdx',
    };
  });
}

export interface FreewaySectionsResult {
  sections: TrafficSection[];
  warnings: string[];
}

async function fetchJson(url: string, accessToken: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function fetchTdxFreewaySections(): Promise<FreewaySectionsResult> {
  const accessToken = await getTdxAccessToken();
  const [metadataResult, shapeResult] = await Promise.allSettled([
    fetchJson(FREEWAY_SECTION_URL, accessToken),
    fetchJson(FREEWAY_SECTION_SHAPE_URL, accessToken),
  ]);

  if (metadataResult.status === 'rejected' && shapeResult.status === 'rejected') {
    throw new Error(`TDX section metadata and shape failed: ${String(metadataResult.reason)}; ${String(shapeResult.reason)}`);
  }

  const warnings: string[] = [];
  if (metadataResult.status === 'rejected') {
    warnings.push(`Section metadata unavailable: ${String(metadataResult.reason)}`);
  }
  if (shapeResult.status === 'rejected') {
    warnings.push(`Section shape unavailable: ${String(shapeResult.reason)}`);
  }

  return {
    sections: joinFreewaySections(
      metadataResult.status === 'fulfilled' ? metadataResult.value : [],
      shapeResult.status === 'fulfilled' ? shapeResult.value : [],
    ),
    warnings,
  };
}
