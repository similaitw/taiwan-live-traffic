import { NextRequest, NextResponse } from 'next/server';
import {
  CameraProxyUrlError,
  fetchAllowedCameraResource,
  parseAllowedCameraUrl,
} from '@/lib/camera-proxy-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CONNECT_TIMEOUT_MS = 15_000;
const LIVE_MAX_DURATION_MS = 90_000;

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    console.log('[proxy/image] missing url parameter');
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    parseAllowedCameraUrl(rawUrl);
  } catch (error) {
    if (error instanceof CameraProxyUrlError) {
      console.log('[proxy/image] rejected url:', rawUrl, error.message);
      return new NextResponse(error.message, { status: error.status });
    }
    return new NextResponse('Invalid URL', { status: 400 });
  }

  const upstreamController = new AbortController();
  const abortFromClient = () => upstreamController.abort();
  if (req.signal.aborted) upstreamController.abort();
  else req.signal.addEventListener('abort', abortFromClient, { once: true });

  const connectTimer = setTimeout(() => upstreamController.abort(), CONNECT_TIMEOUT_MS);

  try {
    console.log('[proxy/image] fetching:', rawUrl);
    const upstream = await fetchAllowedCameraResource(rawUrl, {
      signal: upstreamController.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://thbapp.thb.gov.tw/',
        'Accept': 'image/*,*/*;q=0.8',
      },
    });
    clearTimeout(connectTimer);

    console.log('[proxy/image] upstream status:', upstream.status, 'content-type:', upstream.headers.get('content-type'));

    if (!upstream.ok) {
      req.signal.removeEventListener('abort', abortFromClient);
      console.error('[proxy/image] upstream error status:', upstream.status);
      const text = await upstream.text();
      const errorBody = text.substring(0, 500);
      console.error('[proxy/image] upstream error body:', errorBody);
      console.error('[proxy/image] url that failed:', rawUrl);
      return new NextResponse('Upstream ' + upstream.status + ': ' + errorBody, { status: upstream.status });
    }

    if (!upstream.body) {
      req.signal.removeEventListener('abort', abortFromClient);
      return new NextResponse('Upstream returned no body', { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    const reader = upstream.body.getReader();
    let cleanedUp = false;
    const liveTimer = setTimeout(() => upstreamController.abort(), LIVE_MAX_DURATION_MS);

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      clearTimeout(liveTimer);
      req.signal.removeEventListener('abort', abortFromClient);
    };

    const guardedBody = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            cleanup();
            controller.close();
            return;
          }
          if (value) controller.enqueue(value);
        } catch (error) {
          cleanup();
          controller.error(error);
        }
      },
      async cancel(reason) {
        upstreamController.abort();
        cleanup();
        try {
          await reader.cancel(reason);
        } catch {
          // The upstream may already be aborted or closed.
        }
      },
    });

    console.log('[proxy/image] success, serving as:', contentType, 'max-live-ms:', LIVE_MAX_DURATION_MS);

    return new NextResponse(guardedBody, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store',
        'Access-Control-Allow-Origin': '*',
        'X-Live-Max-Duration': String(Math.floor(LIVE_MAX_DURATION_MS / 1000)),
      },
    });
  } catch (error) {
    clearTimeout(connectTimer);
    req.signal.removeEventListener('abort', abortFromClient);
    if (error instanceof CameraProxyUrlError) {
      console.error('[proxy/image] blocked redirect:', error.message);
      return new NextResponse(error.message, { status: error.status });
    }
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[proxy/image] error:', errMsg);
    console.error('[proxy/image] url that errored:', rawUrl);
    return new NextResponse('Fetch failed: ' + errMsg, { status: 502 });
  }
}
