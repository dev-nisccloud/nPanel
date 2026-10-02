"use client";

import * as React from "react";
import { useNavigate } from "react-router";

import { HostingStatusBadge } from "@/components/hosting/hosting-subscriptions-list";
import { SubscriptionRenewalDialog } from "@/components/subscription-renewal-dialog";
import { Button } from "@/components/ui/button";
import { CleanList, CleanListCell, CleanListRow } from "@/components/ui/clean-list";
import { ViewDetailsButton, VisitSiteButton } from "@/components/ui/list-row-actions";
import { isSubscriptionRenewable } from "@/lib/subscription-renewal-pricing";
import { CustomerSubscriptionViewSheet } from "@/routes/$slug.subscriptions/_components/subscription-view-sheet";
import { useTeamEmailSubscriptions } from "@/routes/$slug.emails/_components/use-team-email-subscriptions";
import { useTeamHostingSubscriptions } from "@/routes/$slug.hosting/_components/use-team-hosting-subscriptions";
import { useTeamWordPressSubscriptions } from "@/routes/$slug.wordpress/_components/use-team-wordpress-subscriptions";
import { trpc } from "@/utils/trpc";

type MarketplaceSubscription = {
  id: string;
  productId: string;
  productName: string;
  productPlanName: string | null;
  subscriptionName: string | null;
  subscriptionDate: Date | string | null;
  nextRenewalDate: Date | string | null;
  expiryDate: Date | string | null;
  status: string;
  billingCycle: string | null;
};

type ManagedMatch = {
  primaryDomain: string | null;
  detailHref: string | null;
};

function managedKind(serviceSlug: string): "hosting" | "wordpress" | "email" | null {
  if (serviceSlug.includes("wordpress")) return "wordpress";
  if (serviceSlug.includes("email") && !serviceSlug.includes("marketing")) return "email";
  if (serviceSlug.includes("website") || serviceSlug.includes("web-hosting")) return "hosting";
  return null;
}

function formatDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function siteUrl(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? "";
  if (!raw || /\s/.test(raw) || !raw.includes(".")) return null;
  return raw;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const upper = status.toUpperCase();
  if (upper === "ACTIVE") return "default";
  if (upper === "SUSPENDED" || upper === "EXPIRED" || upper === "CANCELLED" || upper === "FAILED") {
    return "destructive";
  }
  return "secondary";
}

