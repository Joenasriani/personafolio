'use client';

import { useState } from 'react';

export default function SubmitPage() {
  const [status, setStatus] = useState<string | null>(null);
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
    setStatus(null);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      setStatus(response.ok ? `Job created: ${result.jobId}` : result.error || 'Something went wrong');
    } catch (error) {
      setStatus('Request failed. Check the console and environment setup.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-14 text-text">
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-panel p-8 shadow-soft">
        <h1 className="text-3xl font-semibold">Create a Personafolio job</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Paste a public identity trail: website, portfolio, Linktree, media, interviews, articles, and other profile links.
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
            <textarea
              name="links"
              required
              rows={8}
              className="w-full rounded-2xl px-4 py-3"
              placeholder="One URL per line\nhttps://linktr.ee/example\nhttps://example.com/about"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-accent px-5 py-3 font-medium text-background disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting…' : 'Create job'}
          </button>
        </form>

        {status ? (
          <div className="mt-6 rounded-2xl border border-border bg-panelSoft p-4 text-sm text-muted">{status}</div>
        ) : null}
      </div>
    </main>
  );
}
