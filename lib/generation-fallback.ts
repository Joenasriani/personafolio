export function buildFallbackFacts(input: {
  description?: string | null;
  identitySummaries: string[];
  mediaItems: Array<{
    mediaType?: string | null;
    title?: string | null;
    sourceUrl?: string | null;
    mediaUrl?: string | null;
    roleOfPerson?: string | null;
  }>;
  crawledPages: Array<{
    title?: string | null;
    url?: string | null;
    rawText?: string | null;
  }>;
}) {
  const facts: Array<{ label: string; value: string; confidence?: string; sourceUrl?: string | null }> = [];

  if (input.description?.trim()) {
    facts.push({
      label: 'provided_description',
      value: input.description.trim(),
      confidence: 'medium',
      sourceUrl: null,
    });
  }

  for (const summary of input.identitySummaries) {
    if (summary?.trim()) {
      facts.push({
        label: 'identity_summary',
        value: summary.trim(),
        confidence: 'medium',
        sourceUrl: null,
      });
    }
  }

  for (const item of input.mediaItems) {
    const parts = [item.title, item.mediaType, item.roleOfPerson].filter(Boolean);
    if (parts.length > 0) {
      facts.push({
        label: 'media_signal',
        value: parts.join(' | '),
        confidence: 'low',
        sourceUrl: item.sourceUrl || item.mediaUrl || null,
      });
    }
  }

  for (const page of input.crawledPages) {
    const text = (page.rawText || '').replace(/\s+/g, ' ').trim();
    const shortText = text.slice(0, 280).trim();
    if (page.title || shortText) {
      facts.push({
        label: 'page_signal',
        value: [page.title, shortText].filter(Boolean).join(' — '),
        confidence: 'low',
        sourceUrl: page.url || null,
      });
    }
  }

  const seen = new Set<string>();
  return facts.filter((fact) => {
    const key = `${fact.label}:${fact.value}:${fact.sourceUrl || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
