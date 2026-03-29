export interface Camera {
  id: string;
  name: string;
  type: 'freeway' | 'provincial' | 'county';
  lat: number;
  lng: number;
  streamUrl: string;
  snapshotUrl?: string;
  road?: string;
  direction?: string;
}
