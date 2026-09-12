import { NextRequest, NextResponse } from 'next/server';
import {
  CameraProxyUrlError,
  fetchAllowedCameraResource,
  parseAllowedCameraUrl,
} from '@/lib/camera-proxy-security';

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

  try {
    console.log('[proxy/image] fetching:', rawUrl);
    const upstream = await fetchAllowedCameraResource(rawUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://thbapp.thb.gov.tw/',
        'Accept': 'image/*,*/*;q=0.8',
      },
    });

    console.log('[proxy/image] upstream status:', upstream.status, 'content-type:', upstream.headers.get('content-type'));

    if (!upstream.ok) {
      console.error('[proxy/image] upstream error status:', upstream.status);
      const text = await upstream.text();
      const errorBody = text.substring(0, 500);
      console.error('[proxy/image] upstream error body:', errorBody);
      console.error('[proxy/image] url that failed:', rawUrl);
      return new NextResponse('Upstream ' + upstream.status + ': ' + errorBody, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    console.log('[proxy/image] success, serving as:', contentType);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
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