export function MarketplaceCurrentPlans({
  teamSlug,
  serviceSlug,
  subscriptions,
}: {
  teamSlug: string;
  serviceSlug: string;
  subscriptions: MarketplaceSubscription[];
}) {
  const navigate = useNavigate();
  const kind = managedKind(serviceSlug);
  const hosting = useTeamHostingSubscriptions(kind === "hosting" ? teamSlug : undefined);
  const wordpress = useTeamWordPressSubscriptions(kind === "wordpress" ? teamSlug : undefined);
  const email = useTeamEmailSubscriptions(kind === "email" ? teamSlug : undefined);

  const [viewId, setViewId] = React.useState<string | null>(null);
  const [renewId, setRenewId] = React.useState<string | null>(null);
  const { data: renewalSubscription } = trpc.clientSubscriptions.getById.useQuery(
    { id: renewId!, teamSlug },
    { enabled: !!renewId && !!teamSlug },
  );

  const managedById = React.useMemo(() => {
    const map = new Map<string, ManagedMatch>();
    if (kind === "hosting") {
      for (const item of hosting.data) {
        map.set(item.id, {
          primaryDomain: item.primaryDomain ?? null,
          detailHref: item.pleskSubscriptionId ? `/${teamSlug}/hosting/${item.pleskSubscriptionId}` : null,
        });
      }
    } else if (kind === "wordpress") {
      for (const item of wordpress.data) {
        map.set(item.id, {
          primaryDomain: item.primaryDomain,
          detailHref: item.wordpressInstallationId
            ? `/${teamSlug}/wordpress/${item.wordpressInstallationId}`
            : null,
        });
      }
    } else if (kind === "email") {
      for (const item of email.data) {
        map.set(item.id, {
          primaryDomain: item.primaryDomain ?? null,
          detailHref: `/${teamSlug}/emails/${item.pleskSubscriptionId ?? item.id}`,
        });
      }
    }
    return map;
  }, [email.data, hosting.data, kind, teamSlug, wordpress.data]);

  if (subscriptions.length === 0) return null;

  return (
    <>
      <div className="mt-4 shrink-0">
        <p className="mb-2 text-xs font-semibold">
          Current plan{subscriptions.length > 1 ? "s" : ""}
        </p>
        <CleanList
          columns={[
            { key: "name", label: "Name" },
            { key: "plan", label: "Plan", className: "w-40", hideBelow: "@md" },
            { key: "status", label: "Status", className: "w-28", hideBelow: "@lg" },
            { key: "dates", label: "Dates", className: "w-56", hideBelow: "@xl" },
            { key: "actions", label: "Actions", align: "end" },
          ]}
        >
          {subscriptions.map((subscription) => {
            const managed = managedById.get(subscription.id);
            const name =
              subscription.subscriptionName?.trim() ||
              managed?.primaryDomain ||
              subscription.productName;
            const domain = managed?.primaryDomain;
            const visitUrl = siteUrl(domain) ?? siteUrl(subscription.subscriptionName);
            const detailHref = managed?.detailHref ?? null;
            const subscribed = formatDate(subscription.subscriptionDate);
            const expires = formatDate(subscription.expiryDate);
            const renews = formatDate(subscription.nextRenewalDate);
            const renewable = isSubscriptionRenewable({
              status: subscription.status,
              billingCycle: subscription.billingCycle,
            });
            const openDetails = () => {
              if (detailHref) navigate(detailHref);
              else setViewId(subscription.id);
            };

            return (
              <CleanListRow
                key={subscription.id}
                title={<span className="text-foreground">{name}</span>}
                description={domain && domain !== name ? domain : undefined}
                onClick={openDetails}
                cells={{
                  plan: <CleanListCell>{subscription.productPlanName ?? ""}</CleanListCell>,
                  status: (
                    <HostingStatusBadge
                      label={statusLabel(subscription.status)}
                      variant={statusVariant(subscription.status)}
                      isActive={subscription.status.toUpperCase() === "ACTIVE"}
                    />
                  ),
                  dates: (
                    <CleanListCell wrap>
                      {[
                        subscribed ? `Subscribed ${subscribed}` : null,
                        expires ? `Expires ${expires}` : null,
                        renews && renews !== expires ? `Renews ${renews}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </CleanListCell>
                  ),
                }}
                actions={
                  <>
                    <VisitSiteButton url={visitUrl} />
                    <ViewDetailsButton onClick={openDetails} />
                    {renewable ? (
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => setRenewId(subscription.id)}
                      >
                        Renew
                      </Button>
                    ) : null}
                  </>
                }
              />
            );
          })}
        </CleanList>
      </div>

      <CustomerSubscriptionViewSheet
        subscriptionId={viewId}
        teamSlug={teamSlug}
        open={!!viewId}
        onOpenChange={(open) => {
          if (!open) setViewId(null);
        }}
      />

      <SubscriptionRenewalDialog
        open={!!renewId}
        onOpenChange={(open) => {
          if (!open) setRenewId(null);
        }}
        subscription={
          renewalSubscription
            ? {
                id: renewalSubscription.id,
                name: renewalSubscription.name,
                productId: renewalSubscription.productId,
                productName: renewalSubscription.product?.name || "",
                productPlanId: renewalSubscription.productPlanId,
                serviceType: renewalSubscription.product?.serviceType || null,
                agreedPrice: renewalSubscription.agreedPrice,
                agreedCurrency: renewalSubscription.agreedCurrency,
                billingCycle: renewalSubscription.billingCycle,
                expiryDate: renewalSubscription.expiryDate
                  ? new Date(renewalSubscription.expiryDate)
                  : null,
                userId: renewalSubscription.userId,
                teamId: renewalSubscription.teamId,
              }
            : null
        }
      />
    </>
  );
}
