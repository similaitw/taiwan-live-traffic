interface TdxTokenResponse {
  access_token?: string;
  expires_in?: number;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

const TOKEN_URL = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token';
let tokenCache: TokenCache | null = null;

export function hasTdxCredentials(): boolean {
  return Boolean(process.env.TDX_CLIENT_ID && process.env.TDX_CLIENT_SECRET);
}

export async function getTdxAccessToken(): Promise<string> {
  const clientId = process.env.TDX_CLIENT_ID;
  const clientSecret = process.env.TDX_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('TDX credentials are not configured');
  }

  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`TDX OAuth failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as TdxTokenResponse;
  if (!payload.access_token) {
    throw new Error('TDX OAuth response did not include access_token');
  }

  const expiresInSeconds = typeof payload.expires_in === 'number' ? payload.expires_in : 1800;
  const refreshEarlyMs = 60_000;
  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max(60_000, expiresInSeconds * 1000 - refreshEarlyMs),
  };

  return payload.access_token;
}
