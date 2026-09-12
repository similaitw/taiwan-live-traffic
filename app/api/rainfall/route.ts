import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import { fetchCwaRainfall } from '@/lib/cwa-rainfall';
import type { RainfallResponse, RainfallStation } from '@/types/rainfall';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_KEY = 'cwa:rainfall:O-A0002-001';
const CACHE_TTL_MS = 10 * 60 * 1000;

function latestObservedAt(stations: RainfallStation[]): string | undefined {
  return stations
    .map((station) => station.observedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
}

function payload(
  status: RainfallResponse['source']['status'],
  stations: RainfallStation[],
  error?: string,
): RainfallResponse {
  return {
    enabled: status === 'ok',
    stations,
    source: {
      provider: 'CWA',
      dataset: 'O-A0002-001',
      status,
      fetchedAt: new Date().toISOString(),
      observedAt: latestObservedAt(stations),
      ...(error ? { error } : {}),
    },
  };
}

export async function GET() {
  const cached = getCache<RainfallStation[]>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(payload('ok', cached));
  }

  try {
    const stations = await fetchCwaRainfall();
    setCache(CACHE_KEY, stations, CACHE_TTL_MS);
    return NextResponse.json(payload('ok', stations));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown CWA rainfall error';
    console.error('[rainfall API] source failed:', message);
    return NextResponse.json(payload('error', [], message));
  }
}
