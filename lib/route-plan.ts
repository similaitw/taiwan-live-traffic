export type TrafficMode = 'route' | 'road' | 'nearby';

export const MAX_ROUTE_STOPS = 8;

export function normalizeTrafficMode(value?: string | null): TrafficMode | undefined {
  return value === 'route' || value === 'road' || value === 'nearby' ? value : undefined;
}

export function parseRouteViaParam(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_ROUTE_STOPS);
}

export function serializeRouteViaParam(via: string[]): string | null {
  const normalized = via
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_ROUTE_STOPS);
  return normalized.length > 0 ? normalized.join('|') : null;
}
