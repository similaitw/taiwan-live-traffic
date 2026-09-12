export interface RainfallAmounts {
  now?: number;
  past10Min?: number;
  past1Hr?: number;
  past3Hr?: number;
  past6Hr?: number;
  past12Hr?: number;
  past24Hr?: number;
}

export interface RainfallStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  county?: string;
  town?: string;
  altitude?: number;
  observedAt?: string;
  rainfall: RainfallAmounts;
  source: 'cwa';
}

export interface RainfallSourceStatus {
  provider: 'CWA';
  dataset: 'O-A0002-001';
  status: 'ok' | 'error';
  fetchedAt: string;
  observedAt?: string;
  error?: string;
}

export interface RainfallResponse {
  enabled: boolean;
  stations: RainfallStation[];
  source: RainfallSourceStatus;
}
