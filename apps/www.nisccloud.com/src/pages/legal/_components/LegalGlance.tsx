export type GlanceFact = { value: string; label: string; detail: string };

/** Joined row of headline facts for a legal document. Every value must match the document text. */
export function LegalGlance({ title, facts }: { title: string; facts: readonly GlanceFact[] }) {
  return (
    <section aria-labelledby="at-a-glance" className="border-b border-border bg-background print:border-0">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-12 print:px-0 print:py-4">
        <p className="type-label text-[#38b6ff]">At a glance</p>
        <h2 id="at-a-glance" className="mt-2 text-lg font-semibold tracking-tight text-foreground md:text-xl">
          {title}
        </h2>
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border border-border bg-border lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="flex flex-col bg-card px-4 py-5 sm:px-5 sm:py-6 md:px-6">
              <dt className="order-2 mt-2 text-sm font-semibold text-foreground">{fact.label}</dt>
              <dd className="order-1 text-2xl font-semibold tracking-tight text-[#38b6ff] sm:text-3xl md:text-4xl">{fact.value}</dd>
              <dd className="order-3 mt-1 text-sm leading-relaxed text-muted-foreground">{fact.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
