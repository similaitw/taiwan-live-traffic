import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SnapshotBodyTooLargeError,
  SnapshotMemoryCache,
  readResponseBodyWithLimit,
} from '../lib/snapshot-resource-limits';

function entry(value: number, ts: number) {
  return {
    data: Uint8Array.from([value]).buffer,
    contentType: 'image/jpeg',
    ts,
  };
}

test('SnapshotMemoryCache expires stale entries on read', () => {
  const cache = new SnapshotMemoryCache(4, 100);
  cache.set('a', entry(1, 1_000), 1_000);

  assert.equal(cache.get('a', 1_099)?.data.byteLength, 1);
  assert.equal(cache.get('a', 1_100), undefined);
  assert.equal(cache.size, 0);
});

test('SnapshotMemoryCache prunes expired entries before insert', () => {
  const cache = new SnapshotMemoryCache(2, 100);
  cache.set('old', entry(1, 1_000), 1_000);
  cache.set('fresh', entry(2, 1_150), 1_150);

  assert.equal(cache.get('old', 1_150), undefined);
  assert.ok(cache.get('fresh', 1_150));
  assert.equal(cache.size, 1);
});

test('SnapshotMemoryCache evicts the oldest entry at capacity', () => {
  const cache = new SnapshotMemoryCache(2, 10_000);
  cache.set('a', entry(1, 1_000), 1_000);
  cache.set('b', entry(2, 1_001), 1_001);
  cache.set('c', entry(3, 1_002), 1_002);

  assert.equal(cache.get('a', 1_002), undefined);
  assert.ok(cache.get('b', 1_002));
  assert.ok(cache.get('c', 1_002));
  assert.equal(cache.size, 2);
});

test('readResponseBodyWithLimit reads a body below the byte limit', async () => {
  const response = new Response(Uint8Array.from([1, 2, 3, 4]));
  const body = await readResponseBodyWithLimit(response, 4);
  assert.deepEqual([...new Uint8Array(body)], [1, 2, 3, 4]);
});

test('readResponseBodyWithLimit rejects an oversized Content-Length before buffering', async () => {
  const response = new Response(Uint8Array.from([1, 2]), {
    headers: { 'content-length': '10' },
  });

  await assert.rejects(
    () => readResponseBodyWithLimit(response, 4),
    (error: unknown) => error instanceof SnapshotBodyTooLargeError && error.maxBytes === 4,
  );
});

test('readResponseBodyWithLimit rejects a chunked body once accumulated bytes exceed the limit', async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(Uint8Array.from([1, 2, 3]));
      controller.enqueue(Uint8Array.from([4, 5, 6]));
      controller.close();
    },
  });
  const response = new Response(stream);

  await assert.rejects(
    () => readResponseBodyWithLimit(response, 4),
    (error: unknown) => error instanceof SnapshotBodyTooLargeError && error.maxBytes === 4,
  );
});
