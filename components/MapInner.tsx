'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Camera } from '@/types/camera';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const COLORS: Record<Camera['type'], string> = {
  freeway: '#3b82f6',
  provincial: '#10b981',
  county: '#f59e0b',
};

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371e3;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function makeIcon(type: Camera['type']): L.DivIcon {
  const color = COLORS[type];
  return L.divIcon({
    className: '',
    html: `<svg width="24" height="32" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-${type}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feFlood flood-color="${color}" flood-opacity="0.4" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 8 12 20 12 20S24 20 24 12C24 5.373 18.627 0 12 0z"
        fill="${color}" stroke="rgba(255,255,255,0.3)" stroke-width="1" filter="url(#glow-${type})"/>
      <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.9)"/>
    </svg>`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -34],
    tooltipAnchor: [12, -16],
  });
}

interface Props {
  cameras: Camera[];
  query: string;
  onSelect: (c: Camera) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export default function MapInner({ cameras, query, onSelect, userLocation }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current).setView([23.9, 121.0], 8);

    // Dark-themed CartoDB tiles
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }
    ).addTo(mapRef.current);
    layerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Auto-zoom to user location
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
    }

    const userIcon = L.divIcon({
      className: '',
      html: `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="12" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.3)" stroke-width="1"/>
        <circle cx="14" cy="14" r="6" fill="#3b82f6" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>
        <circle cx="14" cy="14" r="2" fill="white"/>
      </svg>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 2000,
    }).addTo(mapRef.current);

    mapRef.current.setView([userLocation.lat, userLocation.lng], 12, { animate: true });
  }, [userLocation]);

  // Render markers
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;

    const renderMarkers = () => {
      layerRef.current!.clearLayers();

      const filtered = cameras.filter((c) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.road?.toLowerCase().includes(q) ?? false)
        );
      });

      const center = mapRef.current!.getCenter();
      const candidates = filtered
        .map((camera) => {
          const distance = getDistance(center.lat, center.lng, camera.lat, camera.lng);
          return { camera, distance };
        })
        .sort((a, b) => a.distance - b.distance);

      const zoom = mapRef.current!.getZoom();
      const MAX_MARKERS = zoom > 10 ? 200 : zoom > 8 ? 100 : 50;
      const shown = candidates.slice(0, MAX_MARKERS);

      shown.forEach(({ camera }) => {
        const marker = L.marker([camera.lat, camera.lng], { icon: makeIcon(camera.type), zIndexOffset: 1000 });
        const color = COLORS[camera.type];

        const previewContent = `
          <div style="width:200px; font-family:'Noto Sans TC',sans-serif;">
            <div style="position:relative; width:100%; aspect-ratio:16/9; overflow:hidden; background:#0a0e1a; margin-bottom:8px; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
              <img src="/api/proxy/snapshot?url=${encodeURIComponent(camera.snapshotUrl ?? camera.streamUrl)}" alt="${camera.name}"
                style="width:100%; height:100%; object-fit:cover;"
                onerror="this.style.display='none'"/>
            </div>
            <div style="padding:0 2px;">
              <div style="font-weight:700; color:#e8ecf4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:12px; line-height:1.4; margin-bottom:4px;">
                ${camera.name}
              </div>
              <div style="color:#4b5563; font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:8px; font-family:'JetBrains Mono',monospace;">
                ${camera.road ?? '—'}
              </div>
              <div style="padding-top:8px; border-top:1px solid rgba(255,255,255,0.06); color:${color}; font-size:10px; font-weight:700; text-align:center; letter-spacing:0.05em;">
                CLICK TO VIEW LIVE
              </div>
            </div>
          </div>
        `;

        const popup = L.popup({ maxWidth: 220, className: 'leaflet-camera-preview' })
          .setContent(previewContent);

        marker.on('mouseover', () => {
          popup.setLatLng(marker.getLatLng()).openOn(mapRef.current!);
        });

        marker.on('mouseout', () => {
          mapRef.current?.closePopup(popup);
        });

        marker.on('click', () => {
          const currentZoom = mapRef.current!.getZoom();
          mapRef.current!.setView(marker.getLatLng(), Math.max(currentZoom, 13), {
            animate: true,
            duration: 0.8
          });
          mapRef.current?.closePopup(popup);
          onSelect(camera);
        });

        marker.addTo(layerRef.current!);
      });

      if (candidates.length > MAX_MARKERS) {
        console.log(`顯示 ${MAX_MARKERS} 個 marker（共 ${candidates.length} 個）`);
      }
    };

    renderMarkers();

    const handleMapChange = () => renderMarkers();
    mapRef.current.on('moveend', handleMapChange);

    return () => {
      mapRef.current?.off('moveend', handleMapChange);
    };
  }, [cameras, query, onSelect]);

  return <div ref={containerRef} className="w-full h-full" />;
}
