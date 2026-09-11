"use client";

import * as React from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CleanListCell } from "@/components/ui/clean-list";
import {
  SearchableCleanList,
  type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
import { ViewDetailsButton } from "@/components/ui/list-row-actions";
import { trpc } from "@/utils/trpc";

function getStatusBadgeClass(isActive: boolean): string {
  return isActive
    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800"
    : "";
}

export function OrganizationsList({
  onView,
  onEdit,
  onDelete,
}: {
  onView: (teamId: string) => void;
  onEdit: (teamId: string) => void;
  onDelete: (teamId: string, teamName: string) => void;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const {
    data: teams,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = trpc.teams.getAll.useQuery();

  const filtered = React.useMemo(() => {
    if (!teams) return [];
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase().trim();
    return teams.filter((team) => {
      const statusLabel = team.isActive ? "active" : "inactive";
      return (
        team.name.toLowerCase().includes(q) ||
        team.slug.toLowerCase().includes(q) ||
        team.baseCurrency.toLowerCase().includes(q) ||
        statusLabel.includes(q)
      );
    });
  }, [teams, searchQuery]);

  const items: SearchableCleanListItem[] = filtered.map((team) => ({
    key: team.id,
    title: (
      <span className="text-primary hover:underline">{team.name}</span>
    ),
    description: (
      <Badge variant="outline" className={getStatusBadgeClass(team.isActive)}>
        {team.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
    cells: {
      subscriptions: (
        <CleanListCell>{String(team.subscriptionCount ?? 0)}</CleanListCell>
      ),
      currency: <CleanListCell>{team.baseCurrency}</CleanListCell>,
      members: <CleanListCell>{String(team.memberCount ?? 0)}</CleanListCell>,
    },
    onClick: () => onView(team.id),
    actions: (
      <>
        <ViewDetailsButton onClick={() => onView(team.id)} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => onEdit(team.id)}
        >
          <Pencil className="mr-1 h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs text-destructive hover:text-destructive"
          onClick={() => onDelete(team.id, team.name)}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Delete
        </Button>
      </>
    ),
  }));

  return (
    <SearchableCleanList
      items={items}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      totalCount={teams?.length ?? 0}
      isLoading={isLoading}
      isError={isError}
      error={(error as Error) ?? null}
      onRetry={() => refetch()}
      searchPlaceholder="Search by name, currency, or status..."
      errorTitle="Failed to load organizations"
      emptyMessage={
        searchQuery.trim()
          ? `No organizations match "${searchQuery}"`
          : "No organizations found. They will appear here when you create them."
      }
      columns={[
        { key: "name", label: "Organization" },
        { key: "subscriptions", label: "Subscriptions", className: "w-32", hideBelow: "@lg" },
        { key: "currency", label: "Currency", className: "w-24", hideBelow: "@xl" },
        { key: "members", label: "Members", className: "w-24", hideBelow: "@xl" },
        { key: "actions", label: "Actions", align: "end" },
      ]}
      toolbarActions={
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      }
    />
  );
}

export function OrganizationsListCreateButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button size="sm" onClick={onClick}>
      <Plus className="mr-2 h-4 w-4" />
      Create Organization
    </Button>
  );
}
