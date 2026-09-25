'use client';

import RoadFilter from '@/components/RoadFilter';
import DirectionFilter from '@/components/DirectionFilter';
import NearbyFilter, { type NearbyRadius } from '@/components/NearbyFilter';
import type { DirectionOption, TravelDirection } from '@/lib/directions';
import type { RoadGroup } from '@/lib/roads';
import {
  MAX_ROUTE_STOPS,
  buildGoogleMapsDirectionsUrl,
  type TrafficMode,
} from '@/lib/route-plan';

interface Props {
  mode: TrafficMode;
  onModeChange: (mode: TrafficMode) => void;
  roadGroups: RoadGroup[];
  selectedRoad: string | null;
  onRoadChange: (road: string | null) => void;
  directionOptions: DirectionOption[];
  selectedDirection: TravelDirection | null;
  onDirectionChange: (direction: TravelDirection | null) => void;
  nearbyRadius: NearbyRadius | null;
  onNearbyChange: (radius: NearbyRadius | null) => void;
  routeFrom: string;
  routeTo: string;
  routeVia: string[];
  onRouteFromChange: (value: string) => void;
  onRouteToChange: (value: string) => void;
  onRouteViaChange: (value: string[]) => void;
  compact?: boolean;
}

const MODES: Array<{ value: TrafficMode; label: string; icon: string }> = [
  { value: 'route', label: '路線', icon: '↗' },
  { value: 'road', label: '道路', icon: '⇢' },
  { value: 'nearby', label: '附近', icon: '◎' },
];

export default function RoutePlanner({
  mode,
  onModeChange,
  roadGroups,
  selectedRoad,
  onRoadChange,
  directionOptions,
  selectedDirection,
  onDirectionChange,
  nearbyRadius,
  onNearbyChange,
  routeFrom,
  routeTo,
  routeVia,
  onRouteFromChange,
  onRouteToChange,
  onRouteViaChange,
  compact = false,
}: Props) {
  const googleMapsUrl = buildGoogleMapsDirectionsUrl({
    from: routeFrom,
    to: routeTo,
    via: routeVia,
  });

  const setVia = (index: number, value: string) => {
    const next = [...routeVia];
    next[index] = value;
    onRouteViaChange(next);
  };

  const removeVia = (index: number) => {
    onRouteViaChange(routeVia.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <section
      className={`rounded-2xl ${compact ? 'glass p-2 shadow-2xl' : 'p-3'}`}
      style={compact ? undefined : {
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid var(--border-subtle)',
      }}
      aria-label="路況模式"
    >
      <div className="grid grid-cols-3 gap-1 rounded-xl p-1"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        {MODES.map((item) => {
          const active = mode === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onModeChange(item.value)}
              className="min-h-9 rounded-lg px-2 text-xs font-black transition-all"
              style={{
                background: active ? 'var(--accent-freeway)' : 'transparent',
                color: active ? '#fff' : 'var(--text-secondary)',
                boxShadow: active ? '0 6px 16px rgba(59,130,246,0.22)' : 'none',
              }}
              aria-pressed={active}
            >
              <span aria-hidden="true" className="mr-1">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>

      {mode === 'route' && (
        <div className={compact ? 'mt-2 space-y-1.5' : 'mt-3 space-y-2'}>
          <div className="grid grid-cols-2 gap-2">
            <RouteInput label="起點" value={routeFrom} onChange={onRouteFromChange} placeholder="羅東" />
            <RouteInput label="終點" value={routeTo} onChange={onRouteToChange} placeholder="台北" />
          </div>

          {routeVia.map((value, index) => (
            <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
              <RouteInput
                label={`途經 ${index + 1}`}
                value={value}
                onChange={(next) => setVia(index, next)}
                placeholder="例如：礁溪"
              />
              <button
                type="button"
                onClick={() => removeVia(index)}
                aria-label={`移除途經點 ${index + 1}`}
                className="mt-4 h-9 w-9 rounded-lg text-sm font-bold"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2">
            {routeVia.length < MAX_ROUTE_STOPS && (
              <button
                type="button"
                onClick={() => onRouteViaChange([...routeVia, ''])}
                className="min-h-9 rounded-lg px-3 text-[11px] font-bold"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                ＋ 途經點
              </button>
            )}
            {googleMapsUrl ? (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex min-h-9 items-center rounded-lg px-3 text-[11px] font-black"
                style={{ background: '#fff', color: '#111827' }}
              >
                Google Maps ↗
              </a>
            ) : (
              <span className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>
                填入起點與終點
              </span>
            )}
          </div>

          {!compact && (
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              V3.1 先保存路線與開啟 Google Maps；V3.2 會依路廊自動排列沿途 CCTV。Google Maps URL 不需要 API Key。
            </p>
          )}
          {routeVia.filter((item) => item.trim()).length > 3 && (
            <p className="text-[10px]" style={{ color: '#fbbf24' }}>
              手機瀏覽器的 Google Maps URL 最多支援 3 個途經點；站內仍會保留完整多點路線。
            </p>
          )}
        </div>
      )}

      {mode === 'road' && (
        <div className="mt-2 flex flex-wrap gap-2">
          <RoadFilter groups={roadGroups} value={selectedRoad} onChange={onRoadChange} compact={compact} />
          <DirectionFilter
            options={directionOptions}
            value={selectedDirection}
            onChange={onDirectionChange}
            compact={compact}
          />
          {!selectedRoad && (
            <span className="self-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
              選道路後依里程查看沿線 CCTV
            </span>
          )}
        </div>
      )}

      {mode === 'nearby' && (
        <div className="mt-2 flex items-center gap-2">
          <NearbyFilter value={nearbyRadius} onChange={onNearbyChange} compact={compact} />
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            使用裝置定位
          </span>
        </div>
      )}
    </section>
  );
}

function RouteInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[9px] font-bold tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg px-2.5 text-xs font-bold outline-none"
        style={{
          background: 'rgba(255,255,255,0.055)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
        }}
      />
    </label>
  );
}
