'use client';

export default function ResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-background px-6 py-14 text-text">
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-panel p-8 shadow-soft">
        <h1 className="text-3xl font-semibold">Unable to load this result</h1>
        <p className="mt-4 leading-8 text-muted">
          The job result could not be loaded. This can happen if the job ID is invalid, the pipeline has not
          finished yet, or the database connection is not configured correctly.
        </p>
        <div className="mt-6 rounded-2xl border border-border bg-panelSoft p-4 text-sm text-muted">
          {error.message || 'Unknown error'}
        </div>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-2xl bg-accent px-5 py-3 font-medium text-background"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
