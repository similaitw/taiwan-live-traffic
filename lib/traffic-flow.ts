import { getTdxAccessToken } from '@/lib/tdx-auth';
import type { TrafficFlowSegment } from '@/types/traffic-flow';

const FREEWAY_LIVE_TRAFFIC_URL = 'https://tdx.transportdata.tw/api/basic/v2/Road/Traffic/Live/Freeway?$format=JSON';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function findTrafficArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  const root = asRecord(payload);
  if (!root) return [];

  const directCandidates = [
    root.LiveTraffics,
    root.LiveTraffic,
    root.Data,
    root.data,
    root.Items,
    root.items,
  ];
  const direct = directCandidates.find(Array.isArray);
  if (direct) return direct as unknown[];

  const list = asRecord(root.LiveTrafficList);
  if (!list) return [];

  const nestedCandidates = [
    list.LiveTraffics,
    list.LiveTraffic,
    list.Data,
    list.data,
  ];
  return nestedCandidates.find(Array.isArray) as unknown[] | undefined ?? [];
}

function findOuterDataCollectTime(payload: unknown): string | undefined {
  const root = asRecord(payload);
  if (!root) return undefined;

  return asString(root.DataCollectTime)
    ?? asString(root.UpdateTime)
    ?? asString(asRecord(root.LiveTrafficList)?.DataCollectTime)
    ?? asString(asRecord(root.LiveTrafficList)?.UpdateTime);
}

export interface NormalizedTrafficFlow {
  segments: TrafficFlowSegment[];
  dataCollectTime?: string;
}

export function normalizeTdxFreewayTraffic(payload: unknown): NormalizedTrafficFlow {
  const outerDataCollectTime = findOuterDataCollectTime(payload);
  const segments = findTrafficArray(payload)
    .map((value): TrafficFlowSegment | null => {
      const record = asRecord(value);
      if (!record) return null;

      const sectionId = asString(record.SectionID);
      if (!sectionId) return null;

      return {
        sectionId,
        travelTime: asFiniteNumber(record.TravelTime),
        travelSpeed: asFiniteNumber(record.TravelSpeed),
        congestionLevelId: asFiniteNumber(record.CongestionLevelID),
        congestionLevel: asFiniteNumber(record.CongestionLevel),
        dataCollectTime: asString(record.DataCollectTime) ?? outerDataCollectTime,
        source: 'tdx',
      };
    })
    .filter((segment): segment is TrafficFlowSegment => segment !== null);

  return { segments, dataCollectTime: outerDataCollectTime };
}

export async function fetchTdxFreewayTraffic(): Promise<NormalizedTrafficFlow> {
  const accessToken = await getTdxAccessToken();
  const response = await fetch(FREEWAY_LIVE_TRAFFIC_URL, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`TDX freeway live traffic failed with HTTP ${response.status}`);
  }

  return normalizeTdxFreewayTraffic(await response.json());
}
