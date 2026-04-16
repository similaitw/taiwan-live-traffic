'use client';

import { useState } from 'react';
import type { Camera } from '@/types/camera';

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

interface Props {
  camera: Camera;
  onClick: (c: Camera) => void;
}

export default function CameraCard({ camera, onClick }: Props) {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [hovered, setHovered] = useState(false);
  const previewSrc = camera.snapshotUrl || camera.streamUrl;
  const proxyUrl = previewSrc
    ? `/api/proxy/snapshot?url=${encodeURIComponent(previewSrc)}&t=${camera.id}`
    : null;

  const typeStyle = TYPE_STYLES[camera.type];

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
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        {/* Snapshot badge */}
        <span className="absolute right-2 top-2 z-10 px-2 py-0.5 rounded-full font-mono"
          style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em', background: 'rgba(0,0,0,0.7)', color: typeStyle.text, border: `1px solid ${typeStyle.text}33` }}>
          快照
        </span>

        {/* Live indicator dot */}
        <span className="absolute left-2 top-2 z-10 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
        </span>

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
              onLoad={() => setImgLoading(false)}
              onError={() => { setImgLoading(false); setImgError(true); }}
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

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center transition-all duration-300"
          style={{ background: hovered ? 'rgba(0,0,0,0.35)' : 'transparent', opacity: hovered ? 1 : 0 }}>
          <span className="px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide glass"
            style={{ color: 'var(--text-primary)' }}>
            點擊播放
          </span>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{ background: 'linear-gradient(transparent, var(--bg-card))' }} />
      </div>

      {/* Info */}
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
