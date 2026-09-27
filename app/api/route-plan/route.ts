import { NextResponse } from 'next/server';
import type { PlannedRoute, PlannedRouteStop } from '@/lib/route-routing';

export const dynamic = 'force-dynamic';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const USER_AGENT = 'taiwan-live-traffic/3.0 (+https://taiwan-live-traffic.vercel.app)';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const geocodeCache = new Map<string, { value: PlannedRouteStop; expiresAt: number }>();
let nominatimQueue: Promise<void> = Promise.resolve();
let lastNominatimAt = 0;

function sleep(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function paceNominatim(): Promise<void> {
  const previous = nominatimQueue;
  let release!: () => void;
  nominatimQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  const wait = Math.max(0, 1100 - (Date.now() - lastNominatimAt));
  if (wait > 0) await sleep(wait);
  lastNominatimAt = Date.now();
  release();
}

async function geocode(query: string): Promise<PlannedRouteStop> {
  const key = query.trim().toLocaleLowerCase('zh-Hant');
  const cached = geocodeCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  await paceNominatim();
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', `${query}, 台灣`);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'tw');
  url.searchParams.set('accept-language', 'zh-TW');

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Referer: 'https://taiwan-live-traffic.vercel.app/' },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`地點查詢暫時不可用（${response.status}）`);
  const results = await response.json() as Array<{ lat: string; lon: string; display_name: string }>;
  const first = results[0];
  if (!first) throw new Error(`找不到地點：「${query}」`);

  const value: PlannedRouteStop = {
    query,
    label: first.display_name.split(',').slice(0, 3).join('、'),
    lat: Number(first.lat),
    lng: Number(first.lon),
  };
  if (!Number.isFinite(value.lat) || !Number.isFinite(value.lng)) throw new Error(`地點座標無效：「${query}」`);
  if (geocodeCache.size > 200) {
    const firstKey = geocodeCache.keys().next().value;
    if (firstKey) geocodeCache.delete(firstKey);
  }
  geocodeCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
  return value;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { stops?: unknown };
    if (!Array.isArray(body.stops)) return NextResponse.json({ error: '缺少路線地點' }, { status: 400 });
    const stops = body.stops.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
    if (stops.length < 2 || stops.length > 10) return NextResponse.json({ error: '路線需要 2–10 個地點' }, { status: 400 });
    if (stops.some((item) => item.length > 120)) return NextResponse.json({ error: '地點文字過長' }, { status: 400 });

    const resolved: PlannedRouteStop[] = [];
    for (const stop of stops) resolved.push(await geocode(stop));

    const coordinates = resolved.map((stop) => `${stop.lng},${stop.lat}`).join(';');
    const osrm = new URL(`${OSRM_URL}/${coordinates}`);
    osrm.searchParams.set('overview', 'full');
    osrm.searchParams.set('geometries', 'geojson');
    osrm.searchParams.set('steps', 'false');

    const response = await fetch(osrm, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(12000), cache: 'no-store' });
    if (!response.ok) throw new Error(`路線服務暫時不可用（${response.status}）`);
    const payload = await response.json() as {
      code: string;
      message?: string;
      routes?: Array<{ distance: number; duration: number; geometry: { type: 'LineString'; coordinates: Array<[number, number]> } }>;
    };
    const route = payload.routes?.[0];
    if (payload.code !== 'Ok' || !route || route.geometry?.type !== 'LineString') throw new Error(payload.message || '找不到可行車路線');

    const result: PlannedRoute = {
      stops: resolved,
      geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      provider: 'OSRM',
      geocoder: 'Nominatim',
      generatedAt: new Date().toISOString(),
    };
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store', 'X-Route-Provider': 'OSRM' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '目前無法規畫路線';
    return NextResponse.json({ error: message }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
