'use client';

import { useEffect, useState } from 'react';

export type EventLayerFilter = 'all' | 'important' | 'serious';
export type FlowLayerFilter = 'all' | 'congested';
export type CmsLayerFilter = 'active' | 'all' | 'abnormal';
export type RainfallLayerFilter = 'rainy' | 'all';
export type LayerHealthStatus = 'loading' | 'ok' | 'partial' | 'disabled' | 'error' | 'stale';

export interface LayerHealth {
  status: LayerHealthStatus;
  provider?: string;
  updatedAt?: string;
  detail?: string;
}

interface Props {
  rainfallEnabled: boolean;
  rainfallHealth: LayerHealth;
  showRainfall: boolean;
  onToggleRainfall: () => void;
  rainfallFilter: RainfallLayerFilter;
  onRainfallFilterChange: (value: RainfallLayerFilter) => void;
  rainfallCount: number;
  rainfallTotal: number;
  showRadar: boolean;
  onToggleRadar: () => void;

  cmsEnabled: boolean;
  cmsHealth: LayerHealth;
  showCms: boolean;
  onToggleCms: () => void;
  cmsFilter: CmsLayerFilter;
  onCmsFilterChange: (value: CmsLayerFilter) => void;
  cmsRoad: string;
  onCmsRoadChange: (value: string) => void;
  cmsRoadOptions: string[];
  cmsCount: number;
  cmsTotal: number;

  flowEnabled: boolean;
  flowHealth: LayerHealth;
  showFlow: boolean;
  onToggleFlow: () => void;
  flowFilter: FlowLayerFilter;
  onFlowFilterChange: (value: FlowLayerFilter) => void;
  flowCount: number;
  flowTotal: number;

  eventsEnabled: boolean;
  eventsHealth: LayerHealth;
  showEvents: boolean;
  onToggleEvents: () => void;
  eventFilter: EventLayerFilter;
  onEventFilterChange: (value: EventLayerFilter) => void;
  eventCount: number;
  eventTotal: number;
}

interface LayerToggleProps {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  count?: number;
  accent: string;
  disabled?: boolean;
  health?: LayerHealth;
}

const HEALTH_META: Record<LayerHealthStatus, { label: string; color: string }> = {
  loading: { label: '載入中', color: '#94a3b8' },
  ok: { label: '正常', color: '#34d399' },
  partial: { label: '部分資料', color: '#fbbf24' },
  disabled: { label: '未啟用', color: '#94a3b8' },
  error: { label: '暫時失敗', color: '#f87171' },
  stale: { label: '資料較舊', color: '#fb923c' },
};

