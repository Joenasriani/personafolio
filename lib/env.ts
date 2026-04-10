const requiredServerEnv = [
  'PERSONAFOLIO_OPENROUTER_API',
  'PERSONAFOLIO_FIRECRAWL_API',
  'PERSONAFOLIO_SUPABASE_URL',
  'PERSONAFOLIO_SUPABASE_SERVICE_ROLE_KEY',
] as const;

export function getServerEnv() {
  const missing = requiredServerEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    openRouterApi: process.env.PERSONAFOLIO_OPENROUTER_API as string,
    firecrawlApi: process.env.PERSONAFOLIO_FIRECRAWL_API as string,
    apifyApiToken: process.env.PERSONAFOLIO_APIFY_API_TOKEN || '',
    supabaseUrl: process.env.PERSONAFOLIO_SUPABASE_URL as string,
    supabaseAnonKey: process.env.PERSONAFOLIO_SUPABASE_ANON_KEY || '',
    supabaseServiceRoleKey: process.env.PERSONAFOLIO_SUPABASE_SERVICE_ROLE_KEY as string,
  };
}
