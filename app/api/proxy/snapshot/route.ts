import { NextRequest } from 'next/server';
import {
  CameraProxyUrlError,
  fetchAllowedCameraResource,
  parseAllowedCameraUrl,
} from '@/lib/camera-proxy-security';
import {
  SNAPSHOT_MAX_BYTES,
  SnapshotBodyTooLargeError,
  SnapshotMemoryCache,
  readResponseBodyWithLimit,
} from '@/lib/snapshot-resource-limits';

/**
 * Snapshot proxy: fetches a single frame from an image/MJPEG URL.
 * Unlike /api/proxy/image which streams the full response (including MJPEG),
 * this endpoint reads just enough bytes to get one JPEG frame, then closes.
 * Cached briefly with bounded entries to avoid hammering upstream or growing
 * process memory without limit.
 */

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

const snapshotCache = new SnapshotMemoryCache();
const SNAPSHOT_TIMEOUT_MS = 8_000;

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    parseAllowedCameraUrl(rawUrl);
  } catch (error) {
    if (error instanceof CameraProxyUrlError) {
      return new Response(error.message, { status: error.status });
    }
    return new Response('Invalid URL', { status: 400 });
  }

  const cached = snapshotCache.get(rawUrl);
  if (cached) {
    return imageResponse(cached.data, cached.contentType);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SNAPSHOT_TIMEOUT_MS);

  try {
    const upstream = await fetchAllowedCameraResource(rawUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://thbapp.thb.gov.tw/',
        'Accept': 'image/*,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      return new Response('Upstream ' + upstream.status, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') ?? '';

    if (!contentType.includes('multipart') && !contentType.includes('x-mixed-replace')) {
      if (!upstream.body) {
        return new Response('No body', { status: 502 });
      }

      const buf = await readResponseBodyWithLimit(upstream);
      if (buf.byteLength === 0) {
        return new Response('No frame captured', { status: 502 });
      }

      const resolvedContentType = contentType || 'image/jpeg';
      snapshotCache.set(rawUrl, { data: buf, contentType: resolvedContentType, ts: Date.now() });
      return imageResponse(buf, resolvedContentType);
    }

    const reader = upstream.body?.getReader();
    if (!reader) {
      return new Response('No body', { status: 502 });
    }

    const chunks: Uint8Array[] = [];
    let totalLen = 0;

    try {
      while (totalLen < SNAPSHOT_MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;

        if (totalLen + value.length > SNAPSHOT_MAX_BYTES) {
          await reader.cancel().catch(() => {});
          return new Response('Snapshot too large', { status: 502 });
        }

        chunks.push(value);
        totalLen += value.length;

        const combined = concatUint8(chunks);
        const start = findBytes(combined, [0xff, 0xd8]);
        if (start === -1) continue;

        const end = findBytes(combined, [0xff, 0xd9], start + 2);
        if (end !== -1) {
          const jpeg = combined.slice(start, end + 2);
          await reader.cancel().catch(() => {});
          snapshotCache.set(rawUrl, { data: jpeg.buffer, contentType: 'image/jpeg', ts: Date.now() });
          return imageResponse(jpeg, 'image/jpeg');
        }
      }
    } finally {
      await reader.cancel().catch(() => {});
    }

    if (chunks.length > 0) {
      const data = concatUint8(chunks);
      return imageResponse(data, 'image/jpeg');
    }

    return new Response('No frame captured', { status: 502 });
  } catch (error) {
    if (error instanceof CameraProxyUrlError) {
      return new Response(error.message, { status: error.status });
    }
    if (error instanceof SnapshotBodyTooLargeError) {
      return new Response('Snapshot too large', { status: 502 });
    }
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response('Fetch failed: ' + errMsg, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
