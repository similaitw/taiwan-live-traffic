'use client';

import { useEffect, useMemo, useState } from 'react';
import { travelDirectionLabel } from '@/lib/directions';
import { getCameraSequencePosition, type CameraSequenceSegment } from '@/lib/camera-sequence';
import type { Camera } from '@/types/camera';

const AUTOPLAY_KEY = 'taiwan-live-traffic:corridor-autoplay:v1';
const SPEED_KEY = 'taiwan-live-traffic:corridor-speed:v1';
const SPEEDS = [3000, 5000, 10000] as const;

interface Props {
  sequence: CameraSequenceSegment;
  activeCameraId?: string | null;
  onActiveChange: (camera: Camera) => void;
  onInspect: (camera: Camera) => void;
}

function cameraMeta(camera: Camera): string {
  return [camera.direction, camera.mile !== undefined ? `${camera.mile}K` : undefined]
    .filter(Boolean)
    .join(' · ');
}

export default function CorridorPlayer({ sequence, activeCameraId, onActiveChange, onInspect }: Props) {
  const [autoplay, setAutoplay] = useState(true);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(5000);
  const position = useMemo(
    () => getCameraSequencePosition(sequence, activeCameraId),
    [activeCameraId, sequence],
  );
  const camera = position.camera;

  useEffect(() => {
    try {
      const storedAutoplay = window.localStorage.getItem(AUTOPLAY_KEY);
      if (storedAutoplay === '0') setAutoplay(false);
      if (storedAutoplay === '1') setAutoplay(true);
      const storedSpeed = Number(window.localStorage.getItem(SPEED_KEY));
      if (SPEEDS.includes(storedSpeed as (typeof SPEEDS)[number])) setSpeed(storedSpeed as (typeof SPEEDS)[number]);
    } catch {}
  }, []);

  useEffect(() => {
    if (!camera || camera.id === activeCameraId) return;
    onActiveChange(camera);
  }, [activeCameraId, camera, onActiveChange]);

  useEffect(() => {
    try {
      window.localStorage.setItem(AUTOPLAY_KEY, autoplay ? '1' : '0');
      window.localStorage.setItem(SPEED_KEY, String(speed));
    } catch {}
  }, [autoplay, speed]);

  useEffect(() => {
    if (!autoplay || sequence.cameras.length < 2 || !camera) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const nextIndex = (position.index + 1) % sequence.cameras.length;
      const next = sequence.cameras[nextIndex];
      if (next) onActiveChange(next);
    }, speed);
    return () => window.clearInterval(timer);
  }, [autoplay, camera, onActiveChange, position.index, sequence.cameras, speed]);

  if (!camera || sequence.cameras.length === 0) return null;

  const snapshotSource = camera.snapshotUrl || camera.streamUrl;
  const snapshotUrl = snapshotSource
    ? `/api/proxy/snapshot?url=${encodeURIComponent(snapshotSource)}&t=${encodeURIComponent(camera.id)}`
    : null;
  const directionLabel = sequence.direction ? travelDirectionLabel(sequence.direction) : '全部方向';

  const go = (index: number) => {
    const target = sequence.cameras[index];
    if (target) onActiveChange(target);
  };

  return (
    <section
      className="fixed bottom-[4.5rem] left-3 right-3 z-[890] md:bottom-4 md:left-[352px] md:right-4 xl:left-[392px]"
      aria-label={`${sequence.roadNumber} 沿線 CCTV 播放器`}
    >
      <div
        className="overflow-hidden rounded-2xl backdrop-blur-xl"
        style={{
          background: 'var(--panel-bg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 18px 50px var(--shadow-strong)',
        }}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2 md:px-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-black md:text-sm" style={{ color: 'var(--text-primary)' }}>
              {sequence.roadNumber} · {directionLabel}
            </div>
            <div className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
              沿線 CCTV {position.position}/{position.total}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
            <span>自動</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoplay}
              onClick={() => setAutoplay((value) => !value)}
              className="relative h-6 w-11 rounded-full transition-colors"
              style={{ background: autoplay ? 'var(--accent-freeway)' : 'var(--surface-soft)' }}
            >
              <span className="absolute top-1 h-4 w-4 rounded-full bg-white transition-all"
                style={{ left: autoplay ? '24px' : '4px' }} />
            </button>
          </div>

          <select
            aria-label="自動播放速度"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value) as (typeof SPEEDS)[number])}
            className="h-8 rounded-lg bg-transparent px-1 text-[10px] font-bold outline-none"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            <option value={3000} style={{ background: '#111827' }}>3秒</option>
            <option value={5000} style={{ background: '#111827' }}>5秒</option>
            <option value={10000} style={{ background: '#111827' }}>10秒</option>
          </select>
        </div>

        <div className="grid grid-cols-[92px_1fr] gap-2 p-2 md:grid-cols-[160px_1fr] md:gap-3 md:p-3">
          <button
            type="button"
            onClick={() => onInspect(camera)}
            className="relative aspect-video overflow-hidden rounded-xl text-left"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
            aria-label={`查看 ${camera.name}`}
          >
            {snapshotUrl ? (
              <img key={camera.id} src={snapshotUrl} alt={camera.name} className="h-full w-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[9px]" style={{ color: 'var(--text-muted)' }}>無快照</span>
            )}
            <span className="absolute bottom-1 right-1 rounded px-1.5 py-0.5 text-[8px] font-black"
              style={{ background: 'rgba(0,0,0,.72)', color: '#fff' }}>
              SNAPSHOT
            </span>
          </button>

          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => onInspect(camera)}
                  className="block max-w-full truncate text-left text-[11px] font-black md:text-sm"
                  style={{ color: 'var(--text-primary)' }}>
                  {camera.name}
                </button>
                <div className="mt-0.5 text-[9px] md:text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {cameraMeta(camera) || camera.id}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" disabled={position.index <= 0} onClick={() => go(position.index - 1)}
                  className="h-8 w-8 rounded-lg text-xs font-black disabled:opacity-30"
                  style={{ background: 'var(--surface-soft)', color: 'var(--text-secondary)' }} aria-label="上一支 CCTV">‹</button>
                <button type="button" disabled={position.index >= sequence.cameras.length - 1} onClick={() => go(position.index + 1)}
                  className="h-8 w-8 rounded-lg text-xs font-black disabled:opacity-30"
                  style={{ background: 'var(--surface-soft)', color: 'var(--text-secondary)' }} aria-label="下一支 CCTV">›</button>
              </div>
            </div>

            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" aria-label="沿線 CCTV 序列">
              {sequence.cameras.map((item, index) => {
                const active = item.id === camera.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(index)}
                    className="min-w-[58px] shrink-0 rounded-lg px-2 py-1.5 text-left md:min-w-[88px]"
                    style={{
                      background: active ? 'var(--accent-freeway)' : 'var(--surface-soft)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${active ? 'transparent' : 'var(--border-subtle)'}`,
                    }}
                    aria-current={active ? 'true' : undefined}
                    title={item.name}
                  >
                    <span className="block font-mono text-[8px] opacity-75">{String(index + 1).padStart(2, '0')}</span>
                    <span className="block truncate text-[9px] font-black md:text-[10px]">
                      {item.mile !== undefined ? `${item.mile}K` : item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
