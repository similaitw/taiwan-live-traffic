import type { Camera } from '@/types/camera';
import type { CmsDevice } from '@/types/cms';
import type { RainfallStation } from '@/types/rainfall';
import type { TrafficEvent } from '@/types/traffic-event';
import type { TrafficFlowMapSegment } from '@/types/traffic-flow';

export type CorridorSourceAvailability = 'available' | 'unavailable';

export interface RouteCorridorSummary {
  cameraCount: number;
  congestionSegmentCount: number;
  eventCount: number;
  cmsDeviceCount: number;
  cmsMessageCount: number;
  rainfallStationCount: number;
  rainyStationCount: number;
  maxPast1Hr?: number;
}

export interface RouteCorridorSources {
  cameras: CorridorSourceAvailability;
  trafficFlow: CorridorSourceAvailability;
  trafficEvents: CorridorSourceAvailability;
  cms: CorridorSourceAvailability;
  rainfall: CorridorSourceAvailability;
}

export interface RouteCorridor {
  roadNumber: string;
  direction?: string;
  cameras: Camera[];
  trafficFlowSegments: TrafficFlowMapSegment[];
  trafficEvents: TrafficEvent[];
  cmsDevices: CmsDevice[];
  rainfallStations: RainfallStation[];
  summary: RouteCorridorSummary;
  sources: RouteCorridorSources;
  rainfallAnchorRadiusMeters: number;
}

export interface RouteCorridorInput {
  roadNumber: string;
  direction?: string;
  cameras?: Camera[];
  trafficFlowSegments?: TrafficFlowMapSegment[];
  trafficEvents?: TrafficEvent[];
  cmsDevices?: CmsDevice[];
  rainfallStations?: RainfallStation[];
  rainfallAnchorRadiusMeters?: number;
}
