import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import { hasTdxCredentials } from '@/lib/tdx-auth';
import { fetchTdxFreewayTraffic } from '@/lib/traffic-flow';
import type { TrafficFlowResponse } from '@/types/traffic-flow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_KEY = 'traffic-flow:freeway';
const CACHE_TTL_MS = 60_000;

function payload(
  status: TrafficFlowResponse['source']['status'],
  enabled: boolean,
  segments: TrafficFlowResponse['segments'] = [],
  options: { dataCollectTime?: string; error?: string } = {},
): TrafficFlowResponse {
  return {
    enabled,
    segments,
    source: {
      provider: 'TDX',
      status,
      fetchedAt: new Date().toISOString(),
      ...(options.dataCollectTime ? { dataCollectTime: options.dataCollectTime } : {}),
      ...(options.error ? { error: options.error } : {}),
    },
  };
}

export async function GET() {
  if (!hasTdxCredentials()) {
    return NextResponse.json(
      payload('disabled', false, [], {
        error: 'TDX_CLIENT_ID / TDX_CLIENT_SECRET are not configured',
      }),
    );
  }

  const cached = getCache<TrafficFlowResponse>(CACHE_KEY);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await fetchTdxFreewayTraffic();
    const response = payload('ok', true, result.segments, {
      dataCollectTime: result.dataCollectTime,
    });
    setCache(CACHE_KEY, response, CACHE_TTL_MS);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown TDX error';
    console.error('[traffic-flow API] TDX source failed:', message);
    return NextResponse.json(payload('error', true, [], { error: message }));
  }
}
