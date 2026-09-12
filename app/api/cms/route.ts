import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import { hasTdxCredentials } from '@/lib/tdx-auth';
import {
  fetchTdxCmsLive,
  fetchTdxCmsStatic,
  joinCmsDevices,
  type CmsLiveRecord,
  type CmsStaticRecord,
} from '@/lib/cms';
import type { CmsResponse } from '@/types/cms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATIC_CACHE_KEY = 'cms:freeway:static';
const LIVE_CACHE_KEY = 'cms:freeway:live';
const STATIC_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const LIVE_CACHE_TTL_MS = 2 * 60 * 1000;

function response(
  status: CmsResponse['source']['status'],
  enabled: boolean,
  devices: CmsResponse['devices'] = [],
  options: { warnings?: string[]; error?: string } = {},
): CmsResponse {
  return {
    enabled,
    devices,
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
      response('disabled', false, [], {
        error: 'TDX_CLIENT_ID / TDX_CLIENT_SECRET are not configured',
      }),
    );
  }

  let staticRecords = getCache<CmsStaticRecord[]>(STATIC_CACHE_KEY);
  let liveRecords = getCache<CmsLiveRecord[]>(LIVE_CACHE_KEY);
  const warnings: string[] = [];

  if (staticRecords === null) {
    try {
      staticRecords = await fetchTdxCmsStatic();
      setCache(STATIC_CACHE_KEY, staticRecords, STATIC_CACHE_TTL_MS);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown CMS static error';
      console.error('[cms API] static source failed:', message);
      warnings.push(`CMS static unavailable: ${message}`);
    }
  }

  if (liveRecords === null) {
    try {
      liveRecords = await fetchTdxCmsLive();
      setCache(LIVE_CACHE_KEY, liveRecords, LIVE_CACHE_TTL_MS);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown CMS live error';
      console.error('[cms API] live source failed:', message);
      warnings.push(`CMS live unavailable: ${message}`);
    }
  }

  if (staticRecords === null && liveRecords === null) {
    return NextResponse.json(
      response('error', true, [], {
        error: warnings.join('; ') || 'CMS sources unavailable',
      }),
    );
  }

  const devices = joinCmsDevices(staticRecords ?? [], liveRecords ?? []);
  return NextResponse.json(
    response(warnings.length ? 'partial' : 'ok', true, devices, { warnings }),
  );
}
