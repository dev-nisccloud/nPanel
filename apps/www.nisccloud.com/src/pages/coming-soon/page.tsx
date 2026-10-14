import { useEffect } from "react";

export default function ComingSoonPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Coming soon · Nisc Cloud";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="relative flex min-h-svh flex-col bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 56% 42% at 50% 42%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 70%)",
        }}
      />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <img
          src="/nisccloud-logo.svg"
          alt="Nisc Cloud"
          className="h-11 w-auto sm:h-12"
        />

        <p className="mt-14 font-mono text-[11px] font-medium uppercase tracking-[0.34em] text-primary">
          Coming soon
        </p>

        <h1 className="mt-5 max-w-md text-[1.75rem] font-medium leading-snug tracking-tight sm:text-4xl sm:leading-[1.2]">
          Transforming businesses to stand out and succeed.
        </h1>

        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
          The new Nisc Cloud site is almost ready.
        </p>

        <p className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <a
            href="mailto:sales@nisccloud.com"
            className="text-foreground transition-colors hover:text-primary"
          >
            sales@nisccloud.com
          </a>
          <span aria-hidden className="text-border">
            ·
          </span>
          <a
            href="tel:+254748777666"
            className="transition-colors hover:text-primary"
          >
            +254 748 777 666
          </a>
        </p>
      </div>

      <p className="relative pb-8 text-center text-xs tracking-wide text-muted-foreground">
        Nairobi, Kenya
      </p>
    </main>
  );
}
