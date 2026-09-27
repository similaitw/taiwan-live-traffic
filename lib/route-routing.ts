export interface PlannedRouteStop {
  query: string;
  label: string;
  lat: number;
  lng: number;
}

export interface PlannedRoute {
  stops: PlannedRouteStop[];
  geometry: Array<[number, number]>;
  distanceMeters: number;
  durationSeconds: number;
  provider: 'OSRM';
  geocoder: 'Nominatim';
  generatedAt: string;
}
