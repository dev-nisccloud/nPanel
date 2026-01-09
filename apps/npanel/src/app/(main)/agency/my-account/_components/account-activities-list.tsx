"use client";

import { Activity, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

// Loading skeleton
function AccountActivitiesListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-32" />
                    {i === 0 && <Skeleton className="h-5 w-16" />}
                  </div>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              {i > 0 && <Skeleton className="h-9 w-20" />}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AccountActivitiesList() {
  const { data: sessions, isLoading, refetch } = trpc.userProfile.getSessions.useQuery();

  const revokeSessionMutation = trpc.userProfile.revokeSession.useMutation({
    onSuccess: () => {
      toast.success("Session revoked successfully");
      refetch();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to revoke session");
    },
  });

  const handleRevokeSession = async (sessionId: string) => {
    if (confirm("Are you sure you want to revoke this session? The device will be logged out.")) {
      await revokeSessionMutation.mutateAsync({ sessionId });
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
    if (!userAgent) return "Unknown Device";
    
    if (userAgent.includes("Windows")) return "Windows PC";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("iPhone")) return "iPhone";
    if (userAgent.includes("iPad")) return "iPad";
    if (userAgent.includes("Android")) return "Android";
    
    return "Unknown Device";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Activities</CardTitle>
        <CardDescription>
          Manage your active sessions across different devices and browsers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <AccountActivitiesListSkeleton />
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card key={session.id} className={session.isCurrent ? "border-primary" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{getDeviceInfo(session.userAgent)}</p>
                          {session.isCurrent && (
                            <Badge variant="default" className="text-xs">Current</Badge>
                          )}
                        </div>
                        {session.ipAddress && (
                          <p className="text-sm text-muted-foreground">
                            IP: {session.ipAddress}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Last active: {formatDate(session.updatedAt)}
                        </p>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revokeSessionMutation.isPending}
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No active sessions found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
