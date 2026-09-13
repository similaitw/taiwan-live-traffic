import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CameraProxyUrlError,
  fetchAllowedCameraResource,
  parseAllowedCameraUrl,
} from '../lib/camera-proxy-security';

function assertBlocked(rawUrl: string, expectedStatus: 400 | 403 | 502 = 403) {
  assert.throws(
    () => parseAllowedCameraUrl(rawUrl),
    (error: unknown) =>
      error instanceof CameraProxyUrlError && error.status === expectedStatus,
  );
}

test('allows known official camera hosts', () => {
  const allowed = [
    'https://cctvs.freeway.gov.tw/live-view/mjpg/video.cgi?camera=1',
    'https://tisvcloud.freeway.gov.tw/cctv_info.xml.gz',
    'https://thbapp.thb.gov.tw/services/cctv/thb',
    'https://cctv.thb.gov.tw/example.jpg',
    'https://cciv.thb.gov.tw/example.jpg',
    'https://cctv-ss05.thb.gov.tw/example.jpg',
    'https://its.taipei.gov.tw/example.jpg',
    'https://cctv-a1b2.thb.gov.tw/example.jpg',
  ];

  for (const rawUrl of allowed) {
    assert.equal(parseAllowedCameraUrl(rawUrl).hostname, new URL(rawUrl).hostname);
  }
});

test('rejects non-allowlisted, lookalike and loopback hosts', () => {
  assertBlocked('https://example.com/camera.jpg');
  assertBlocked('https://cctv-a1b2.thb.gov.tw.evil.example/camera.jpg');
  assertBlocked('http://127.0.0.1:3000/api/health');
  assertBlocked('http://localhost:3000/api/health');
  assertBlocked('http://[::1]/api/health');
});

test('rejects non HTTP(S), URL credentials and invalid URLs', () => {
  assertBlocked('file:///etc/passwd');
  assertBlocked('ftp://cctvs.freeway.gov.tw/camera.jpg');
  assertBlocked('https://user:pass@cctvs.freeway.gov.tw/camera.jpg');
  assertBlocked('not a url', 400);
});

test('allows a relative redirect only when its resolved host remains allowed', () => {
  const base = new URL('https://cctvs.freeway.gov.tw/live/current.jpg');
  const resolved = parseAllowedCameraUrl('../next.jpg', base);
  assert.equal(resolved.href, 'https://cctvs.freeway.gov.tw/next.jpg');

  assert.throws(
    () => parseAllowedCameraUrl('https://example.com/next.jpg', base),
    (error: unknown) => error instanceof CameraProxyUrlError && error.status === 403,
  );
});

test('fetchAllowedCameraResource revalidates an allowed relative redirect', async (t) => {
  const originalFetch = globalThis.fetch;
  const seen: string[] = [];
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof URL ? input.href : String(input);
    seen.push(url);
    assert.equal(init?.redirect, 'manual');

    if (seen.length === 1) {
      return new Response(null, {
        status: 302,
        headers: { location: '/live/next.jpg' },
      });
    }

    return new Response('ok', { status: 200 });
  }) as typeof fetch;

  const response = await fetchAllowedCameraResource(
    'https://cctvs.freeway.gov.tw/live/start.jpg',
  );

  assert.equal(response.status, 200);
  assert.deepEqual(seen, [
    'https://cctvs.freeway.gov.tw/live/start.jpg',
    'https://cctvs.freeway.gov.tw/live/next.jpg',
  ]);
});

test('fetchAllowedCameraResource blocks a redirect that leaves the allowlist', async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async () => {
    calls += 1;
    return new Response(null, {
      status: 302,
      headers: { location: 'https://example.com/private' },
    });
  }) as typeof fetch;

  await assert.rejects(
    () => fetchAllowedCameraResource('https://cctvs.freeway.gov.tw/live/start.jpg'),
    (error: unknown) => error instanceof CameraProxyUrlError && error.status === 403,
  );
  assert.equal(calls, 1);
});

test('fetchAllowedCameraResource stops excessive redirect chains', async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async () => {
    calls += 1;
    return new Response(null, {
      status: 302,
      headers: { location: '/loop.jpg' },
    });
  }) as typeof fetch;

  await assert.rejects(
    () => fetchAllowedCameraResource('https://cctvs.freeway.gov.tw/live/start.jpg'),
    (error: unknown) => error instanceof CameraProxyUrlError && error.status === 502,
  );
  assert.equal(calls, 5);
});
