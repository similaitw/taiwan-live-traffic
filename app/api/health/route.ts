import { NextResponse } from 'next/server';
import { hasTdxCredentials } from '@/lib/tdx-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const generatedAt = new Date().toISOString();
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || undefined;
  const vercelEnvironment = process.env.VERCEL_ENV || undefined;

  return NextResponse.json(
    {
      status: 'ok',
      generatedAt,
      deployment: {
        environment: vercelEnvironment,
        commitSha,
        runtime: 'nodejs',
      },
      configuration: {
        tdx: {
          configured: hasTdxCredentials(),
          requiredFor: ['traffic-events', 'traffic-flow', 'traffic-sections', 'cms'],
        },
        cwa: {
          configured: true,
          authenticationRequired: false,
          datasets: ['O-A0002-001 rainfall', 'O-A0058-006 radar'],
        },
        cameraProxy: {
          allowlistEnforced: true,
          redirectsRevalidated: true,
          liveStreamExplicitOptIn: true,
          liveStreamMaxSeconds: 90,
        },
      },
      endpoints: {
        cameras: '/api/cameras',
        rainfall: '/api/rainfall',
        trafficEvents: '/api/traffic-events',
        trafficFlow: '/api/traffic-flow',
        trafficSections: '/api/traffic-sections',
        cms: '/api/cms',
      },
      note: 'Passive diagnostics only. This endpoint does not probe upstream services.',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
