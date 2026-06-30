import { motion } from "motion/react";
import { Check, ArrowRight, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import { buildOrderPlanCartParams, navigateToStorefrontCart } from "@/lib/storefront-cart-url.ts";
import type { OrderPlan } from "@/pages/hosting/_components/OrderDialog.tsx";

const plans: OrderPlan[] = [
  {
    id: "domain-coke",
    name: ".co.ke Domain",
    price: 999,
    period: "yr",
    features: [
      "1-Year .co.ke Registration",
      "Free WHOIS Privacy",
      "Free DNS Management",
      "Domain Lock Enabled",
      "Auto-Renewal Option",
      "Email & SMS Expiry Alerts",
      "M-Pesa Payment Accepted",
      "KENIC-Accredited Registration",
      "24/7 Domain Support",
    ],
  },
  {
    id: "domain-com-popular",
    name: ".com Domain",
    price: 1200,
    period: "yr",
    features: [
      "1-Year .com Registration",
      "Free WHOIS Privacy",
      "Free DNS Management",
      "Domain Lock Enabled",
      "Auto-Renewal Option",
      "Email & SMS Expiry Alerts",
      "M-Pesa Payment Accepted",
      "ICANN-Accredited Registration",
      "200+ TLD Extensions Available",
      "24/7 Domain Support",
    ],
  },
  {
    id: "domain-bundle",
    name: "Business Bundle",
    price: 1800,
    period: "yr",
    features: [
      ".co.ke + .com Registered Together",
      "Both Domains Point to One Site",
      "Free WHOIS Privacy (Both)",
      "Free DNS Management (Both)",
      "Domain Lock on Both",
      "Auto-Renewal Option",
      "Email & SMS Expiry Alerts",
      "M-Pesa Payment Accepted",
      "Brand Protected in Kenya & Globally",
      "Priority Support",
      "Free Domain Forwarding Setup",
    ],
  },
];

const addons = [
  { id: "domain-addon-ssl", label: "Basic SSL Certificate", price: 1500, period: "yr" },
  { id: "domain-addon-business-email", label: "Business Email (5 mailboxes)", price: 250, period: "mo" },
];

export default function DomainsPricingSection({ sectionId = "pricing" }: { sectionId?: string }) {
  const handlePlanSelect = async (plan: OrderPlan) => {
    try {
      await navigateToStorefrontCart(
        buildOrderPlanCartParams(plan, "domain_registration", "Domain Registration"),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open checkout.");
    }
  };

  return (
    <section id={sectionId} className="mx-auto max-w-7xl px-4 py-20 md:px-8">
      <div className="mb-12 text-center">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">Pricing</span>
        <h2 className="mt-2 mb-2 text-3xl font-bold">Transparent. No Surprises.</h2>
        <p className="text-sm text-muted-foreground">KES pricing. M-Pesa accepted. Multi-year discounts available.</p>
      </div>
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
        {plans.map((plan, i) => {
          const popular = plan.id.includes("popular") || plan.id === "domain-bundle";
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-2xl border bg-card",
                popular
                  ? "scale-[1.02] border-primary shadow-xl shadow-primary/10"
                  : "border-border transition-all hover:border-primary/30 hover:shadow-md",
              )}
            >
              {popular && (
                <div className="flex items-center justify-center gap-1.5 bg-primary py-2 text-center text-xs font-bold tracking-wider text-primary-foreground">
                  <Star size={11} className="fill-current" /> BEST VALUE
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="mb-1 text-base font-bold">{plan.name}</h3>
                <div className="mb-5">
                  <span className="text-3xl font-extrabold text-primary">KES {plan.price.toLocaleString()}</span>
                  <span className="ml-1 text-sm text-muted-foreground">/{plan.period}</span>
                </div>
                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={13} className="mt-0.5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn(
                    "h-10 w-full cursor-pointer rounded-xl text-sm font-semibold",
                    popular
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-muted text-foreground transition-colors hover:bg-primary hover:text-primary-foreground",
                  )}
                  onClick={() => handlePlanSelect(plan)}
                >
                  Get Started <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="mx-auto mt-8 max-w-2xl">
        <p className="mb-3 text-center text-sm font-medium text-muted-foreground">Optional add-ons</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {addons.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="font-medium">{a.label}</span>
              <Badge variant="secondary">
                KES {a.price.toLocaleString()}/{a.period}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
