'use client';

export type NearbyRadius = 5 | 10 | 20;

interface Props {
  value: NearbyRadius | null;
  onChange: (radius: NearbyRadius | null) => void;
  compact?: boolean;
  disabled?: boolean;
}

const RADII: NearbyRadius[] = [5, 10, 20];

export default function NearbyFilter({ value, onChange, compact = false, disabled = false }: Props) {
  return (
    <div
      className={`shrink-0 flex items-center gap-1 rounded-full ${compact ? 'p-1 backdrop-blur-xl' : 'p-1'}`}
      style={{
        background: compact ? 'rgba(10,14,26,0.82)' : 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border-subtle)',
        boxShadow: compact ? '0 6px 20px rgba(0,0,0,0.28)' : 'none',
        opacity: disabled ? 0.65 : 1,
      }}
      aria-label="附近監視器半徑"
    >
      <button
        type="button"
        onClick={() => onChange(null)}
        className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold transition-all"
        style={{
          background: value === null ? 'rgba(16,185,129,0.9)' : 'transparent',
          color: value === null ? '#fff' : 'var(--text-muted)',
        }}
      >
        附近
      </button>
      {RADII.map((radius) => (
        <button
          key={radius}
          type="button"
          onClick={() => onChange(radius)}
          className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold transition-all"
          style={{
            background: value === radius ? 'rgba(16,185,129,0.9)' : 'transparent',
            color: value === radius ? '#fff' : 'var(--text-secondary)',
          }}
        >
          {radius}km
        </button>
      ))}
    </div>
  );
}
