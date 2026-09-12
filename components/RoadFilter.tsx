'use client';

import type { RoadGroup } from '@/lib/roads';

interface Props {
  groups: RoadGroup[];
  value: string | null;
  onChange: (road: string | null) => void;
  compact?: boolean;
}

export default function RoadFilter({ groups, value, onChange, compact = false }: Props) {
  return (
    <label
      className={`shrink-0 flex items-center gap-1.5 rounded-full ${compact ? 'px-2 py-1.5 backdrop-blur-xl' : 'px-2.5 py-1.5'}`}
      style={{
        background: value ? 'rgba(236,72,153,0.16)' : compact ? 'rgba(10,14,26,0.82)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${value ? 'rgba(236,72,153,0.5)' : 'var(--border-subtle)'}`,
        boxShadow: compact ? '0 6px 20px rgba(0,0,0,0.28)' : 'none',
      }}
    >
      <span className="text-[11px] font-bold" style={{ color: value ? 'var(--accent-pink)' : 'var(--text-muted)' }}>
        道路
      </span>
      <select
        aria-label="道路篩選"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        className="max-w-[110px] bg-transparent text-xs font-bold outline-none cursor-pointer"
        style={{ color: 'var(--text-primary)' }}
      >
        <option value="" style={{ background: '#111827' }}>全部</option>
        {groups.map((group) => (
          <option key={group.roadNumber} value={group.roadNumber} style={{ background: '#111827' }}>
            {group.roadNumber}（{group.count}）
          </option>
        ))}
      </select>
    </label>
  );
}
