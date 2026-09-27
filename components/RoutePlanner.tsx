'use client';

import RoadFilter from '@/components/RoadFilter';
import DirectionFilter from '@/components/DirectionFilter';
import NearbyFilter, { type NearbyRadius } from '@/components/NearbyFilter';
import SkinSwitcher from '@/components/SkinSwitcher';
import type { DirectionOption, TravelDirection } from '@/lib/directions';
import type { RoadGroup } from '@/lib/roads';
import { MAX_ROUTE_STOPS, type TrafficMode } from '@/lib/route-plan';
import type { PlannedRoute } from '@/lib/route-routing';

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
  onPlanRoute: () => void;
  routePlanning: boolean;
  routeError?: string | null;
  routeResult?: PlannedRoute | null;
  routeCameraCount?: number | null;
  compact?: boolean;
}

const MODES: Array<{ value: TrafficMode; label: string; icon: string }> = [
  { value: 'route', label: '路線', icon: '↗' },
  { value: 'road', label: '道路', icon: '⇢' },
  { value: 'nearby', label: '附近', icon: '◎' },
];

function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`
    : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `約 ${minutes} 分`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `約 ${hours} 小時 ${rest} 分` : `約 ${hours} 小時`;
}

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
  onPlanRoute,
  routePlanning,
  routeError,
  routeResult,
  routeCameraCount,
  compact = false,
}: Props) {
  const setVia = (index: number, value: string) => {
    const next = [...routeVia];
    next[index] = value;
    onRouteViaChange(next);
  };

  const removeVia = (index: number) => {
    onRouteViaChange(routeVia.filter((_, itemIndex) => itemIndex !== index));
  };

  const canPlan = Boolean(routeFrom.trim() && routeTo.trim());

  return (
    <section
      className={`rounded-2xl ${compact ? 'glass p-2 shadow-2xl' : 'p-3'}`}
      style={compact ? undefined : {
        background: 'var(--surface-soft)',
        border: '1px solid var(--border-subtle)',
      }}
      aria-label="路況模式"
    >
      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-3 gap-1 rounded-xl p-1"
          style={{ background: 'var(--surface-soft)' }}>
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
        <SkinSwitcher compact={compact} />
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
                style={{ background: 'var(--surface-soft)', color: 'var(--text-muted)' }}
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
                className="min-h-10 rounded-xl px-3 text-[11px] font-bold"
                style={{
                  background: 'var(--surface-soft)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                ＋ 途經點
              </button>
            )}

            <button
              type="button"
              onClick={onPlanRoute}
              disabled={!canPlan || routePlanning}
              className="ml-auto min-h-10 rounded-xl px-4 text-[11px] font-black disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'var(--accent-freeway)', color: '#fff' }}
            >
              {routePlanning ? '規畫中…' : '規畫路線'}
            </button>
          </div>

          {routeError && (
            <div
              className="rounded-lg px-2.5 py-2 text-[10px] font-bold"
              style={{
                background: 'rgba(239,68,68,.10)',
                color: '#fca5a5',
                border: '1px solid rgba(239,68,68,.22)',
              }}
            >
              {routeError}
            </div>
          )}

          {routeResult && (
            <div
              className="rounded-xl px-3 py-2"
              style={{ background: 'var(--surface-soft)', border: '1px solid var(--border-subtle)' }}
            >
              <div
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-black"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>✓ {formatDistance(routeResult.distanceMeters)}</span>
                <span>{formatDuration(routeResult.durationSeconds)}</span>
                <span style={{ color: 'var(--accent-freeway)' }}>
                  沿途 CCTV {routeCameraCount ?? 0} 支
                </span>
              </div>
              {!compact && (
                <div className="mt-1 truncate text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  {routeResult.stops.map((stop) => stop.label).join(' → ')}
                </div>
              )}
            </div>
          )}

          {!routeResult && !routeError && !compact && (
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              按「規畫路線」後會直接在站內畫路線，並自動排列路線附近 CCTV；不再依賴 Google Maps。
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
          background: 'var(--surface-soft)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
        }}
      />
    </label>
  );
}
