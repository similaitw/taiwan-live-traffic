export type TravelDirection = 'north' | 'south' | 'east' | 'west';

export interface DirectionOption {
  value: TravelDirection;
  label: string;
  count: number;
}

const DIRECTION_LABELS: Record<TravelDirection, string> = {
  north: '北向',
  south: '南向',
  east: '東向',
  west: '西向',
};

const DIRECTION_ORDER: TravelDirection[] = ['north', 'south', 'east', 'west'];

export function normalizeTravelDirection(value?: string | null): TravelDirection | undefined {
  if (!value) return undefined;
  const normalized = value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, '');
  if (!normalized) return undefined;

  if (/北上|北向|往北/.test(normalized) || ['n', 'nb', 'north', 'northbound'].includes(normalized)) return 'north';
  if (/南下|南向|往南/.test(normalized) || ['s', 'sb', 'south', 'southbound'].includes(normalized)) return 'south';
  if (/東向|往東/.test(normalized) || ['e', 'eb', 'east', 'eastbound'].includes(normalized)) return 'east';
  if (/西向|往西/.test(normalized) || ['w', 'wb', 'west', 'westbound'].includes(normalized)) return 'west';

  return undefined;
}

export function travelDirectionLabel(direction: TravelDirection): string {
  return DIRECTION_LABELS[direction];
}

export function directionMatches(
  filterDirection: string | undefined,
  value: string | undefined,
  includeUnknown = true,
): boolean {
  if (!filterDirection) return true;

  const filter = normalizeTravelDirection(filterDirection);
  if (!filter) return true;

  const candidate = normalizeTravelDirection(value);
  if (!candidate) return includeUnknown;
  return candidate === filter;
}

export function buildDirectionOptions(values: Array<string | undefined>): DirectionOption[] {
  const counts = new Map<TravelDirection, number>();

  for (const value of values) {
    const direction = normalizeTravelDirection(value);
    if (!direction) continue;
    counts.set(direction, (counts.get(direction) ?? 0) + 1);
  }

  return DIRECTION_ORDER
    .filter((direction) => counts.has(direction))
    .map((direction) => ({
      value: direction,
      label: travelDirectionLabel(direction),
      count: counts.get(direction) ?? 0,
    }));
}
