export type TrafficSectionPoint = [lat: number, lng: number];
export type TrafficSectionPath = TrafficSectionPoint[];

export interface TrafficSection {
  sectionId: string;
  roadId?: string;
  roadName?: string;
  roadDirection?: string;
  sectionName?: string;
  start?: string;
  end?: string;
  paths: TrafficSectionPath[];
  source: 'tdx';
}

export interface TrafficSectionsSourceStatus {
  provider: 'TDX';
  status: 'ok' | 'partial' | 'disabled' | 'error';
  fetchedAt: string;
  warnings?: string[];
  error?: string;
}

export interface TrafficSectionsResponse {
  enabled: boolean;
  sections: TrafficSection[];
  source: TrafficSectionsSourceStatus;
}
