import { directionMatches } from '@/lib/directions';
import { getDistance } from '@/lib/geo';
import { getCameraRoadNumber, normalizeRoadNumber } from '@/lib/roads';
import type { Camera } from '@/types/camera';
import type { CmsDevice } from '@/types/cms';
import type { RainfallStation } from '@/types/rainfall';
import type { RouteCorridor, RouteCorridorInput } from '@/types/route-corridor';
import type { TrafficEvent } from '@/types/traffic-event';
import type { TrafficFlowMapSegment } from '@/types/traffic-flow';

const DEFAULT_RAINFALL_ANCHOR_RADIUS_METERS = 15_000;

function itemRoadNumber(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const normalized = normalizeRoadNumber(value);
    if (normalized) return normalized;
  }
  return undefined;
}

function cameraMile(camera: Camera): number {
  if (typeof camera.mile === 'number') {
    return Number.isFinite(camera.mile) ? camera.mile : Number.POSITIVE_INFINITY;
  }

  const text = camera.mile == null ? '' : String(camera.mile).trim();
  const stake = text.match(/(\d+)\s*[kK]?\s*\+\s*(\d{1,3})/);
  if (stake) return Number(stake[1]) + Number(stake[2]) / 1000;

  const decimal = text.match(/\d+(?:\.\d+)?/);
  return decimal ? Number(decimal[0]) : Number.POSITIVE_INFINITY;
}

function sortCameras(cameras: Camera[]): Camera[] {
  return [...cameras].sort((a, b) => {
    const aMile = cameraMile(a);
    const bMile = cameraMile(b);
    if (Number.isFinite(aMile) && Number.isFinite(bMile) && aMile !== bMile) return aMile - bMile;
    if (Number.isFinite(aMile) !== Number.isFinite(bMile)) return Number.isFinite(aMile) ? -1 : 1;
    return a.name.localeCompare(b.name, 'zh-Hant', { numeric: true }) || a.id.localeCompare(b.id);
  });
}

function isNearAnyCamera(
  station: RainfallStation,
  cameras: Camera[],
  radiusMeters: number,
): boolean {
  return cameras.some((camera) => getDistance(station.lat, station.lng, camera.lat, camera.lng) <= radiusMeters);
}

function matchingCameras(cameras: Camera[], roadNumber: string, direction?: string): Camera[] {
  return sortCameras(
    cameras.filter((camera) => (
      getCameraRoadNumber(camera) === roadNumber
      && directionMatches(direction, camera.direction)
    )),
  );
}

function matchingFlow(
  segments: TrafficFlowMapSegment[],
  roadNumber: string,
  direction?: string,
): TrafficFlowMapSegment[] {
  return segments.filter((segment) => (
    itemRoadNumber(segment.roadName, segment.roadId, segment.sectionName) === roadNumber
    && directionMatches(direction, segment.roadDirection)
  ));
}

function matchingEvents(events: TrafficEvent[], roadNumber: string, direction?: string): TrafficEvent[] {
  return events.filter((event) => (
    itemRoadNumber(event.road, event.title, event.description) === roadNumber
    && directionMatches(direction, event.direction)
  ));
}

function matchingCms(devices: CmsDevice[], roadNumber: string, direction?: string): CmsDevice[] {
  return devices.filter((device) => (
    itemRoadNumber(device.roadName, device.roadId) === roadNumber
    && directionMatches(direction, device.roadDirection)
  ));
}

export function buildRouteCorridor(input: RouteCorridorInput): RouteCorridor {
  const roadNumber = normalizeRoadNumber(input.roadNumber);
  if (!roadNumber) {
    throw new Error(`Unsupported road number: ${input.roadNumber}`);
  }

  const rainfallAnchorRadiusMeters = input.rainfallAnchorRadiusMeters
    ?? DEFAULT_RAINFALL_ANCHOR_RADIUS_METERS;

  const cameras = matchingCameras(input.cameras ?? [], roadNumber, input.direction);
  const trafficFlowSegments = matchingFlow(input.trafficFlowSegments ?? [], roadNumber, input.direction);
  const trafficEvents = matchingEvents(input.trafficEvents ?? [], roadNumber, input.direction);
  const cmsDevices = matchingCms(input.cmsDevices ?? [], roadNumber, input.direction);
  const rainfallStations = cameras.length === 0
    ? []
    : (input.rainfallStations ?? []).filter((station) => (
        isNearAnyCamera(station, cameras, rainfallAnchorRadiusMeters)
      ));

  const rainfallValues = rainfallStations
    .map((station) => station.rainfall.past1Hr)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0);

  return {
    roadNumber,
    direction: input.direction?.trim() || undefined,
    cameras,
    trafficFlowSegments,
    trafficEvents,
    cmsDevices,
    rainfallStations,
    summary: {
      cameraCount: cameras.length,
      congestionSegmentCount: trafficFlowSegments.filter((segment) => (segment.congestionLevel ?? 0) >= 3).length,
      eventCount: trafficEvents.length,
      cmsDeviceCount: cmsDevices.length,
      cmsMessageCount: cmsDevices.reduce((total, device) => total + device.messages.length, 0),
      rainfallStationCount: rainfallStations.length,
      rainyStationCount: rainfallValues.filter((value) => value > 0).length,
      maxPast1Hr: rainfallValues.length > 0 ? Math.max(...rainfallValues) : undefined,
    },
    sources: {
      cameras: input.cameras === undefined ? 'unavailable' : 'available',
      trafficFlow: input.trafficFlowSegments === undefined ? 'unavailable' : 'available',
      trafficEvents: input.trafficEvents === undefined ? 'unavailable' : 'available',
      cms: input.cmsDevices === undefined ? 'unavailable' : 'available',
      rainfall: input.rainfallStations === undefined ? 'unavailable' : 'available',
    },
    rainfallAnchorRadiusMeters,
  };
}
