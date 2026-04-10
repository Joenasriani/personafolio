import { getServerEnv } from '@/lib/env';

type FirecrawlScrapeResult = {
  title?: string;
  markdown?: string;
  html?: string;
  metadata?: Record<string, unknown>;
};

export async function scrapeUrl(url: string): Promise<FirecrawlScrapeResult> {
  const env = getServerEnv();

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.firecrawlApi}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'Firecrawl scrape failed.');
  }

  const data = payload?.data || {};

  return {
    title: data?.metadata?.title || data?.title || '',
    markdown: data?.markdown || '',
    html: data?.html || '',
    metadata: data?.metadata || {},
  };
}
