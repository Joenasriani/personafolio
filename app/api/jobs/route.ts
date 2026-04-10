import { NextResponse } from 'next/server';

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
        {
          error: 'Missing required fields: fullName, profession, and at least one link are required.',
        },
        { status: 400 }
      );
    }

    const jobId = `job_${Date.now()}`;

    return NextResponse.json({
      jobId,
      status: 'pending',
      fullName,
      profession,
      description,
      links,
      nextStep: 'Wire this route to Supabase job storage, then trigger crawling with Firecrawl.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Invalid JSON payload.',
      },
      { status: 400 }
    );
  }
}
