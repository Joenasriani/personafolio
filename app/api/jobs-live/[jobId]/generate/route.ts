import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateSummaryAndFolio } from '@/lib/folio';

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

    const [{ data: job, error: jobError }, { data: facts, error: factsError }, { data: mediaItems, error: mediaError }] = await Promise.all([
      supabase
        .from('jobs')
        .select('id, full_name, profession, description, status')
        .eq('id', jobId)
        .single(),
      supabase
        .from('extracted_facts')
        .select('label, value, confidence, source_url')
        .eq('job_id', jobId),
      supabase
        .from('media_items')
        .select('media_type, title, source_url, media_url, embed_available, thumbnail_url, role_of_person, relevance_score')
        .eq('job_id', jobId),
    ]);

    if (jobError || !job) {
      return NextResponse.json({ error: jobError?.message || 'Job not found.' }, { status: 404 });
    }

    if (factsError) {
      return NextResponse.json({ error: factsError.message }, { status: 500 });
    }

    if (mediaError) {
      return NextResponse.json({ error: mediaError.message }, { status: 500 });
    }

    if (!facts || facts.length === 0) {
      return NextResponse.json({ error: 'No extracted facts found for this job.' }, { status: 404 });
    }

    const generated = await generateSummaryAndFolio({
      fullName: job.full_name,
      profession: job.profession,
      description: job.description,
      facts: facts.map((fact) => ({
        label: fact.label,
        value: fact.value,
        confidence: fact.confidence,
        sourceUrl: fact.source_url,
      })),
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

    const rows = [
      {
        job_id: jobId,
        output_type: 'identity_snapshot',
        content: generated.identitySnapshot,
        metadata: {},
      },
      {
        job_id: jobId,
        output_type: 'professional_summary',
        content: generated.professionalSummary,
        metadata: {},
      },
      {
        job_id: jobId,
        output_type: 'short_bio',
        content: generated.shortBio,
        metadata: {},
      },
      {
        job_id: jobId,
        output_type: 'html_folio',
        content: generated.htmlFolio,
        metadata: {},
      },
    ];

    const { error: outputError } = await supabase.from('generated_outputs').insert(rows);

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
      identitySnapshot: generated.identitySnapshot,
      professionalSummary: generated.professionalSummary,
      shortBio: generated.shortBio,
      htmlFolio: generated.htmlFolio,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
