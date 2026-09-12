export type CameraType = 'freeway' | 'provincial' | 'county';
export type CameraStatus = 'online' | 'stale' | 'offline' | 'unknown';

export interface Camera {
  id: string;
  name: string;
  type: CameraType;
  provider?: string;
  lat: number;
  lng: number;
  streamUrl: string;
  snapshotUrl?: string;
  road?: string;
  roadNumber?: string;
  mile?: number | string;
  direction?: string;
  county?: string;
  district?: string;
  streamType?: 'mjpeg' | 'image' | 'unknown';
  status?: CameraStatus;
  lastCheckedAt?: string;
  lastFrameAt?: string;
  tags?: string[];
}
