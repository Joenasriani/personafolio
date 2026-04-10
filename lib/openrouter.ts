import { getServerEnv } from '@/lib/env';

type ExtractionResult = {
  facts: Array<{
    label: string;
    value: string;
    confidence?: string;
    sourceUrl?: string;
  }>;
  mediaItems: Array<{
    mediaType: string;
    title?: string;
    sourceUrl?: string;
    mediaUrl?: string;
    embedAvailable?: boolean;
    thumbnailUrl?: string;
    roleOfPerson?: string;
    relevanceScore?: number;
    metadata?: Record<string, unknown>;
  }>;
  identitySummary?: string;
};

const extractionPrompt = `You are a structured identity extraction engine.
Return valid JSON only.

Extract from the provided web page text:
- facts: key identity, profession, organization, project, award, role, timeline, and biography statements
- mediaItems: videos, audio, music, images, galleries, podcasts, documents, and embeds mentioned or linked
- identitySummary: one short grounded summary

Return this exact JSON shape:
{
  "facts": [{ "label": "", "value": "", "confidence": "high|medium|low", "sourceUrl": "" }],
  "mediaItems": [{
    "mediaType": "video|audio|image|document|podcast|gallery|other",
    "title": "",
    "sourceUrl": "",
    "mediaUrl": "",
    "embedAvailable": false,
    "thumbnailUrl": "",
    "roleOfPerson": "creator|featured|mentioned|unknown",
    "relevanceScore": 0,
    "metadata": {}
  }],
  "identitySummary": ""
}

Rules:
- do not invent facts
- do not include commentary outside JSON
- keep facts concise
- use only evidence from the provided content`;

export async function extractStructuredData(input: {
  fullName: string;
  profession: string;
  sourceUrl: string;
  title?: string | null;
  rawText: string;
}): Promise<ExtractionResult> {
  const env = getServerEnv();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openRouterApi}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-4.1-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: extractionPrompt,
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
    throw new Error(payload?.error?.message || payload?.error || 'OpenRouter extraction failed.');
  }

  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenRouter returned no content.');
  }

  const parsed = JSON.parse(content);

  return {
    facts: Array.isArray(parsed?.facts) ? parsed.facts : [],
    mediaItems: Array.isArray(parsed?.mediaItems) ? parsed.mediaItems : [],
    identitySummary: typeof parsed?.identitySummary === 'string' ? parsed.identitySummary : '',
  };
}
