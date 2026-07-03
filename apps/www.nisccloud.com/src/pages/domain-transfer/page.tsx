import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import { PricingProvider } from "@/lib/domain-search/pricing-context.tsx";
import { TransferDomainSection } from "./_components/TransferDomainSection.tsx";
import { TransferPrerequisites } from "./_components/TransferPrerequisites.tsx";

export default function DomainTransferPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8 md:py-10">
          <div className="mb-6 flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Domain Transfer</h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Transfer domains from other registrars to Nisc Cloud. Check eligibility and pricing, then
              complete checkout with your authorization code.
            </p>
          </div>

          <PricingProvider>
            <TransferDomainSection />
          </PricingProvider>

          <div className="mt-8">
            <TransferPrerequisites />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
