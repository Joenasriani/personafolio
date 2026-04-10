import { getJobResult } from '@/lib/jobs';

export default async function ResultsPage({ params }: { params: { jobId: string } }) {
  const { job, facts, mediaItems, outputs, sourceLinks } = await getJobResult(params.jobId);

  const identitySnapshot = outputs.find((item) => item.output_type === 'identity_snapshot')?.content || '';
  const professionalSummary = outputs.find((item) => item.output_type === 'professional_summary')?.content || '';
  const shortBio = outputs.find((item) => item.output_type === 'short_bio')?.content || '';
  const htmlFolio = outputs.find((item) => item.output_type === 'html_folio')?.content || '';

  return (
    <main className="min-h-screen bg-background px-6 py-14 text-text">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-border bg-panel p-8 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm text-muted">Job {job.id}</div>
              <h1 className="mt-2 text-3xl font-semibold">{job.full_name}</h1>
              <p className="mt-2 text-muted">{job.profession}</p>
            </div>
            <div className="rounded-2xl border border-border bg-panelSoft px-4 py-2 text-sm">
              Status: {job.status}
            </div>
          </div>
          {shortBio ? <p className="mt-5 text-lg text-accentSoft">{shortBio}</p> : null}
          {identitySnapshot ? <p className="mt-4 max-w-4xl leading-8 text-muted">{identitySnapshot}</p> : null}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div className="rounded-3xl border border-border bg-panel p-8 shadow-soft">
              <h2 className="text-xl font-semibold">Professional summary</h2>
              <p className="mt-4 leading-8 text-muted">{professionalSummary || 'No generated summary yet.'}</p>
            </div>

            <div className="rounded-3xl border border-border bg-panel p-8 shadow-soft">
              <h2 className="text-xl font-semibold">Extracted facts</h2>
              <div className="mt-5 grid gap-4">
                {facts.length > 0 ? facts.map((fact) => (
                  <div key={fact.id} className="rounded-2xl border border-border bg-panelSoft p-4">
                    <div className="text-sm text-accentSoft">{fact.label}</div>
                    <div className="mt-1 text-sm leading-7 text-muted">{fact.value}</div>
                    {fact.source_url ? <div className="mt-2 text-xs text-muted">Source: {fact.source_url}</div> : null}
                  </div>
                )) : <div className="text-sm text-muted">No facts extracted yet.</div>}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-panel p-8 shadow-soft">
              <h2 className="text-xl font-semibold">HTML folio</h2>
              {htmlFolio ? (
                <iframe
                  title="Personafolio HTML preview"
                  srcDoc={htmlFolio}
                  className="mt-5 h-[600px] w-full rounded-2xl border border-border bg-white"
                />
              ) : (
                <div className="mt-4 text-sm text-muted">No HTML folio generated yet.</div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-border bg-panel p-8 shadow-soft">
              <h2 className="text-xl font-semibold">Source links</h2>
              <div className="mt-5 space-y-3">
                {sourceLinks.length > 0 ? sourceLinks.map((link) => (
                  <div key={link.id} className="rounded-2xl border border-border bg-panelSoft p-4 text-sm">
                    <div className="break-all text-muted">{link.url}</div>
                    <div className="mt-2 text-xs text-accentSoft">{link.status}</div>
                  </div>
                )) : <div className="text-sm text-muted">No source links saved yet.</div>}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-panel p-8 shadow-soft">
              <h2 className="text-xl font-semibold">Media items</h2>
              <div className="mt-5 space-y-3">
                {mediaItems.length > 0 ? mediaItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border bg-panelSoft p-4 text-sm">
                    <div className="font-medium">{item.title || item.media_type}</div>
                    <div className="mt-2 text-muted">{item.media_type}</div>
                    {item.source_url ? <div className="mt-2 break-all text-xs text-muted">{item.source_url}</div> : null}
                  </div>
                )) : <div className="text-sm text-muted">No media items extracted yet.</div>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
