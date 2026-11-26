import DomainSearch from "@/pages/_components/DomainSearch.tsx";
import { AccreditationBadges } from "@/pages/_components/AccreditationStrip.tsx";
import { PricingProvider } from "@/lib/domain-search/pricing-context.tsx";
import { DomainExtensionsSection } from "./DomainExtensionsSection.tsx";

export function DomainSearchSection() {
  return (
    <PricingProvider>
      <DomainSearch embedded />
      <div className="container mx-auto px-4 pt-2 pb-6">
        <AccreditationBadges className="justify-center" />
      </div>
      <DomainExtensionsSection />
    </PricingProvider>
  );
}
