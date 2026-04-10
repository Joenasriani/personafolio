import Link from 'next/link';

const features = [
  'Paste websites, Linktree pages, portfolios, videos, and press links.',
  'Extract identity, roles, projects, and public media references.',
  'Generate a clean summary, source map, media map, and HTML folio.',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-border bg-panel p-8 shadow-soft">
            <div className="inline-flex rounded-full border border-border bg-panelSoft px-3 py-1 text-sm text-accent">
              Personafolio MVP
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
              Turn public links into a source-backed professional folio.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              Personafolio collects user-approved links, extracts professional signal, maps public media,
              and prepares a polished identity summary with a folio-ready output.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/submit" className="rounded-2xl bg-accent px-5 py-3 font-medium text-background">
                Start a profile
              </Link>
              <a href="https://github.com/Joenasriani/personafolio" className="rounded-2xl border border-border px-5 py-3 font-medium text-text">
                View repository
              </a>
            </div>
          </section>

          <aside className="rounded-3xl border border-border bg-panel p-8 shadow-soft">
            <h2 className="text-xl font-semibold">What the MVP does</h2>
            <div className="mt-6 space-y-4">
              {features.map((feature) => (
                <div key={feature} className="rounded-2xl border border-border bg-panelSoft p-4 text-sm leading-7 text-muted">
                  {feature}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
