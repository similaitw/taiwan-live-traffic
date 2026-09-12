'use client';

import type { Camera } from '@/types/camera';
import type { RoadNeighbors } from '@/lib/roads';

interface Props {
  neighbors: RoadNeighbors | null | undefined;
  onNavigate: (camera: Camera) => void;
  compact?: boolean;
  className?: string;
}

export default function RoadCameraNavigator({
  neighbors,
  onNavigate,
  compact = false,
  className = '',
}: Props) {
  if (!neighbors || neighbors.total <= 1) return null;

  const label = [neighbors.roadNumber, neighbors.direction].filter(Boolean).join(' ');

  return (
    <div
      className={`flex items-center gap-2 ${compact ? 'w-full' : ''} ${className}`}
      style={{
        background: 'rgba(17,24,39,0.94)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        padding: compact ? '8px' : '8px 10px',
        boxShadow: compact ? 'none' : '0 12px 30px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(14px)',
      }}
      aria-label="沿線監視器導覽"
    >
      <button
        type="button"
        disabled={!neighbors.previous}
        onClick={() => neighbors.previous && onNavigate(neighbors.previous)}
        className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-all"
        style={{
          background: neighbors.previous ? 'rgba(59,130,246,0.14)' : 'rgba(255,255,255,0.03)',
          color: neighbors.previous ? 'var(--accent-freeway)' : 'var(--text-muted)',
          opacity: neighbors.previous ? 1 : 0.45,
          cursor: neighbors.previous ? 'pointer' : 'not-allowed',
        }}
      >
        ← 上一支
      </button>

      <div className="min-w-0 flex-1 text-center px-1">
        {label && (
          <p className="truncate text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </p>
        )}
        <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          {neighbors.position} / {neighbors.total}
        </p>
      </div>

      <button
        type="button"
        disabled={!neighbors.next}
        onClick={() => neighbors.next && onNavigate(neighbors.next)}
        className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-all"
        style={{
          background: neighbors.next ? 'rgba(59,130,246,0.14)' : 'rgba(255,255,255,0.03)',
          color: neighbors.next ? 'var(--accent-freeway)' : 'var(--text-muted)',
          opacity: neighbors.next ? 1 : 0.45,
          cursor: neighbors.next ? 'pointer' : 'not-allowed',
        }}
      >
        下一支 →
      </button>
    </div>
  );
}
