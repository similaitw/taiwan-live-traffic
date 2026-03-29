'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Camera } from '@/types/camera';

// Fix default marker icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const COLORS: Record<Camera['type'], string> = {
  freeway: '#3b82f6',
  provincial: '#22c55e',
  county: '#f97316',
};

function makeIcon(type: Camera['type']): L.DivIcon {
  const color = COLORS[type];
  return L.divIcon({
    className: '',
    html: `<svg width="22" height="30" viewBox="0 0 22 30" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 0C4.925 0 0 4.925 0 11c0 7.5 11 19 11 19S22 18.5 22 11C22 4.925 17.075 0 11 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="11" cy="11" r="4.5" fill="white" opacity="0.9"/>
    </svg>`,
    iconSize: [22, 30],
    iconAnchor: [11, 30],
    popupAnchor: [0, -32],
    tooltipAnchor: [12, -15],
  });
}

interface Props {
  cameras: Camera[];
  query: string;
  onSelect: (c: Camera) => void;
}

export default function MapInner({ cameras, query, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current).setView([23.9, 121.0], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);
    layerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Render markers when cameras or query changes
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();

    const filtered = cameras.filter((c) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.road?.toLowerCase().includes(q) ?? false)
      );
    });

    filtered.forEach((camera) => {
      const marker = L.marker([camera.lat, camera.lng], { icon: makeIcon(camera.type) });

      // Hover tooltip with snapshot
      const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(camera.streamUrl)}`;
      marker.bindTooltip(
        `<div class="camera-tooltip">
          <img src="${proxyUrl}" alt="${camera.name}"
            onerror="this.style.display='none'"
            style="width:160px;height:90px;object-fit:cover;display:block;border-radius:4px 4px 0 0"/>
          <div style="padding:4px 6px;font-size:11px;font-weight:600;color:#1f2937;max-width:160px;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${camera.name}</div>
        </div>`,
        { direction: 'right', opacity: 1, className: 'leaflet-camera-tooltip' }
      );

      marker.on('click', () => onSelect(camera));
      marker.addTo(layerRef.current!);
    });
  }, [cameras, query, onSelect]);

  return (
    <>
      <style>{`
        .leaflet-camera-tooltip { padding: 0; background: white; border: 1px solid #e5e7eb;
          border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .leaflet-camera-tooltip::before { display: none; }
        .leaflet-tooltip.leaflet-camera-tooltip { padding: 0; }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  );
}
