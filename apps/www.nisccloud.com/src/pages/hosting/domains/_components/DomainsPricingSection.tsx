import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

/** Domain prices are live after search. Do not advertise static domain plan prices here. */
export default function DomainsPricingSection({ sectionId = "pricing" }: { sectionId?: string }) {
  return (
    <section id={sectionId} className="mx-auto max-w-7xl px-4 py-20 md:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">Pricing</span>
        <h2 className="mt-2 mb-3 text-3xl font-bold">Search to See the Live Price</h2>
        <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
          Domain prices depend on the name and extension you choose. Search your domain to see availability and the exact price before you check out.
        </p>
        <Button
          className="h-11 cursor-pointer gap-2 rounded-xl px-8 font-bold"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <Search size={16} />
          Search Domains
          <ArrowRight size={15} />
        </Button>
      </div>
    </section>
  );
}
