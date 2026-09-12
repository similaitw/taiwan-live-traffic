export type TrafficEventSeverity = 'info' | 'warning' | 'serious';

export interface TrafficEvent {
  id: string;
  title: string;
  description?: string;
  severity: TrafficEventSeverity;
  lat?: number;
  lng?: number;
  road?: string;
  direction?: string;
  publishTime?: string;
  effectiveTime?: string;
  source: 'tdx';
}

export interface TrafficEventSourceStatus {
  provider: 'TDX';
  status: 'ok' | 'disabled' | 'error';
  fetchedAt: string;
  error?: string;
}

export interface TrafficEventsResponse {
  enabled: boolean;
  events: TrafficEvent[];
  source: TrafficEventSourceStatus;
}
