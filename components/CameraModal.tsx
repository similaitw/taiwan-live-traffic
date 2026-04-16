'use client';

import { useEffect, useState, useRef } from 'react';
import type { Camera } from '@/types/camera';

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

interface Props {
  camera: Camera | null;
  onClose: () => void;
}

export default function CameraModal({ camera, onClose }: Props) {
  const [streamError, setStreamError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [key, setKey] = useState(0);
  const [imgRetries, setImgRetries] = useState(0);
  const [visible, setVisible] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setStreamError(false);
    setErrorMsg('');
    setKey((k) => k + 1);
    setImgRetries(0);
    setStreamReady(false);
    setSnapshotLoaded(false);

    if (streamTimerRef.current) {
      clearTimeout(streamTimerRef.current);
      streamTimerRef.current = null;
    }

    if (camera) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [camera?.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    };
  }, []);

  if (!camera) return null;

  // Snapshot URL (fast, single frame)
  const snapshotSrc = camera.snapshotUrl || camera.streamUrl;
  const proxySnapshot = snapshotSrc
    ? `/api/proxy/snapshot?url=${encodeURIComponent(snapshotSrc)}`
    : null;

  // Stream URL (MJPEG live, slower to load)
  const proxyStream = camera.streamUrl
    ? `/api/proxy/image?url=${encodeURIComponent(camera.streamUrl)}`
    : null;

  const typeStyle = TYPE_STYLES[camera.type];

  const handleSnapshotLoad = () => {
    setSnapshotLoaded(true);
    // Start loading the stream after a small delay to let the snapshot render
    if (proxyStream) {
      streamTimerRef.current = setTimeout(() => {
        setKey((k) => k + 1);
      }, 200);
    }
  };

  const handleStreamLoad = () => {
    setStreamReady(true);
  };

  const handleStreamError = () => {
    if (imgRetries < 1) {
      setImgRetries((r) => r + 1);
    } else {
      setStreamError(true);
      setErrorMsg('無法從來源載入影像，請確認此攝像頭仍在線上');
    }
  };

  const handleRetry = () => {
    setStreamError(false);
    setErrorMsg('');
    setKey((k) => k + 1);
    setImgRetries(0);
    setStreamReady(false);
  };

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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
              style={{ background: typeStyle.bg, color: typeStyle.text }}>
              {TYPE_LABEL[camera.type]}
            </span>
            <h2 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {camera.name}
            </h2>
            {/* Live status indicator */}
            <span className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full"
              style={{
                background: streamReady ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${streamReady ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
              }}>
              <span className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: streamReady ? '#ef4444' : 'var(--text-muted)',
                  boxShadow: streamReady ? '0 0 6px #ef4444' : 'none',
                  animation: streamReady ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                }} />
              <span className="text-[9px] font-bold font-mono tracking-wider"
                style={{ color: streamReady ? '#ef4444' : 'var(--text-muted)' }}>
                {streamReady ? 'LIVE' : 'LOADING'}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="關閉"
            aria-label="關閉"
            className="shrink-0 ml-3 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video area: snapshot + stream layers */}
        <div className="relative aspect-video" style={{ background: 'var(--bg-primary)' }}>
          {/* Scan line effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]" style={{ zIndex: 10 }}>
            <div className="w-full h-1/3" style={{ background: 'linear-gradient(transparent, rgba(59,130,246,0.3), transparent)', animation: 'scan-line 4s linear infinite' }} />
          </div>

          {!proxySnapshot && !proxyStream ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                <svg className="w-7 h-7" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>此攝像頭無直播來源</p>
            </div>
          ) : !streamError ? (
            <>
              {/* Layer 1: Snapshot (shows immediately) */}
              {proxySnapshot && !streamReady && (
                <img
                  src={proxySnapshot}
                  alt={camera.name}
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ zIndex: 1 }}
                  onLoad={handleSnapshotLoad}
                  onError={() => {
                    // If snapshot fails, try loading stream directly
                    setSnapshotLoaded(true);
                  }}
                />
              )}

              {/* Loading overlay on top of snapshot */}
              {snapshotLoaded && !streamReady && (
                <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none" style={{ zIndex: 3 }}>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                    <div className="w-3 h-3 rounded-full animate-spin"
                      style={{ border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-freeway)' }} />
                    <span className="text-[10px] font-bold font-mono tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      CONNECTING LIVE STREAM...
                    </span>
                  </div>
                </div>
              )}

              {/* Initial loading spinner (before snapshot loads) */}
              {!snapshotLoaded && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full animate-spin"
                      style={{ border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-freeway)' }} />
                    <span className="text-[10px] font-mono tracking-wider" style={{ color: 'var(--text-muted)' }}>LOADING...</span>
                  </div>
                </div>
              )}

              {/* Layer 2: Live stream (loads in background, replaces snapshot when ready) */}
              {proxyStream && snapshotLoaded && (
                <img
                  key={key}
                  src={proxyStream}
                  alt={camera.name}
                  className="absolute inset-0 w-full h-full object-contain transition-opacity duration-500"
                  style={{ zIndex: 2, opacity: streamReady ? 1 : 0 }}
                  onLoad={handleStreamLoad}
                  onError={handleStreamError}
                />
              )}

              {imgRetries > 0 && !streamReady && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.6)', zIndex: 5 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full animate-spin"
                      style={{ border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-freeway)' }} />
                    <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>RETRYING...</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <svg className="w-7 h-7" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{errorMsg || '無法載入影像'}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>此攝像頭可能離線或影像伺服器暫時無法存取</p>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200"
                style={{ background: 'var(--accent-freeway)', color: '#fff', boxShadow: '0 0 12px rgba(59,130,246,0.3)' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(59,130,246,0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 12px rgba(59,130,246,0.3)'; }}
              >
                重試
              </button>
            </div>
          )}
        </div>

        {/* Info footer */}
        <div className="px-5 py-3.5 flex flex-wrap gap-x-5 gap-y-1.5"
          style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-subtle)' }}>
          {camera.road && (
            <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>道路</span> {camera.road}
            </span>
          )}
          {camera.direction && (
            <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>方向</span> {camera.direction}
            </span>
          )}
          <span className="text-xs font-mono flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-sans" style={{ color: 'var(--text-muted)' }}>座標</span>
            {camera.lat.toFixed(5)}, {camera.lng.toFixed(5)}
          </span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
            ID: {camera.id}
          </span>
          {camera.streamUrl && (
            <span className="w-full text-[9px] font-mono mt-1 break-all" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
              {camera.streamUrl}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
