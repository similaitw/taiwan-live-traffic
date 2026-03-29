import type { Camera } from '@/types/camera';

const THB_PROVINCIAL = 'https://thbapp.thb.gov.tw/services/cctv/thb';
const THB_COUNTY = 'https://thbapp.thb.gov.tw/services/cctv/county';

interface THBCamera {
  id?: string;
  cctvid?: string;
  name?: string;
  location?: string;
  roadname?: string;
  RoadName?: string;
  gisx?: number | string;
  gisy?: number | string;
  lon?: number | string;
  lat?: number | string;
  url?: string;
  snapshoturl?: string;
  [key: string]: unknown;
}

function mapTHB(raw: THBCamera, type: 'provincial' | 'county'): Camera | null {
  const id = String(raw.id ?? raw.cctvid ?? '');
  const lat = Number(raw.gisy ?? raw.lat ?? 0);
  const lng = Number(raw.gisx ?? raw.lon ?? 0);
  if (!lat || !lng) return null;

  const name =
    (raw.name as string) ??
    (raw.location as string) ??
    (raw.roadname as string) ??
    (raw.RoadName as string) ??
    id;
  const streamUrl = (raw.url as string) ?? '';
  const snapshotUrl = (raw.snapshoturl as string) ?? undefined;

  return {
    id: `${type}-${id}`,
    name,
    type,
    lat,
    lng,
    streamUrl,
    snapshotUrl,
    road: (raw.roadname as string) ?? (raw.RoadName as string),
  };
}

async function fetchTHB(url: string, type: 'provincial' | 'county'): Promise<Camera[]> {
  const res = await fetch(url, {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`THB fetch failed (${type}): ${res.status}`);

  const data: THBCamera[] | { data?: THBCamera[] } = await res.json();
  const items: THBCamera[] = Array.isArray(data) ? data : (data?.data ?? []);

  return items.map((c) => mapTHB(c, type)).filter((c): c is Camera => c !== null);
}

export async function fetchProvincialCameras(): Promise<Camera[]> {
  return fetchTHB(THB_PROVINCIAL, 'provincial');
}

export async function fetchCountyCameras(): Promise<Camera[]> {
  return fetchTHB(THB_COUNTY, 'county');
}
