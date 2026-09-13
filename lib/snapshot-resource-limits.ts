export const SNAPSHOT_CACHE_TTL_MS = 30_000;
export const SNAPSHOT_CACHE_MAX_ENTRIES = 64;
export const SNAPSHOT_MAX_BYTES = 2 * 1024 * 1024;

export interface SnapshotCacheEntry {
  data: ArrayBuffer;
  contentType: string;
  ts: number;
}

export class SnapshotBodyTooLargeError extends Error {
  constructor(public readonly maxBytes: number) {
    super(`Snapshot exceeds ${maxBytes} bytes`);
    this.name = 'SnapshotBodyTooLargeError';
  }
}

export class SnapshotMemoryCache {
  private readonly entries = new Map<string, SnapshotCacheEntry>();

  constructor(
    private readonly maxEntries = SNAPSHOT_CACHE_MAX_ENTRIES,
    private readonly ttlMs = SNAPSHOT_CACHE_TTL_MS,
  ) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new Error('maxEntries must be a positive integer');
    }
    if (!Number.isFinite(ttlMs) || ttlMs < 0) {
      throw new Error('ttlMs must be a non-negative number');
    }
  }

  get size(): number {
    return this.entries.size;
  }

  get(key: string, now = Date.now()): SnapshotCacheEntry | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;

    if (now - entry.ts >= this.ttlMs) {
      this.entries.delete(key);
      return undefined;
    }

    return entry;
  }

  set(key: string, entry: SnapshotCacheEntry, now = Date.now()): void {
    this.pruneExpired(now);

    if (this.entries.has(key)) {
      this.entries.delete(key);
    }

    while (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value as string | undefined;
      if (!oldestKey) break;
      this.entries.delete(oldestKey);
    }

    this.entries.set(key, entry);
  }

  private pruneExpired(now: number): void {
    for (const [key, entry] of this.entries) {
      if (now - entry.ts >= this.ttlMs) {
        this.entries.delete(key);
      }
    }
  }
}

export async function readResponseBodyWithLimit(
  response: Response,
  maxBytes = SNAPSHOT_MAX_BYTES,
): Promise<ArrayBuffer> {
  const contentLengthHeader = response.headers.get('content-length');
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      await response.body?.cancel().catch(() => {});
      throw new SnapshotBodyTooLargeError(maxBytes);
    }
  }

  const reader = response.body?.getReader();
  if (!reader) return new ArrayBuffer(0);

  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalLength += value.byteLength;
      if (totalLength > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new SnapshotBodyTooLargeError(maxBytes);
      }
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }

  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output.buffer;
}
