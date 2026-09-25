export type SkinId = 'obsidian' | 'ocean' | 'forest' | 'plum';

export interface SkinDefinition {
  id: SkinId;
  name: string;
  description: string;
}

export const DEFAULT_SKIN: SkinId = 'obsidian';

export const SKINS: SkinDefinition[] = [
  { id: 'obsidian', name: '黑曜', description: '黑色控制中心' },
  { id: 'ocean', name: '海灣', description: '深海藍與青色' },
  { id: 'forest', name: '森林', description: '墨綠與翡翠色' },
  { id: 'plum', name: '暮紫', description: '黑紫與桃紅色' },
];

export function isSkinId(value: unknown): value is SkinId {
  return SKINS.some((skin) => skin.id === value);
}
