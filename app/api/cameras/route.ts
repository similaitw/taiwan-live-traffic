import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';
import { fetchFreewayCameras } from '@/lib/freeway';
import { fetchProvincialCameras, fetchCountyCameras } from '@/lib/thb';
import type { Camera } from '@/types/camera';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const cached = getCache<Camera[]>('cameras');
  if (cached) {
    return NextResponse.json(cached);
  }

  const results = await Promise.allSettled([
    fetchFreewayCameras(),
    fetchProvincialCameras(),
    fetchCountyCameras(),
  ]);

  const cameras: Camera[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      cameras.push(...result.value);
    } else {
      console.error('[cameras API] source failed:', result.reason);
    }
  }

  setCache('cameras', cameras);
  return NextResponse.json(cameras);
}
