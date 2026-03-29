import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    return NextResponse.json({
      status: res.status,
      statusOk: res.ok,
      contentType: res.headers.get('content-type'),
      contentLength: res.headers.get('content-length'),
      error: res.ok ? null : 'Not OK',
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      status: 'failed',
    }, { status: 502 });
  }
}
