import { NextResponse } from 'next/server';
import { runCrawlStage, runExtractStage, runGenerateStage } from '@/lib/pipeline';

export async function POST(
  _request: Request,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId.' }, { status: 400 });
  }

  try {
    const crawlResults = await runCrawlStage(jobId);
    const extractResults = await runExtractStage(jobId);
    const generated = await runGenerateStage(jobId);

    return NextResponse.json({
      jobId,
      status: 'generated',
      crawlResults,
      extractResults,
      generated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Run pipeline failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
