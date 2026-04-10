import { NextResponse } from 'next/server';
import { runCrawlStage, runExtractStage } from '@/lib/pipeline';

export async function POST(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId.' }, { status: 400 });
  }

  try {
    const origin = new URL(request.url).origin;
    const crawlResults = await runCrawlStage(jobId);
    const extractResults = await runExtractStage(jobId);

    const fallbackResponse = await fetch(`${origin}/api/jobs-live/${jobId}/generate-fallback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const fallbackResult = await fallbackResponse.json();

    if (!fallbackResponse.ok) {
      return NextResponse.json(
        {
          error: fallbackResult.error || 'Fallback generation failed.',
          crawlResults,
          extractResults,
        },
        { status: fallbackResponse.status }
      );
    }

    return NextResponse.json({
      jobId,
      status: 'generated',
      crawlResults,
      extractResults,
      generated: fallbackResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Run pipeline failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
