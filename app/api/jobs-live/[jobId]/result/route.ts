import { NextResponse } from 'next/server';
import { getJobResult } from '@/lib/jobs';

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId.' }, { status: 400 });
  }

  try {
    const result = await getJobResult(jobId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch result.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
