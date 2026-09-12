import { getTdxAccessToken } from '@/lib/tdx-auth';
import type { CmsDevice } from '@/types/cms';

const FREEWAY_CMS_URL = 'https://tdx.transportdata.tw/api/basic/v2/Road/Traffic/CMS/Freeway?$format=JSON';
const FREEWAY_CMS_LIVE_URL = 'https://tdx.transportdata.tw/api/basic/v2/Road/Traffic/Live/CMS/Freeway?$format=JSON';

type UnknownRecord = Record<string, unknown>;

export interface CmsStaticRecord {
  id: string;
  cmsId?: string;
  cmsUid?: string;
  lat?: number;
  lng?: number;
  linkId?: string;
  roadId?: string;
  roadName?: string;
  roadDirection?: string;
  locationType?: number;
}

export interface CmsLiveRecord {
  id: string;
  cmsId?: string;
  cmsUid?: string;
  messageStatus?: number;
  messages: string[];
  status?: number;
  dataCollectTime?: string;
}

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

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function findArray(payload: unknown, keys: string[], containers: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  if (!root) return [];

  for (const key of keys) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }

  for (const containerKey of containers) {
    const container = asRecord(root[containerKey]);
    if (!container) continue;
    for (const key of keys) {
      if (Array.isArray(container[key])) return container[key] as unknown[];
    }
  }

  return [];
}

function normalizeId(record: UnknownRecord): { id: string; cmsId?: string; cmsUid?: string } | null {
  const cmsUid = asString(record.CMSUID);
  const cmsId = asString(record.CMSID);
  const id = cmsUid ?? cmsId;
  return id ? { id, cmsId, cmsUid } : null;
}

function extractMessageTexts(value: unknown): string[] {
  const result: string[] = [];

  const add = (candidate: unknown) => {
    const text = asString(candidate);
    if (text) result.push(text);
  };

  const visitMessage = (message: unknown) => {
    const direct = asString(message);
    if (direct) {
      result.push(direct);
      return;
    }
    const record = asRecord(message);
    if (!record) return;
    add(record.Text);
    add(record.MessageText);
  };

  if (Array.isArray(value)) {
    value.forEach(visitMessage);
  } else {
    const record = asRecord(value);
    if (record) {
      const nested = record.Message ?? record.Messages ?? record.Items;
      if (Array.isArray(nested)) nested.forEach(visitMessage);
      else if (nested !== undefined) visitMessage(nested);
      else visitMessage(record);
    } else {
      visitMessage(value);
    }
  }

  return [...new Set(result.map((text) => text.replace(/\s+/g, ' ').trim()).filter(Boolean))];
}

export function normalizeTdxCmsStatic(payload: unknown): CmsStaticRecord[] {
  return findArray(payload, ['CMSs', 'CMS'], ['CMSList', 'Data', 'data'])
    .map((value): CmsStaticRecord | null => {
      const record = asRecord(value);
      if (!record) return null;
      const identity = normalizeId(record);
      if (!identity) return null;

      return {
        ...identity,
        lat: asNumber(record.PositionLat),
        lng: asNumber(record.PositionLon),
        linkId: asString(record.LinkID),
        roadId: asString(record.RoadID),
        roadName: asString(record.RoadName),
        roadDirection: asString(record.RoadDirection),
        locationType: asNumber(record.LocationType),
      };
    })
    .filter((item): item is CmsStaticRecord => item !== null);
}

export function normalizeTdxCmsLive(payload: unknown): CmsLiveRecord[] {
  return findArray(payload, ['CMSLives', 'CMSLive'], ['CMSLiveList', 'Data', 'data'])
    .map((value): CmsLiveRecord | null => {
      const record = asRecord(value);
      if (!record) return null;
      const identity = normalizeId(record);
      if (!identity) return null;

      const messages = [
        ...extractMessageTexts(record.Messages),
        ...extractMessageTexts(record.Text),
      ];

      return {
        ...identity,
        messageStatus: asNumber(record.MessageStatus),
        messages: [...new Set(messages)],
        status: asNumber(record.Status),
        dataCollectTime: asString(record.DataCollectTime),
      };
    })
    .filter((item): item is CmsLiveRecord => item !== null);
}

function lookupKeys(item: { id: string; cmsId?: string; cmsUid?: string }): string[] {
  return [...new Set([item.id, item.cmsUid, item.cmsId].filter((value): value is string => Boolean(value)))];
}

function findByKeys<T>(lookup: Map<string, T>, keys: string[]): T | undefined {
  for (const key of keys) {
    const value = lookup.get(key);
    if (value) return value;
  }
  return undefined;
}

export function joinCmsDevices(staticRecords: CmsStaticRecord[], liveRecords: CmsLiveRecord[]): CmsDevice[] {
  const staticLookup = new Map<string, CmsStaticRecord>();
  const liveLookup = new Map<string, CmsLiveRecord>();

  for (const item of staticRecords) {
    for (const key of lookupKeys(item)) staticLookup.set(key, item);
  }
  for (const item of liveRecords) {
    for (const key of lookupKeys(item)) liveLookup.set(key, item);
  }

  const devices = new Map<string, CmsDevice>();
  const seeds: Array<CmsStaticRecord | CmsLiveRecord> = [...staticRecords, ...liveRecords];

  for (const seed of seeds) {
    const keys = lookupKeys(seed);
    const staticRecord = findByKeys(staticLookup, keys);
    const liveRecord = findByKeys(liveLookup, [
      ...keys,
      ...(staticRecord ? lookupKeys(staticRecord) : []),
    ]);
    const resolvedStatic = staticRecord ?? (liveRecord ? findByKeys(staticLookup, lookupKeys(liveRecord)) : undefined);
    const canonicalId = resolvedStatic?.cmsUid
      ?? liveRecord?.cmsUid
      ?? resolvedStatic?.cmsId
      ?? liveRecord?.cmsId
      ?? seed.id;

    if (devices.has(canonicalId)) continue;

    const messages = liveRecord?.messages ?? [];
    const messageStatus = liveRecord?.messageStatus;
    devices.set(canonicalId, {
      id: canonicalId,
      cmsId: resolvedStatic?.cmsId ?? liveRecord?.cmsId,
      cmsUid: resolvedStatic?.cmsUid ?? liveRecord?.cmsUid,
      lat: resolvedStatic?.lat,
      lng: resolvedStatic?.lng,
      linkId: resolvedStatic?.linkId,
      roadId: resolvedStatic?.roadId,
      roadName: resolvedStatic?.roadName,
      roadDirection: resolvedStatic?.roadDirection,
      locationType: resolvedStatic?.locationType,
      messageStatus,
      messages,
      status: liveRecord?.status,
      dataCollectTime: liveRecord?.dataCollectTime,
      active: messageStatus === 1 && messages.length > 0,
      source: 'tdx',
    });
  }

  return [...devices.values()];
}

async function fetchJson(url: string): Promise<unknown> {
  const accessToken = await getTdxAccessToken();
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

export async function fetchTdxCmsStatic(): Promise<CmsStaticRecord[]> {
  return normalizeTdxCmsStatic(await fetchJson(FREEWAY_CMS_URL));
}

export async function fetchTdxCmsLive(): Promise<CmsLiveRecord[]> {
  return normalizeTdxCmsLive(await fetchJson(FREEWAY_CMS_LIVE_URL));
}
