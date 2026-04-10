import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { extractStructuredData } from '@/lib/openrouter';

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

    const [{ data: job, error: jobError }, { data: pages, error: pagesError }] = await Promise.all([
      supabase
        .from('jobs')
        .select('id, full_name, profession, description, status')
        .eq('id', jobId)
        .single(),
      supabase
        .from('crawled_pages')
        .select('id, url, title, raw_text, metadata, status')
        .eq('job_id', jobId)
        .eq('status', 'completed'),
    ]);

    if (jobError || !job) {
      return NextResponse.json({ error: jobError?.message || 'Job not found.' }, { status: 404 });
    }

    if (pagesError) {
      return NextResponse.json({ error: pagesError.message }, { status: 500 });
    }

    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: 'No completed crawled pages found for this job.' }, { status: 404 });
    }

    const results: Array<{ pageId: string; url: string; facts: number; mediaItems: number; status: string; error?: string }> = [];

    for (const page of pages) {
      try {
        const extraction = await extractStructuredData({
          fullName: job.full_name,
          profession: job.profession,
          sourceUrl: page.url,
          title: page.title,
          rawText: page.raw_text || '',
        });

        if (extraction.facts.length > 0) {
          const factRows = extraction.facts.map((fact) => ({
            job_id: jobId,
            page_id: page.id,
            label: fact.label,
            value: fact.value,
            confidence: fact.confidence || null,
            source_url: fact.sourceUrl || page.url,
          }));

          const { error: factsError } = await supabase.from('extracted_facts').insert(factRows);
          if (factsError) throw new Error(factsError.message);
        }

        if (extraction.mediaItems.length > 0) {
          const mediaRows = extraction.mediaItems.map((item) => ({
            job_id: jobId,
            page_id: page.id,
            media_type: item.mediaType,
            title: item.title || null,
            source_url: item.sourceUrl || page.url,
            media_url: item.mediaUrl || null,
            embed_available: Boolean(item.embedAvailable),
            thumbnail_url: item.thumbnailUrl || null,
            role_of_person: item.roleOfPerson || null,
            relevance_score: typeof item.relevanceScore === 'number' ? item.relevanceScore : null,
            metadata: item.metadata || {},
          }));

          const { error: mediaError } = await supabase.from('media_items').insert(mediaRows);
          if (mediaError) throw new Error(mediaError.message);
        }

        if (extraction.identitySummary) {
          const { error: outputError } = await supabase.from('generated_outputs').insert({
            job_id: jobId,
            output_type: 'identity_summary',
            content: extraction.identitySummary,
            metadata: {
              page_id: page.id,
              source_url: page.url,
            },
          });

          if (outputError) throw new Error(outputError.message);
        }

        results.push({
          pageId: page.id,
          url: page.url,
          facts: extraction.facts.length,
          mediaItems: extraction.mediaItems.length,
          status: 'completed',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Extraction failed.';
        results.push({
          pageId: page.id,
          url: page.url,
          facts: 0,
          mediaItems: 0,
          status: 'failed',
          error: message,
        });
      }
    }

    await supabase
      .from('jobs')
      .update({ status: 'extracted', updated_at: new Date().toISOString() })
      .eq('id', jobId);

    return NextResponse.json({
      jobId,
      status: 'extracted',
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Extraction job failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
