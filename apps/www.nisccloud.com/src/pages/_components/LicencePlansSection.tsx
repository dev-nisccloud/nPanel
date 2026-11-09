import { ArrowRight, Check, Coins, Repeat, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

type LicencePlan = {
  name: string;
  /** Vendor list price in USD per user per month on an annual commitment; `null` for quote-only. */
  annual: number | null;
  /** Vendor no-commitment monthly price, where the vendor publishes one. */
  flexible?: number;
  points: string[];
};

type Vendor = {
  title: string;
  checkedOn: string;
  sourceLabel: string;
  sourceUrl: string;
  plans: LicencePlan[];
  commitment: string;
  userLimit: string;
};

/**
 * Vendor list prices as published on the vendors' own sites. Introductory or promotional prices
 * are deliberately excluded. The customer's KES price, including Nisc Cloud's margin, is quoted.
 */
const VENDORS: Record<"microsoft-365" | "google-workspace", Vendor> = {
  "microsoft-365": {
    title: "Microsoft 365",
    checkedOn: "8 November 2026",
    sourceLabel: "microsoft.com",
    sourceUrl: "https://www.microsoft.com/en-us/microsoft-365/business/compare-all-microsoft-365-business-products",
    commitment:
      "Microsoft lists these prices per user per month on an annual subscription that renews automatically. Monthly-commitment options cost more and are confirmed in your quote.",
    userLimit: "Business plans support up to 300 users. Larger organisations need an enterprise plan, which we quote separately.",
    plans: [
      {
        name: "Business Basic",
        annual: 7,
        points: [
          "Web and mobile Word, Excel, PowerPoint and Outlook",
          "Business email on your domain",
          "Microsoft Teams chat, calls and meetings",
          "Spam and malware filtering",
        ],
      },
      {
        name: "Business Standard",
        annual: 14,
        points: [
          "Desktop, web and mobile Office apps",
          "Business email on your domain",
          "1 TB cloud storage per user",
          "Teams meetings and webinars",
          "Loop, Clipchamp, Bookings and Planner",
        ],
      },
      {
        name: "Business Premium",
        annual: 22,
        points: [
          "Everything in Business Standard",
          "Advanced device management",
          "Threat protection against phishing and cyber attacks",
          "Information protection for sensitive data",
        ],
      },
    ],
  },
  "google-workspace": {
    title: "Google Workspace",
    checkedOn: "8 November 2026",
    sourceLabel: "Google Workspace Help",
    sourceUrl: "https://knowledge.workspace.google.com/admin/billing/compare-flexible-and-annual-fixed-term-payment-plans",
    commitment:
      "Google lists an Annual plan (one-year commitment, paid monthly or yearly) and a Flexible plan (no commitment, add or remove users any time). Both are shown per user per month.",
    userLimit: "Business Starter, Standard and Plus support up to 300 users. Enterprise has no user limit and is quoted.",
    plans: [
      {
        name: "Business Starter",
        annual: 7,
        flexible: 8.4,
        points: [
          "Gmail on your business domain",
          "30 GB pooled storage per user",
          "Gemini in Gmail",
          "Video meetings for up to 100 participants",
        ],
      },
      {
        name: "Business Standard",
        annual: 14,
        flexible: 16.8,
        points: [
          "2 TB pooled storage per user",
          "Gemini in Gmail, Docs, Meet and more",
          "Meetings with recording, up to 150 participants",
          "eSignature and appointment booking",
        ],
      },
      {
        name: "Business Plus",
        annual: 22,
        flexible: 26.4,
        points: [
          "5 TB pooled storage per user",
          "Vault to retain, archive and search data",
          "Meetings for up to 500 participants",
          "Advanced endpoint management",
        ],
      },
      {
        name: "Enterprise",
        annual: null,
        points: [
          "5 TB pooled storage per user, expandable",
          "S/MIME email encryption",
          "Meetings for up to 1,000 participants",
          "No user limit",
        ],
      },
    ],
  },
};

const usd = (n: number) => `US$${n.toFixed(2)}`;

function enquiryUrl(vendor: string, plan: string) {
  return `/contact?${new URLSearchParams({ service: "launch", serviceName: vendor, plan }).toString()}`;
}

export function LicencePlansSection({ kind }: { kind: keyof typeof VENDORS }) {
  const vendor = VENDORS[kind];
  const explainers = [
    { icon: Users, title: "Priced per user", body: "You pay for each person who needs a licence, and can mix plans across your team." },
    {
      icon: Coins,
      title: "Quoted in KES",
      body: "Prices below are the vendor's USD list prices, excluding taxes. Your quote states the KES price per user.",
    },
    { icon: Repeat, title: "Monthly or annual", body: vendor.commitment },
    {
      icon: Truck,
      title: "Migration planned",
      body: "We review your mailboxes, files and devices and agree the migration scope and timing before anything changes.",
    },
  ];

  return (
    <section id="plans" className="bg-muted/10 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <h2 className="text-[36px] font-extrabold leading-[1.15] tracking-tight">{vendor.title} plans</h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Choose licences around the work each person does. We confirm the plan mix, your KES price and
            migration in one proposal.
          </p>
        </div>

        <div
          className={cn(
            "grid grid-cols-1 gap-6 md:grid-cols-2",
            vendor.plans.length >= 4 ? "xl:grid-cols-4" : "lg:grid-cols-3",
          )}
        >
          {vendor.plans.map((plan) => {
            const quoted = plan.annual == null;
            return (
              <article
                key={plan.name}
                className={cn(
                  "flex h-full flex-col rounded-2xl border p-6",
                  quoted
                    ? "border-neutral-800 bg-neutral-950 text-white dark:border-white/10 dark:bg-neutral-900"
                    : "border-border bg-card",
                )}
              >
                <h3 className="text-xl font-bold tracking-tight">{plan.name}</h3>
                <div className="mt-4 min-h-[5.5rem]">
                  {quoted ? (
                    <>
                      <p className="text-3xl font-extrabold tracking-tight">Custom pricing</p>
                      <p className="mt-1.5 text-xs text-white/60">Quoted through Google sales and resellers</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Vendor list price</p>
                      <p className="mt-1 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold tracking-tight tabular-nums">{usd(plan.annual!)}</span>
                        <span className="text-sm text-muted-foreground">/user/month</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Annual commitment
                        {plan.flexible ? ` · ${usd(plan.flexible)} with no commitment` : ""}
                      </p>
                    </>
                  )}
                </div>
                <Button
                  asChild
                  size="lg"
                  variant={quoted ? "default" : "outline"}
                  className={cn(
                    "mt-5 w-full gap-2 font-semibold",
                    quoted
                      ? "bg-white text-neutral-950 hover:bg-white/90"
                      : "border-primary/40 text-primary hover:bg-primary/5 hover:text-primary",
                  )}
                >
                  <a href={enquiryUrl(vendor.title, plan.name)}>
                    {quoted ? "Talk to Sales" : "Get a KES quote"}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <ul className={cn("mt-6 flex-1 space-y-2 border-t pt-5", quoted ? "border-white/10" : "border-border/70")}>
                  {plan.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[13px] leading-snug">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                      </span>
                      <span className={quoted ? "text-white/85" : "text-foreground/85"}>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          List prices checked on {vendor.checkedOn} at{" "}
          <a href={vendor.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            {vendor.sourceLabel}
          </a>
          . Introductory offers are not shown. {vendor.userLimit}
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {explainers.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
