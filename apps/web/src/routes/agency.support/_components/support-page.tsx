"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  useTicketsList,
} from "@/routes/agency/_components/tickets/use-tickets";
import type {
  TicketListItem,
  TicketStatus,
  TicketPriority,
  TicketType,
} from "@/routes/agency/_components/tickets/schema";
import { TicketChatSheet } from "./ticket-chat-sheet";

const STATUS_OPTIONS: { value: TicketStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING", label: "Waiting" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_OPTIONS: { value: TicketPriority | "ALL"; label: string }[] = [
  { value: "ALL", label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const TYPE_OPTIONS: { value: TicketType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All types" },
  { value: "GENERAL", label: "General" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "BILLING", label: "Billing" },
  { value: "HOSTING", label: "Hosting" },
  { value: "DOMAIN", label: "Domain" },
  { value: "EMAIL", label: "Email" },
  { value: "WORDPRESS", label: "WordPress" },
  { value: "BUG", label: "Bug" },
  { value: "FEATURE", label: "Feature" },
  { value: "ACCOUNT", label: "Account" },
];

function statusBadgeClass(status: TicketStatus) {
  switch (status) {
    case "OPEN":
      return "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "IN_PROGRESS":
      return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "WAITING":
      return "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300";
    case "RESOLVED":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "CLOSED":
      return "border-border bg-muted text-muted-foreground";
    case "CANCELLED":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    default:
      return "";
  }
}

function priorityBadgeClass(priority: TicketPriority) {
  switch (priority) {
    case "URGENT":
      return "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
    case "HIGH":
      return "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300";
    case "NORMAL":
      return "border-border bg-muted/60 text-foreground";
    case "LOW":
      return "border-border bg-muted text-muted-foreground";
    default:
      return "";
  }
}

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function TicketListSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card divide-y">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="hidden h-5 w-16 shrink-0 sm:block" />
        </div>
      ))}
    </div>
  );
}

function TicketRow({
  ticket,
  onClick,
}: {
  ticket: TicketListItem;
  onClick: () => void;
}) {
  const timeLabel = ticket.lastMessageAt
    ? formatDistanceToNow(ticket.lastMessageAt, { addSuffix: true })
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        ticket.unreadCount > 0 && "bg-primary/[0.04]",
      )}
    >
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icons.LiveChat className="size-4" />
        {ticket.unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
            {ticket.unreadCount > 99 ? "99+" : ticket.unreadCount}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "truncate text-sm text-foreground",
              ticket.unreadCount > 0 ? "font-semibold" : "font-medium",
            )}
          >
            {ticket.customerName || ticket.subject || "Support ticket"}
          </p>
          {ticket.isGuest ? (
            <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px] font-normal">
              Guest
            </Badge>
          ) : null}
          <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
            {ticket.ticketNumber}
          </span>
          {timeLabel && (
            <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
              {timeLabel}
            </span>
          )}
        </div>

        <div className="mt-0.5 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {ticket.subject ? `${ticket.subject} · ` : ""}
            {ticket.lastMessage || "No messages yet"}
          </p>
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            <Badge
              variant="outline"
              className={cn(
                "h-5 px-1.5 text-[10px] font-normal",
                statusBadgeClass(ticket.status),
              )}
            >
              {formatStatusLabel(ticket.status)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "h-5 px-1.5 text-[10px] font-normal",
                priorityBadgeClass(ticket.priority),
              )}
            >
              {formatStatusLabel(ticket.priority)}
            </Badge>
          </div>
        </div>
      </div>
    </button>
  );
}

export function SupportPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<TicketStatus | "ALL">(
    "ALL",
  );
  const [priorityFilter, setPriorityFilter] = React.useState<
    TicketPriority | "ALL"
  >("ALL");
  const [typeFilter, setTypeFilter] = React.useState<TicketType | "ALL">("ALL");
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const { tickets, isLoading, isRefetching, isError, error, refetch } =
    useTicketsList({
      status: statusFilter === "ALL" ? undefined : statusFilter,
      priority: priorityFilter === "ALL" ? undefined : priorityFilter,
      type: typeFilter === "ALL" ? undefined : typeFilter,
    });

  const filteredTickets = React.useMemo(() => {
    if (!searchQuery.trim()) return tickets;
    const q = searchQuery.toLowerCase().trim();
    return tickets.filter((ticket) => {
      return (
        ticket.ticketNumber.toLowerCase().includes(q) ||
        (ticket.subject?.toLowerCase().includes(q) ?? false) ||
        (ticket.customerName?.toLowerCase().includes(q) ?? false) ||
        (ticket.lastMessage?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [tickets, searchQuery]);

  const openTicket = (id: string) => {
    setSelectedTicketId(id);
    setSheetOpen(true);
  };

  return (
    <div className="@container/main flex flex-col gap-3 px-4 md:px-6 lg:px-8 py-4 md:py-5">
      <div className="mx-auto w-full max-w-5xl space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold tracking-tight">
              Support & Help
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              View and respond to customer support tickets in one place.
            </p>
          </div>
          {!isLoading && !isError && filteredTickets.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {filteredTickets.length} ticket
              {filteredTickets.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 @lg/main:flex-row @lg/main:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket, customer, or message..."
              className="h-9 pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as TicketStatus | "ALL")
              }
            >
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={priorityFilter}
              onValueChange={(v) =>
                setPriorityFilter(v as TicketPriority | "ALL")
              }
            >
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TicketType | "ALL")}
            >
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => void refetch()}
              disabled={isRefetching}
              title="Refresh"
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefetching && "animate-spin")}
              />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <TicketListSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <p className="mb-1 text-sm font-semibold">Failed to load tickets</p>
            <p className="mb-3 max-w-sm text-xs text-muted-foreground">
              {error?.message || "Something went wrong. Please try again."}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icons.LiveChat className="size-5" />
            </div>
            <p className="mb-1 text-sm font-semibold">No tickets found</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {searchQuery ||
              statusFilter !== "ALL" ||
              priorityFilter !== "ALL" ||
              typeFilter !== "ALL"
                ? "Try adjusting your search or filters."
                : "When customers open support tickets, they will show up here."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-card divide-y">
            {filteredTickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                onClick={() => openTicket(ticket.id)}
              />
            ))}
          </div>
        )}
      </div>

      <TicketChatSheet
        ticketId={selectedTicketId}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedTicketId(null);
        }}
      />
    </div>
  );
}
