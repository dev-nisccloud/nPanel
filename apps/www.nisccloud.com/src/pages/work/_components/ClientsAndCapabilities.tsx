import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileCheck2 } from "lucide-react";
import { CLIENT_LOGOS } from "@/lib/clients.ts";
import { BrandWebFlagshipArt, HostingFlagshipArt, SeoFlagshipArt } from "@/components/artwork/flagship-art.tsx";
import { ZeepoArt } from "@/components/artwork/growth-art.tsx";

type Capability = {
  title: string;
  description: string;
  deliverables: string[];
  href: string;
  linkLabel: string;
  art: () => ReactNode;
};

const CAPABILITIES: Capability[] = [
  {
    title: "Build",
    description: "Brand identities and websites that make a business look established from day one.",
    deliverables: ["Logo and brand kit", "Business websites", "Online stores"],
    href: "/services/website-design",
    linkLabel: "Brand and web design",
    art: () => <BrandWebFlagshipArt />,
  },
  {
    title: "Run",
    description: "Domains, hosting, business email and servers, managed from one nPanel account.",
    deliverables: [".co.ke and international domains", "Website and WordPress hosting", "Business email and servers"],
    href: "/hosting",
    linkLabel: "Cloud products",
    art: () => <HostingFlagshipArt />,
  },
  {
    title: "Grow",
    description: "Search, social and paid campaigns that bring in enquiries, with clear reporting.",
    deliverables: ["SEO and content", "Social media management", "Paid advertising"],
    href: "/services/seo",
    linkLabel: "Marketing services",
    art: () => <SeoFlagshipArt />,
  },
];

export default function ClientsAndCapabilities() {
  return (
    <>
      <section aria-labelledby="work-clients" className="px-4 md:px-8 pb-16 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 id="work-clients" className="text-sm font-semibold text-muted-foreground mb-5">
            Some of the businesses we work with
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CLIENT_LOGOS.map((client) => (
              <li
                key={client.name}
                className="flex h-24 items-center justify-center rounded-xl border border-border bg-card px-4"
              >
                <img
                  src={client.logo}
                  alt={client.name}
                  loading="lazy"
                  className="max-h-14 w-auto max-w-full object-contain"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="work-capabilities" className="px-4 md:px-8 pb-16 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 id="work-capabilities" className="text-2xl font-bold mb-2">
            What we deliver
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
            Start with Build, Run or Grow and add the other capabilities as your
            business needs them. Automation supports work across all three
            pillars rather than standing apart from them.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <article key={c.title} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border bg-muted/30 p-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Illustration · sample business and data
                  </p>
                  <div aria-hidden>
                  {c.art()}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{c.description}</p>
                  <ul className="mb-5 space-y-1.5 text-sm">
                    {c.deliverables.map((d) => (
                      <li key={d} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={c.href}
                    className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary hover:opacity-80"
                  >
                    {c.linkLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <article className="mt-6 grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col justify-center p-6 md:p-8">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Automation across the pillars
              </p>
              <h3 className="text-xl font-bold">Zepo supports Build, Run and Grow</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Use Zepo for service questions, research, content and images,
                technical guidance, SEO and marketing ideas, with escalation to
                customer service or technical support when a person is needed.
              </p>
              <Link
                to="/services/zepo-ai"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:opacity-80"
              >
                Explore Zepo <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="border-t border-border bg-muted/30 p-4 md:border-t-0 md:border-l">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Illustration · sample business and data
              </p>
              <div aria-hidden>
                <ZeepoArt />
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="px-4 md:px-8 pb-10 bg-background">
        <div className="max-w-7xl mx-auto flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-5">
          <FileCheck2 className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Detailed case studies are on the way.</span>{" "}
            We publish project details and results only after each client has reviewed and approved them. Ask us for references relevant to your project.
          </p>
        </div>
      </section>
    </>
  );
}
