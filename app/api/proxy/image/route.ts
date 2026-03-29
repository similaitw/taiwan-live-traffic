import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTNAMES = [
  'cctvs.freeway.gov.tw',
  'tisvcloud.freeway.gov.tw',
  'thbapp.thb.gov.tw',
  'cctv.thb.gov.tw',
  'its.taipei.gov.tw',
];

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  if (!ALLOWED_HOSTNAMES.includes(parsed.hostname)) {
    return new NextResponse('URL not allowed', { status: 403 });
  }

  try {
    const upstream = await fetch(rawUrl, {
      signal: AbortSignal.timeout(8000),
    });
    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store',
      },
    });
  } catch {
    return new NextResponse('Upstream fetch failed', { status: 502 });
  }
}
