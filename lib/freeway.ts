import { gunzipSync } from 'zlib';
import { XMLParser } from 'fast-xml-parser';
import type { Camera } from '@/types/camera';
import { normalizeCamera } from '@/lib/camera-normalizer';

const CCTV_INFO_URL = 'https://tisvcloud.freeway.gov.tw/cctv_info.xml.gz';
const STREAM_BASE = 'https://cctvs.freeway.gov.tw/live-view/mjpg/video.cgi?camera=';

interface RawCCTV {
  CCTV_ID: string;
  PositionLon: number;
  PositionLat: number;
  RoadName?: string;
  LocationMile?: string | number;
  RoadDirection?: string;
  AuthorityCode?: string;
  [key: string]: unknown;
}

export async function fetchFreewayCameras(): Promise<Camera[]> {
  try {
    const res = await fetch(CCTV_INFO_URL, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn(`[freeway] fetch failed: ${res.status}, returning empty list`);
      return [];
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const xml = gunzipSync(buf).toString('utf-8');

    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      parseTagValue: true,
    });
    const parsed = parser.parse(xml);

    const items: RawCCTV[] = parsed?.CCTVInfo?.CCTV ?? [];
    const list = Array.isArray(items) ? items : [items];

    const result = list
      .filter((c) => c.PositionLat && c.PositionLon)
      .map((c) => normalizeCamera({
        id: `freeway-${c.CCTV_ID}`,
        name: c.RoadName
          ? `${c.RoadName}${c.LocationMile ? ` ${c.LocationMile}K` : ''}`
          : c.CCTV_ID,
        type: 'freeway' as const,
        lat: Number(c.PositionLat),
        lng: Number(c.PositionLon),
        streamUrl: `${STREAM_BASE}${c.CCTV_ID}`,
        road: c.RoadName,
        provider: c.AuthorityCode || '高速公路局',
        mile: c.LocationMile,
        direction: c.RoadDirection,
      }));

    console.log(`[freeway] fetched ${result.length} cameras`);
    return result;
  } catch (error) {
    console.warn(`[freeway] error:`, error instanceof Error ? error.message : String(error), ', returning empty list');
    return [];
  }
}
