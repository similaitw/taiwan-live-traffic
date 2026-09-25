'use client';

import { SKINS, type SkinId } from '@/lib/skins';
import { useSkin } from '@/hooks/useSkin';

export default function SkinSwitcher({ compact = false }: { compact?: boolean }) {
  const { skin, setSkin } = useSkin();

  return (
    <label
      className={`flex shrink-0 items-center gap-1.5 rounded-xl ${compact ? 'h-10 px-2' : 'h-10 px-2.5'}`}
      style={{ background: 'var(--surface-soft)', border: '1px solid var(--border-subtle)' }}
      title="切換版面 Skin"
    >
      <span aria-hidden="true" className="text-sm">◐</span>
      {!compact && <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Skin</span>}
      <select
        aria-label="版面 Skin"
        value={skin}
        onChange={(event) => setSkin(event.target.value as SkinId)}
        className={`${compact ? 'max-w-[64px]' : 'max-w-[76px]'} cursor-pointer bg-transparent text-[11px] font-black outline-none`}
        style={{ color: 'var(--text-primary)' }}
      >
        {SKINS.map((item) => (
          <option key={item.id} value={item.id} style={{ background: '#111827', color: '#fff' }}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}
