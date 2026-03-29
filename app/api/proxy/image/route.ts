import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTNAMES = [
  'cctvs.freeway.gov.tw',
  'tisvcloud.freeway.gov.tw',
  'thbapp.thb.gov.tw',
  'cctv.thb.gov.tw',
  'cciv.thb.gov.tw',
  'cctv-ss05.thb.gov.tw',
  'its.taipei.gov.tw',
];

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    console.log('[proxy/image] missing url parameter');
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch (error) {
    console.log('[proxy/image] invalid url:', rawUrl, error);
    return new NextResponse('Invalid URL', { status: 400 });
  }

  // Whitelist check: allow specific hosts and wildcard patterns for THB CCTV servers
  const hostname = parsed.hostname;
  const isAllowed = 
    ALLOWED_HOSTNAMES.includes(hostname) ||
    /^cctv-[a-z0-9]+\.thb\.gov\.tw$/.test(hostname);

  if (!isAllowed) {
    console.log('[proxy/image] hostname not allowed:', hostname);
    return new NextResponse('URL not allowed', { status: 403 });
  }

  try {
    console.log('[proxy/image] fetching:', rawUrl);
    const upstream = await fetch(rawUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://thbapp.thb.gov.tw/',
        'Accept': 'image/*,*/*;q=0.8',
      },
      redirect: 'follow',
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
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[proxy/image] error:', errMsg);
    console.error('[proxy/image] url that errored:', rawUrl);
    return new NextResponse('Fetch failed: ' + errMsg, { status: 502 });
  }
}
