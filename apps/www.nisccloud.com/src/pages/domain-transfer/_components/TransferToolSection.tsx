import { PricingProvider } from "@/lib/domain-search/pricing-context.tsx";
import { TransferDomainSection } from "./TransferDomainSection.tsx";
import { TransferPrerequisites } from "./TransferPrerequisites.tsx";

export function TransferToolSection() {
  return (
    <PricingProvider>
      <section className="relative overflow-hidden py-16 md:py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 40%, color-mix(in srgb, var(--color-primary) 5%, transparent), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-mono tracking-wide text-primary">
              START YOUR TRANSFER
            </div>
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              Check If Your Domain Can Move
            </h2>
            <p className="mx-auto max-w-xl text-base text-muted-foreground">
              Enter your domain to see if it can transfer and to get the live transfer price. We will guide you through the rest.
            </p>
          </div>

          <TransferDomainSection />

          <div className="mt-8">
            <TransferPrerequisites />
          </div>
        </div>
      </section>
    </PricingProvider>
  );
}
