'use client';

import { useEffect, useState } from 'react';
import type { Camera } from '@/types/camera';

const TYPE_LABEL: Record<Camera['type'], string> = {
  freeway: '國道',
  provincial: '省道',
  county: '縣市',
};

interface Props {
  camera: Camera | null;
  onClose: () => void;
}

export default function CameraModal({ camera, onClose }: Props) {
  const [streamError, setStreamError] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setStreamError(false);
    setKey((k) => k + 1);
  }, [camera?.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!camera) return null;

  const proxyStream = `/api/proxy/image?url=${encodeURIComponent(camera.streamUrl)}`;
  const proxySnapshot = camera.snapshotUrl
    ? `/api/proxy/image?url=${encodeURIComponent(camera.snapshotUrl)}`
    : proxyStream;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${
              camera.type === 'freeway' ? 'bg-blue-100 text-blue-700' :
              camera.type === 'provincial' ? 'bg-green-100 text-green-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {TYPE_LABEL[camera.type]}
            </span>
            <h2 className="text-sm font-semibold text-gray-800 truncate">{camera.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stream */}
        <div className="relative bg-black aspect-video">
          {!streamError ? (
            <img
              key={key}
              src={proxyStream}
              alt={camera.name}
              className="w-full h-full object-contain"
              onError={() => setStreamError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-sm">無法載入影像</p>
              <button
                onClick={() => { setStreamError(false); setKey((k) => k + 1); }}
                className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                重試
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-5 py-3 bg-gray-50 text-xs text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
          {camera.road && <span>道路：{camera.road}</span>}
          {camera.direction && <span>方向：{camera.direction}</span>}
          <span>座標：{camera.lat.toFixed(5)}, {camera.lng.toFixed(5)}</span>
          <span>ID：{camera.id}</span>
        </div>
      </div>
    </div>
  );
}
