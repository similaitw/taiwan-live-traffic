const ALLOWED_HOSTNAMES = new Set([
  'cctvs.freeway.gov.tw',
  'tisvcloud.freeway.gov.tw',
  'thbapp.thb.gov.tw',
  'cctv.thb.gov.tw',
  'cciv.thb.gov.tw',
  'cctv-ss05.thb.gov.tw',
  'its.taipei.gov.tw',
]);

const THB_CCTV_HOST_PATTERN = /^cctv-[a-z0-9]+\.thb\.gov\.tw$/;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 4;

export class CameraProxyUrlError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 403 | 502 = 400,
  ) {
    super(message);
    this.name = 'CameraProxyUrlError';
  }
}

export function parseAllowedCameraUrl(rawUrl: string, base?: URL): URL {
  let url: URL;
  try {
    url = base ? new URL(rawUrl, base) : new URL(rawUrl);
  } catch {
    throw new CameraProxyUrlError('Invalid URL', 400);
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new CameraProxyUrlError('URL not allowed', 403);
  }

  if (url.username || url.password) {
    throw new CameraProxyUrlError('URL credentials are not allowed', 403);
  }

  const hostname = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTNAMES.has(hostname) && !THB_CCTV_HOST_PATTERN.test(hostname)) {
    throw new CameraProxyUrlError('URL not allowed', 403);
  }

  return url;
}

export async function fetchAllowedCameraResource(
  rawUrl: string,
  init: RequestInit = {},
): Promise<Response> {
  let currentUrl = parseAllowedCameraUrl(rawUrl);

  for (let redirectCount = 0; ; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      ...init,
      redirect: 'manual',
    });

    if (!REDIRECT_STATUSES.has(response.status)) {
      return response;
    }

    const location = response.headers.get('location');
    if (!location) {
      return response;
    }

    if (redirectCount >= MAX_REDIRECTS) {
      response.body?.cancel().catch(() => {});
      throw new CameraProxyUrlError('Too many upstream redirects', 502);
    }

    const nextUrl = parseAllowedCameraUrl(location, currentUrl);
    response.body?.cancel().catch(() => {});
    currentUrl = nextUrl;
  }
}
