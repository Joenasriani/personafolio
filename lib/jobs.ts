import { getSupabaseAdmin } from '@/lib/supabase';

export async function createJobWithLinks(input: {
  fullName: string;
  profession: string;
  description?: string;
  links: string[];
}) {
  const supabase = getSupabaseAdmin();

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      full_name: input.fullName,
      profession: input.profession,
      description: input.description || '',
      status: 'pending',
    })
    .select('id, status, full_name, profession, description, created_at')
    .single();

  if (jobError || !job) {
    throw new Error(jobError?.message || 'Failed to create job record.');
  }

  const sourceRows = input.links.map((url) => ({
    job_id: job.id,
    url,
    status: 'queued',
  }));

  const { error: linkError } = await supabase.from('source_links').insert(sourceRows);

  if (linkError) {
    throw new Error(linkError.message);
  }

  return job;
}

export async function getJobResult(jobId: string) {
  const supabase = getSupabaseAdmin();

  const [jobRes, factsRes, mediaRes, outputsRes, linksRes] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', jobId).single(),
    supabase.from('extracted_facts').select('*').eq('job_id', jobId),
    supabase.from('media_items').select('*').eq('job_id', jobId),
    supabase.from('generated_outputs').select('*').eq('job_id', jobId),
    supabase.from('source_links').select('*').eq('job_id', jobId),
  ]);

  if (jobRes.error || !jobRes.data) {
    throw new Error(jobRes.error?.message || 'Job not found.');
  }

  return {
    job: jobRes.data,
    facts: factsRes.data || [],
    mediaItems: mediaRes.data || [],
    outputs: outputsRes.data || [],
    sourceLinks: linksRes.data || [],
  };
}
