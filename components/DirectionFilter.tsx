'use client';

import type { DirectionOption, TravelDirection } from '@/lib/directions';

interface Props {
  options: DirectionOption[];
  value: TravelDirection | null;
  onChange: (direction: TravelDirection | null) => void;
  compact?: boolean;
}

export default function DirectionFilter({ options, value, onChange, compact = false }: Props) {
  if (options.length === 0) return null;

  return (
    <label
      className={`shrink-0 flex items-center gap-1.5 rounded-full ${compact ? 'px-2 py-1.5 backdrop-blur-xl' : 'px-2.5 py-1.5'}`}
      style={{
        background: value ? 'rgba(14,165,233,0.16)' : compact ? 'rgba(10,14,26,0.82)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${value ? 'rgba(56,189,248,0.5)' : 'var(--border-subtle)'}`,
        boxShadow: compact ? '0 6px 20px rgba(0,0,0,0.28)' : 'none',
      }}
    >
      <span className="text-[11px] font-bold" style={{ color: value ? '#7dd3fc' : 'var(--text-muted)' }}>
        方向
      </span>
      <select
        aria-label="道路方向篩選"
        value={value ?? ''}
        onChange={(event) => onChange((event.target.value || null) as TravelDirection | null)}
        className="max-w-[96px] bg-transparent text-xs font-bold outline-none cursor-pointer"
        style={{ color: 'var(--text-primary)' }}
      >
        <option value="" style={{ background: '#111827' }}>全部方向</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} style={{ background: '#111827' }}>
            {option.label}（{option.count}）
          </option>
        ))}
      </select>
    </label>
  );
}