function formatHealthTime(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HealthLine({ health }: { health: LayerHealth }) {
  const meta = HEALTH_META[health.status];
  const time = formatHealthTime(health.updatedAt);
  return (
    <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[9px] leading-4" style={{ color: 'var(--text-muted)' }}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
      <span className="shrink-0" style={{ color: meta.color }}>{meta.label}</span>
      {health.provider && <span className="shrink-0">· {health.provider}</span>}
      {time && <span className="truncate">· {time}</span>}
      {health.detail && <span className="truncate">· {health.detail}</span>}
    </span>
  );
}

function LayerToggle({ label, icon, active, onClick, count, accent, disabled = false, health }: LayerToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className="min-h-11 w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-65"
      style={{
        background: active && !disabled ? `${accent}18` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active && !disabled ? `${accent}66` : 'var(--border-subtle)'}`,
      }}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="text-base leading-none" aria-hidden="true">{icon}</span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold" style={{ color: active && !disabled ? '#fff' : 'var(--text-secondary)' }}>
            {label}
          </span>
          {health && <HealthLine health={health} />}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {count !== undefined && (
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{count}</span>
        )}
        <span
          className="relative h-5 w-9 rounded-full transition-all"
          style={{ background: active && !disabled ? accent : 'rgba(148,163,184,0.18)' }}
        >
          <span
            className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
            style={{ left: active && !disabled ? '1.125rem' : '0.125rem' }}
          />
        </span>
      </span>
    </button>
  );
}

const selectClass = 'h-11 min-w-0 flex-1 rounded-lg px-2.5 text-[11px] font-bold outline-none';
const selectStyle = {
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-subtle)',
};

export default function MapLayerControls(props: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const availableLayerCount = 1
    + (props.rainfallEnabled ? 1 : 0)
    + (props.cmsEnabled ? 1 : 0)
    + (props.flowEnabled ? 1 : 0)
    + (props.eventsEnabled ? 1 : 0);
  const activeLayerCount = Number(props.showRadar)
    + Number(props.rainfallEnabled && props.showRainfall)
    + Number(props.cmsEnabled && props.showCms)
    + Number(props.flowEnabled && props.showFlow)
    + Number(props.eventsEnabled && props.showEvents);

  return (
    <div className="pointer-events-none absolute bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-[900] flex flex-col items-end gap-2 md:bottom-auto md:top-3">
      {open && (
        <div
          id="map-layer-panel"
          role="region"
          aria-label="地圖圖層設定"
          className="pointer-events-auto w-[min(21rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-2xl p-3 backdrop-blur-xl"
          style={{
            maxHeight: 'min(62dvh, 34rem)',
            background: 'rgba(10,14,26,0.94)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 18px 45px rgba(0,0,0,0.45)',
          }}
        >
          <div className="mb-3 flex items-start justify-between gap-3 px-1">
            <div>
              <div className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>地圖圖層</div>
              <div className="mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                CCTV 為基礎圖層；灰色圖層可查看未啟用或失敗原因
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="關閉圖層面板"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
            >
              ×
            </button>
          </div>

          <section className="mb-3">
            <div className="mb-1.5 px-1 text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>天氣</div>
            <div className="space-y-1.5">
              <LayerToggle label="雷達回波" icon="🌦" active={props.showRadar} onClick={props.onToggleRadar} accent="#6366f1" />
              <LayerToggle
                label="雨量觀測站"
                icon="💧"
                active={props.rainfallEnabled && props.showRainfall}
                onClick={props.onToggleRainfall}
                count={props.rainfallEnabled ? (props.showRainfall ? props.rainfallCount : props.rainfallTotal) : undefined}
                accent="#0ea5e9"
                disabled={!props.rainfallEnabled}
                health={props.rainfallHealth}
              />
              {props.rainfallEnabled && props.showRainfall && props.rainfallTotal > 0 && (
                <div className="flex gap-2 px-1 pb-1">
                  <select
                    value={props.rainfallFilter}
                    onChange={(event) => props.onRainfallFilterChange(event.target.value as RainfallLayerFilter)}
                    className={selectClass}
                    style={selectStyle}
                    aria-label="雨量站篩選"
                  >
                    <option value="rainy">近 1 小時有雨</option>
                    <option value="all">全部雨量站</option>
                  </select>
                </div>
              )}
            </div>
          </section>

          <section className="mb-3">
            <div className="mb-1.5 px-1 text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>路況</div>
            <div className="space-y-1.5">
              <LayerToggle
                label="即時車速／壅塞"
                icon="🚗"
                active={props.flowEnabled && props.showFlow}
                onClick={props.onToggleFlow}
                count={props.flowEnabled ? (props.showFlow ? props.flowCount : props.flowTotal) : undefined}
                accent="#10b981"
                disabled={!props.flowEnabled}
                health={props.flowHealth}
              />
              {props.flowEnabled && props.showFlow && props.flowTotal > 0 && (
                <div className="flex gap-2 px-1 pb-1">
                  <select
                    value={props.flowFilter}
                    onChange={(event) => props.onFlowFilterChange(event.target.value as FlowLayerFilter)}
                    className={selectClass}
                    style={selectStyle}
                    aria-label="即時路況篩選"
                  >
                    <option value="all">全部路況</option>
                    <option value="congested">只看壅塞</option>
                  </select>
                </div>
              )}

              <LayerToggle
                label="交通事件"
                icon="⚠️"
                active={props.eventsEnabled && props.showEvents}
                onClick={props.onToggleEvents}
                count={props.eventsEnabled ? (props.showEvents ? props.eventCount : props.eventTotal) : undefined}
                accent="#ef4444"
                disabled={!props.eventsEnabled}
                health={props.eventsHealth}
              />
              {props.eventsEnabled && props.showEvents && props.eventTotal > 0 && (
                <div className="flex gap-2 px-1 pb-1">
                  <select
                    value={props.eventFilter}
                    onChange={(event) => props.onEventFilterChange(event.target.value as EventLayerFilter)}
                    className={selectClass}
                    style={selectStyle}
                    aria-label="交通事件嚴重程度"
                  >
                    <option value="all">全部事件</option>
                    <option value="important">警示以上</option>
                    <option value="serious">嚴重事件</option>
                  </select>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="mb-1.5 px-1 text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>官方資訊</div>
            <div className="space-y-1.5">
              <LayerToggle
                label="CMS 官方看板"
                icon="📢"
                active={props.cmsEnabled && props.showCms}
                onClick={props.onToggleCms}
                count={props.cmsEnabled ? (props.showCms ? props.cmsCount : props.cmsTotal) : undefined}
                accent="#06b6d4"
                disabled={!props.cmsEnabled}
                health={props.cmsHealth}
              />
              {props.cmsEnabled && props.showCms && props.cmsTotal > 0 && (
                <div className="grid grid-cols-2 gap-2 px-1 pb-1 max-[360px]:grid-cols-1">
                  <select
                    value={props.cmsFilter}
                    onChange={(event) => props.onCmsFilterChange(event.target.value as CmsLayerFilter)}
                    className={selectClass}
                    style={selectStyle}
                    aria-label="官方看板篩選"
                  >
                    <option value="active">目前顯示</option>
                    <option value="all">全部設備</option>
                    <option value="abnormal">異常設備</option>
                  </select>
                  <select
                    value={props.cmsRoad}
                    onChange={(event) => props.onCmsRoadChange(event.target.value)}
                    className={selectClass}
                    style={selectStyle}
                    aria-label="官方看板道路"
                  >
                    <option value="">全部道路</option>
                    {props.cmsRoadOptions.map((road) => <option key={road} value={road}>{road}</option>)}
                  </select>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="map-layer-panel"
        aria-label={open ? '收合地圖圖層' : '開啟地圖圖層'}
        className="pointer-events-auto flex h-11 min-w-11 items-center gap-2 rounded-full px-3.5 text-xs font-black backdrop-blur-xl transition-all"
        style={{
          background: open ? 'rgba(59,130,246,0.94)' : 'rgba(10,14,26,0.88)',
          color: '#fff',
          border: `1px solid ${open ? 'rgba(96,165,250,0.9)' : 'var(--border-subtle)'}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.34)',
        }}
      >
        <span aria-hidden="true">◫</span>
        <span>圖層</span>
        <span className="font-mono text-[10px] opacity-70">{activeLayerCount}/{availableLayerCount}</span>
      </button>
    </div>
  );
}
