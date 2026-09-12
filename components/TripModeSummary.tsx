'use client';

import { useEffect, useState } from 'react';
import type { RouteCorridor } from '@/types/route-corridor';

interface Props {
  corridor: RouteCorridor;
}

function sourceValue(available: boolean, value: number | string): number | string {
  return available ? value : '—';
}

function rainfallLabel(corridor: RouteCorridor): string {
  if (corridor.sources.rainfall !== 'available') return '—';
  if (corridor.summary.rainfallStationCount === 0) return '無鄰近站';
  if (corridor.summary.maxPast1Hr === undefined) return '無有效值';
  return `${corridor.summary.maxPast1Hr.toFixed(1)} mm`;
}

export default function TripModeSummary({ corridor }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOpen(window.matchMedia('(min-width: 768px)').matches);
  }, [corridor.roadNumber]);

  const tdxAvailable = corridor.sources.trafficFlow === 'available'
    || corridor.sources.trafficEvents === 'available'
    || corridor.sources.cms === 'available';

  return (
    <div className="pointer-events-none absolute bottom-[8rem] left-3 z-[880] md:bottom-3">
      {open ? (
        <section
          className="pointer-events-auto w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl p-3 backdrop-blur-xl"
          style={{
            background: 'rgba(10,14,26,0.94)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 18px 45px rgba(0,0,0,0.42)',
          }}
          aria-label={`${corridor.roadNumber} 沿線摘要`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black"
                  style={{ background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: '1px solid rgba(129,140,248,0.35)' }}>
                  TRIP MODE
                </span>
                <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                  {corridor.roadNumber} 沿線
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                道路情境聚合，非 A→B 導航路線
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="收合沿線摘要"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
            >
              ×
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric label="目前可見 CCTV" value={corridor.summary.cameraCount} />
            <Metric
              label="壅塞路段"
              value={sourceValue(corridor.sources.trafficFlow === 'available', corridor.summary.congestionSegmentCount)}
              alert={corridor.summary.congestionSegmentCount > 0}
            />
            <Metric
              label="道路事件"
              value={sourceValue(corridor.sources.trafficEvents === 'available', corridor.summary.eventCount)}
              alert={corridor.summary.eventCount > 0}
            />
            <Metric
              label="CMS 訊息"
              value={sourceValue(corridor.sources.cms === 'available', corridor.summary.cmsMessageCount)}
            />
            <Metric
              label="鄰近雨量站"
              value={sourceValue(corridor.sources.rainfall === 'available', corridor.summary.rainfallStationCount)}
            />
            <Metric
              label="近 1 小時最大雨量"
              value={rainfallLabel(corridor)}
              alert={(corridor.summary.maxPast1Hr ?? 0) > 0}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <SourceBadge label="CCTV" available={corridor.sources.cameras === 'available'} />
            <SourceBadge label="TDX" available={tdxAvailable} />
            <SourceBadge label="CWA" available={corridor.sources.rainfall === 'available'} />
          </div>

          {corridor.sources.trafficEvents !== 'available' && corridor.sources.trafficFlow !== 'available' && corridor.sources.cms !== 'available' && (
            <p className="mt-2 text-[10px] leading-relaxed" style={{ color: '#fbbf24' }}>
              TDX 路況資料目前未啟用或暫時不可用；摘要仍保留 CCTV / CWA 可用資訊。
            </p>
          )}
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto flex h-11 items-center gap-2 rounded-full px-3.5 text-xs font-black backdrop-blur-xl"
          style={{
            background: 'rgba(10,14,26,0.9)',
            color: '#fff',
            border: '1px solid rgba(129,140,248,0.45)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.34)',
          }}
          aria-label={`開啟 ${corridor.roadNumber} 沿線摘要`}
        >
          <span aria-hidden="true">⇢</span>
          <span>{corridor.roadNumber} 沿線</span>
          {(corridor.summary.congestionSegmentCount > 0 || corridor.summary.eventCount > 0) && (
            <span className="rounded-full px-1.5 py-0.5 font-mono text-[9px]"
              style={{ background: 'rgba(239,68,68,0.18)', color: '#fca5a5' }}>
              {corridor.summary.congestionSegmentCount + corridor.summary.eventCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function Metric({ label, value, alert = false }: { label: string; value: number | string; alert?: boolean }) {
  return (
    <div className="rounded-xl px-2.5 py-2"
      style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid var(--border-subtle)' }}>
      <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="mt-0.5 text-sm font-black font-mono" style={{ color: alert ? '#fca5a5' : 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

function SourceBadge({ label, available }: { label: string; available: boolean }) {
  return (
    <span className="rounded-full px-2 py-1 text-[9px] font-bold"
      style={{
        background: available ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.08)',
        color: available ? '#6ee7b7' : 'var(--text-muted)',
        border: `1px solid ${available ? 'rgba(16,185,129,0.24)' : 'var(--border-subtle)'}`,
      }}>
      {label} {available ? '可用' : '不可用'}
    </span>
  );
}
