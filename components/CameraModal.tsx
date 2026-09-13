'use client';

import { useEffect, useState } from 'react';
import type { Camera, CameraStatus } from '@/types/camera';
import { usePassiveCameraStatus } from '@/hooks/usePassiveCameraStatus';

const TYPE_LABEL: Record<Camera['type'], string> = {
  freeway: '國道',
  provincial: '省道',
  county: '縣市',
};

const TYPE_STYLES: Record<Camera['type'], { bg: string; text: string }> = {
  freeway: { bg: 'rgba(59,130,246,0.15)', text: 'var(--accent-freeway)' },
  provincial: { bg: 'rgba(16,185,129,0.15)', text: 'var(--accent-provincial)' },
  county: { bg: 'rgba(245,158,11,0.15)', text: 'var(--accent-county)' },
};

const PASSIVE_STATUS: Record<CameraStatus, { label: string; color: string; bg: string }> = {
  online: { label: 'SNAPSHOT OK', color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
  stale: { label: 'SNAPSHOT STALE', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
  offline: { label: 'SNAPSHOT UNAVAILABLE', color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  unknown: { label: 'SNAPSHOT CHECK', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)' },
};

type SnapshotState = 'loading' | 'ready' | 'error';
type StreamState = 'idle' | 'loading' | 'ready' | 'error';

interface Props {
  camera: Camera | null;
  onClose: () => void;
}

export default function CameraModal({ camera, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [snapshotState, setSnapshotState] = useState<SnapshotState>('loading');
  const [liveActive, setLiveActive] = useState(false);
  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [streamKey, setStreamKey] = useState(0);
  const { observation, markSnapshotSuccess, markSnapshotFailure } = usePassiveCameraStatus(camera);

  useEffect(() => {
    setSnapshotState('loading');
    setLiveActive(false);
    setStreamState('idle');
    setStreamKey((value) => value + 1);

    if (camera) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [camera?.id, camera]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const stopBackgroundLive = () => {
      if (document.visibilityState === 'hidden') {
        setLiveActive(false);
        setStreamState('idle');
      }
    };
    const handlePageHide = () => {
      setLiveActive(false);
      setStreamState('idle');
    };

    document.addEventListener('visibilitychange', stopBackgroundLive);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', stopBackgroundLive);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  if (!camera) return null;

  const snapshotSrc = camera.snapshotUrl || camera.streamUrl;
  const proxySnapshot = snapshotSrc
    ? `/api/proxy/snapshot?url=${encodeURIComponent(snapshotSrc)}`
    : null;
  const proxyStream = camera.streamUrl
    ? `/api/proxy/image?url=${encodeURIComponent(camera.streamUrl)}`
    : null;
  const typeStyle = TYPE_STYLES[camera.type];
  const passiveStatus = PASSIVE_STATUS[observation.status];
  const checkedAt = observation.lastCheckedAt
    ? new Date(observation.lastCheckedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    : undefined;
  const frameAt = observation.lastFrameAt
    ? new Date(observation.lastFrameAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    : undefined;

  const startLive = () => {
    if (!proxyStream) return;
    setLiveActive(true);
    setStreamState('loading');
    setStreamKey((value) => value + 1);
  };

  const stopLive = () => {
    setLiveActive(false);
    setStreamState('idle');
  };

  const retryLive = () => {
    if (!proxyStream) return;
    setLiveActive(true);
    setStreamState('loading');
    setStreamKey((value) => value + 1);
  };

  const status = liveActive
    ? streamState === 'ready'
      ? { label: 'LIVE', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' }
      : streamState === 'error'
        ? { label: 'LIVE ERROR', color: '#f87171', bg: 'rgba(239,68,68,0.1)' }
        : { label: 'CONNECTING', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' }
    : snapshotState === 'loading' && observation.status === 'unknown'
      ? PASSIVE_STATUS.unknown
      : passiveStatus;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 transition-all duration-300"
      style={{
        zIndex: 99999,
        background: visible ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(8px)' : 'blur(0px)',
      }}
      onClick={onClose}
    >
      <div
        className="overflow-hidden w-full max-w-3xl transition-all duration-300"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          opacity: visible ? 1 : 0,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0" style={{ background: typeStyle.bg, color: typeStyle.text }}>
              {TYPE_LABEL[camera.type]}
            </span>
            <h2 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{camera.name}</h2>
            <span
              className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full"
              style={{ background: status.bg, border: `1px solid ${status.color}55` }}
              title={!liveActive && checkedAt ? `最後快照檢查 ${checkedAt}` : undefined}
              aria-live="polite"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color, boxShadow: streamState === 'ready' && liveActive ? `0 0 6px ${status.color}` : 'none' }} />
              <span className="text-[9px] font-bold font-mono tracking-wider" style={{ color: status.color }}>{status.label}</span>
            </span>
          </div>
          <button type="button" onClick={onClose} title="關閉" aria-label="關閉" className="shrink-0 ml-3 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-150" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="relative aspect-video" style={{ background: 'var(--bg-primary)' }}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]" style={{ zIndex: 10 }}>
            <div className="w-full h-1/3" style={{ background: 'linear-gradient(transparent, rgba(59,130,246,0.3), transparent)', animation: 'scan-line 4s linear infinite' }} />
          </div>

          {!proxySnapshot && !proxyStream ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                <svg className="w-7 h-7" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>此攝像頭無影像來源</p>
            </div>
          ) : (
            <>
              {proxySnapshot && (
                <img
                  src={proxySnapshot}
                  alt={`${camera.name} 快照`}
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ zIndex: 1 }}
                  onLoad={() => {
                    setSnapshotState('ready');
                    markSnapshotSuccess();
                  }}
                  onError={() => {
                    setSnapshotState('error');
                    markSnapshotFailure();
                  }}
                />
              )}

              {!proxySnapshot && !liveActive && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>無快照來源，可手動開啟直播</p></div>
              )}

              {snapshotState === 'loading' && proxySnapshot && !liveActive && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}><div className="w-9 h-9 rounded-full animate-spin" style={{ border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-freeway)' }} /></div>
              )}

              {liveActive && proxyStream && streamState !== 'error' && (
                <img key={streamKey} src={proxyStream} alt={`${camera.name} 即時直播`} className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300" style={{ zIndex: 3, opacity: streamState === 'ready' ? 1 : 0 }} onLoad={() => setStreamState('ready')} onError={() => setStreamState('error')} />
              )}

              {liveActive && streamState === 'loading' && (
                <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none" style={{ zIndex: 4 }}>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass"><div className="w-3 h-3 rounded-full animate-spin" style={{ border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-freeway)' }} /><span className="text-[10px] font-bold font-mono tracking-wider" style={{ color: 'var(--text-secondary)' }}>CONNECTING LIVE STREAM...</span></div>
                </div>
              )}

              {liveActive && streamState === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6" style={{ zIndex: 5, background: 'rgba(10,14,26,0.76)' }}>
                  <p className="text-sm font-medium text-center" style={{ color: 'var(--text-secondary)' }}>直播來源暫時無法連線；快照仍可使用時會保留在背景。</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={retryLive} className="px-4 py-2 text-xs font-bold rounded-lg" style={{ background: 'var(--accent-freeway)', color: '#fff' }}>重試直播</button>
                    <button type="button" onClick={stopLive} className="px-4 py-2 text-xs font-bold rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>回到快照</button>
                  </div>
                </div>
              )}

              {proxyStream && streamState !== 'error' && (
                <div className="absolute bottom-3 right-3 flex gap-2" style={{ zIndex: 12 }}>
                  {liveActive ? (
                    <button type="button" onClick={stopLive} className="h-10 px-4 rounded-full text-xs font-bold backdrop-blur-xl" style={{ background: 'rgba(10,14,26,0.88)', color: '#fff', border: '1px solid rgba(248,113,113,0.7)' }}>停止直播</button>
                  ) : (
                    <button type="button" onClick={startLive} className="h-10 px-4 rounded-full text-xs font-bold backdrop-blur-xl" style={{ background: 'rgba(59,130,246,0.94)', color: '#fff', border: '1px solid rgba(96,165,250,0.9)', boxShadow: '0 8px 22px rgba(0,0,0,0.3)' }}>開啟直播</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-3.5 flex flex-wrap gap-x-5 gap-y-1.5" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-subtle)' }}>
          {camera.road && <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>道路</span> {camera.road}</span>}
          {camera.direction && <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-muted)' }}>方向</span> {camera.direction}</span>}
          <span className="text-xs font-mono flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}><span className="font-sans" style={{ color: 'var(--text-muted)' }}>座標</span>{camera.lat.toFixed(5)}, {camera.lng.toFixed(5)}</span>
          {checkedAt && <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>快照檢查 {checkedAt}</span>}
          {frameAt && <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>最後畫面 {frameAt}</span>}
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>ID: {camera.id}</span>
          <span className="w-full text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>預設顯示單張快照；快照狀態只來自你實際載入過的影像。直播僅在你手動開啟且連線成功時才顯示 LIVE，離開頁面或停止直播會立即卸載。</span>
        </div>
      </div>
    </div>
  );
}
