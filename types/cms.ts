export interface CmsDevice {
  id: string;
  cmsId?: string;
  cmsUid?: string;
  lat?: number;
  lng?: number;
  linkId?: string;
  roadId?: string;
  roadName?: string;
  roadDirection?: string;
  locationType?: number;
  messageStatus?: number;
  messages: string[];
  status?: number;
  dataCollectTime?: string;
  active: boolean;
  source: 'tdx';
}

export interface CmsSourceStatus {
  provider: 'TDX';
  status: 'ok' | 'partial' | 'disabled' | 'error';
  fetchedAt: string;
  warnings?: string[];
  error?: string;
}

export interface CmsResponse {
  enabled: boolean;
  devices: CmsDevice[];
  source: CmsSourceStatus;
}
