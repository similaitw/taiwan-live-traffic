'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildCameraSearchSuggestions } from '@/lib/camera-search-suggestions';
import type { Camera } from '@/types/camera';

interface Props {
  cameras: Camera[];
  value: string;
  onChange: (value: string) => void;
  onSelectRoad: (road: string) => void;
  onSelectCamera: (camera: Camera) => void;
  placeholder?: string;
}

type FlatSuggestion =
  | { kind: 'road'; key: string; roadNumber: string }
  | { kind: 'area'; key: string; value: string }
  | { kind: 'camera'; key: string; camera: Camera };

export default function CameraSearchBar({
  cameras,
  value,
  onChange,
  onSelectRoad,
  onSelectCamera,
  placeholder,
}: Props) {
  const [local, setLocal] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const blurTimerRef = useRef<number | null>(null);

  const suggestions = useMemo(
    () => buildCameraSearchSuggestions(cameras, local),
    [cameras, local],
  );

  const flatSuggestions = useMemo<FlatSuggestion[]>(() => [
    ...suggestions.roads.map((item) => ({
      kind: 'road' as const,
      key: `road:${item.roadNumber}`,
      roadNumber: item.roadNumber,
    })),
    ...suggestions.areas.map((item) => ({
      kind: 'area' as const,
      key: `area:${item.areaType}:${item.value}`,
      value: item.value,
    })),
    ...suggestions.cameras.map((item) => ({
      kind: 'camera' as const,
      key: `camera:${item.camera.id}`,
      camera: item.camera,
    })),
  ], [suggestions]);

  const hasSuggestions = flatSuggestions.length > 0;
  const showPanel = open && local.trim().length > 0 && hasSuggestions;

  useEffect(() => {
    const timer = window.setTimeout(() => onChange(local), 250);
    return () => window.clearTimeout(timer);
  }, [local, onChange]);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [local]);

  useEffect(() => () => {
    if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
  }, []);

  const closePanel = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const chooseRoad = (roadNumber: string) => {
    setLocal('');
    onChange('');
    closePanel();
    onSelectRoad(roadNumber);
  };

  const chooseArea = (area: string) => {
    setLocal(area);
    onChange(area);
    closePanel();
  };

  const chooseCamera = (camera: Camera) => {
    closePanel();
    onSelectCamera(camera);
  };

  const chooseFlat = (item: FlatSuggestion) => {
    if (item.kind === 'road') chooseRoad(item.roadNumber);
    else if (item.kind === 'area') chooseArea(item.value);
    else chooseCamera(item.camera);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      closePanel();
      return;
    }

    if (!showPanel || flatSuggestions.length === 0) {
      if (event.key === 'ArrowDown' && local.trim()) setOpen(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % flatSuggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => index <= 0 ? flatSuggestions.length - 1 : index - 1);
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const item = flatSuggestions[activeIndex];
      if (item) chooseFlat(item);
    }
  };

  let renderIndex = -1;
  const nextIndex = () => {
    renderIndex += 1;
    return renderIndex;
  };

  return (
    <div className="relative flex-1">
      <span className="absolute inset-y-0 left-3 z-10 flex items-center" style={{ color: 'var(--text-muted)' }}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
      </span>
      <input
        type="text"
        value={local}
        onChange={(event) => {
          setLocal(event.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={(event) => {
          if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
          setOpen(true);
          event.currentTarget.style.borderColor = 'var(--accent-freeway)';
          event.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
        }}
        onBlur={(event) => {
          event.currentTarget.style.borderColor = 'var(--border-subtle)';
          event.currentTarget.style.boxShadow = 'none';
          blurTimerRef.current = window.setTimeout(closePanel, 120);
        }}
        placeholder={placeholder ?? '搜尋路名、地點…'}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls="camera-search-suggestions"
        aria-activedescendant={activeIndex >= 0 ? `camera-search-option-${activeIndex}` : undefined}
        className="w-full rounded-lg py-2 pl-9 pr-9 text-sm font-medium transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
      />

      {local && (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setLocal('');
            onChange('');
            closePanel();
          }}
          aria-label="清除搜尋"
          className="absolute inset-y-0 right-3 z-10 flex items-center transition-colors duration-150"
          style={{ color: 'var(--text-muted)' }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {showPanel && (
        <div
          id="camera-search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-[1200] max-h-[min(50dvh,22rem)] overflow-y-auto overscroll-contain rounded-xl p-2 backdrop-blur-xl"
          style={{
            background: 'rgba(10,14,26,0.97)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          }}
          onMouseDown={(event) => event.preventDefault()}
        >
          {suggestions.roads.length > 0 && (
            <SuggestionSection title="道路">
              {suggestions.roads.map((item) => {
                const index = nextIndex();
                return (
                  <SuggestionButton
                    key={item.roadNumber}
                    id={`camera-search-option-${index}`}
                    active={index === activeIndex}
                    icon="路"
                    title={item.roadNumber}
                    detail={`${item.count} 支 CCTV`}
                    onClick={() => chooseRoad(item.roadNumber)}
                  />
                );
              })}
            </SuggestionSection>
          )}

          {suggestions.areas.length > 0 && (
            <SuggestionSection title="地區">
              {suggestions.areas.map((item) => {
                const index = nextIndex();
                return (
                  <SuggestionButton
                    key={`${item.areaType}:${item.value}`}
                    id={`camera-search-option-${index}`}
                    active={index === activeIndex}
                    icon="地"
                    title={item.label}
                    detail={`${item.count} 支 CCTV`}
                    onClick={() => chooseArea(item.value)}
                  />
                );
              })}
            </SuggestionSection>
          )}

          {suggestions.cameras.length > 0 && (
            <SuggestionSection title="監視器">
              {suggestions.cameras.map((item) => {
                const index = nextIndex();
                const detail = [item.camera.roadNumber ?? item.camera.road, item.camera.direction, item.camera.mile !== undefined ? `${item.camera.mile}K` : undefined]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <SuggestionButton
                    key={item.camera.id}
                    id={`camera-search-option-${index}`}
                    active={index === activeIndex}
                    icon="影"
                    title={item.camera.name}
                    detail={detail || item.camera.id}
                    onClick={() => chooseCamera(item.camera)}
                  />
                );
              })}
            </SuggestionSection>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-1.5 last:mb-0">
      <div className="px-2 pb-1 pt-1 text-[9px] font-black tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function SuggestionButton({
  id,
  active,
  icon,
  title,
  detail,
  onClick,
}: {
  id: string;
  active: boolean;
  icon: string;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left"
      style={{ background: active ? 'rgba(59,130,246,0.16)' : 'transparent' }}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black"
        style={{ background: 'rgba(99,102,241,0.14)', color: '#a5b4fc' }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{title}</span>
        <span className="mt-0.5 block truncate text-[9px]" style={{ color: 'var(--text-muted)' }}>{detail}</span>
      </span>
    </button>
  );
}
