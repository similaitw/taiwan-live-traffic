export interface TrafficFlowSegment {
  sectionId: string;
  travelTime?: number;
  travelSpeed?: number;
  congestionLevelId?: number;
  congestionLevel?: number;
  dataCollectTime?: string;
  source: 'tdx';
}

export interface TrafficFlowSourceStatus {
  provider: 'TDX';
  status: 'ok' | 'disabled' | 'error';
  fetchedAt: string;
  dataCollectTime?: string;
  error?: string;
}

export interface TrafficFlowResponse {
  enabled: boolean;
  segments: TrafficFlowSegment[];
  source: TrafficFlowSourceStatus;
}
