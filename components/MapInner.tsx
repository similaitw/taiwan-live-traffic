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

interface CameraCluster {
  cameras: Camera[];
  lat: number;
  lng: number;
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

function makeClusterIcon(count: number): L.DivIcon {
  const size = count >= 100 ? 52 : count >= 25 ? 46 : 40;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:9999px;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#fff;
      font-family:'JetBrains Mono',monospace;
      font-weight:800;
      font-size:${count >= 100 ? 11 : 12}px;
      background:linear-gradient(135deg,rgba(59,130,246,0.96),rgba(99,102,241,0.96));
      border:2px solid rgba(255,255,255,0.65);
      box-shadow:0 0 0 6px rgba(59,130,246,0.14),0 8px 24px rgba(0,0,0,0.42);
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function clusterCameras(map: L.Map, cameras: Camera[], zoom: number): CameraCluster[] {
  // At close zoom levels individual cameras are more useful than clustering.
  if (zoom >= 15) {
    return cameras.map((camera) => ({ cameras: [camera], lat: camera.lat, lng: camera.lng }));
  }

  const cellSize = zoom <= 7 ? 110 : zoom <= 9 ? 90 : zoom <= 11 ? 72 : zoom <= 13 ? 56 : 42;
  const groups = new Map<string, { cameras: Camera[]; latSum: number; lngSum: number }>();

  for (const camera of cameras) {
    const point = map.project(L.latLng(camera.lat, camera.lng), zoom);
    const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;
    const existing = groups.get(key);

    if (existing) {
      existing.cameras.push(camera);
      existing.latSum += camera.lat;
      existing.lngSum += camera.lng;
    } else {
      groups.set(key, {
        cameras: [camera],
        latSum: camera.lat,
        lngSum: camera.lng,
      });
    }
  }

  return [...groups.values()].map((group) => ({
    cameras: group.cameras,
    lat: group.latSum / group.cameras.length,
    lng: group.lngSum / group.cameras.length,
  }));
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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current).setView([23.9, 121.0], 8);

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

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;

    const renderMarkers = () => {
      const map = mapRef.current!;
      const layer = layerRef.current!;
      layer.clearLayers();

      const filtered = cameras.filter((camera) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          camera.name.toLowerCase().includes(q) ||
          camera.id.toLowerCase().includes(q) ||
          (camera.road?.toLowerCase().includes(q) ?? false)
        );
      });

      const zoom = map.getZoom();
      const clusters = clusterCameras(map, filtered, zoom);

      clusters.forEach((cluster) => {
        if (cluster.cameras.length > 1) {
          const marker = L.marker([cluster.lat, cluster.lng], {
            icon: makeClusterIcon(cluster.cameras.length),
            zIndexOffset: 800,
            keyboard: true,
            title: `${cluster.cameras.length} 支監視器`,
          });

          marker.on('click', () => {
            map.setView([cluster.lat, cluster.lng], Math.min(zoom + 2, 16), {
              animate: true,
              duration: 0.6,
            });
          });

          marker.addTo(layer);
          return;
        }

        const camera = cluster.cameras[0];
        if (!camera) return;

        const marker = L.marker([camera.lat, camera.lng], {
          icon: makeIcon(camera.type),
          zIndexOffset: 1000,
          title: camera.name,
        });
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
                點擊查看
              </div>
            </div>
          </div>
        `;

        const popup = L.popup({ maxWidth: 220, className: 'leaflet-camera-preview' })
          .setContent(previewContent);

        marker.on('mouseover', () => {
          popup.setLatLng(marker.getLatLng()).openOn(map);
        });

        marker.on('mouseout', () => {
          map.closePopup(popup);
        });

        marker.on('click', () => {
          const currentZoom = map.getZoom();
          map.setView(marker.getLatLng(), Math.max(currentZoom, 13), {
            animate: true,
            duration: 0.8,
          });
          map.closePopup(popup);
          onSelect(camera);
        });

        marker.addTo(layer);
      });
    };

    renderMarkers();

    const handleMapChange = () => renderMarkers();
    mapRef.current.on('moveend', handleMapChange);
    mapRef.current.on('zoomend', handleMapChange);

    return () => {
      mapRef.current?.off('moveend', handleMapChange);
      mapRef.current?.off('zoomend', handleMapChange);
    };
  }, [cameras, query, onSelect]);

  return <div ref={containerRef} className="w-full h-full" />;
}
