'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { Camera } from '@/types/camera';
import type { TrafficEvent, TrafficEventsResponse } from '@/types/traffic-event';

const MapInner = dynamic(() => import('./MapInner'), { ssr: false });

interface Props {
  cameras: Camera[];
  query: string;
  onSelect: (c: Camera) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export default function Map({ cameras, query, onSelect, userLocation }: Props) {
  const [trafficEvents, setTrafficEvents] = useState<TrafficEvent[]>([]);
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [showTrafficEvents, setShowTrafficEvents] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/traffic-events')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<TrafficEventsResponse>;
      })
      .then((payload) => {
        if (cancelled) return;
        setTrafficEnabled(payload.enabled);
        setTrafficEvents(payload.enabled ? payload.events : []);
      })
      .catch(() => {
        if (cancelled) return;
        setTrafficEnabled(false);
        setTrafficEvents([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-none md:rounded-xl"
      style={{
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      <MapInner
        cameras={cameras}
        query={query}
        onSelect={onSelect}
        userLocation={userLocation}
        trafficEvents={showTrafficEvents ? trafficEvents : []}
      />

      {trafficEnabled && (
        <button
          type="button"
          onClick={() => setShowTrafficEvents((value) => !value)}
          className="absolute right-3 bottom-16 md:bottom-auto md:top-3 z-[900] px-3 py-2 rounded-full text-xs font-bold backdrop-blur-xl transition-all"
          style={{
            background: showTrafficEvents ? 'rgba(239,68,68,0.92)' : 'rgba(10,14,26,0.86)',
            color: '#fff',
            border: `1px solid ${showTrafficEvents ? 'rgba(248,113,113,0.9)' : 'var(--border-subtle)'}`,
            boxShadow: '0 8px 22px rgba(0,0,0,0.3)',
          }}
          aria-pressed={showTrafficEvents}
        >
          ⚠ 交通事件 {trafficEvents.length}
        </button>
      )}
    </div>
  );
}
