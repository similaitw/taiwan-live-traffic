import type { RainfallAmounts, RainfallStation } from '@/types/rainfall';

const CWA_RAINFALL_URL = 'https://cwaopendata.s3.ap-northeast-1.amazonaws.com/Observation/O-A0002-001.json';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function rainfallNumber(value: unknown): number | undefined {
  const numeric = asNumber(value);
  return numeric !== undefined && numeric >= 0 ? numeric : undefined;
}

function findStations(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  if (!root) return [];

  const directCandidates = [root.Station, root.station, root.location, root.locations];
  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  const containers = [
    root.records,
    root.dataset,
    asRecord(root.cwaopendata)?.dataset,
    asRecord(root.cwaOpenData)?.dataset,
    root.data,
  ];

  for (const candidate of containers) {
    const container = asRecord(candidate);
    if (!container) continue;
    for (const key of ['Station', 'station', 'location', 'locations']) {
      if (Array.isArray(container[key])) return container[key] as unknown[];
    }
  }

  return [];
}

function findCoordinates(geoInfo: UnknownRecord): { lat?: number; lng?: number } {
  const rawCoordinates = geoInfo.Coordinates ?? geoInfo.coordinates;
  const coordinates = Array.isArray(rawCoordinates)
    ? rawCoordinates
    : rawCoordinates !== undefined
      ? [rawCoordinates]
      : [];

  const parsed = coordinates
    .map((value) => asRecord(value))
    .filter((value): value is UnknownRecord => value !== null)
    .map((coordinate) => ({
      name: asString(coordinate.CoordinateName ?? coordinate.coordinateName)?.toUpperCase(),
      lat: asNumber(coordinate.StationLatitude ?? coordinate.stationLatitude ?? coordinate.Latitude ?? coordinate.latitude),
      lng: asNumber(coordinate.StationLongitude ?? coordinate.stationLongitude ?? coordinate.Longitude ?? coordinate.longitude),
    }))
    .filter((coordinate) => coordinate.lat !== undefined && coordinate.lng !== undefined);

  const wgs84 = parsed.find((coordinate) => coordinate.name?.includes('WGS84'));
  const fallback = wgs84 ?? parsed[0];
  if (fallback) return { lat: fallback.lat, lng: fallback.lng };

  return {
    lat: asNumber(geoInfo.StationLatitude ?? geoInfo.stationLatitude ?? geoInfo.Latitude ?? geoInfo.latitude),
    lng: asNumber(geoInfo.StationLongitude ?? geoInfo.stationLongitude ?? geoInfo.Longitude ?? geoInfo.longitude),
  };
}

function precipitationFrom(value: unknown): number | undefined {
  const record = asRecord(value);
  if (record) {
    return rainfallNumber(
      record.Precipitation
      ?? record.precipitation
      ?? record.value
      ?? record.Value,
    );
  }
  return rainfallNumber(value);
}

function rainfallAmounts(record: UnknownRecord): RainfallAmounts {
  const rainfall = asRecord(record.RainfallElement ?? record.rainfallElement ?? record.Precipitation);
  if (!rainfall) return {};

  return {
    now: precipitationFrom(rainfall.Now ?? rainfall.now),
    past10Min: precipitationFrom(rainfall.Past10Min ?? rainfall.past10Min ?? rainfall.Past10min),
    past1Hr: precipitationFrom(rainfall.Past1hr ?? rainfall.Past1Hr ?? rainfall.past1hr),
    past3Hr: precipitationFrom(rainfall.Past3hr ?? rainfall.Past3Hr ?? rainfall.past3hr),
    past6Hr: precipitationFrom(rainfall.Past6hr ?? rainfall.Past6Hr ?? rainfall.past6hr),
    past12Hr: precipitationFrom(rainfall.Past12hr ?? rainfall.Past12Hr ?? rainfall.past12hr),
    past24Hr: precipitationFrom(rainfall.Past24hr ?? rainfall.Past24Hr ?? rainfall.past24hr),
  };
}

function observedAt(record: UnknownRecord): string | undefined {
  const obsTime = asRecord(record.ObsTime ?? record.obsTime);
  return asString(
    obsTime?.DateTime
    ?? obsTime?.dateTime
    ?? record.DateTime
    ?? record.dateTime
    ?? record.ObsTime
    ?? record.obsTime,
  );
}

export function normalizeCwaRainfall(payload: unknown): RainfallStation[] {
  return findStations(payload)
    .map((value): RainfallStation | null => {
      const record = asRecord(value);
      if (!record) return null;

      const id = asString(record.StationId ?? record.StationID ?? record.stationId ?? record.stationID);
      const name = asString(record.StationName ?? record.stationName ?? record.locationName);
      if (!id || !name) return null;

      const geoInfo = asRecord(record.GeoInfo ?? record.geoInfo) ?? record;
      const { lat, lng } = findCoordinates(geoInfo);
      if (lat === undefined || lng === undefined) return null;

      return {
        id,
        name,
        lat,
        lng,
        county: asString(geoInfo.CountyName ?? geoInfo.countyName ?? record.CountyName ?? record.countyName),
        town: asString(geoInfo.TownName ?? geoInfo.townName ?? record.TownName ?? record.townName),
        altitude: asNumber(geoInfo.StationAltitude ?? geoInfo.stationAltitude ?? record.StationAltitude),
        observedAt: observedAt(record),
        rainfall: rainfallAmounts(record),
        source: 'cwa',
      };
    })
    .filter((station): station is RainfallStation => station !== null);
}

export async function fetchCwaRainfall(): Promise<RainfallStation[]> {
  const response = await fetch(CWA_RAINFALL_URL, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`CWA rainfall HTTP ${response.status}`);
  }

  return normalizeCwaRainfall(await response.json());
}
