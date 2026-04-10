import { getServerEnv } from '@/lib/env';

type GenerateSummaryInput = {
  fullName: string;
  profession: string;
  description?: string | null;
  facts: Array<{ label: string; value: string; confidence?: string | null; sourceUrl?: string | null }>;
  mediaItems: Array<{
    mediaType: string;
    title?: string | null;
    sourceUrl?: string | null;
    mediaUrl?: string | null;
    embedAvailable?: boolean | null;
    thumbnailUrl?: string | null;
    roleOfPerson?: string | null;
    relevanceScore?: number | null;
  }>;
};

type GenerateSummaryResult = {
  identitySnapshot: string;
  professionalSummary: string;
  shortBio: string;
  htmlFolio: string;
};

const generationPrompt = `You are a professional identity synthesis engine.
Return valid JSON only.

Input includes a person's name, profession, extracted facts, and extracted media items.
Generate:
- identitySnapshot: one short paragraph
- professionalSummary: a polished 80-140 word summary grounded in the facts
- shortBio: one concise 1-2 line bio
- htmlFolio: a single self-contained HTML document with sections:
  Hero, About, Facts, Media, Links

Rules:
- do not invent information
- use only the provided facts and media
- keep the HTML clean and minimal
- no external CSS frameworks
- no markdown in htmlFolio
- return this exact JSON shape:
{
  "identitySnapshot": "",
  "professionalSummary": "",
  "shortBio": "",
  "htmlFolio": ""
}`;

export async function generateSummaryAndFolio(input: GenerateSummaryInput): Promise<GenerateSummaryResult> {
  const env = getServerEnv();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openRouterApi}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-4.1-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: generationPrompt,
        },
        {
          role: 'user',
          content: JSON.stringify(input),
        },
      ],
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.error || 'OpenRouter generation failed.');
  }

  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenRouter returned no generation content.');
  }

  const parsed = JSON.parse(content);

  return {
    identitySnapshot: typeof parsed?.identitySnapshot === 'string' ? parsed.identitySnapshot : '',
    professionalSummary: typeof parsed?.professionalSummary === 'string' ? parsed.professionalSummary : '',
    shortBio: typeof parsed?.shortBio === 'string' ? parsed.shortBio : '',
    htmlFolio: typeof parsed?.htmlFolio === 'string' ? parsed.htmlFolio : '',
  };
}
