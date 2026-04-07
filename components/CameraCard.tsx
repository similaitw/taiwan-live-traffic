'use client';

import { useState } from 'react';
import type { Camera } from '@/types/camera';

const TYPE_LABEL: Record<Camera['type'], string> = {
  freeway: '國道',
  provincial: '省道',
  county: '縣市',
};

const TYPE_COLOR: Record<Camera['type'], string> = {
  freeway: 'bg-blue-100 text-blue-700',
  provincial: 'bg-green-100 text-green-700',
  county: 'bg-orange-100 text-orange-700',
};

interface Props {
  camera: Camera;
  distance?: number;
  selected?: boolean;
  onClick: (c: Camera) => void;
}

export default function CameraCard({ camera, distance, selected, onClick }: Props) {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const sourceLabel = camera.snapshotUrl ? '抓圖來源' : '直播來源';
  const proxyUrl = (camera.snapshotUrl || camera.streamUrl)
    ? `/api/proxy/image?url=${encodeURIComponent(camera.snapshotUrl ?? camera.streamUrl)}&t=${camera.id}`
    : null;

  return (
    <div
      className={`relative rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all group bg-white ${selected ? 'ring-2 ring-blue-500/50' : ''}`}
      onClick={() => onClick(camera)}
    >
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <span className="absolute right-2 top-2 z-10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white rounded-full bg-black/70">
          {sourceLabel}
        </span>
        {selected && (
          <span className="absolute left-2 top-2 z-10 px-2 py-0.5 text-[10px] font-semibold text-white rounded-full bg-blue-600">
            已勾選
          </span>
        )}
        {proxyUrl && !imgError ? (
          <>
            {imgLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-20">
                <div className="animate-pulse">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                </div>
              </div>
            )}
            <img
              loading="lazy"
              src={proxyUrl}
              alt={camera.name}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setImgLoading(false)}
              onError={() => { setImgLoading(false); setImgError(true); }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0
                  012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center
          justify-center opacity-0 group-hover:opacity-100 transition-all">
          <span className="bg-white/90 rounded-full px-3 py-1 text-xs font-medium text-gray-700">
            點擊播放
          </span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start gap-2">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${TYPE_COLOR[camera.type]}`}>
            {TYPE_LABEL[camera.type]}
          </span>
          <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">{camera.name}</p>
        </div>
        {camera.road && (
          <p className="text-xs text-gray-500 mt-1 truncate">{camera.road}</p>
        )}
        {distance !== undefined && distance !== Infinity && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            距離 { (distance / 1000).toFixed(1) } 公里
          </p>
        )}
      </div>
    </div>
  );
}
