export type TrafficMode = 'route' | 'road' | 'nearby';

export interface RoutePlan {
  from: string;
  to: string;
  via: string[];
}

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

export function buildGoogleMapsDirectionsUrl(plan: RoutePlan): string | null {
  const from = plan.from.trim();
  const to = plan.to.trim();
  if (!from || !to) return null;

  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('origin', from);
  url.searchParams.set('destination', to);
  url.searchParams.set('travelmode', 'driving');

  const via = plan.via
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_ROUTE_STOPS);
  if (via.length > 0) url.searchParams.set('waypoints', via.join('|'));

  return url.toString();
}
