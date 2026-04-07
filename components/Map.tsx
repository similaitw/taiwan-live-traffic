'use client';

import dynamic from 'next/dynamic';
import type { Camera } from '@/types/camera';

const MapInner = dynamic(() => import('./MapInner'), { ssr: false });

interface Props {
  cameras: Camera[];
  query: string;
  onSelect: (c: Camera) => void;
  onToggleSelect: (c: Camera) => void;
  selectedIds?: string[];
  userLocation?: { lat: number; lng: number } | null;
  rangeKm?: number | null;
}

export default function Map({ cameras, query, onSelect, onToggleSelect, selectedIds, userLocation, rangeKm }: Props) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200">
      <MapInner
        cameras={cameras}
        query={query}
        onSelect={onSelect}
        onToggleSelect={onToggleSelect}
        selectedIds={selectedIds}
        userLocation={userLocation}
        rangeKm={rangeKm}
      />
    </div>
  );
}
