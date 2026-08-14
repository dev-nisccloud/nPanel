import { Globe, Mail, Phone, Server, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  buildDomainRegistrationCartParams,
  buildSharedHostingCartParams,
  buildVpsCartParams,
  navigateToStorefrontCart,
} from "@/lib/storefront-cart-url.ts";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";
import { toast } from "sonner";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_TEL_HREF,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO_HREF,
} from "@/lib/contact.ts";

function asObject(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  return payload as Record<string, unknown>;
}

export function LandingSupportToolCards({
  results,
  onViewTicket,
}: {
  results: Array<{ result: unknown }>;
  onViewTicket?: (ticketId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {results.map((row, i) => (
        <LandingSupportToolCard key={i} result={row.result} onViewTicket={onViewTicket} />
      ))}
    </div>
  );
}

function LandingSupportToolCard({
  result,
  onViewTicket,
}: {
  result: unknown;
  onViewTicket?: (ticketId: string) => void;
}) {
  const o = asObject(result);
  if (!o?._tool) return null;
  const tool = String(o._tool);

  if (tool === "create_support_ticket") {
    return <TicketCard payload={o} onViewTicket={onViewTicket} />;
  }

  if (tool === "check_domain_availability") {
    return <DomainCard payload={o} />;
  }
  if (
    tool === "get_web_hosting_plans" ||
    tool === "get_email_hosting_plans" ||
    tool === "get_wordpress_hosting_plans"
  ) {
    return <HostingCard payload={o} tool={tool} />;
  }
  if (tool === "get_vps_plans" || tool === "get_vds_plans" || tool === "get_dedicated_server_plans") {
    return <CloudPlansCard payload={o} kind={tool === "get_vps_plans" ? "vps" : tool === "get_vds_plans" ? "vds" : "dedicated_servers"} />;
  }
  return null;
}

function TicketCard({
  payload,
  onViewTicket,
}: {
  payload: Record<string, unknown>;
  onViewTicket?: (ticketId: string) => void;
}) {
  if (!payload.ok) return null;
  const ticketId = String(payload.ticketId ?? "");
  const ticketNumber = String(payload.ticketNumber ?? "");
  const intent = payload.intent === "sales" ? "Sales" : "Support";
  const already = payload.alreadyOpen === true;
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-xs font-semibold">
        <Ticket className="h-3.5 w-3.5 text-primary" />
        {already ? `${intent} ticket already open` : `${intent} ticket opened`}
      </div>
      <div className="space-y-2 px-3 py-3">
        <p className="text-sm font-medium">{ticketNumber}</p>
        <p className="text-[11px] text-muted-foreground">
          Our team will reply in Messages. You can also call or email us.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {onViewTicket && ticketId ? (
            <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => onViewTicket(ticketId)}>
              View ticket
            </Button>
          ) : null}
          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" asChild>
            <a href={CONTACT_TEL_HREF}>
              <Phone className="mr-1 h-3 w-3" />
              {CONTACT_PHONE_DISPLAY}
            </a>
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" asChild>
            <a href={SUPPORT_MAILTO_HREF}>
              <Mail className="mr-1 h-3 w-3" />
              {SUPPORT_EMAIL}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function DomainCard({ payload }: { payload: Record<string, unknown> }) {
  const checked = Array.isArray(payload.checked) ? payload.checked : [];
  const go = async (domain: string) => {
    try {
      const result: DomainSearchResult = { domain, status: "available" };
      await navigateToStorefrontCart(buildDomainRegistrationCartParams(result));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open cart");
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-xs font-semibold">
        <Globe className="h-3.5 w-3.5 text-primary" />
        Domain check
      </div>
      <div className="divide-y">
        {checked.slice(0, 6).map((raw) => {
          const entry = asObject(raw);
          if (!entry) return null;
          const domain = String(entry.domain ?? "");
          const available = entry.available === true;
          const price = asObject(entry.price);
          return (
            <div key={domain} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{domain}</p>
                <p className="text-[11px] text-muted-foreground">
                  {available
                    ? price?.formatted
                      ? String(price.formatted)
                      : "Available"
                    : "Taken"}
                </p>
              </div>
              {available ? (
                <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => void go(domain)}>
                  Buy
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HostingCard({ payload, tool }: { payload: Record<string, unknown>; tool: string }) {
  const plans = Array.isArray(payload.plans) ? payload.plans : [];
  const label =
    tool === "get_email_hosting_plans"
      ? "Email hosting"
      : tool === "get_wordpress_hosting_plans"
        ? "WordPress hosting"
        : "Web hosting";
  const serviceType =
    tool === "get_email_hosting_plans"
      ? "email_hosting"
      : tool === "get_wordpress_hosting_plans"
        ? "wordpress_hosting"
        : "web_hosting";

  const go = async (plan: Record<string, unknown>) => {
    try {
      await navigateToStorefrontCart(
        buildSharedHostingCartParams(
          {
            id: String(plan.id ?? ""),
            name: String(plan.name ?? "Plan"),
            niscPrice: plan.niscPrice != null ? String(plan.niscPrice) : null,
            niscCurrency: String(plan.niscCurrency ?? "KES"),
            billingCycle: String(plan.billingCycle ?? "MONTHLY"),
            isPopular: Boolean(plan.isPopular),
            isRecommended: Boolean(plan.isRecommended),
            productId: String(plan.productId ?? ""),
            productName: String(plan.productName ?? label),
            featureValues: [],
          },
          serviceType,
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open cart");
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-xs font-semibold">
        <Server className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <div className="divide-y">
        {plans.slice(0, 4).map((raw) => {
          const plan = asObject(raw);
          if (!plan) return null;
          return (
            <div key={String(plan.id)} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{String(plan.name)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {plan.niscPrice ? `${plan.niscCurrency ?? "KES"} ${plan.niscPrice}` : "See cart"}
                </p>
              </div>
              <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => void go(plan)}>
                Buy
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CloudPlansCard({
  payload,
  kind,
}: {
  payload: Record<string, unknown>;
  kind: "vps" | "vds" | "dedicated_servers";
}) {
  const plans = Array.isArray(payload.plans) ? payload.plans : [];
  const label = kind === "vps" ? "VPS" : kind === "vds" ? "VDS" : "Dedicated";

  const go = async (plan: Record<string, unknown>) => {
    const checkout = asObject(plan.checkout);
    const productId = Number(checkout?.inventoryProductId ?? plan.product_id);
    if (!Number.isFinite(productId)) {
      toast.error("This plan isn't ready to buy yet.");
      return;
    }
    try {
      await navigateToStorefrontCart(
        buildVpsCartParams({
          productId,
          planName: String(plan.product_name ?? label),
          productName: label,
          serviceType: kind,
          locationName: String(checkout?.locationName ?? plan.locationDisplayName ?? plan.data_center ?? ""),
        }),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open cart");
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-xs font-semibold">
        <Server className="h-3.5 w-3.5 text-primary" />
        {label} plans
      </div>
      <div className="divide-y">
        {plans.slice(0, 4).map((raw, i) => {
          const plan = asObject(raw);
          if (!plan) return null;
          return (
            <div key={`${plan.product_id}-${i}`} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{String(plan.product_name)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {String(plan.locationDisplayName ?? plan.data_center ?? "")}
                  {plan.product_memory ? ` · ${String(plan.product_memory)}` : ""}
                </p>
              </div>
              <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => void go(plan)}>
                Buy
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
