'use client';

import { useState } from 'react';
import type { Camera } from '@/types/camera';

interface Props {
  camera: Camera;
  compact?: boolean;
  className?: string;
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

export default function CameraShareButton({ camera, compact = false, className = '' }: Props) {
  const [status, setStatus] = useState<'idle' | 'copied'>('idle');

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('camera', camera.id);
    const shareUrl = url.toString();

    try {
      if (navigator.share) {
        await navigator.share({
          title: camera.name,
          text: `${camera.name} 即時路況`,
          url: shareUrl,
        });
        return;
      }

      await copyText(shareUrl);
      setStatus('copied');
      window.setTimeout(() => setStatus('idle'), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try {
        await copyText(shareUrl);
        setStatus('copied');
        window.setTimeout(() => setStatus('idle'), 1800);
      } catch {
        // Leave the browser URL intact so it can still be copied manually.
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={`分享 ${camera.name}`}
      title="分享這支監視器"
      className={`${compact ? 'w-9 h-9 rounded-full' : 'h-10 px-3 rounded-xl'} flex items-center justify-center gap-1.5 font-bold transition-all ${className}`}
      style={{
        background: 'rgba(255,255,255,0.08)',
        color: status === 'copied' ? 'var(--accent-provincial)' : 'var(--text-primary)',
        border: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.368-2.684 3 3 0 00-5.368 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      {!compact && <span className="text-xs">{status === 'copied' ? '已複製' : '分享'}</span>}
    </button>
  );
}
