import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateSummaryAndFolio } from '@/lib/folio';
import { buildFallbackFacts } from '@/lib/generation-fallback';

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

    const [jobRes, factsRes, mediaRes, outputsRes, pagesRes] = await Promise.all([
      supabase.from('jobs').select('id, full_name, profession, description').eq('id', jobId).single(),
      supabase.from('extracted_facts').select('label, value, confidence, source_url').eq('job_id', jobId),
      supabase.from('media_items').select('media_type, title, source_url, media_url, role_of_person').eq('job_id', jobId),
      supabase.from('generated_outputs').select('output_type, content').eq('job_id', jobId),
      supabase.from('crawled_pages').select('title, url, raw_text').eq('job_id', jobId),
    ]);

    if (jobRes.error || !jobRes.data) {
      return NextResponse.json({ error: jobRes.error?.message || 'Job not found.' }, { status: 404 });
    }
    if (factsRes.error) return NextResponse.json({ error: factsRes.error.message }, { status: 500 });
    if (mediaRes.error) return NextResponse.json({ error: mediaRes.error.message }, { status: 500 });
    if (outputsRes.error) return NextResponse.json({ error: outputsRes.error.message }, { status: 500 });
    if (pagesRes.error) return NextResponse.json({ error: pagesRes.error.message }, { status: 500 });

    const identitySummaries = (outputsRes.data || [])
      .filter((item) => item.output_type === 'identity_summary' && item.content)
      .map((item) => item.content);

    const realFacts = (factsRes.data || []).map((fact) => ({
      label: fact.label,
      value: fact.value,
      confidence: fact.confidence,
      sourceUrl: fact.source_url,
    }));

    const mediaItems = (mediaRes.data || []).map((item) => ({
      mediaType: item.media_type,
      title: item.title,
      sourceUrl: item.source_url,
      mediaUrl: item.media_url,
      roleOfPerson: item.role_of_person,
    }));

    const fallbackFacts = buildFallbackFacts({
      description: jobRes.data.description,
      identitySummaries,
      mediaItems,
      crawledPages: pagesRes.data || [],
    });

    const facts = realFacts.length > 0 ? realFacts : fallbackFacts;

    if (facts.length === 0) {
      return NextResponse.json(
        { error: 'Not enough extracted or fallback information was available to generate a profile.' },
        { status: 422 }
      );
    }

    const generated = await generateSummaryAndFolio({
      fullName: jobRes.data.full_name,
      profession: jobRes.data.profession,
      description: jobRes.data.description,
      facts,
      mediaItems: mediaItems.map((item) => ({
        mediaType: item.mediaType || 'other',
        title: item.title || null,
        sourceUrl: item.sourceUrl || null,
        mediaUrl: item.mediaUrl || null,
        embedAvailable: false,
        thumbnailUrl: null,
        roleOfPerson: item.roleOfPerson || null,
        relevanceScore: null,
      })),
    });

    await supabase.from('generated_outputs').delete().eq('job_id', jobId).in('output_type', [
      'identity_snapshot',
      'professional_summary',
      'short_bio',
      'html_folio',
    ]);

    const { error: outputError } = await supabase.from('generated_outputs').insert([
      { job_id: jobId, output_type: 'identity_snapshot', content: generated.identitySnapshot, metadata: {} },
      { job_id: jobId, output_type: 'professional_summary', content: generated.professionalSummary, metadata: {} },
      { job_id: jobId, output_type: 'short_bio', content: generated.shortBio, metadata: {} },
      { job_id: jobId, output_type: 'html_folio', content: generated.htmlFolio, metadata: {} },
    ]);

    if (outputError) {
      return NextResponse.json({ error: outputError.message }, { status: 500 });
    }

    await supabase
      .from('jobs')
      .update({ status: 'generated', updated_at: new Date().toISOString() })
      .eq('id', jobId);

    return NextResponse.json({
      jobId,
      status: 'generated',
      usedFallbackFacts: realFacts.length === 0,
      factCount: facts.length,
      identitySnapshot: generated.identitySnapshot,
      professionalSummary: generated.professionalSummary,
      shortBio: generated.shortBio,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Fallback generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
