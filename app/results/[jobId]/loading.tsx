export default function ResultsLoading() {
  return (
    <main className="min-h-screen bg-background px-6 py-14 text-text">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-border bg-panel p-8 shadow-soft">
          <div className="h-6 w-40 animate-pulse rounded bg-panelSoft" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded bg-panelSoft" />
          <div className="mt-4 h-5 w-52 animate-pulse rounded bg-panelSoft" />
        </div>
      </div>
    </main>
  );
}
