'use client';

import { useState, useEffect, useRef } from 'react';
import type { Camera } from '@/types/camera';
import CameraCard from './CameraCard';

const INITIAL_LOAD = 4;
const INCREMENT = 12;

interface Props {
  cameras: Camera[];
  query: string;
  onSelect: (c: Camera) => void;
}

export default function CameraList({ cameras, query, onSelect }: Props) {
  const [displayCount, setDisplayCount] = useState(INITIAL_LOAD);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const filtered = cameras.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.road?.toLowerCase().includes(q) ?? false)
    );
  });

  const visible = filtered.slice(0, displayCount);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && displayCount < filtered.length) {
          setDisplayCount((prev) => Math.min(prev + INCREMENT, filtered.length));
        }
      },
      { rootMargin: '100px' }
    );

    if (endRef.current) {
      observer.observe(endRef.current);
    }

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [displayCount, filtered.length]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
          <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>找不到符合的監視器</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>試試其他關鍵字或篩選條件</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] font-mono tracking-wider" style={{ color: 'var(--text-muted)' }}>
        SHOWING {visible.length} / {filtered.length} CAMERAS
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {visible.map((c, i) => (
          <div key={c.id} style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
            <CameraCard camera={c} onClick={onSelect} />
          </div>
        ))}
      </div>

      {displayCount < filtered.length && (
        <div ref={endRef} className="flex justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full animate-spin"
              style={{ border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-freeway)' }} />
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>LOADING MORE...</span>
          </div>
        </div>
      )}
    </div>
  );
}
