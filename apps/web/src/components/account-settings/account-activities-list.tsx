"use client";

import * as React from "react";
import { LogOut, MonitorSmartphone, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "@/components/ui/sonner";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";

function AccountActivitiesListSkeleton() {
  return (
    <div className="divide-y rounded-lg border bg-card">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AccountActivitiesList() {
  const navigate = useNavigate();
  const { data: sessions, isLoading, refetch } = trpc.userProfile.getSessions.useQuery();

  const [revokeDialogOpen, setRevokeDialogOpen] = React.useState(false);
  const [revokeAllDialogOpen, setRevokeAllDialogOpen] = React.useState(false);
  const [sessionIdToRevoke, setSessionIdToRevoke] = React.useState<string | null>(null);

  const revokeSessionMutation = trpc.userProfile.revokeSession.useMutation({
    onSuccess: () => {
      toast.success("Session revoked successfully");
      setRevokeDialogOpen(false);
      setSessionIdToRevoke(null);
      refetch();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to revoke session");
    },
  });

  const revokeAllSessionsMutation = trpc.userProfile.revokeAllSessions.useMutation({
    onSuccess: async () => {
      toast.success("Signed out everywhere");
      setRevokeAllDialogOpen(false);
      try {
        await authClient.signOut();
      } catch {
        // Session may already be deleted server-side.
      }
      navigate("/auth/login", { replace: true });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to sign out everywhere");
    },
  });

  const openRevokeDialog = (sessionId: string) => {
    setSessionIdToRevoke(sessionId);
    setRevokeDialogOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (sessionIdToRevoke) {
      await revokeSessionMutation.mutateAsync({ sessionId: sessionIdToRevoke });
    }
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getDeviceInfo = (userAgent: string | null) => {
    if (!userAgent) return "Unknown device";

    if (userAgent.includes("Windows")) return "Windows PC";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("iPhone")) return "iPhone";
    if (userAgent.includes("iPad")) return "iPad";
    if (userAgent.includes("Android")) return "Android";

    return "Unknown device";
  };

  if (isLoading) {
    return <AccountActivitiesListSkeleton />;
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Devices and browsers where you&apos;re currently signed in.
          </p>
          {sessions && sessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive hover:text-destructive"
              onClick={() => setRevokeAllDialogOpen(true)}
              disabled={revokeAllSessionsMutation.isPending}
            >
              <ShieldAlert className="mr-1 h-3.5 w-3.5" />
              Sign out everywhere
            </Button>
          )}
        </div>

        {sessions && sessions.length > 0 ? (
          <div className="divide-y overflow-hidden rounded-lg border bg-card">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  session.isCurrent && "bg-primary/5"
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="text-sm font-medium">{getDeviceInfo(session.userAgent)}</p>
                    {session.isCurrent && (
                      <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {session.ipAddress ? `IP ${session.ipAddress} · ` : ""}
                    Last active {formatDate(session.updatedAt)}
                  </p>
                </div>

                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0 px-2 text-muted-foreground hover:text-destructive"
                    onClick={() => openRevokeDialog(session.id)}
                    disabled={revokeSessionMutation.isPending}
                  >
                    <LogOut className="mr-1 h-3.5 w-3.5" />
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No active sessions found</p>
          </div>
        )}
      </div>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this session? The device will be logged out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeSessionMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmRevoke();
              }}
              disabled={revokeSessionMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeSessionMutation.isPending ? "Revoking…" : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={revokeAllDialogOpen} onOpenChange={setRevokeAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out everywhere</AlertDialogTitle>
            <AlertDialogDescription>
              This ends every active session, including this one. You will need to sign in again
              on all devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeAllSessionsMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void revokeAllSessionsMutation.mutateAsync();
              }}
              disabled={revokeAllSessionsMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeAllSessionsMutation.isPending ? "Signing out…" : "Sign out everywhere"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
