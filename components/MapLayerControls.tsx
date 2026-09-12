'use client';

import { useEffect, useState } from 'react';

export type EventLayerFilter = 'all' | 'important' | 'serious';
export type FlowLayerFilter = 'all' | 'congested';
export type CmsLayerFilter = 'active' | 'all' | 'abnormal';
export type RainfallLayerFilter = 'rainy' | 'all';

interface Props {
  rainfallEnabled: boolean;
  showRainfall: boolean;
  onToggleRainfall: () => void;
  rainfallFilter: RainfallLayerFilter;
  onRainfallFilterChange: (value: RainfallLayerFilter) => void;
  rainfallCount: number;
  rainfallTotal: number;
  showRadar: boolean;
  onToggleRadar: () => void;

  cmsEnabled: boolean;
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
  showFlow: boolean;
  onToggleFlow: () => void;
  flowFilter: FlowLayerFilter;
  onFlowFilterChange: (value: FlowLayerFilter) => void;
  flowCount: number;
  flowTotal: number;

  eventsEnabled: boolean;
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
}

function LayerToggle({ label, icon, active, onClick, count, accent }: LayerToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="min-h-11 w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
      style={{
        background: active ? `${accent}18` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? `${accent}66` : 'var(--border-subtle)'}`,
      }}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="text-base leading-none" aria-hidden="true">{icon}</span>
        <span className="truncate text-xs font-bold" style={{ color: active ? '#fff' : 'var(--text-secondary)' }}>
          {label}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {count !== undefined && (
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{count}</span>
        )}
        <span
          className="relative h-5 w-9 rounded-full transition-all"
          style={{ background: active ? accent : 'rgba(148,163,184,0.18)' }}
        >
          <span
            className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
            style={{ left: active ? '1.125rem' : '0.125rem' }}
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
                CCTV 為基礎圖層，其他資訊可獨立開關
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
              {props.rainfallEnabled && (
                <>
                  <LayerToggle label="雨量觀測站" icon="💧" active={props.showRainfall} onClick={props.onToggleRainfall} count={props.showRainfall ? props.rainfallCount : props.rainfallTotal} accent="#0ea5e9" />
                  {props.showRainfall && props.rainfallTotal > 0 && (
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
                </>
              )}
            </div>
          </section>

          {(props.flowEnabled || props.eventsEnabled) && (
            <section className="mb-3">
              <div className="mb-1.5 px-1 text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>路況</div>
              <div className="space-y-1.5">
                {props.flowEnabled && (
                  <>
                    <LayerToggle label="即時車速／壅塞" icon="🚗" active={props.showFlow} onClick={props.onToggleFlow} count={props.showFlow ? props.flowCount : props.flowTotal} accent="#10b981" />
                    {props.showFlow && props.flowTotal > 0 && (
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
                  </>
                )}
                {props.eventsEnabled && (
                  <>
                    <LayerToggle label="交通事件" icon="⚠️" active={props.showEvents} onClick={props.onToggleEvents} count={props.showEvents ? props.eventCount : props.eventTotal} accent="#ef4444" />
                    {props.showEvents && props.eventTotal > 0 && (
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
                  </>
                )}
              </div>
            </section>
          )}

          {props.cmsEnabled && (
            <section>
              <div className="mb-1.5 px-1 text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>官方資訊</div>
              <div className="space-y-1.5">
                <LayerToggle label="CMS 官方看板" icon="📢" active={props.showCms} onClick={props.onToggleCms} count={props.showCms ? props.cmsCount : props.cmsTotal} accent="#06b6d4" />
                {props.showCms && props.cmsTotal > 0 && (
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
          )}
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
