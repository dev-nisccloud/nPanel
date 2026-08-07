"use client";

import * as React from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  MoreVertical,
  Activity,
  Building2,
  FileText,
  CreditCard,
  Receipt,
  Wallet,
  Lock,
  Unlock,
  Ban,
  Plus,
  Edit,
  MonitorSmartphone,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { captureEvent } from "@/lib/posthog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { SettingsSection } from "@/components/account-settings/settings-section";
import { trpc } from "@/utils/trpc";

import { ProfileInformation } from "./profile-information";
import { EditProfileDialog } from "./edit-profile-dialog";
import { IntegrationsDisplay } from "./integrations-display";
import { AddIntegrationDialog } from "./add-integration-dialog";
import { EditClientDialog } from "./edit-client-dialog";
import { OverviewInvoicesBilling } from "./overview-invoices-billing";
import { ClientSettingsShell, type ClientTab } from "./client-settings-shell";
import { ClientProfileHeader } from "./client-profile-header";
import { ClientStatusBadge } from "./client-status-badge";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fmtFull(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleString();
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-8 text-center">
      <Icon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm first:pt-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function PanelLoading() {
  return (
    <div className="flex justify-center py-12">
      <Spinner size={28} />
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground last:text-right"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((cells, i) => (
            <tr key={i} className="hover:bg-muted/30">
              {cells.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 ${j === cells.length - 2 ? "text-right font-medium" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function OverviewTab({
  clientId,
  client,
}: {
  clientId: string;
  client: {
    email: string;
    emailVerified: boolean;
    role: string;
    status: string;
    createdAt: Date | string;
    lastLoginAt?: Date | string | null;
    adminNotes?: string | null;
    howDidYouFindUs?: string | null;
  };
}) {
  return (
    <div className="space-y-5">
      <SettingsSection title="Account" description="Core account information for this client.">
        <div className="divide-y rounded-lg border bg-card px-4">
          <DetailRow label="Email" value={client.email} />
          <DetailRow
            label="Email verified"
            value={
              <Badge variant={client.emailVerified ? "outline" : "secondary"} className="text-xs">
                {client.emailVerified ? "Yes" : "No"}
              </Badge>
            }
          />
          <DetailRow label="Role" value={<Badge variant="outline" className="text-xs">{client.role}</Badge>} />
          <DetailRow label="Status" value={<ClientStatusBadge status={client.status} />} />
          <DetailRow label="Joined" value={fmtFull(client.createdAt)} />
          {client.lastLoginAt ? <DetailRow label="Last login" value={fmtFull(client.lastLoginAt)} /> : null}
        </div>
      </SettingsSection>

      <SettingsSection title="Admin notes" description="Internal notes and acquisition details.">
        <div className="rounded-lg border bg-card px-4 py-3 text-sm">
          {client.howDidYouFindUs ? (
            <div className="border-b py-2.5">
              <p className="text-xs text-muted-foreground">How did they find us?</p>
              <p className="mt-1 font-medium">{client.howDidYouFindUs}</p>
            </div>
          ) : null}
          {client.adminNotes ? (
            <div className="py-2.5">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{client.adminNotes}</p>
            </div>
          ) : null}
          {!client.howDidYouFindUs && !client.adminNotes ? (
            <p className="py-2 text-muted-foreground">No admin notes recorded.</p>
          ) : null}
        </div>
      </SettingsSection>

      <OverviewInvoicesBilling clientId={clientId} />
    </div>
  );
}

function ProfileTab({
  clientId,
  onEditProfile,
}: {
  clientId: string;
  onEditProfile: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Contact details, preferences, and admin information.
        </p>
        <Button variant="outline" size="sm" onClick={onEditProfile}>
          <Edit className="mr-2 h-4 w-4" />
          Edit profile
        </Button>
      </div>
      <ProfileInformation userId={clientId} />
    </div>
  );
}

function UserActivityTab({ clientId }: { clientId: string }) {
  const { data: sessions, isLoading, error } = trpc.clients.getSessions.useQuery({ userId: clientId });

  if (isLoading) return <PanelLoading />;
  if (error) return <p className="text-sm text-destructive py-4">{error.message}</p>;
  if (!sessions?.length) {
    return (
      <EmptyPanel
        icon={Activity}
        title="No active sessions"
        description="This client has no recorded sessions."
      />
    );
  }

  return (
    <SettingsSection
      title="Sessions"
      description={`${sessions.length} session${sessions.length !== 1 ? "s" : ""} on record.`}
    >
      <div className="divide-y overflow-hidden rounded-lg border bg-card">
        {sessions.map((session) => {
          const active = new Date(session.expiresAt) > new Date();
          return (
            <div key={session.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{active ? "Active session" : "Expired session"}</p>
                  <Badge variant={active ? "default" : "secondary"} className="h-5 px-1.5 text-[10px]">
                    {active ? "Active" : "Expired"}
                  </Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {session.ipAddress ? `IP ${session.ipAddress} · ` : ""}
                  Logged in {fmt(session.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SettingsSection>
  );
}

function IntegrationsTab({
  clientId,
  onAddIntegration,
}: {
  clientId: string;
  onAddIntegration: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Connected third-party accounts.</p>
        <Button variant="outline" size="sm" onClick={onAddIntegration}>
          <Plus className="mr-2 h-4 w-4" />
          Add integration
        </Button>
      </div>
      <IntegrationsDisplay userId={clientId} />
    </div>
  );
}

function OrganizationsTab({ clientId }: { clientId: string }) {
  const { data: orgs, isLoading, error } = trpc.clients.getTeams.useQuery({ userId: clientId });

  if (isLoading) return <PanelLoading />;
  if (error) return <p className="text-sm text-destructive py-4">{error.message}</p>;
  if (!orgs?.length) {
    return (
      <EmptyPanel
        icon={Building2}
        title="No organizations"
        description="This client is not an owner or admin of any organization."
      />
    );
  }

  return (
    <SettingsSection
      title="Organizations"
      description={`${orgs.length} organization${orgs.length !== 1 ? "s" : ""}.`}
    >
      <div className="divide-y overflow-hidden rounded-lg border bg-card">
        {orgs.map((org) => (
          <div key={org.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{org.name}</p>
              <p className="text-xs text-muted-foreground">/{org.slug} · Created {fmt(org.createdAt)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">{org.role}</Badge>
              <Badge variant={org.isActive ? "default" : "secondary"} className="text-[10px]">
                {org.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

function InvoicesTab({ clientId }: { clientId: string }) {
  const { data: invoices, isLoading, error } = trpc.clients.getInvoices.useQuery({ userId: clientId });

  if (isLoading) return <PanelLoading />;
  if (error) return <p className="text-sm text-destructive py-4">{error.message}</p>;
  if (!invoices?.length) {
    return (
      <EmptyPanel
        icon={FileText}
        title="No invoices"
        description="No invoices have been issued for this client."
      />
    );
  }

  return (
    <SettingsSection title="Invoices" description={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}.`}>
      <DataTable
        headers={["Number", "Customer", "Status", "Amount", "Due"]}
        rows={invoices.map((inv) => [
          <span key="num" className="font-mono text-xs">{inv.invoiceNumber ?? "-"}</span>,
          <div key="cust">
            <p className="font-medium leading-none">{inv.customerName ?? "-"}</p>
            {inv.customerEmail ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{inv.customerEmail}</p>
            ) : null}
          </div>,
          <Badge key="status" variant="outline" className={`text-xs ${INVOICE_STATUS_COLORS[inv.status] ?? ""}`}>
            {inv.status}
          </Badge>,
          inv.amount ? `${inv.currency} ${inv.amount}` : "-",
          <span key="due" className="text-xs text-muted-foreground">{fmt(inv.dueDate)}</span>,
        ])}
      />
    </SettingsSection>
  );
}

const SUB_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function SubscriptionsTab({ clientId }: { clientId: string }) {
  const { data: subs, isLoading, error } = trpc.clients.getSubscriptions.useQuery({ userId: clientId });

  if (isLoading) return <PanelLoading />;
  if (error) return <p className="text-sm text-destructive py-4">{error.message}</p>;
  if (!subs?.length) {
    return (
      <EmptyPanel
        icon={CreditCard}
        title="No subscriptions"
        description="No active subscriptions found for this client."
      />
    );
  }

  return (
    <SettingsSection
      title="Subscriptions"
      description={`${subs.length} subscription${subs.length !== 1 ? "s" : ""}.`}
    >
      <div className="divide-y overflow-hidden rounded-lg border bg-card">
        {subs.map((sub) => (
          <div key={sub.id} className="space-y-2 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-xs text-muted-foreground">{sub.id}</p>
              <Badge variant="outline" className={`text-xs ${SUB_STATUS_COLORS[sub.status] ?? ""}`}>
                {sub.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Billing cycle</p>
                <p className="font-medium">{sub.billingCycle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Auto renew</p>
                <p className="font-medium">{sub.autoRenew ? "Yes" : "No"}</p>
              </div>
              {sub.subscriptionDate ? (
                <div>
                  <p className="text-xs text-muted-foreground">Start date</p>
                  <p className="font-medium">{fmt(sub.subscriptionDate)}</p>
                </div>
              ) : null}
              {sub.nextRenewalDate ? (
                <div>
                  <p className="text-xs text-muted-foreground">Next renewal</p>
                  <p className="font-medium">{fmt(sub.nextRenewalDate)}</p>
                </div>
              ) : null}
            </div>
            {sub.notes ? <p className="border-t pt-2 text-xs text-muted-foreground">{sub.notes}</p> : null}
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}

const QUOTE_STATUS_COLORS: Record<string, string> = {
  ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  DECLINED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

function QuotationsTab({ clientId }: { clientId: string }) {
  const { data: quotations, isLoading, error } = trpc.clients.getQuotations.useQuery({ userId: clientId });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Loading…" : `${quotations?.length ?? 0} quotation${(quotations?.length ?? 0) !== 1 ? "s" : ""}`}
        </p>
        <Button size="sm" asChild>
          <Link to="/agency/quotations/create">
            <Plus className="mr-2 h-4 w-4" />
            New quotation
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <PanelLoading />
      ) : error ? (
        <p className="text-sm text-destructive py-4">{error.message}</p>
      ) : !quotations?.length ? (
        <EmptyPanel
          icon={Receipt}
          title="No quotations"
          description="No quotations have been created for this client."
        />
      ) : (
        <DataTable
          headers={["Number", "Customer", "Status", "Amount", "Date"]}
          rows={quotations.map((q) => [
            <span key="num" className="font-mono text-xs">{q.quotationNumber ?? "-"}</span>,
            <div key="cust">
              <p className="font-medium leading-none">{q.customerName ?? "-"}</p>
              {q.customerEmail ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{q.customerEmail}</p>
              ) : null}
            </div>,
            <Badge key="status" variant="outline" className={`text-xs ${QUOTE_STATUS_COLORS[q.status] ?? ""}`}>
              {q.status}
            </Badge>,
            q.amount ? `${q.currency} ${q.amount}` : "-",
            <span key="date" className="text-xs text-muted-foreground">{fmt(q.issueDate ?? q.createdAt)}</span>,
          ])}
        />
      )}
    </div>
  );
}

const TXN_STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

function TransactionsTab({ clientId }: { clientId: string }) {
  const { data: txns, isLoading, error } = trpc.clients.getTransactions.useQuery({ userId: clientId });

  if (isLoading) return <PanelLoading />;
  if (error) return <p className="text-sm text-destructive py-4">{error.message}</p>;
  if (!txns?.length) {
    return (
      <EmptyPanel
        icon={Wallet}
        title="No transactions"
        description="No payment transactions found for this client."
      />
    );
  }

  return (
    <SettingsSection title="Transactions" description={`${txns.length} transaction${txns.length !== 1 ? "s" : ""}.`}>
      <DataTable
        headers={["Receipt", "Gateway", "Status", "Amount", "Date"]}
        rows={txns.map((txn) => [
          <span key="rcpt" className="font-mono text-xs">{txn.receiptNumber ?? txn.accountReference ?? "-"}</span>,
          txn.gateway,
          <Badge key="status" variant="outline" className={`text-xs ${TXN_STATUS_COLORS[txn.status] ?? ""}`}>
            {txn.status}
          </Badge>,
          `${txn.currency} ${txn.amount}`,
          <span key="date" className="text-xs text-muted-foreground">{fmt(txn.initiatedAt)}</span>,
        ])}
      />
    </SettingsSection>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ClientDetailSkeleton() {
  return (
    <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <Skeleton className="h-4 w-28" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-[88px] w-full rounded-lg" />
        <div className="flex flex-col gap-5 md:flex-row md:gap-8">
          <Skeleton className="h-64 w-full rounded-lg md:w-44" />
          <Skeleton className="h-80 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Data hook ────────────────────────────────────────────────────────────────

type ClientDetailRecord = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: "CUSTOMER" | "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER";
  status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
  image: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  adminNotes: string | null;
  howDidYouFindUs: string | null;
};

function mergeClientDetail(
  cached: Partial<ClientDetailRecord> | undefined,
  userInfo: Record<string, unknown> | undefined,
): ClientDetailRecord | null {
  if (!cached && !userInfo) return null;

  const pick = <T,>(key: keyof ClientDetailRecord, fallback: T): T => {
    if (userInfo && userInfo[key as string] !== undefined) {
      return userInfo[key as string] as T;
    }
    if (cached && cached[key] !== undefined) {
      return cached[key] as T;
    }
    return fallback;
  };

  return {
    id: pick("id", ""),
    name: pick("name", ""),
    email: pick("email", ""),
    emailVerified: pick("emailVerified", false),
    role: pick("role", "CUSTOMER"),
    status: pick("status", "ACTIVE"),
    image: pick("image", null),
    lastLoginAt: pick("lastLoginAt", null),
    createdAt: pick("createdAt", new Date()),
    updatedAt: pick("updatedAt", new Date()),
    adminNotes: pick("adminNotes", null),
    howDidYouFindUs: pick("howDidYouFindUs", null),
  };
}

function useClientData(clientId: string) {
  const utils = trpc.useUtils();
  const cached = utils.clients.getAll.getData();
  const clientFromCache = React.useMemo(
    () => cached?.find((c) => c.id === clientId) as Partial<ClientDetailRecord> | undefined,
    [cached, clientId],
  );

  const { data: userInfo, isLoading, error } = trpc.userProfile.getUserById.useQuery(
    { userId: clientId },
    { enabled: !!clientId },
  );

  const client = React.useMemo(
    () => mergeClientDetail(clientFromCache, userInfo as Record<string, unknown> | undefined),
    [clientFromCache, userInfo],
  );

  return { client, isLoading: isLoading && !client, error: error ?? null };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ClientDetailPage({ clientId }: { clientId: string }) {
  const [activeTab, setActiveTab] = React.useState<ClientTab>("overview");
  const { client, isLoading, error } = useClientData(clientId);

  const [isEditAccountOpen, setIsEditAccountOpen] = React.useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = React.useState(false);
  const [isAddIntegrationOpen, setIsAddIntegrationOpen] = React.useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);
  const [statusDialog, setStatusDialog] = React.useState<{
    open: boolean;
    status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED" | null;
    label: string;
  }>({ open: false, status: null, label: "" });

  const utils = trpc.useUtils();

  React.useEffect(() => {
    if (clientId) {
      captureEvent("client_profile_viewed", { client_id: clientId });
    }
  }, [clientId]);

  const changeStatusMutation = trpc.clients.changeStatus.useMutation({
    onSuccess: (_data, variables) => {
      if (variables.status === "DEACTIVATED" || variables.status === "BANNED") {
        captureEvent("client_deleted", { status: variables.status });
      }
      toast.success("Status updated successfully");
      utils.clients.getAll.invalidate();
      utils.userProfile.getUserById.invalidate({ userId: clientId });
    },
    onError: (err) => toast.error(err.message ?? "Failed to update status"),
  });

  const handleEditSuccess = React.useCallback(() => {
    utils.clients.getAll.invalidate();
    utils.userProfile.getUserById.invalidate({ userId: clientId });
    utils.clients.getProfile.invalidate({ userId: clientId });
    utils.clients.getIntegrations.invalidate({ userId: clientId });
  }, [utils, clientId]);

  if (isLoading) return <ClientDetailSkeleton />;

  if (error || !client) {
    return (
      <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl space-y-5">
          <Link to="/agency/clients">
            <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to clients
            </Button>
          </Link>
          <div className="rounded-lg border border-dashed px-4 py-12 text-center">
            <p className="text-destructive mb-4">{error?.message ?? "Client not found"}</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/agency/clients">Back to clients</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isDeactivated = client.status === "DEACTIVATED";
  const isBanned = client.status === "BANNED";
  const isSuspended = client.status === "SUSPENDED";

  const headerActions = (
    <DropdownMenu open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => { setIsActionMenuOpen(false); setIsEditAccountOpen(true); }}>
          <Edit className="mr-2 h-4 w-4" />
          Edit account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isDeactivated ? (
          <DropdownMenuItem onSelect={() => { setIsActionMenuOpen(false); setStatusDialog({ open: true, status: "ACTIVE", label: "reactivate" }); }}>
            <Unlock className="mr-2 h-4 w-4" />Reactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => { setIsActionMenuOpen(false); setStatusDialog({ open: true, status: "DEACTIVATED", label: "deactivate" }); }}>
            <Lock className="mr-2 h-4 w-4" />Deactivate
          </DropdownMenuItem>
        )}
        {isSuspended ? (
          <DropdownMenuItem onSelect={() => { setIsActionMenuOpen(false); setStatusDialog({ open: true, status: "ACTIVE", label: "unsuspend" }); }}>
            <Unlock className="mr-2 h-4 w-4" />Unsuspend
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => { setIsActionMenuOpen(false); setStatusDialog({ open: true, status: "SUSPENDED", label: "suspend" }); }}>
            <Lock className="mr-2 h-4 w-4" />Suspend
          </DropdownMenuItem>
        )}
        {isBanned ? (
          <DropdownMenuItem onSelect={() => { setIsActionMenuOpen(false); setStatusDialog({ open: true, status: "ACTIVE", label: "unban" }); }}>
            <Unlock className="mr-2 h-4 w-4" />Unban
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => { setIsActionMenuOpen(false); setStatusDialog({ open: true, status: "BANNED", label: "ban" }); }}
          >
            <Ban className="mr-2 h-4 w-4" />Ban account
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <ClientSettingsShell
        title="Client details"
        description="View and manage this client's account, billing, and activity."
        activeTab={activeTab}
        onTabChange={setActiveTab}
        backAction={
          <Link to="/agency/clients">
            <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to clients
            </Button>
          </Link>
        }
        header={<ClientProfileHeader client={client} actions={headerActions} />}
      >
        {activeTab === "overview" && <OverviewTab clientId={clientId} client={client} />}
        {activeTab === "profile" && (
          <ProfileTab clientId={clientId} onEditProfile={() => setIsEditProfileOpen(true)} />
        )}
        {activeTab === "activity" && <UserActivityTab clientId={clientId} />}
        {activeTab === "integrations" && (
          <IntegrationsTab clientId={clientId} onAddIntegration={() => setIsAddIntegrationOpen(true)} />
        )}
        {activeTab === "organizations" && <OrganizationsTab clientId={clientId} />}
        {activeTab === "invoices" && <InvoicesTab clientId={clientId} />}
        {activeTab === "subscriptions" && <SubscriptionsTab clientId={clientId} />}
        {activeTab === "quotations" && <QuotationsTab clientId={clientId} />}
        {activeTab === "transactions" && <TransactionsTab clientId={clientId} />}
      </ClientSettingsShell>

      <EditClientDialog
        open={isEditAccountOpen}
        onOpenChange={setIsEditAccountOpen}
        clientId={clientId}
        initialData={{ name: client.name, email: client.email, role: client.role }}
        onSuccess={handleEditSuccess}
      />

      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        userId={clientId}
        userName={client.name}
        onSuccess={handleEditSuccess}
      />

      <AddIntegrationDialog
        open={isAddIntegrationOpen}
        onOpenChange={setIsAddIntegrationOpen}
        userId={clientId}
        onSuccess={handleEditSuccess}
      />

      <AlertDialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog({ open, status: null, label: "" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm status change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {statusDialog.label} this account?
              {statusDialog.status && ` Status will change to ${statusDialog.status}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changeStatusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!statusDialog.status) return;
                changeStatusMutation.mutate({ userId: clientId, status: statusDialog.status });
                setStatusDialog({ open: false, status: null, label: "" });
              }}
              disabled={changeStatusMutation.isPending}
              className={
                statusDialog.status === "BANNED" || statusDialog.status === "DEACTIVATED"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {changeStatusMutation.isPending ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
