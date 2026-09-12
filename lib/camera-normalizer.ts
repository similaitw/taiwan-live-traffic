import type { Camera } from '@/types/camera';

function clean(value?: string): string | undefined {
  return value?.normalize('NFKC').trim().replace(/\s+/g, ' ') || undefined;
}

function normalizeRoad(value?: string): string | undefined {
  return clean(value)?.replace(/臺/g, '台').replace(/國道\s*/g, '國')
    .replace(/(國|台|縣道|鄉道)\s*(\d+)(?:\s*號)?/g, '$1$2')
    .replace(/(\d)\s+([甲乙丙丁])/g, '$1$2');
}

function roadNumber(value?: string): string | undefined {
  return value?.match(/(?:國|台|縣道|鄉道)\d+(?:甲|乙|丙|丁)?/)?.[0];
}

// A bare number is accepted only from an explicit mileage field, never a name.
function mileage(value: number | string | undefined, explicit = false): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : undefined;
  const text = clean(value);
  if (!text) return undefined;
  const stake = text.match(/(?:^|[^\d.])(\d+)\s*[kK]?\s*\+\s*(\d{1,3})(?!\d)/);
  if (stake) return Number(stake[1]) + Number(stake[2]) / 1000;
  const km = text.match(/(?:^|[^\d.])(\d+(?:\.\d+)?)\s*(?:[kK](?:[mM])?|公里)(?![a-zA-Z])/);
  if (km) return Number(km[1]);
  if (explicit && /^\d+(?:\.\d+)?$/.test(text)) return Number(text);
  return undefined;
}

function direction(value?: string): string | undefined {
  const text = clean(value);
  if (!text) return undefined;
  const cardinal = text.match(/([東西南北])(?:向|行|上|下)/)?.[1]
    ?? text.match(/往([東西南北])(?:$|\s)/)?.[1];
  if (cardinal) return `${cardinal}向`;
  const english: Record<string, string> = { N: '北向', S: '南向', E: '東向', W: '西向', NB: '北向', SB: '南向', EB: '東向', WB: '西向' };
  return english[text.toUpperCase()];
}

export function normalizeCamera(camera: Camera): Camera {
  const road = normalizeRoad(camera.road);
  const name = normalizeRoad(camera.name);
  const number = roadNumber(normalizeRoad(camera.roadNumber)) ?? roadNumber(road) ?? roadNumber(name);
  const mile = mileage(camera.mile, true) ?? mileage(road) ?? mileage(name);
  const normalizedDirection = direction(camera.direction) ?? clean(camera.direction) ?? direction(road) ?? direction(name);
  const tags = [...new Set([
    ...(camera.tags ?? []), camera.name, camera.type, camera.provider,
    road, number, mile === undefined ? undefined : `${mile}K`,
    normalizedDirection, camera.county, camera.district,
  ].map(clean).filter((tag): tag is string => Boolean(tag)))];

  return {
    ...camera,
    ...(road ? { road } : {}),
    ...(number ? { roadNumber: number } : {}),
    ...(mile !== undefined ? { mile } : {}),
    ...(normalizedDirection ? { direction: normalizedDirection } : {}),
    tags,
  };
}
