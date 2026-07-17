import DomainSearch from "@/pages/_components/DomainSearch.tsx";
import { DomainExtensionsSection } from "./DomainExtensionsSection.tsx";

export function DomainSearchSection() {
  return (
    <>
      <DomainSearch />
      <DomainExtensionsSection />
    </>
  );
}
