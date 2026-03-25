"use client";

import * as React from "react";
import { Mail, UserPlus, MoreHorizontal, Trash2, Clock, CheckCircle2, XCircle, Ban, Calendar, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { useUsersLookup } from "@/hooks/use-user-lookup";
import { InviteMemberDialog } from "./invite-member-dialog";

interface ActiveInvitationsSectionProps {
  teamId: string;
}

function getInviteStatusBadge(status: string) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "secondary",
    ACCEPTED: "default",
    DECLINED: "destructive",
    EXPIRED: "outline",
    CANCELLED: "outline",
  };
  const icons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-3 w-3 mr-1" />,
    ACCEPTED: <CheckCircle2 className="h-3 w-3 mr-1" />,
    DECLINED: <XCircle className="h-3 w-3 mr-1" />,
    EXPIRED: <Ban className="h-3 w-3 mr-1" />,
    CANCELLED: <Ban className="h-3 w-3 mr-1" />,
  };
  return (
    <Badge variant={variants[status] ?? "secondary"} className="flex items-center gap-1">
      {icons[status]}
      {status}
    </Badge>
  );
}

export function ActiveInvitationsSection({ teamId }: ActiveInvitationsSectionProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const [deleteInviteDialog, setDeleteInviteDialog] = React.useState<{
    open: boolean;
    inviteId: string | null;
    inviteEmail: string;
  }>({ open: false, inviteId: null, inviteEmail: "" });

  const { data: invites, isLoading } = trpc.teams.getInvitesAsMember.useQuery(
    { teamId },
    { enabled: !!teamId }
  );

  const userIds = React.useMemo(
    () => (invites ?? []).map((inv) => inv.invitedById).filter(Boolean),
    [invites]
  );
  const { usersMap } = useUsersLookup(userIds);

  const utils = trpc.useUtils();
  const deleteInviteMutation = trpc.teams.deleteInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite deleted");
      utils.teams.getInvitesAsMember.invalidate({ teamId });
      setDeleteInviteDialog({ open: false, inviteId: null, inviteEmail: "" });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to delete invite");
    },
  });

  const handleInviteSuccess = () => {
    utils.teams.getInvitesAsMember.invalidate({ teamId });
    setInviteDialogOpen(false);
  };

  const confirmDeleteInvite = () => {
    if (deleteInviteDialog.inviteId) {
      deleteInviteMutation.mutate({ inviteId: deleteInviteDialog.inviteId });
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pt-6 pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Active Invitations
            </CardTitle>
            <CardDescription>Pending and recent company invitations</CardDescription>
          </div>
          <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite
          </Button>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size={24} />
            </div>
          ) : !invites || invites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Mail className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">No pending invitations.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setInviteDialogOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Invite a member
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {invites.map((invite) => {
                const inviter = usersMap.get(invite.invitedById);
                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/20 p-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited by: {inviter?.name ?? inviter?.email ?? "Unknown"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Role: {invite.role}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getInviteStatusBadge(invite.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              setDeleteInviteDialog({
                                open: true,
                                inviteId: invite.id,
                                inviteEmail: invite.email,
                              });
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete invite
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        teamId={teamId}
        onSuccess={handleInviteSuccess}
      />

      <AlertDialog
        open={deleteInviteDialog.open}
        onOpenChange={(open) =>
          setDeleteInviteDialog((prev) =>
            open ? { ...prev, open: true } : { open: false, inviteId: null, inviteEmail: "" }
          )
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invite</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the invite for{" "}
              <strong>{deleteInviteDialog.inviteEmail}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInviteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteInvite}
              disabled={deleteInviteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteInviteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
