'use client';

import { useState, useEffect, useRef } from 'react';
import type { Camera } from '@/types/camera';
import CameraCard from './CameraCard';

const INITIAL_LOAD = 4;
const INCREMENT = 12;

interface CameraItem {
  camera: Camera;
  distance?: number;
}

interface Props {
  items: CameraItem[];
  query: string;
  onSelect: (c: Camera) => void;
  selectedIds?: string[];
}

export default function CameraList({ items, query, onSelect, selectedIds }: Props) {
  const [displayCount, setDisplayCount] = useState(INITIAL_LOAD);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const filtered = items.filter(({ camera }) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      camera.name.toLowerCase().includes(q) ||
      camera.id.toLowerCase().includes(q) ||
      (camera.road?.toLowerCase().includes(q) ?? false)
    );
  });

  const visible = filtered.slice(0, displayCount);

  // 無限卷軸邏輯
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
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">找不到符合的監視器</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-500">已載入 {visible.length} / {filtered.length} 台監視器</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {visible.map((item) => (
          <CameraCard
            key={item.camera.id}
            camera={item.camera}
            distance={item.distance}
            selected={selectedIds?.includes(item.camera.id)}
            onClick={onSelect}
          />
        ))}
      </div>
      
      {/* 無限卷軸觸發點 */}
      {displayCount < filtered.length && (
        <div ref={endRef} className="flex justify-center py-6">
          <div className="w-6 h-6 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
        </div>
      )}
    </div>
  );
}
