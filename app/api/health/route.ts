import { NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';

export async function GET() {
  try {
    const env = getServerEnv();

    return NextResponse.json({
      ok: true,
      configured: {
        openRouter: Boolean(env.openRouterApi),
        firecrawl: Boolean(env.firecrawlApi),
        supabaseUrl: Boolean(env.supabaseUrl),
        supabaseServiceRole: Boolean(env.supabaseServiceRoleKey),
        apify: Boolean(env.apifyApiToken),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Health check failed.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
