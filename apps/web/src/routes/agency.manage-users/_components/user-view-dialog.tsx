"use client";

import * as React from "react";
import { Edit, Mail, ShieldCheck, ShieldX, Calendar, User, BadgeCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@npanel/ui/components/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { EditUserDialog } from "./edit-user-dialog";
import { ProfileInformation } from "./profile-information";
import { EditProfileDialog } from "./edit-profile-dialog";

interface UserViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onStatusChange?: (id: string, status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED", action: string) => void;
}

export function UserViewDialog({
  open,
  onOpenChange,
  userId,
  onStatusChange,
}: UserViewDialogProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = React.useState(false);

  const { data: user, isLoading, error } = trpc.manageUsers.getById.useQuery(
    { userId },
    { enabled: open && !!userId }
  );

  const { data: sessions, isLoading: isLoadingSessions } = trpc.manageUsers.getSessions.useQuery(
    { userId },
    { enabled: open && !!userId }
  );

  const utils = trpc.useUtils();

  const handleEditSuccess = () => {
    utils.manageUsers.getAll.invalidate();
    utils.manageUsers.getById.invalidate({ userId });
    // onStatusChange is called when status actually changes, not here
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Loading user</DialogTitle>
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">User not found</DialogTitle>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">{error?.message || "User not found"}</p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getStatusBadge = () => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      SUSPENDED: "secondary",
      BANNED: "destructive",
      DEACTIVATED: "outline",
    };
    return (
      <Badge variant={variants[user.status] || "secondary"}>
        {user.status}
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6" hideClose>
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-2xl">{user.name}</DialogTitle>
                  {user.emailVerified && (
                    <BadgeCheck className="h-5 w-5 text-blue-500 flex-shrink-0 fill-blue-500" />
                  )}
                </div>
                <DialogDescription>Agency user account details</DialogDescription>
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Name</span>
                  </div>
                  <p className="text-sm font-medium">{user.name}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{user.email}</p>
                    {user.emailVerified ? (
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <ShieldX className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Role</span>
                  </div>
                  <Badge variant="outline">{user.role}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Status</span>
                  </div>
                  {getStatusBadge()}
                </div>

                {user.lastLoginAt && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Last Login</span>
                    </div>
                    <p className="text-sm font-medium">
                      {new Date(user.lastLoginAt).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created At</span>
                  </div>
                  <p className="text-sm font-medium">
                    {new Date(user.createdAt).toLocaleString()}
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
              <ProfileInformation userId={userId} />
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
                        <Badge variant={new Date(session.expiresAt) > new Date() ? "default" : "secondary"}>
                          {new Date(session.expiresAt) > new Date() ? "Active" : "Expired"}
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

      {user && (
        <>
          <EditUserDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            userId={user.id}
            initialData={{
              name: user.name,
              email: user.email,
              role: user.role === "CUSTOMER" ? "AGENCY_USER" : user.role as "AGENCY_ADMIN" | "AGENCY_SUPER_ADMIN" | "AGENCY_USER",
            }}
            onSuccess={handleEditSuccess}
          />
          <EditProfileDialog
            open={isEditProfileDialogOpen}
            onOpenChange={setIsEditProfileDialogOpen}
            userId={user.id}
            userName={user.name}
            onSuccess={handleEditSuccess}
          />
        </>
      )}
    </>
  );
}


