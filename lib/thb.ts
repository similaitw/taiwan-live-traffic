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
  html?: string;
  videoliveurl?: string;
  VideoLiveUrl?: string;
  liveurl?: string;
  LiveUrl?: string;
  snapshoturl?: string;
  snapshotUrl?: string;
  thumbnailurl?: string;
  ThumbnailUrl?: string;
  stakenumber?: string;
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
    (raw.stakenumber as string) ??
    id;
  
  // THB uses 'html' field for stream URL, try multiple field names
  const streamUrl = (raw.html as string) ?? 
                    (raw.url as string) ?? 
                    (raw.videoliveurl as string) ?? 
                    (raw.VideoLiveUrl as string) ??
                    (raw.liveurl as string) ?? 
                    (raw.LiveUrl as string) ?? '';
  
  const snapshotUrl = (raw.snapshoturl as string) ?? 
                      (raw.snapshotUrl as string) ??
                      (raw.thumbnailurl as string) ?? 
                      (raw.ThumbnailUrl as string) ??
                      undefined;

  return {
    id: `${type}-${id}`,
    name,
    type,
    lat,
    lng,
    streamUrl,
    snapshotUrl,
    road: (raw.roadname as string) ?? (raw.RoadName as string) ?? (raw.stakenumber as string),
  };
}

async function fetchTHB(url: string, type: 'provincial' | 'county'): Promise<Camera[]> {
  const res = await fetch(url, {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`THB fetch failed (${type}): ${res.status}`);

  const data: THBCamera[] | { data?: THBCamera[] } = await res.json();
  const items: THBCamera[] = Array.isArray(data) ? data : (data?.data ?? []);

  console.log(`[thb/${type}] fetched ${items.length} items`);
  if (items.length > 0) {
    console.log(`[thb/${type}] sample item:`, JSON.stringify(items[0], null, 2));
    const withUrl = items.filter((c) => c.url || c.videoliveurl || c.VideoLiveUrl || c.liveurl || c.LiveUrl).length;
    console.log(`[thb/${type}] items with url: ${withUrl}/${items.length}`);
  }

  const result = items.map((c) => mapTHB(c, type)).filter((c): c is Camera => c !== null);
  console.log(`[thb/${type}] mapped to ${result.length} cameras`);
  if (result.length > 0) {
    console.log(`[thb/${type}] sample camera:`, result[0]);
  }
  return result;
}

export async function fetchProvincialCameras(): Promise<Camera[]> {
  return fetchTHB(THB_PROVINCIAL, 'provincial');
}

export async function fetchCountyCameras(): Promise<Camera[]> {
  return fetchTHB(THB_COUNTY, 'county');
}
