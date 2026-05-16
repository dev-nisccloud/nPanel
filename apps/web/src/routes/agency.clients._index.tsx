"use client";

import * as React from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientsTable, ClientsTableSkeleton } from "./agency.clients/_components/clients-table";
import { CreateClientSheet } from "./agency.clients/_components/create-client-sheet";
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
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { z } from "zod";
import { clientSchema } from "./agency.clients/_components/schema";

const EmptyState = ({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-lg font-semibold mb-2">{title}</p>
    <p className="text-muted-foreground mb-4">{description}</p>
    {action}
  </div>
);

export default function ClientsPage() {
  const navigate = useNavigate();
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusChangeDialog, setStatusChangeDialog] = React.useState<{
    open: boolean;
    clientId: string | null;
    status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED" | null;
    action: string;
  }>({
    open: false,
    clientId: null,
    status: null,
    action: "",
  });

  const { data: clients, isLoading, error, refetch } = trpc.clients.getAll.useQuery({}, {
    placeholderData: (previousData) => previousData,
  });

  const utils = trpc.useUtils();

  const filteredClients = React.useMemo(() => {
    if (!clients) return [];
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase().trim();
    return clients.filter((client) =>
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.role.toLowerCase().includes(query) ||
      client.status.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  const transformedClients = React.useMemo(() => {
    return filteredClients.map((client) => {
      const toDate = (value: unknown): Date => {
        if (value instanceof Date) return value;
        if (typeof value === "string") return new Date(value);
        return new Date(String(value));
      };
      return {
        ...client,
        createdAt: toDate(client.createdAt),
        updatedAt: toDate(client.updatedAt),
        lastLoginAt: client.lastLoginAt ? toDate(client.lastLoginAt) : null,
      } as z.infer<typeof clientSchema>;
    });
  }, [filteredClients]);

  const handleSuccess = () => {
    utils.clients.getAll.invalidate();
    setIsCreateSheetOpen(false);
  };

  const handleView = (id: string) => {
    navigate(`/agency/clients/${id}`);
  };

  const changeStatusMutation = trpc.clients.changeStatus.useMutation({
    onSuccess: () => {
      toast.success("Client status updated successfully");
      utils.clients.getAll.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update client status");
    },
  });

  const handleStatusChange = (id: string, status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED", action: string) => {
    setStatusChangeDialog({ open: true, clientId: id, status, action });
  };

  const confirmStatusChange = () => {
    if (statusChangeDialog.clientId && statusChangeDialog.status) {
      changeStatusMutation.mutate({ userId: statusChangeDialog.clientId, status: statusChangeDialog.status });
      setStatusChangeDialog({ open: false, clientId: null, status: null, action: "" });
    }
  };

  if (isLoading) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <ClientsTableSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">{error.message || "Failed to load clients"}</p>
            <Button onClick={() => refetch()} variant="outline">Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Clients</h1>
          <p className="text-xs text-muted-foreground">
            Manage your client accounts, view their activity, and handle their services.
          </p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search clients by name, email, role, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading} title="Refresh">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button onClick={() => setIsCreateSheetOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Client
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {!clients || clients.length === 0 ? (
            <EmptyState
              title="No clients found"
              description="Get started by creating a new client account."
              action={
                <Button onClick={() => setIsCreateSheetOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Client
                </Button>
              }
            />
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-semibold mb-2">No clients found</p>
              <p className="text-muted-foreground mb-4">No clients match your search query "{searchQuery}".</p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
            </div>
          ) : (
            <ClientsTable
              data={transformedClients}
              onView={handleView}
              onDeactivate={(id) => handleStatusChange(id, "DEACTIVATED", "deactivate")}
              onReactivate={(id) => handleStatusChange(id, "ACTIVE", "reactivate")}
              onBan={(id) => handleStatusChange(id, "BANNED", "ban")}
              onUnban={(id) => handleStatusChange(id, "ACTIVE", "unban")}
              onSuspend={(id) => handleStatusChange(id, "SUSPENDED", "suspend")}
              onUnsuspend={(id) => handleStatusChange(id, "ACTIVE", "unsuspend")}
            />
          )}
        </div>
      </div>

      <CreateClientSheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        onSuccess={handleSuccess}
      />

      <AlertDialog
        open={statusChangeDialog.open}
        onOpenChange={(open) => setStatusChangeDialog({ open, clientId: null, status: null, action: "" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {statusChangeDialog.action} this client account?
              {statusChangeDialog.status && ` This action will change their account status to ${statusChangeDialog.status}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changeStatusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={changeStatusMutation.isPending}
              className={
                statusChangeDialog.status === "BANNED" || statusChangeDialog.status === "DEACTIVATED"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {changeStatusMutation.isPending ? (
                <><Spinner size={16} className="mr-2" />Updating...</>
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
