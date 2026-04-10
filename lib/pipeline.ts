import { getSupabaseAdmin } from '@/lib/supabase';
import { scrapeUrl } from '@/lib/firecrawl';
import { extractStructuredData } from '@/lib/openrouter';
import { generateSummaryAndFolio } from '@/lib/folio';

export async function runCrawlStage(jobId: string) {
  const supabase = getSupabaseAdmin();
  const { data: links, error: linksError } = await supabase
    .from('source_links')
    .select('id, url, status')
    .eq('job_id', jobId);

  if (linksError) throw new Error(linksError.message);
  if (!links || links.length === 0) throw new Error('No source links found for this job.');

  const results: Array<{ url: string; status: string; pageId?: string; error?: string }> = [];

  for (const link of links) {
    try {
      const scraped = await scrapeUrl(link.url);
      const { data: existing } = await supabase
        .from('crawled_pages')
        .select('id')
        .eq('job_id', jobId)
        .eq('source_link_id', link.id)
        .maybeSingle();

      if (existing?.id) {
        await supabase.from('crawled_pages').delete().eq('id', existing.id);
      }

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

      if (pageError) throw new Error(pageError.message);
      await supabase.from('source_links').update({ status: 'crawled' }).eq('id', link.id);
      results.push({ url: link.url, status: 'completed', pageId: page.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown crawl error.';
      await supabase.from('source_links').update({ status: 'failed' }).eq('id', link.id);
      results.push({ url: link.url, status: 'failed', error: message });
    }
  }

  await supabase.from('jobs').update({ status: 'crawled', updated_at: new Date().toISOString() }).eq('id', jobId);
  return results;
}

export async function runExtractStage(jobId: string) {
  const supabase = getSupabaseAdmin();
  const [{ data: job, error: jobError }, { data: pages, error: pagesError }] = await Promise.all([
    supabase.from('jobs').select('id, full_name, profession, description').eq('id', jobId).single(),
    supabase.from('crawled_pages').select('id, url, title, raw_text').eq('job_id', jobId).eq('status', 'completed'),
  ]);

  if (jobError || !job) throw new Error(jobError?.message || 'Job not found.');
  if (pagesError) throw new Error(pagesError.message);
  if (!pages || pages.length === 0) throw new Error('No completed crawled pages found for this job.');

  await supabase.from('extracted_facts').delete().eq('job_id', jobId);
  await supabase.from('media_items').delete().eq('job_id', jobId);
  await supabase.from('generated_outputs').delete().eq('job_id', jobId).eq('output_type', 'identity_summary');

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
          metadata: { page_id: page.id, source_url: page.url },
        });
        if (outputError) throw new Error(outputError.message);
      }

      results.push({ pageId: page.id, url: page.url, facts: extraction.facts.length, mediaItems: extraction.mediaItems.length, status: 'completed' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Extraction failed.';
      results.push({ pageId: page.id, url: page.url, facts: 0, mediaItems: 0, status: 'failed', error: message });
    }
  }

  await supabase.from('jobs').update({ status: 'extracted', updated_at: new Date().toISOString() }).eq('id', jobId);
  return results;
}

export async function runGenerateStage(jobId: string) {
  const supabase = getSupabaseAdmin();
  const [{ data: job, error: jobError }, { data: facts, error: factsError }, { data: mediaItems, error: mediaError }] = await Promise.all([
    supabase.from('jobs').select('id, full_name, profession, description').eq('id', jobId).single(),
    supabase.from('extracted_facts').select('label, value, confidence, source_url').eq('job_id', jobId),
    supabase.from('media_items').select('media_type, title, source_url, media_url, embed_available, thumbnail_url, role_of_person, relevance_score').eq('job_id', jobId),
  ]);

  if (jobError || !job) throw new Error(jobError?.message || 'Job not found.');
  if (factsError) throw new Error(factsError.message);
  if (mediaError) throw new Error(mediaError.message);
  if (!facts || facts.length === 0) throw new Error('No extracted facts found for this job.');

  const generated = await generateSummaryAndFolio({
    fullName: job.full_name,
    profession: job.profession,
    description: job.description,
    facts: facts.map((fact) => ({ label: fact.label, value: fact.value, confidence: fact.confidence, sourceUrl: fact.source_url })),
    mediaItems: (mediaItems || []).map((item) => ({
      mediaType: item.media_type,
      title: item.title,
      sourceUrl: item.source_url,
      mediaUrl: item.media_url,
      embedAvailable: item.embed_available,
      thumbnailUrl: item.thumbnail_url,
      roleOfPerson: item.role_of_person,
      relevanceScore: item.relevance_score,
    })),
  });

  await supabase.from('generated_outputs').delete().eq('job_id', jobId).in('output_type', ['identity_snapshot','professional_summary','short_bio','html_folio']);

  const rows = [
    { job_id: jobId, output_type: 'identity_snapshot', content: generated.identitySnapshot, metadata: {} },
    { job_id: jobId, output_type: 'professional_summary', content: generated.professionalSummary, metadata: {} },
    { job_id: jobId, output_type: 'short_bio', content: generated.shortBio, metadata: {} },
    { job_id: jobId, output_type: 'html_folio', content: generated.htmlFolio, metadata: {} },
  ];

  const { error: outputError } = await supabase.from('generated_outputs').insert(rows);
  if (outputError) throw new Error(outputError.message);

  await supabase.from('jobs').update({ status: 'generated', updated_at: new Date().toISOString() }).eq('id', jobId);
  return generated;
}
