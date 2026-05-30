"use client";

import * as React from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  MoreVertical,
  BadgeCheck,
  LayoutDashboard,
  ChevronRight,
  UserCog,
  Activity,
  Plug,
  Building2,
  FileText,
  CreditCard,
  Receipt,
  Wallet,
  Ticket,
  Lock,
  Unlock,
  Ban,
  Plus,
  Edit,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";

import { trpc } from "@/utils/trpc";
import { ProfileInformation } from "./profile-information";
import { EditProfileDialog } from "./edit-profile-dialog";
import { IntegrationsDisplay } from "./integrations-display";
import { AddIntegrationDialog } from "./add-integration-dialog";
import { EditClientDialog } from "./edit-client-dialog";
import { OverviewInvoicesBilling } from "./overview-invoices-billing";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fmtFull(d: Date | string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ACTIVE"
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
      : "";
  return (
    <Badge
      variant={status === "BANNED" ? "destructive" : status === "DEACTIVATED" || status === "SUSPENDED" ? "secondary" : "outline"}
      className={cls}
    >
      {status}
    </Badge>
  );
}

// ─── Tab content components (pure, receive callbacks via props) ────────────────

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
    updatedAt: Date | string;
    lastLoginAt?: Date | string | null;
    [key: string]: unknown;
  };
}) {
  const adminNotes = client.adminNotes as string | null | undefined;
  const howDidYouFindUs = client.howDidYouFindUs as string | null | undefined;

  return (
    <div className="space-y-6">
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <div className="flex items-center gap-1.5 font-medium">
              {client.email}
              {client.emailVerified ? (
                <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <ShieldX className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="outline" className="text-xs">{client.role}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={client.status} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date joined</span>
            <span className="font-medium">{fmtFull(client.createdAt)}</span>
          </div>
          {client.lastLoginAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last login</span>
              <span className="font-medium">{fmtFull(client.lastLoginAt)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Admin Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {howDidYouFindUs && (
            <div className="space-y-1">
              <p className="text-muted-foreground">How did they find us?</p>
              <p className="font-medium">{howDidYouFindUs}</p>
            </div>
          )}
          {adminNotes && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Notes</p>
              <p className="leading-relaxed whitespace-pre-wrap">{adminNotes}</p>
            </div>
          )}
          {!howDidYouFindUs && !adminNotes && (
            <p className="text-muted-foreground">No admin notes recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>

    <OverviewInvoicesBilling clientId={clientId} />
    </div>
  );
}

function ProfileTab({
  clientId,
  clientName,
  onEditProfile,
}: {
  clientId: string;
  clientName: string;
  onEditProfile: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Profile</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Contact details, email & marketing preferences, and admin information
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onEditProfile}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>
      <ProfileInformation userId={clientId} />
    </div>
  );
}

function UserActivityTab({ clientId }: { clientId: string }) {
  const { data: sessions, isLoading, error } = trpc.clients.getSessions.useQuery({ userId: clientId });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size={28} /></div>;
  if (error) return <p className="text-destructive text-sm py-8 text-center">{error.message}</p>;
  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Activity className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="font-semibold">No active sessions</p>
        <p className="text-sm text-muted-foreground mt-1">This user has no recorded sessions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</p>
      {sessions.map((session) => {
        const active = new Date(session.expiresAt) > new Date();
        return (
          <Card key={session.id}>
            <CardContent className="pt-5 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Token</p>
                  <p className="text-xs font-mono truncate max-w-[260px]">{session.token}</p>
                </div>
                <Badge variant={active ? "default" : "secondary"}>{active ? "Active" : "Expired"}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Logged in</p>
                  <p className="font-medium">{fmt(session.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Expires</p>
                  <p className="font-medium">{fmt(session.expiresAt)}</p>
                </div>
                {session.ipAddress && (
                  <div>
                    <p className="text-muted-foreground text-xs">IP Address</p>
                    <p className="font-medium">{session.ipAddress}</p>
                  </div>
                )}
                {session.userAgent && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Device</p>
                    <p className="text-xs line-clamp-1">{session.userAgent}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Platform Integrations</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Connected third-party accounts</p>
        </div>
        <Button variant="outline" size="sm" onClick={onAddIntegration}>
          <Plus className="mr-2 h-4 w-4" />
          Add Integration
        </Button>
      </div>
      <IntegrationsDisplay userId={clientId} />
    </div>
  );
}

function OrganizationsTab({ clientId }: { clientId: string }) {
  const { data: orgs, isLoading, error } = trpc.clients.getTeams.useQuery({ userId: clientId });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size={28} /></div>;
  if (error) return <p className="text-destructive text-sm py-8 text-center">{error.message}</p>;
  if (!orgs || orgs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="font-semibold">No organizations</p>
        <p className="text-sm text-muted-foreground mt-1">This user is not an owner or admin of any team.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{orgs.length} organization{orgs.length !== 1 ? "s" : ""}</p>
      {orgs.map((org) => (
        <Card key={org.id}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-semibold text-sm">{org.name}</p>
                <p className="text-xs text-muted-foreground">/{org.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{org.role}</Badge>
                <Badge variant={org.isActive ? "default" : "secondary"} className="text-xs">
                  {org.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Created {fmt(org.createdAt)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InvoicesTab({ clientId }: { clientId: string }) {
  const { data: invoices, isLoading, error } = trpc.clients.getInvoices.useQuery({ userId: clientId });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size={28} /></div>;
  if (error) return <p className="text-destructive text-sm py-8 text-center">{error.message}</p>;
  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="font-semibold">No invoices</p>
        <p className="text-sm text-muted-foreground mt-1">No invoices have been issued for this client.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200",
    OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200",
    SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200",
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Number</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Customer</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber ?? "-"}</td>
                <td className="px-4 py-3">
                  <p className="font-medium leading-none">{inv.customerName ?? "-"}</p>
                  {inv.customerEmail && <p className="text-xs text-muted-foreground mt-0.5">{inv.customerEmail}</p>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${statusColors[inv.status] ?? ""}`}>
                    {inv.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {inv.amount ? `${inv.currency} ${inv.amount}` : "-"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(inv.dueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubscriptionsTab({ clientId }: { clientId: string }) {
  const { data: subs, isLoading, error } = trpc.clients.getSubscriptions.useQuery({ userId: clientId });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size={28} /></div>;
  if (error) return <p className="text-destructive text-sm py-8 text-center">{error.message}</p>;
  if (!subs || subs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CreditCard className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="font-semibold">No subscriptions</p>
        <p className="text-sm text-muted-foreground mt-1">No active subscriptions found for this client.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200",
    EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200",
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{subs.length} subscription{subs.length !== 1 ? "s" : ""}</p>
      {subs.map((sub) => (
        <Card key={sub.id}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-xs text-muted-foreground">{sub.id}</div>
              <Badge variant="outline" className={`text-xs ${statusColors[sub.status] ?? ""}`}>{sub.status}</Badge>
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
              {sub.subscriptionDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Start date</p>
                  <p className="font-medium">{fmt(sub.subscriptionDate)}</p>
                </div>
              )}
              {sub.nextRenewalDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Next renewal</p>
                  <p className="font-medium">{fmt(sub.nextRenewalDate)}</p>
                </div>
              )}
            </div>
            {sub.notes && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">{sub.notes}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuotationsTab({ clientId }: { clientId: string }) {
  const { data: quotations, isLoading, error } = trpc.clients.getQuotations.useQuery({ userId: clientId });

  const statusColors: Record<string, string> = {
    ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200",
    DECLINED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200",
    SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Loading…" : `${quotations?.length ?? 0} quotation${(quotations?.length ?? 0) !== 1 ? "s" : ""}`}
        </p>
        {/* Use Link so navigation is always reliable regardless of loading state */}
        <Button size="sm" asChild>
          <Link to="/agency/quotations/create">
            <Plus className="mr-2 h-4 w-4" />
            New Quotation
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : error ? (
        <p className="text-destructive text-sm py-8 text-center">{error.message}</p>
      ) : !quotations || quotations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Receipt className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="font-semibold">No quotations</p>
          <p className="text-sm text-muted-foreground mt-1">No quotations have been created for this client.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Number</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotations.map((q) => (
                <tr key={q.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{q.quotationNumber ?? "-"}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium leading-none">{q.customerName ?? "-"}</p>
                    {q.customerEmail && <p className="text-xs text-muted-foreground mt-0.5">{q.customerEmail}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-xs ${statusColors[q.status] ?? ""}`}>
                      {q.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {q.amount ? `${q.currency} ${q.amount}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(q.issueDate ?? q.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TransactionsTab({ clientId }: { clientId: string }) {
  const { data: txns, isLoading, error } = trpc.clients.getTransactions.useQuery({ userId: clientId });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size={28} /></div>;
  if (error) return <p className="text-destructive text-sm py-8 text-center">{error.message}</p>;
  if (!txns || txns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Wallet className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="font-semibold">No transactions</p>
        <p className="text-sm text-muted-foreground mt-1">No payment transactions found for this client.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200",
    FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200",
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200",
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{txns.length} transaction{txns.length !== 1 ? "s" : ""}</p>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Receipt</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Gateway</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {txns.map((txn) => (
              <tr key={txn.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{txn.receiptNumber ?? txn.accountReference ?? "-"}</td>
                <td className="px-4 py-3 font-medium">{txn.gateway}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${statusColors[txn.status] ?? ""}`}>{txn.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-medium">{txn.currency} {txn.amount}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(txn.initiatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TicketsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Ticket className="h-10 w-10 text-muted-foreground mb-4" />
      <p className="font-semibold">Tickets coming soon</p>
      <p className="text-sm text-muted-foreground mt-1">Support ticket history will appear here.</p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ClientDetailSkeleton() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="mt-8 space-y-4">
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-[100px] w-[140px] rounded-lg" />)}
          </div>
          <Skeleton className="h-64 w-full" />
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
  generalEmailsAccepted: boolean | null;
  invoiceEmailsAccepted: boolean | null;
  supportEmailsAccepted: boolean | null;
  productEmailsAccepted: boolean | null;
  domainEmailsAccepted: boolean | null;
  affiliateEmailsAccepted: boolean | null;
  marketingEmailsAccepted: boolean | null;
  smsMarketingAccepted: boolean | null;
  adminNotes: string | null;
  howDidYouFindUs: string | null;
  acceptedTermsAndConditions: boolean | null;
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
    generalEmailsAccepted: pick("generalEmailsAccepted", null),
    invoiceEmailsAccepted: pick("invoiceEmailsAccepted", null),
    supportEmailsAccepted: pick("supportEmailsAccepted", null),
    productEmailsAccepted: pick("productEmailsAccepted", null),
    domainEmailsAccepted: pick("domainEmailsAccepted", null),
    affiliateEmailsAccepted: pick("affiliateEmailsAccepted", null),
    marketingEmailsAccepted: pick("marketingEmailsAccepted", null),
    smsMarketingAccepted: pick("smsMarketingAccepted", null),
    adminNotes: pick("adminNotes", null),
    howDidYouFindUs: pick("howDidYouFindUs", null),
    acceptedTermsAndConditions: pick("acceptedTermsAndConditions", null),
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

// ─── Tab config ───────────────────────────────────────────────────────────────

const TAB_CONFIG = [
  { value: "overview",       icon: LayoutDashboard, label: "Overview",      sub: "Summary"    },
  { value: "profile",        icon: UserCog,         label: "Profile",       sub: "Contact info"},
  { value: "activity",       icon: Activity,        label: "User Activity", sub: "Sessions"   },
  { value: "integrations",   icon: Plug,            label: "Integrations",  sub: "Platforms"  },
  { value: "organizations",  icon: Building2,       label: "Organizations", sub: "Teams"      },
  { value: "invoices",       icon: FileText,        label: "Invoices",      sub: "Billing"    },
  { value: "subscriptions",  icon: CreditCard,      label: "Subscriptions", sub: "Plans"      },
  { value: "quotations",     icon: Receipt,         label: "Quotations",    sub: "Quotes"     },
  { value: "transactions",   icon: Wallet,          label: "Transactions",  sub: "Payments"   },
  { value: "tickets",        icon: Ticket,          label: "Tickets",       sub: "Support"    },
] as const;

// ─── Main component ───────────────────────────────────────────────────────────

export function ClientDetailPage({ clientId }: { clientId: string }) {
  const { client, isLoading, error } = useClientData(clientId);

  // ── All dialog state lives here (same pattern as hosting detail) ──
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

  const changeStatusMutation = trpc.clients.changeStatus.useMutation({
    onSuccess: () => {
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
      <div className="@container/main flex flex-col gap-4 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/agency/clients">
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-destructive mb-4">{error?.message ?? "Client not found"}</p>
            <Link to="/agency/clients"><Button variant="outline">Back to Clients</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const isDeactivated = client.status === "DEACTIVATED";
  const isBanned = client.status === "BANNED";
  const isSuspended = client.status === "SUSPENDED";

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/agency/clients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-base font-semibold tracking-tight flex items-center gap-2">
                {client.name}
                {client.emailVerified && (
                  <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500" />
                )}
              </h1>
              <p className="text-xs text-muted-foreground">Joined {fmtFull(client.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={client.status} />
            <DropdownMenu open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
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
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-8">
          <Tabs defaultValue="overview" className="w-full">
            <ScrollArea className="w-full -mx-4 px-4 md:mx-0 md:px-0 scrollbar-default">
              <TabsList className="inline-flex h-auto w-max min-w-full gap-2 p-1.5 bg-muted/50 rounded-lg border border-border/50">
                {TAB_CONFIG.map(({ value, icon: Icon, label, sub }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-shrink-0 min-w-[140px] @lg/main:min-w-[160px]"
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col items-start gap-1 w-full">
                      <span className="text-sm font-semibold tracking-tight">{label}</span>
                      <span className="text-xs text-muted-foreground">{sub}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" className="flex" />
            </ScrollArea>

            <TabsContent value="overview" className="mt-10">
              <OverviewTab clientId={clientId} client={client} />
            </TabsContent>
            <TabsContent value="profile" className="mt-10">
              <ProfileTab
                clientId={clientId}
                clientName={client.name}
                onEditProfile={() => setIsEditProfileOpen(true)}
              />
            </TabsContent>
            <TabsContent value="activity" className="mt-10">
              <UserActivityTab clientId={clientId} />
            </TabsContent>
            <TabsContent value="integrations" className="mt-10">
              <IntegrationsTab
                clientId={clientId}
                onAddIntegration={() => setIsAddIntegrationOpen(true)}
              />
            </TabsContent>
            <TabsContent value="organizations" className="mt-10">
              <OrganizationsTab clientId={clientId} />
            </TabsContent>
            <TabsContent value="invoices" className="mt-10">
              <InvoicesTab clientId={clientId} />
            </TabsContent>
            <TabsContent value="subscriptions" className="mt-10">
              <SubscriptionsTab clientId={clientId} />
            </TabsContent>
            <TabsContent value="quotations" className="mt-10">
              <QuotationsTab clientId={clientId} />
            </TabsContent>
            <TabsContent value="transactions" className="mt-10">
              <TransactionsTab clientId={clientId} />
            </TabsContent>
            <TabsContent value="tickets" className="mt-10">
              <TicketsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── All dialogs rendered at bottom of page, outside tab content ── */}

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
              {changeStatusMutation.isPending
                ? <><Spinner size={16} className="mr-2" />Updating...</>
                : "Confirm"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
