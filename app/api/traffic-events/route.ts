import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import { hasTdxCredentials } from '@/lib/tdx-auth';
import { fetchTdxFreewayEvents } from '@/lib/traffic-events';
import type { TrafficEventsResponse } from '@/types/traffic-event';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_KEY = 'traffic-events:freeway';
const CACHE_TTL_MS = 60_000;

function response(
  status: TrafficEventsResponse['source']['status'],
  enabled: boolean,
  events: TrafficEventsResponse['events'] = [],
  error?: string,
): TrafficEventsResponse {
  return {
    enabled,
    events,
    source: {
      provider: 'TDX',
      status,
      fetchedAt: new Date().toISOString(),
      ...(error ? { error } : {}),
    },
  };
}

export async function GET() {
  if (!hasTdxCredentials()) {
    return NextResponse.json(
      response('disabled', false, [], 'TDX_CLIENT_ID / TDX_CLIENT_SECRET are not configured'),
    );
  }

  const cached = getCache<TrafficEventsResponse>(CACHE_KEY);
  if (cached) return NextResponse.json(cached);

  try {
    const events = await fetchTdxFreewayEvents();
    const payload = response('ok', true, events);
    setCache(CACHE_KEY, payload, CACHE_TTL_MS);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown TDX error';
    console.error('[traffic-events API] TDX source failed:', message);
    return NextResponse.json(response('error', true, [], message));
  }
}
