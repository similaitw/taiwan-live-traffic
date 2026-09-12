import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import { hasTdxCredentials } from '@/lib/tdx-auth';
import { fetchTdxFreewaySections } from '@/lib/traffic-sections';
import type { TrafficSectionsResponse } from '@/types/traffic-section';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_KEY = 'traffic-sections:freeway';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function payload(
  status: TrafficSectionsResponse['source']['status'],
  enabled: boolean,
  sections: TrafficSectionsResponse['sections'] = [],
  options: { warnings?: string[]; error?: string } = {},
): TrafficSectionsResponse {
  return {
    enabled,
    sections,
    source: {
      provider: 'TDX',
      status,
      fetchedAt: new Date().toISOString(),
      ...(options.warnings?.length ? { warnings: options.warnings } : {}),
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

  const cached = getCache<TrafficSectionsResponse>(CACHE_KEY);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await fetchTdxFreewaySections();
    const response = payload(
      result.warnings.length ? 'partial' : 'ok',
      true,
      result.sections,
      { warnings: result.warnings },
    );
    setCache(CACHE_KEY, response, CACHE_TTL_MS);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown TDX error';
    console.error('[traffic-sections API] TDX source failed:', message);
    return NextResponse.json(payload('error', true, [], { error: message }));
  }
}
