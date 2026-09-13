'use client';

import { useState } from 'react';
import type { Camera, CameraStatus } from '@/types/camera';
import { usePassiveCameraStatus } from '@/hooks/usePassiveCameraStatus';

const TYPE_LABEL: Record<Camera['type'], string> = {
  freeway: '國道',
  provincial: '省道',
  county: '縣市',
};

const TYPE_STYLES: Record<Camera['type'], { bg: string; text: string; glow: string }> = {
  freeway: { bg: 'rgba(59,130,246,0.15)', text: 'var(--accent-freeway)', glow: 'var(--glow-blue)' },
  provincial: { bg: 'rgba(16,185,129,0.15)', text: 'var(--accent-provincial)', glow: 'var(--glow-green)' },
  county: { bg: 'rgba(245,158,11,0.15)', text: 'var(--accent-county)', glow: 'var(--glow-amber)' },
};

const STATUS_STYLES: Record<CameraStatus, { label: string; color: string; bg: string; border: string }> = {
  online: {
    label: '快照可用',
    color: '#6ee7b7',
    bg: 'rgba(6,78,59,0.78)',
    border: 'rgba(110,231,183,0.28)',
  },
  stale: {
    label: '快照待更新',
    color: '#fcd34d',
    bg: 'rgba(120,53,15,0.78)',
    border: 'rgba(252,211,77,0.28)',
  },
  offline: {
    label: '快照暫不可用',
    color: '#fca5a5',
    bg: 'rgba(127,29,29,0.78)',
    border: 'rgba(252,165,165,0.28)',
  },
  unknown: {
    label: '快照待確認',
    color: '#cbd5e1',
    bg: 'rgba(15,23,42,0.78)',
    border: 'rgba(203,213,225,0.2)',
  },
};

interface Props {
  camera: Camera;
  onClick: (c: Camera) => void;
  favorite?: boolean;
  onToggleFavorite?: (c: Camera) => void;
}

export default function CameraCard({ camera, onClick, favorite = false, onToggleFavorite }: Props) {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [hovered, setHovered] = useState(false);
  const { observation, markSnapshotSuccess, markSnapshotFailure } = usePassiveCameraStatus(camera);
  const previewSrc = camera.snapshotUrl || camera.streamUrl;
  const proxyUrl = previewSrc
    ? `/api/proxy/snapshot?url=${encodeURIComponent(previewSrc)}&t=${camera.id}`
    : null;

  const typeStyle = TYPE_STYLES[camera.type];
  const statusStyle = STATUS_STYLES[observation.status];
  const checkedAt = observation.lastCheckedAt
    ? new Date(observation.lastCheckedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    : undefined;

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer transition-all duration-300 animate-fade-in-up"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${hovered ? typeStyle.text : 'var(--border-subtle)'}`,
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.4), ${typeStyle.glow}` : '0 2px 8px rgba(0,0,0,0.2)',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
      onClick={() => onClick(camera)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <span
          className="absolute right-2 top-2 z-10 px-2 py-0.5 rounded-full font-mono"
          title={checkedAt ? `最後檢查 ${checkedAt}` : '尚未完成被動快照檢查'}
          style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            background: statusStyle.bg,
            color: statusStyle.color,
            border: `1px solid ${statusStyle.border}`,
          }}
        >
          {imgLoading && observation.status === 'unknown' ? '快照檢查中' : statusStyle.label}
        </span>

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(camera);
            }}
            aria-label={favorite ? `取消收藏 ${camera.name}` : `收藏 ${camera.name}`}
            title={favorite ? '取消收藏' : '加入收藏'}
            className="absolute left-2 top-2 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{
              background: favorite ? 'rgba(245,158,11,0.92)' : 'rgba(0,0,0,0.68)',
              color: favorite ? '#fff' : 'rgba(255,255,255,0.82)',
              border: `1px solid ${favorite ? 'rgba(245,158,11,0.95)' : 'rgba(255,255,255,0.12)'}`,
              boxShadow: favorite ? '0 0 14px rgba(245,158,11,0.35)' : 'none',
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        )}

        {proxyUrl && !imgError ? (
          <>
            {imgLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-20 animate-shimmer"
                style={{ background: 'var(--bg-secondary)' }}>
                <svg className="w-6 h-6 animate-pulse" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              </div>
            )}
            <img
              loading="lazy"
              src={proxyUrl}
              alt={camera.name}
              className="w-full h-full object-cover transition-transform duration-500"
              style={{ transform: hovered ? 'scale(1.08)' : 'scale(1)', opacity: imgLoading ? 0 : 1 }}
              onLoad={() => {
                setImgLoading(false);
                markSnapshotSuccess();
              }}
              onError={() => {
                setImgLoading(false);
                setImgError(true);
                markSnapshotFailure();
              }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0
                  012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 pointer-events-none"
          style={{ background: hovered ? 'rgba(0,0,0,0.35)' : 'transparent', opacity: hovered ? 1 : 0 }}>
          <span className="px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide glass"
            style={{ color: 'var(--text-primary)' }}>
            點擊查看
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{ background: 'linear-gradient(transparent, var(--bg-card))' }} />
      </div>

      <div className="p-3">
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
            style={{ background: typeStyle.bg, color: typeStyle.text }}>
            {TYPE_LABEL[camera.type]}
          </span>
          <p className="text-xs font-bold line-clamp-2 leading-snug" style={{ color: 'var(--text-primary)' }}>
            {camera.name}
          </p>
        </div>
        {camera.road && (
          <p className="text-[11px] mt-1.5 truncate font-mono" style={{ color: 'var(--text-muted)' }}>
            {camera.road}
          </p>
        )}
      </div>
    </div>
  );
}
