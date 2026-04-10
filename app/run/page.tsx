'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RunPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      fullName: String(formData.get('fullName') || '').trim(),
      profession: String(formData.get('profession') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      links: String(formData.get('links') || '')
        .split('\n')
        .map((link) => link.trim())
        .filter(Boolean),
    };

    setIsSubmitting(true);
    setStatus('Creating job...');
    setJobId(null);

    try {
      const createResponse = await fetch('/api/jobs-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const created = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(created.error || 'Failed to create job.');
      }

      setJobId(created.jobId);
      setStatus('Running crawl, extraction, and generation...');

      const runResponse = await fetch(`/api/jobs-live/${created.jobId}/run`, {
        method: 'POST',
      });
      const runResult = await runResponse.json();

      if (!runResponse.ok) {
        throw new Error(runResult.error || 'Pipeline run failed.');
      }

      setStatus('Done. Opening results...');
      router.push(`/results/${created.jobId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Run failed.';
      setStatus(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-14 text-text">
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-panel p-8 shadow-soft">
        <h1 className="text-3xl font-semibold">Run Personafolio end to end</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Submit public links once, then let the app create the job, crawl the sources, extract signal, and generate the folio.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium">Full name</label>
            <input name="fullName" required className="w-full rounded-2xl px-4 py-3" placeholder="Joe Example" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Profession</label>
            <input name="profession" required className="w-full rounded-2xl px-4 py-3" placeholder="Creative technologist" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Short description</label>
            <textarea name="description" rows={4} className="w-full rounded-2xl px-4 py-3" placeholder="Optional context for the crawler and summarizer." />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Links</label>
            <textarea name="links" required rows={8} className="w-full rounded-2xl px-4 py-3" placeholder="One URL per line\nhttps://linktr.ee/example\nhttps://example.com/about" />
          </div>
          <button type="submit" disabled={isSubmitting} className="rounded-2xl bg-accent px-5 py-3 font-medium text-background disabled:opacity-60">
            {isSubmitting ? 'Running…' : 'Run full pipeline'}
          </button>
        </form>

        {jobId ? <div className="mt-6 text-sm text-accentSoft">Job: {jobId}</div> : null}
        {status ? <div className="mt-3 rounded-2xl border border-border bg-panelSoft p-4 text-sm text-muted">{status}</div> : null}
      </div>
    </main>
  );
}
