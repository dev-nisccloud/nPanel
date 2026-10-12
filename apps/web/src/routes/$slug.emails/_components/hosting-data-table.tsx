"use client";

import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router";

import {
  HostingStatusBadge,
  HostingSubscriptionsList,
} from "@/components/hosting/hosting-subscriptions-list";
import { CleanListCell } from "@/components/ui/clean-list";
import { ViewDetailsButton, VisitSiteButton } from "@/components/ui/list-row-actions";
import { PurchaseAnotherPlanButton } from "@/routes/$slug.marketplace/_components/purchase-another-plan-button";

import { HostingPricing } from "./hosting-pricing";
import { getStatusBadgeVariant, getStatusDisplayText } from "./hosting-utils";
import type { CustomerHostingListItem } from "./schema";
import { useTeamEmailSubscriptions } from "./use-team-email-subscriptions";

function emailHostingDetailId(sub: Pick<CustomerHostingListItem, "id" | "pleskSubscriptionId">) {
  return sub.pleskSubscriptionId ?? sub.id;
}

function formatListDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

export function HostingDataTable() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const teamSlug = pathname.split("/")[1];
  const { data, isLoading, isError, error, refetch } = useTeamEmailSubscriptions(teamSlug);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((subscription) =>
      (subscription.subscriptionName ?? "").toLowerCase().includes(q) ||
      (subscription.primaryDomain ?? "").toLowerCase().includes(q) ||
      (subscription.productPlanName ?? "").toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  if (!isLoading && !isError && data.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <HostingPricing className="min-h-[min(calc(100dvh-18rem),48rem)]" />
      </div>
    );
  }

  const items = filteredData.map((subscription) => {
    const detailId = emailHostingDetailId(subscription);
    const titleText =
      subscription.primaryDomain ?? subscription.subscriptionName ?? subscription.id;
    const siteUrl = subscription.primaryDomain ?? subscription.subscriptionName;
    const detailHref = `/${teamSlug}/emails/${detailId}`;
    const subscribed = formatListDate(subscription.subscriptionDate);
    const expires = formatListDate(subscription.expiryDate);
    const statusUpper = String(subscription.status).toUpperCase();

    return {
      key: subscription.id,
      title: (
        <Link
          to={detailHref}
          className="text-foreground hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {titleText}
        </Link>
      ),
      description: subscription.productPlanName ? (
        <span className="truncate">{subscription.productPlanName}</span>
      ) : undefined,
      cells: {
        dates: (
          <CleanListCell>
            {subscribed || expires
              ? `${subscribed ? `Subscribed ${subscribed}` : ""}${subscribed && expires ? " · " : ""}${expires ? `Expires ${expires}` : ""}`
              : ""}
          </CleanListCell>
        ),
        status: (
          <HostingStatusBadge
            label={getStatusDisplayText(subscription.status)}
            variant={getStatusBadgeVariant(subscription.status)}
            isActive={statusUpper === "ACTIVE"}
          />
        ),
      },
      actions: (
        <>
          <VisitSiteButton url={siteUrl} />
          <ViewDetailsButton onClick={() => navigate(detailHref)} />
        </>
      ),
      onClick: () => navigate(detailHref),
    };
  });

  return (
    <HostingSubscriptionsList
      items={items}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      totalCount={data.length}
      isLoading={isLoading}
      isError={isError}
      error={error as unknown as Error | null}
      onRetry={() => refetch()}
      columns={[
        { key: "name", label: "Domain" },
        { key: "status", label: "Status", className: "w-36", hideBelow: "@md" },
        { key: "dates", label: "Dates", className: "min-w-0 flex-1", hideBelow: "@lg" },
        { key: "actions", label: "Actions", align: "end" },
      ]}
      toolbarActions={<PurchaseAnotherPlanButton service="email" />}
    />
  );
}
