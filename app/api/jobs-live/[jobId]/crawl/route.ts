import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { scrapeUrl } from '@/lib/firecrawl';

export async function POST(
  _request: Request,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: links, error: linksError } = await supabase
      .from('source_links')
      .select('id, url, status')
      .eq('job_id', jobId);

    if (linksError) {
      return NextResponse.json({ error: linksError.message }, { status: 500 });
    }

    if (!links || links.length === 0) {
      return NextResponse.json({ error: 'No source links found for this job.' }, { status: 404 });
    }

    const results: Array<{ url: string; status: string; pageId?: string; error?: string }> = [];

    for (const link of links) {
      try {
        const scraped = await scrapeUrl(link.url);

        const { data: page, error: pageError } = await supabase
          .from('crawled_pages')
          .insert({
            job_id: jobId,
            source_link_id: link.id,
            url: link.url,
            title: scraped.title || null,
            raw_text: scraped.markdown || scraped.html || '',
            metadata: scraped.metadata || {},
            status: 'completed',
          })
          .select('id')
          .single();

        if (pageError) {
          throw new Error(pageError.message);
        }

        await supabase
          .from('source_links')
          .update({ status: 'crawled' })
          .eq('id', link.id);

        results.push({
          url: link.url,
          status: 'completed',
          pageId: page.id,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown crawl error.';

        await supabase
          .from('source_links')
          .update({ status: 'failed' })
          .eq('id', link.id);

        results.push({
          url: link.url,
          status: 'failed',
          error: message,
        });
      }
    }

    await supabase
      .from('jobs')
      .update({ status: 'crawled', updated_at: new Date().toISOString() })
      .eq('id', jobId);

    return NextResponse.json({
      jobId,
      status: 'crawled',
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Crawl job failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
