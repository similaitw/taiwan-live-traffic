'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Camera } from '@/types/camera';
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

function cameraMeta(camera: Camera): string {
  const parts: string[] = [];
  if (camera.direction) parts.push(camera.direction);
  if (camera.mile !== undefined) parts.push(`${camera.mile}K`);
  return parts.join(' · ');
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function corridorUrl(corridor: RouteCorridor, cameraId?: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set('road', corridor.roadNumber);

  if (corridor.direction) url.searchParams.set('direction', corridor.direction);
  else url.searchParams.delete('direction');

  if (cameraId) url.searchParams.set('camera', cameraId);
  else url.searchParams.delete('camera');

  // A corridor share should reopen the road context without unrelated filters
  // accidentally narrowing it to an empty result set.
  url.searchParams.delete('q');
  url.searchParams.delete('type');
  url.searchParams.delete('nearby');

  return url.toString();
}

export default function TripModeSummary({ corridor }: Props) {
  const [open, setOpen] = useState(false);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOpen(window.matchMedia('(min-width: 768px)').matches);
  }, [corridor.roadNumber]);

  useEffect(() => {
    setCameraIndex(0);
  }, [corridor.direction, corridor.roadNumber]);

  useEffect(() => {
    if (cameraIndex < corridor.cameras.length) return;
    setCameraIndex(Math.max(0, corridor.cameras.length - 1));
  }, [cameraIndex, corridor.cameras.length]);

  const selectedCamera = corridor.cameras[cameraIndex];
  const selectedCameraMeta = useMemo(
    () => selectedCamera ? cameraMeta(selectedCamera) : '',
    [selectedCamera],
  );

  const tdxAvailable = corridor.sources.trafficFlow === 'available'
    || corridor.sources.trafficEvents === 'available'
    || corridor.sources.cms === 'available';

  const handleShare = async () => {
    const shareUrl = corridorUrl(corridor);
    const directionText = corridor.direction ? ` ${corridor.direction}` : '';

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${corridor.roadNumber}${directionText} 沿線路況`,
          text: `${corridor.roadNumber}${directionText} 沿線即時交通情境`,
          url: shareUrl,
        });
        return;
      }

      await copyText(shareUrl);
      setShareStatus('copied');
      window.setTimeout(() => setShareStatus('idle'), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try {
        await copyText(shareUrl);
        setShareStatus('copied');
        window.setTimeout(() => setShareStatus('idle'), 1800);
      } catch {
        // The current URL remains available for manual copying.
      }
    }
  };

  const openCamera = (camera: Camera) => {
    // Re-enter the existing camera workflow instead of creating a second viewer:
    // mobile restores the Bottom Sheet; desktop restores the snapshot-first Modal.
    window.location.assign(corridorUrl(corridor, camera.id));
  };

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
                  {corridor.roadNumber}{corridor.direction ? ` ${corridor.direction}` : ''} 沿線
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                道路情境聚合，非 A→B 導航路線
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={handleShare}
                aria-label={`分享 ${corridor.roadNumber} 沿線路況`}
                className="flex h-9 items-center justify-center rounded-full px-2.5 text-[10px] font-bold"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: shareStatus === 'copied' ? '#6ee7b7' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {shareStatus === 'copied' ? '已複製' : '分享'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="收合沿線摘要"
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
              >
                ×
              </button>
            </div>
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

          {selectedCamera && (
            <div className="mt-3 rounded-xl p-2.5"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(129,140,248,0.24)' }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold" style={{ color: '#a5b4fc' }}>
                  沿線 CCTV {cameraIndex + 1}/{corridor.cameras.length}
                </span>
                <span className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  依里程排序
                </span>
              </div>
              <div className="mt-1 truncate text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                {selectedCamera.name}
              </div>
              {selectedCameraMeta && (
                <div className="mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {selectedCameraMeta}
                </div>
              )}
              <div className="mt-2 grid grid-cols-[1fr_1fr_1.35fr] gap-1.5">
                <button
                  type="button"
                  onClick={() => setCameraIndex((index) => Math.max(0, index - 1))}
                  disabled={cameraIndex === 0}
                  className="min-h-10 rounded-lg text-[10px] font-bold"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)',
                    opacity: cameraIndex === 0 ? 0.4 : 1,
                  }}
                >
                  上一支
                </button>
                <button
                  type="button"
                  onClick={() => setCameraIndex((index) => Math.min(corridor.cameras.length - 1, index + 1))}
                  disabled={cameraIndex >= corridor.cameras.length - 1}
                  className="min-h-10 rounded-lg text-[10px] font-bold"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)',
                    opacity: cameraIndex >= corridor.cameras.length - 1 ? 0.4 : 1,
                  }}
                >
                  下一支
                </button>
                <button
                  type="button"
                  onClick={() => openCamera(selectedCamera)}
                  className="min-h-10 rounded-lg text-[10px] font-black"
                  style={{ background: '#4f46e5', color: '#fff' }}
                >
                  查看 CCTV
                </button>
              </div>
            </div>
          )}

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
          <span>{corridor.roadNumber}{corridor.direction ? ` ${corridor.direction}` : ''} 沿線</span>
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
