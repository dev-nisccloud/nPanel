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
  {
    title: "Automate",
    description: "Zepo AI assistants that answer customers and follow up leads around the clock.",
    deliverables: ["Website and WhatsApp assistants", "Lead follow-up", "Email marketing"],
    href: "/services/zeepo-ai",
    linkLabel: "Zepo AI",
    art: () => <ZeepoArt />,
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
            Every engagement draws on the same four disciplines, so a client can start with one and add the rest without changing providers.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {CAPABILITIES.map((c) => (
              <article key={c.title} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border bg-muted/30 p-4" aria-hidden>
                  {c.art()}
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
