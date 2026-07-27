import DomainSearch from "@/pages/_components/DomainSearch.tsx";
import { PricingProvider } from "@/lib/domain-search/pricing-context.tsx";
import { DomainExtensionsSection } from "./DomainExtensionsSection.tsx";

export function DomainSearchSection() {
  return (
    <PricingProvider>
      <DomainSearch embedded />
      <DomainExtensionsSection />
    </PricingProvider>
  );
}
