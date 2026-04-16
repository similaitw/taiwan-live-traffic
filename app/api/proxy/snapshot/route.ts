import { NextRequest } from 'next/server';

/**
 * Snapshot proxy: fetches a single frame from an image/MJPEG URL.
 * Unlike /api/proxy/image which streams the full response (including MJPEG),
 * this endpoint reads just enough bytes to get one JPEG frame, then closes.
 * Cached for 30 seconds to avoid hammering upstream.
 */

const ALLOWED_HOSTNAMES = [
  'cctvs.freeway.gov.tw',
  'tisvcloud.freeway.gov.tw',
  'thbapp.thb.gov.tw',
  'cctv.thb.gov.tw',
  'cciv.thb.gov.tw',
  'cctv-ss05.thb.gov.tw',
  'its.taipei.gov.tw',
];

function concatUint8(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, a) => acc + a.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function findBytes(haystack: Uint8Array, needle: number[], from = 0): number {
  for (let i = from; i <= haystack.length - needle.length; i++) {
    let match = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) { match = false; break; }
    }
    if (match) return i;
  }
  return -1;
}

function imageResponse(body: ArrayBuffer | Uint8Array, contentType: string): Response {
  return new Response(body as BodyInit, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=30',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// In-memory snapshot cache
const snapshotCache = new Map<string, { data: ArrayBuffer; contentType: string; ts: number }>();
const CACHE_TTL = 30_000;

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  const hostname = parsed.hostname;
  const isAllowed =
    ALLOWED_HOSTNAMES.includes(hostname) ||
    /^cctv-[a-z0-9]+\.thb\.gov\.tw$/.test(hostname);

  if (!isAllowed) {
    return new Response('URL not allowed', { status: 403 });
  }

  // Check cache
  const cached = snapshotCache.get(rawUrl);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return imageResponse(cached.data, cached.contentType);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const upstream = await fetch(rawUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://thbapp.thb.gov.tw/',
        'Accept': 'image/*,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!upstream.ok) {
      return new Response('Upstream ' + upstream.status, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') ?? '';

    // If it's a normal JPEG/PNG image, just return it
    if (!contentType.includes('multipart') && !contentType.includes('x-mixed-replace')) {
      const buf = await upstream.arrayBuffer();
      snapshotCache.set(rawUrl, { data: buf, contentType: contentType || 'image/jpeg', ts: Date.now() });
      return imageResponse(buf, contentType || 'image/jpeg');
    }

    // MJPEG stream: read until we find a complete JPEG frame
    const reader = upstream.body?.getReader();
    if (!reader) {
      return new Response('No body', { status: 502 });
    }

    const chunks: Uint8Array[] = [];
    let totalLen = 0;
    const MAX_BYTES = 2 * 1024 * 1024;

    try {
      while (totalLen < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalLen += value.length;

        const combined = concatUint8(chunks);
        const start = findBytes(combined, [0xff, 0xd8]);
        if (start === -1) continue;

        const end = findBytes(combined, [0xff, 0xd9], start + 2);
        if (end !== -1) {
          const jpeg = combined.slice(start, end + 2);
          reader.cancel();
          snapshotCache.set(rawUrl, { data: jpeg.buffer, contentType: 'image/jpeg', ts: Date.now() });
          return imageResponse(jpeg, 'image/jpeg');
        }
      }
    } finally {
      reader.cancel().catch(() => {});
    }

    if (chunks.length > 0) {
      const data = concatUint8(chunks);
      return imageResponse(data, 'image/jpeg');
    }

    return new Response('No frame captured', { status: 502 });
  } catch (error) {
    clearTimeout(timeout);
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response('Fetch failed: ' + errMsg, { status: 502 });
  }
}
