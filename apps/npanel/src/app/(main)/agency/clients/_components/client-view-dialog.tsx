"use client";

import * as React from "react";
import { Edit, Mail, ShieldCheck, ShieldX, Calendar, User, BadgeCheck, Plug } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@nPanel/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { EditClientDialog } from "./edit-client-dialog";
import { ProfileInformation } from "./profile-information";
import { EditProfileDialog } from "./edit-profile-dialog";
import { IntegrationsDisplay } from "./integrations-display";
import { AddIntegrationDialog } from "./add-integration-dialog";

interface ClientViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onStatusChange?: (id: string, status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED", action: string) => void;
}

export function ClientViewDialog({
  open,
  onOpenChange,
  clientId,
  onStatusChange,
}: ClientViewDialogProps) {
  // ALL HOOKS MUST BE AT THE TOP LEVEL - BEFORE ANY CONDITIONAL RETURNS
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = React.useState(false);
  const [isAddIntegrationDialogOpen, setIsAddIntegrationDialogOpen] = React.useState(false);

  // Use efficient query - get client from the list cache or fetch user info
  const utils = trpc.useUtils();
  
  // Try to get client from cache first
  const clientsData = utils.clients.getAll.getData();
  const clientFromCache = React.useMemo(() => {
    if (!clientsData) return undefined;
    return clientsData.find((c) => c.id === clientId);
  }, [clientsData, clientId]);

  // Fallback: fetch user info if not in cache
  const { data: userInfo, isLoading: isLoadingUserInfo } = trpc.userProfile.getUserById.useQuery(
    { userId: clientId, fields: ["id", "name", "email", "emailVerified", "role", "status", "image", "lastLoginAt", "createdAt", "updatedAt"] },
    { enabled: open && !!clientId && !clientFromCache }
  );

  // Use client from cache or userInfo as fallback
  const displayClient = React.useMemo(() => {
    if (clientFromCache) return clientFromCache;
    if (userInfo) {
      return {
        id: userInfo.id,
        name: userInfo.name || "",
        email: userInfo.email || "",
        emailVerified: userInfo.emailVerified || false,
        role: userInfo.role,
        status: userInfo.status,
        image: userInfo.image,
        lastLoginAt: userInfo.lastLoginAt,
        createdAt: userInfo.createdAt,
        updatedAt: userInfo.updatedAt,
      };
    }
    return undefined;
  }, [clientFromCache, userInfo]);

  const { data: sessions, isLoading: isLoadingSessions } = trpc.clients.getSessions.useQuery(
    { userId: clientId },
    { enabled: open && !!clientId }
  );

  const isLoading = !displayClient && isLoadingUserInfo;
  const error = undefined;

  const handleEditSuccess = React.useCallback(() => {
    // Invalidate only the specific queries that need updating
    utils.clients.getAll.invalidate();
    utils.userProfile.getUserById.invalidate({ userId: clientId });
    utils.clients.getProfile.invalidate({ userId: clientId });
    utils.clients.getIntegrations.invalidate({ userId: clientId });
    // Don't call onStatusChange without proper arguments
  }, [utils, clientId]);

  // Helper function - not a hook, so it can be defined after conditional returns
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      SUSPENDED: "secondary",
      BANNED: "destructive",
      DEACTIVATED: "outline",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  // NOW we can do conditional returns
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Client</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !displayClient) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{error?.message || "Client not found"}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">{error?.message || "Client not found"}</p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6" hideClose>
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-2xl">{displayClient.name}</DialogTitle>
                  {displayClient.emailVerified && (
                    <BadgeCheck className="h-5 w-5 text-blue-500 flex-shrink-0 fill-blue-500" title="Verified Account" />
                  )}
                </div>
                <DialogDescription>Client account details</DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Name</span>
                  </div>
                  <p className="text-sm font-medium">{displayClient.name}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{displayClient.email}</p>
                    {displayClient.emailVerified ? (
                      <ShieldCheck className="h-4 w-4 text-green-500" title="Email Verified" />
                    ) : (
                      <ShieldX className="h-4 w-4 text-gray-400" title="Email Not Verified" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Role</span>
                  </div>
                  <Badge variant="outline">{displayClient.role}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Status</span>
                  </div>
                  {getStatusBadge(displayClient.status)}
                </div>

                {displayClient.lastLoginAt && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Last Login</span>
                    </div>
                    <p className="text-sm font-medium">
                      {new Date(displayClient.lastLoginAt).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created At</span>
                  </div>
                  <p className="text-sm font-medium">
                    {new Date(displayClient.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Profile Information</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditProfileDialogOpen(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
              <ProfileInformation userId={clientId} />
            </TabsContent>

            <TabsContent value="integrations" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Platform Integrations</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddIntegrationDialogOpen(true)}
                >
                  <Plug className="mr-2 h-4 w-4" />
                  Add Integration
                </Button>
              </div>
              <IntegrationsDisplay userId={clientId} />
            </TabsContent>

            <TabsContent value="sessions" className="mt-6">
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size={24} />
                </div>
              ) : !sessions || sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">No active sessions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Session Token</p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {session.token}
                          </p>
                        </div>
                        <Badge variant={session.expiresAt > new Date() ? "default" : "secondary"}>
                          {session.expiresAt > new Date() ? "Active" : "Expired"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Expires At</p>
                          <p>{new Date(session.expiresAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created At</p>
                          <p>{new Date(session.createdAt).toLocaleString()}</p>
                        </div>
                        {session.ipAddress && (
                          <div>
                            <p className="text-muted-foreground">IP Address</p>
                            <p>{session.ipAddress}</p>
                          </div>
                        )}
                        {session.userAgent && (
                          <div>
                            <p className="text-muted-foreground">User Agent</p>
                            <p className="text-xs truncate">{session.userAgent}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {displayClient && (
        <>
          <EditClientDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            clientId={displayClient.id}
            initialData={{
              name: displayClient.name,
              email: displayClient.email,
              role: displayClient.role,
            }}
            onSuccess={handleEditSuccess}
          />
          <EditProfileDialog
            open={isEditProfileDialogOpen}
            onOpenChange={setIsEditProfileDialogOpen}
            userId={displayClient.id}
            userName={displayClient.name}
            onSuccess={handleEditSuccess}
          />
          <AddIntegrationDialog
            open={isAddIntegrationDialogOpen}
            onOpenChange={setIsAddIntegrationDialogOpen}
            userId={displayClient.id}
            onSuccess={handleEditSuccess}
          />
        </>
      )}
    </>
  );
}

