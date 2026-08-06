"use client";

import * as React from "react";
import {
  Mail,
  UserPlus,
  MoreHorizontal,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";
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
    PENDING: <Clock className="h-2.5 w-2.5" />,
    ACCEPTED: <CheckCircle2 className="h-2.5 w-2.5" />,
    DECLINED: <XCircle className="h-2.5 w-2.5" />,
    EXPIRED: <Ban className="h-2.5 w-2.5" />,
    CANCELLED: <Ban className="h-2.5 w-2.5" />,
  };
  return (
    <Badge
      variant={variants[status] ?? "secondary"}
      className="flex h-5 items-center gap-0.5 px-1.5 text-[10px]"
    >
      {icons[status]}
      {status}
    </Badge>
  );
}

function InvitationsSkeleton() {
  return (
    <div className="divide-y rounded-lg border bg-card">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
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
      captureEvent("team_member_invitation_cancelled");
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
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Pending and recent company invitations.
          </p>
          <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Invite
          </Button>
        </div>

        {isLoading ? (
          <InvitationsSkeleton />
        ) : invites && invites.length > 0 ? (
          <div className="divide-y overflow-hidden rounded-lg border bg-card">
            {invites.map((invite) => {
              const inviter = usersMap.get(invite.invitedById);
              return (
                <div key={invite.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-sm font-medium">{invite.email}</p>
                      {getInviteStatusBadge(invite.status)}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {invite.role} · Invited by {inviter?.name ?? inviter?.email ?? "Unknown"} ·
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
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
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No pending invitations.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setInviteDialogOpen(true)}
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Invite a member
            </Button>
          </div>
        )}
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
            <AlertDialogCancel disabled={deleteInviteMutation.isPending}>Cancel</AlertDialogCancel>
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
