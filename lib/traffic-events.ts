import { getTdxAccessToken } from '@/lib/tdx-auth';
import type { TrafficEvent, TrafficEventSeverity } from '@/types/traffic-event';

const FREEWAY_EVENTS_URL = 'https://tdx.transportdata.tw/api/basic/v1/Traffic/RoadEvent/LiveEvent/Freeway?$format=JSON';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseWktPoint(value: unknown): { lat: number; lng: number } | null {
  const raw = asString(value);
  if (!raw) return null;

  const match = raw.match(/POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i);
  if (!match) return null;

  const lng = Number(match[1]);
  const lat = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function severityFrom(record: UnknownRecord): TrafficEventSeverity {
  const impact = asRecord(record.Impact);
  const text = [
    asString(record.EventTitle),
    asString(record.Description),
    asString(impact?.Description),
  ].filter(Boolean).join(' ');

  if (/全部阻斷|全線封閉|封閉|重大事故|車禍|火燒車|坍方|落石/.test(text)) return 'serious';
  if (/部分阻斷|施工|養護|壅塞|障礙|管制|事故/.test(text)) return 'warning';
  return 'info';
}

function unwrapRoadEvents(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  const record = asRecord(payload);
  if (!record) return [];

  const candidates = [record.RoadEvents, record.Data, record.data, record.Items, record.items];
  return candidates.find(Array.isArray) as unknown[] | undefined ?? [];
}

export function normalizeTdxRoadEvents(payload: unknown): TrafficEvent[] {
  return unwrapRoadEvents(payload)
    .map((value, index): TrafficEvent | null => {
      const record = asRecord(value);
      if (!record) return null;

      const location = asRecord(record.Location);
      const freeway = asRecord(location?.FreeExpressHighway);
      const impact = asRecord(record.Impact);
      const point = parseWktPoint(record.Positions);

      const title = asString(record.EventTitle) ?? asString(record.Description) ?? '道路事件';
      const publishTime = asString(record.PublishTime);
      const id = asString(record.EventID) ?? `tdx-freeway-${publishTime ?? 'unknown'}-${index}`;

      return {
        id,
        title,
        description: asString(impact?.Description) ?? asString(record.Description),
        severity: severityFrom(record),
        lat: point?.lat,
        lng: point?.lng,
        road: asString(freeway?.Road) ?? asString(record.RoadName),
        direction: asString(record.Direction),
        publishTime,
        effectiveTime: asString(record.EffectiveTime),
        source: 'tdx',
      };
    })
    .filter((event): event is TrafficEvent => event !== null);
}

export async function fetchTdxFreewayEvents(): Promise<TrafficEvent[]> {
  const accessToken = await getTdxAccessToken();
  const response = await fetch(FREEWAY_EVENTS_URL, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`TDX freeway events failed with HTTP ${response.status}`);
  }

  return normalizeTdxRoadEvents(await response.json());
}
