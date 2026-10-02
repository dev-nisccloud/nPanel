"use client";

import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { CleanListCell } from "@/components/ui/clean-list";
import { ViewDetailsButton, VisitSiteButton } from "@/components/ui/list-row-actions";
import {
  WordPressList,
  WordPressListStatusBadge,
} from "@/components/wordpress/wordpress-list";

import { PurchaseAnotherPlanButton } from "@/routes/$slug.marketplace/_components/purchase-another-plan-button";
import { WordPressPricing } from "./wordpress-pricing";
import { useTeamWordPressSubscriptions } from "./use-team-wordpress-subscriptions";

function getDetailRouteId(subscription: { wordpressInstallationId?: string | null }) {
  return subscription.wordpressInstallationId ?? null;
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  const upperStatus = String(status).toUpperCase();
  if (upperStatus === "ACTIVE") return "default";
  if (upperStatus === "SUSPENDED") return "destructive";
  return "secondary";
}

function getStatusDisplayText(status: string): string {
  const upperStatus = String(status).toUpperCase();
  if (upperStatus === "ACTIVE") return "Active";
  if (upperStatus === "SUSPENDED") return "Suspended";
  if (upperStatus === "PENDING") return "Pending";
  if (upperStatus === "CANCELLED") return "Cancelled";
  return status;
}

function formatListDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

export function WordPressDataTable() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const teamSlug = pathname.split("/")[1];
  const { data, isLoading, isError, error, refetch } = useTeamWordPressSubscriptions(teamSlug);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (subscription) =>
        (subscription.subscriptionName ?? "").toLowerCase().includes(q) ||
        (subscription.primaryDomain ?? "").toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  if (!isLoading && !isError && data.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <WordPressPricing className="min-h-[min(calc(100dvh-18rem),48rem)]" />
      </div>
    );
  }

  const items = filteredData.map((subscription) => {
    const detailId = getDetailRouteId(subscription);
    const titleText =
      subscription.primaryDomain ?? subscription.subscriptionName ?? subscription.id;
    const siteUrl = subscription.primaryDomain ?? subscription.subscriptionName;
    const detailHref = detailId ? `/${teamSlug}/wordpress/${detailId}` : null;
    const subscribed = formatListDate(subscription.subscriptionDate);
    const expires = formatListDate(subscription.expiryDate);
    const statusUpper = String(subscription.status).toUpperCase();

    return {
      key: subscription.id,
      title: detailHref ? (
        <Link
          to={detailHref}
          className="text-foreground hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {titleText}
        </Link>
      ) : (
        <span className="text-muted-foreground">{titleText}</span>
      ),
      cells: {
        dates: (
          <CleanListCell>
            {subscribed || expires
              ? `${subscribed ? `Subscribed ${subscribed}` : ""}${subscribed && expires ? " · " : ""}${expires ? `Expires ${expires}` : ""}`
              : ""}
          </CleanListCell>
        ),
        status: (
          <WordPressListStatusBadge
            label={getStatusDisplayText(subscription.status)}
            variant={getStatusBadgeVariant(subscription.status)}
            isActive={statusUpper === "ACTIVE"}
          />
        ),
      },
      actions: (
        <>
          <VisitSiteButton url={siteUrl} />
          {detailHref ? (
            <ViewDetailsButton onClick={() => navigate(detailHref)} />
          ) : null}
        </>
      ),
      onClick: detailHref ? () => navigate(detailHref) : undefined,
    };
  });

  return (
    <WordPressList
      items={items}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      totalCount={data.length}
      isLoading={isLoading}
      isError={isError}
      error={error as unknown as Error | null}
      onRetry={() => refetch()}
      searchPlaceholder="Search WordPress subscriptions..."
      emptyMessage="No WordPress subscriptions found"
      errorTitle="Failed to load WordPress subscriptions"
      columns={[
        { key: "name", label: "Domain" },
        { key: "dates", label: "Dates", className: "min-w-0 flex-1", hideBelow: "@lg" },
        { key: "status", label: "Status", className: "w-28 shrink-0", hideBelow: "@xl" },
        { key: "actions", label: "Actions", align: "end" },
      ]}
      toolbarActions={<PurchaseAnotherPlanButton service="wordpress" />}
    />
  );
}
