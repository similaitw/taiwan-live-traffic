'use client';

import { useEffect, useState } from 'react';
import type { Camera } from '@/types/camera';
import CameraShareButton from './CameraShareButton';

const TYPE_LABEL: Record<Camera['type'], string> = {
  freeway: '國道',
  provincial: '省道',
  county: '縣市',
};

const TYPE_STYLES: Record<Camera['type'], { bg: string; text: string }> = {
  freeway: { bg: 'rgba(59,130,246,0.15)', text: 'var(--accent-freeway)' },
  provincial: { bg: 'rgba(16,185,129,0.15)', text: 'var(--accent-provincial)' },
  county: { bg: 'rgba(245,158,11,0.15)', text: 'var(--accent-county)' },
};

interface Props {
  camera: Camera | null;
  onClose: () => void;
  onOpenLive: (camera: Camera) => void;
  favorite?: boolean;
  onToggleFavorite?: (camera: Camera) => void;
}

export default function CameraBottomSheet({
  camera,
  onClose,
  onOpenLive,
  favorite = false,
  onToggleFavorite,
}: Props) {
  const [snapshotState, setSnapshotState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    setSnapshotState('loading');
  }, [camera?.id]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!camera) return null;

  const previewSrc = camera.snapshotUrl || camera.streamUrl;
  const proxySnapshot = previewSrc
    ? `/api/proxy/snapshot?url=${encodeURIComponent(previewSrc)}&t=${camera.id}`
    : null;
  const typeStyle = TYPE_STYLES[camera.type];

  const statusText = snapshotState === 'ready'
    ? '快照可用'
    : snapshotState === 'error'
      ? '來源異常'
      : '確認中';

  const statusColor = snapshotState === 'ready'
    ? 'var(--accent-provincial)'
    : snapshotState === 'error'
      ? '#ef4444'
      : 'var(--text-muted)';

  return (
    <section
      className="md:hidden fixed inset-x-0 bottom-0 z-[9998] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="監視器資訊"
    >
      <div
        className="overflow-hidden rounded-t-2xl rounded-b-xl"
        style={{
          background: 'rgba(17,24,39,0.97)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 -18px 50px rgba(0,0,0,0.45)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <div className="flex justify-center pt-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.16)' }} />
        </div>

        <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
                style={{ background: typeStyle.bg, color: typeStyle.text }}
              >
                {TYPE_LABEL[camera.type]}
              </span>
              <span className="text-[10px] font-bold flex items-center gap-1.5" style={{ color: statusColor }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                {statusText}
              </span>
            </div>
            <h2 className="text-sm font-bold line-clamp-2" style={{ color: 'var(--text-primary)' }}>
              {camera.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CameraShareButton camera={camera} compact />
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(camera)}
                aria-label={favorite ? '取消收藏' : '加入收藏'}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: favorite ? 'rgba(245,158,11,0.92)' : 'rgba(255,255,255,0.05)',
                  color: favorite ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${favorite ? 'rgba(245,158,11,0.95)' : 'var(--border-subtle)'}`,
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉監視器資訊"
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-4">
          <div className="relative aspect-video overflow-hidden rounded-xl" style={{ background: 'var(--bg-primary)' }}>
            {proxySnapshot ? (
              <>
                {snapshotState === 'loading' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full animate-spin"
                      style={{ border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-freeway)' }} />
                  </div>
                )}
                <img
                  src={proxySnapshot}
                  alt={camera.name}
                  className="w-full h-full object-cover"
                  style={{ opacity: snapshotState === 'ready' ? 1 : 0 }}
                  onLoad={() => setSnapshotState('ready')}
                  onError={() => setSnapshotState('error')}
                />
                {snapshotState === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center">
                    <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>目前無法取得快照，可嘗試開啟直播來源</p>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                此監視器沒有快照來源
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {camera.road && (
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>道路 </span>{camera.road}
            </span>
          )}
          {camera.direction && (
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>方向 </span>{camera.direction}
            </span>
          )}
          {camera.mile !== undefined && (
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>里程 </span>{camera.mile}K
            </span>
          )}
        </div>

        <div className="p-4 pt-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            返回地圖
          </button>
          <button
            type="button"
            onClick={() => onOpenLive(camera)}
            disabled={!camera.streamUrl}
            className="flex-[1.4] py-2.5 rounded-xl text-sm font-bold"
            style={{
              background: camera.streamUrl ? 'var(--accent-freeway)' : 'rgba(255,255,255,0.05)',
              color: camera.streamUrl ? '#fff' : 'var(--text-muted)',
              opacity: camera.streamUrl ? 1 : 0.5,
              boxShadow: camera.streamUrl ? '0 0 18px rgba(59,130,246,0.25)' : 'none',
            }}
          >
            開啟直播
          </button>
        </div>
      </div>
    </section>
  );
}
