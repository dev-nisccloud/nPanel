"use client";

import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { ViewDetailsButton, VisitSiteButton } from "@/components/ui/list-row-actions";
import { WordPressList } from "@/components/wordpress/wordpress-list";
import {
  WP_INSTALLATION_STATUS_BADGE_CLASS,
  WpInstallationStatusBadge,
} from "@/components/wordpress/wp-installation-status-badge";

import { wordpressInstallationSchema } from "./schema";
import { useWordPressInstances } from "./use-wordpress-instances";

function getSecurityBadge(item: z.infer<typeof wordpressInstallationSchema>) {
  const securityStatus = item.features?.security?.status;
  if (securityStatus === "secureRecommended") {
    return (
      <Badge
        variant="outline"
        className={`${WP_INSTALLATION_STATUS_BADGE_CLASS.online} ${WP_INSTALLATION_STATUS_BADGE_CLASS.size}`}
      >
        Secure
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={`${WP_INSTALLATION_STATUS_BADGE_CLASS.negative} ${WP_INSTALLATION_STATUS_BADGE_CLASS.size}`}
    >
      Needs Attention
    </Badge>
  );
}

export function WordPressDataTable() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const teamSlug = pathname.split("/")[1] ?? "";
  const { data: wordpressData, isLoading, isError, error, refetch } = useWordPressInstances();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!wordpressData) return [];
    if (!searchTerm.trim()) return wordpressData;
    const q = searchTerm.toLowerCase();
    return wordpressData.filter(
      (item) =>
        (item.displayTitle || "").toLowerCase().includes(q) ||
        (item.title || "").toLowerCase().includes(q) ||
        (item.domain?.name || "").toLowerCase().includes(q) ||
        (item.url || "").toLowerCase().includes(q),
    );
  }, [wordpressData, searchTerm]);

  const items = filteredData.map((item) => {
    const title = item.displayTitle || item.title || `Installation ${item.id}`;
    const href = `/${teamSlug}/wordpress/${item.id}`;
    const siteUrl = item.url || item.domain?.name;

    return {
      key: String(item.id),
      title: (
        <Link
          to={href}
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {title}
        </Link>
      ),
      trailing: <WpInstallationStatusBadge status={item.status} />,
      description: (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>WP {item.version || "Unknown"}</span>
          {item.title && item.displayTitle && item.title !== item.displayTitle ? (
            <span>· {item.title}</span>
          ) : null}
          {item.domain?.name ? <span>· {item.domain.name}</span> : null}
          <span className="inline-flex items-center gap-1">· {getSecurityBadge(item)}</span>
        </div>
      ),
      actions: (
        <>
          <VisitSiteButton url={siteUrl} />
          <ViewDetailsButton onClick={() => navigate(href)} />
        </>
      ),
      onClick: () => navigate(href),
    };
  });

  return (
    <WordPressList
      items={items}
      searchQuery={searchTerm}
      onSearchChange={setSearchTerm}
      totalCount={wordpressData?.length || 0}
      isLoading={isLoading}
      isError={isError}
      error={error as Error | null}
      onRetry={() => refetch()}
      searchPlaceholder="Search WordPress installations..."
      emptyMessage="No WordPress installations found"
      errorTitle="Failed to load WordPress installations"
    />
  );
}
