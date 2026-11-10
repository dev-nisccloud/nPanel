import { Link } from "react-router-dom";
import { ArrowRight, Building2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import ProposalEnquiry from "@/components/ProposalEnquiry.tsx";

const selfServiceProducts = [
  { label: "Domains", href: "/hosting/domains" },
  { label: "Website hosting", href: "/hosting/shared" },
  { label: "Business email", href: "/hosting/email" },
  { label: "VPS & servers", href: "/hosting/vps" },
  { label: "SSL certificates", href: "/security/ssl" },
  { label: "Microsoft 365", href: "/hosting/microsoft-365" },
] as const;

/** Homepage close: self-service purchase on one side, the guided corporate enquiry on the other. */
export default function HomeClosing() {
  return (
    <section
      id="get-started"
      aria-labelledby="closing-heading"
      className="py-14 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2
            id="closing-heading"
            className="text-balance text-3xl font-bold tracking-tight md:text-4xl"
          >
            Two ways to get started.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Buy cloud products online in minutes, or tell us what your business
            needs and we will prepare a proposal.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="flex flex-col rounded-3xl bg-primary p-7 text-[#02070a] md:p-8 lg:sticky lg:top-24 lg:self-start">
            <ShoppingCart className="mb-5 size-8" aria-hidden />
            <p className="type-label">Self-service</p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight">
              Ready to buy? Start online.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#02070a]/80">
              Prices are shown before checkout. Manage everything afterwards in
              nPanel.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {selfServiceProducts.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white/40 px-3.5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02070a]"
                  >
                    {label}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Button
                asChild
                size="lg"
                className="gap-2 rounded-[10px] bg-[#02070a] font-semibold text-white hover:bg-[#02070a]/85"
              >
                <Link to="/hosting">
                  Explore Cloud Products
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="rounded-[10px] border border-[#02070a]/30 font-semibold text-[#02070a] hover:bg-white/30 hover:text-[#02070a]"
              >
                <Link to="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>

          <div id="proposal" className="scroll-mt-24">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-xl font-bold tracking-tight">
                  Discuss your project
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tell us what you need in three short steps. We will reply with
                  the next step and, where it fits, a scoped proposal.
                </p>
              </div>
            </div>
            <ProposalEnquiry source="homepage" />
          </div>
        </div>
      </div>
    </section>
  );
}
