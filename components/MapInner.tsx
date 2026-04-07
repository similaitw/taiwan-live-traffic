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

function makeIcon(type: Camera['type'], selected = false): L.DivIcon {
  const color = selected ? '#2563eb' : COLORS[type];
  const stroke = selected ? '#2563eb' : 'white';
  const strokeWidth = selected ? 3 : 1.5;
  return L.divIcon({
    className: '',
    html: `<svg width="22" height="30" viewBox="0 0 22 30" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 0C4.925 0 0 4.925 0 11c0 7.5 11 19 11 19S22 18.5 22 11C22 4.925 17.075 0 11 0z"
        fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
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
  onToggleSelect: (c: Camera) => void;
  selectedIds?: string[];
  userLocation?: { lat: number; lng: number } | null;
  rangeKm?: number | null;
}

export default function MapInner({ cameras, query, onSelect, onToggleSelect, selectedIds, userLocation, rangeKm }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const rangeCircleRef = useRef<L.Circle | null>(null);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current).setView([23.9, 121.0], 8);
    
    // Use OpenStreetMap tiles (free, no limit)
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }
    ).addTo(mapRef.current);
    layerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Auto-zoom 到用戶位置
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    // 移除舊的用戶 marker
    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
    }

    // 添加新的用戶 marker（藍色圓點 + 準確度圓圈）
    const userIcon = L.divIcon({
      className: '',
      html: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 2000,
    }).addTo(mapRef.current);

    // 自動 zoom 到用戶位置（level 12）
    mapRef.current.setView([userLocation.lat, userLocation.lng], 12, { animate: true });
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!userLocation || !rangeKm) {
      if (rangeCircleRef.current) {
        mapRef.current.removeLayer(rangeCircleRef.current);
        rangeCircleRef.current = null;
      }
      return;
    }

    if (rangeCircleRef.current) {
      rangeCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      rangeCircleRef.current.setRadius(rangeKm * 1000);
    } else {
      rangeCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: rangeKm * 1000,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '6',
      }).addTo(mapRef.current);
    }
  }, [userLocation, rangeKm]);

  // Render markers when cameras or query changes
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
          // 永遠以畫面中央作為定位基準
          const distance = getDistance(center.lat, center.lng, camera.lat, camera.lng);
          return { camera, distance };
        })
        .sort((a, b) => a.distance - b.distance);

      // Dynamic marker limit based on zoom
      const zoom = mapRef.current!.getZoom();
      const MAX_MARKERS = zoom > 10 ? 200 : zoom > 8 ? 100 : 50;
      const shown = candidates.slice(0, MAX_MARKERS);

      shown.forEach(({ camera }) => {
        const selected = selectedIds?.includes(camera.id) ?? false;
        const marker = L.marker([camera.lat, camera.lng], { icon: makeIcon(camera.type, selected), zIndexOffset: 1000 });

        // 預覽小窗（滑鼠移入時顯示）
        const previewContent = `
          <div style="width:190px; user-select:none;">
            <div style="position:relative; width:100%; aspect-ratio:16/9; overflow:hidden; background:#1a1a1a; margin-bottom:8px; border-radius:6px; box-shadow: inset 0 0 8px rgba(0,0,0,0.3);">
              <img src="/api/proxy/image?url=${encodeURIComponent(camera.streamUrl)}" alt="${camera.name}" 
                style="width:100%; height:100%; object-fit:cover; transition: transform 0.3s ease;" 
                onerror="this.style.display='none'"/>
            </div>
            <div style="padding: 0 2px;">
              <div style="font-weight:700; color:#1f2937; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:13px; line-height:1.3; margin-bottom:4px;">
                ${camera.name}
              </div>
              <div style="color:#6b7280; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:8px; line-height:1.2;">
                📍 ${camera.road ?? '無道路資訊'}
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px solid #f3f4f6; font-size:11px; font-weight:600; line-height:1.2;">
                <span style="color:${selected ? '#1d4ed8' : '#6b7280'};">${selected ? '已勾選' : 'Shift+Click 勾選'}</span>
                <span style="color:#2563eb; cursor:pointer;">👉 點擊查看即時畫面</span>
              </div>
            </div>
          </div>
        `;

        const popup = L.popup({ maxWidth: 200, className: 'leaflet-camera-preview' })
          .setContent(previewContent);

        marker.on('mouseover', () => {
          popup.setLatLng(marker.getLatLng()).openOn(mapRef.current!);
        });

        marker.on('mouseout', () => {
          mapRef.current?.closePopup(popup);
        });

        marker.on('click', (event: L.LeafletMouseEvent) => {
          if (event.originalEvent?.shiftKey) {
            onToggleSelect(camera);
            return;
          }

          // 平滑移動地圖到此 marker，同時稍微放大
          const currentZoom = mapRef.current!.getZoom();
          mapRef.current!.setView(marker.getLatLng(), Math.max(currentZoom, 13), {
            animate: true,
            duration: 0.8,
          });
          
          // 關閉預覽並打開主窗
          mapRef.current?.closePopup(popup);
          onSelect(camera);
        });

        marker.addTo(layerRef.current!);
      });

      // 不顯示通知 popup，避免重複出現
      if (candidates.length > MAX_MARKERS) {
        console.log(`顯示 ${MAX_MARKERS} 個 marker（共 ${candidates.length} 個），請用搜尋或縮放地圖以檢視其他資料`);
      }
    };

    renderMarkers();
    
    // 移動或縮放地圖時重新渲染 marker（以畫面中央定位）
    const handleMapChange = () => renderMarkers();
    mapRef.current.on('moveend', handleMapChange);

    return () => {
      mapRef.current?.off('moveend', handleMapChange);
    };
  }, [cameras, query, onSelect, onToggleSelect, selectedIds]);

  return (
    <>
      <style>{`
        .leaflet-pane { z-index: 400 !important; }
        .leaflet-marker-pane { z-index: 500 !important; }
        .leaflet-popup-pane { z-index: 1 !important; }
        .leaflet-tooltip-pane { z-index: 1 !important; }
        
        .leaflet-camera-preview .leaflet-popup-content-wrapper {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          padding: 8px !important;
          animation: slideUp 0.2s ease-out;
        }
        
        .leaflet-camera-preview .leaflet-popup-content {
          margin: 0;
          padding: 0;
          font-family: inherit;
        }
        
        .leaflet-camera-preview .leaflet-popup-tip-container {
          display: none;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  );
}
