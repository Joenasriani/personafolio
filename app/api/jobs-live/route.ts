import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

function normalizeLinks(links: unknown): string[] {
  if (!Array.isArray(links)) return [];

  return links
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .filter((link, index, array) => array.indexOf(link) === index);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const profession = typeof body.profession === 'string' ? body.profession.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const links = normalizeLinks(body.links);

    if (!fullName || !profession || links.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, profession, and at least one link are required.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        full_name: fullName,
        profession,
        description,
        status: 'pending',
      })
      .select('id, status, full_name, profession, description, created_at')
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: jobError?.message || 'Failed to create job record.' },
        { status: 500 }
      );
    }

    const sourceRows = links.map((url) => ({
      job_id: job.id,
      url,
      status: 'queued',
    }));

    const { error: linkError } = await supabase.from('source_links').insert(sourceRows);

    if (linkError) {
      return NextResponse.json(
        { error: linkError.message, jobId: job.id },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      fullName: job.full_name,
      profession: job.profession,
      description: job.description,
      links,
      createdAt: job.created_at,
      nextStep: 'Trigger crawling and extraction for this job.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON payload.';

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
