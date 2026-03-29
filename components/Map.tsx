'use client';

import dynamic from 'next/dynamic';
import type { Camera } from '@/types/camera';

const MapInner = dynamic(() => import('./MapInner'), { ssr: false });

interface Props {
  cameras: Camera[];
  query: string;
  onSelect: (c: Camera) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export default function Map({ cameras, query, onSelect, userLocation }: Props) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200">
      <MapInner
        cameras={cameras}
        query={query}
        onSelect={onSelect}
        userLocation={userLocation}
      />
    </div>
  );
}
