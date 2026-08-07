"use client";

import * as React from "react";
import { Building2, Users, Mail, Calendar, Globe, UserPlus, CheckCircle2, XCircle, Clock, Ban, MoreHorizontal, UserMinus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@npanel/ui/components/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
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
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { useUsersLookup } from "@/hooks/use-user-lookup";
import { InviteMemberDialog } from "./invite-member-dialog";
import { BillingSettingsTab } from "./billing-settings-tab";
import { z } from "zod";
import { teamMemberSchema, teamInviteSchema, hostingSubscriptionSchema } from "./schema";

interface TeamViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

export function TeamViewDialog({
  open,
  onOpenChange,
  teamId,
}: TeamViewDialogProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false);
  const [removeMemberDialog, setRemoveMemberDialog] = React.useState<{
    open: boolean;
    memberId: string | null;
    memberName: string;
  }>({
    open: false,
    memberId: null,
    memberName: "",
  });
  const [deleteInviteDialog, setDeleteInviteDialog] = React.useState<{
    open: boolean;
    inviteId: string | null;
    inviteEmail: string;
  }>({
    open: false,
    inviteId: null,
    inviteEmail: "",
  });

  const { data: team, isLoading: isLoadingTeam, error: teamError } = trpc.teams.getById.useQuery(
    { teamId },
    { enabled: open && !!teamId }
  );

  const { data: members, isLoading: isLoadingMembers } = trpc.teams.getMembers.useQuery(
    { teamId },
    { enabled: open && !!teamId }
  );

  const { data: invites, isLoading: isLoadingInvites } = trpc.teams.getInvites.useQuery(
    { teamId },
    { enabled: open && !!teamId }
  );

  const { data: subscriptions, isLoading: isLoadingSubscriptions } = trpc.teams.getHostingSubscriptions.useQuery(
    { teamId },
    { enabled: open && !!teamId }
  );

  // Get all user IDs for lookup
  const userIds = React.useMemo(() => {
    const ids: string[] = [];
    if (team?.createdById) ids.push(team.createdById);
    if (members) {
      members.forEach((m) => {
        if (m.userId) ids.push(m.userId);
      });
    }
    if (invites) {
      invites.forEach((inv) => {
        if (inv.invitedById) ids.push(inv.invitedById);
      });
    }
    return Array.from(new Set(ids));
  }, [team, members, invites]);

  const { usersMap, isLoading: isLoadingUsers } = useUsersLookup(userIds);

  const utils = trpc.useUtils();

  const handleInviteSuccess = () => {
    utils.teams.getInvites.invalidate({ teamId });
    setIsInviteDialogOpen(false);
  };

  const removeMemberMutation = trpc.teams.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed successfully");
      utils.teams.getMembers.invalidate({ teamId });
      setRemoveMemberDialog({ open: false, memberId: null, memberName: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove member");
    },
  });

  const deleteInviteMutation = trpc.teams.deleteInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite deleted successfully");
      utils.teams.getInvites.invalidate({ teamId });
      setDeleteInviteDialog({ open: false, inviteId: null, inviteEmail: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete invite");
    },
  });

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setRemoveMemberDialog({ open: true, memberId, memberName });
  };

  const handleDeleteInvite = (inviteId: string, inviteEmail: string) => {
    setDeleteInviteDialog({ open: true, inviteId, inviteEmail });
  };

  const confirmRemoveMember = () => {
    if (removeMemberDialog.memberId) {
      removeMemberMutation.mutate({
        teamId,
        memberId: removeMemberDialog.memberId,
      });
    }
  };

  const confirmDeleteInvite = () => {
    if (deleteInviteDialog.inviteId) {
      deleteInviteMutation.mutate({
        inviteId: deleteInviteDialog.inviteId,
      });
    }
  };

  if (isLoadingTeam) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Team</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (teamError || !team) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{teamError?.message || "Team not found"}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">{teamError?.message || "Team not found"}</p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const creator = usersMap.get(team.createdById);

  const getInviteStatusBadge = (status: string) => {
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
      <Badge variant={variants[status] || "secondary"} className="flex items-center gap-1">
        {icons[status]}
        {status}
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6" hideClose>
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <DialogTitle className="text-2xl">{team.name}</DialogTitle>
                </div>
                <DialogDescription>Team details and management</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="invites">Invites</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="billing">Billing Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>Team Name</span>
                  </div>
                  <p className="text-sm font-medium">{team.name}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span>Slug</span>
                  </div>
                  <p className="text-sm font-mono">{team.slug}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Currency</span>
                  </div>
                  <Badge variant="outline">{team.baseCurrency}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Status</span>
                  </div>
                  <Badge variant={team.isActive ? "default" : "secondary"}>
                    {team.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Created By</span>
                  </div>
                  <p className="text-sm font-medium">
                    {isLoadingUsers ? "Loading..." : creator?.name || creator?.email || "Unknown"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created At</span>
                  </div>
                  <p className="text-sm font-medium">
                    {new Date(team.createdAt).toLocaleString()}
                  </p>
                </div>

                {team.logoUrl && (
                  <div className="space-y-2 col-span-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Logo URL</span>
                    </div>
                    <a
                      href={team.logoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {team.logoUrl}
                    </a>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              {isLoadingMembers || isLoadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size={24} />
                </div>
              ) : !members || members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No members found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => {
                    const user = usersMap.get(member.userId);
                    const memberName = user?.name || user?.email || "Unknown";
                    return (
                      <div
                        key={member.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1 flex-1">
                            <p className="text-sm font-medium">
                              {memberName}
                            </p>
                            {user?.email && (
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{member.role}</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    handleRemoveMember(member.id, memberName);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <UserMinus className="mr-2 h-4 w-4" />
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Joined: {new Date(member.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invites" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Team Invitations</h3>
                <Button
                  size="sm"
                  onClick={() => setIsInviteDialogOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </div>

              {isLoadingInvites || isLoadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size={24} />
                </div>
              ) : !invites || invites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No invitations found</p>
                  <Button
                    size="sm"
                    onClick={() => setIsInviteDialogOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {invites.map((invite) => {
                    const inviter = usersMap.get(invite.invitedById);
                    return (
                      <div
                        key={invite.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1 flex-1">
                            <p className="text-sm font-medium">{invite.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Invited by: {inviter?.name || inviter?.email || "Unknown"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getInviteStatusBadge(invite.status)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    handleDeleteInvite(invite.id, invite.email);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Invite
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Role: {invite.role}</span>
                          <span>Expires: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                          {invite.acceptedAt && (
                            <span>Accepted: {new Date(invite.acceptedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="subscriptions" className="mt-6">
              {isLoadingSubscriptions ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size={24} />
                </div>
              ) : !subscriptions || subscriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">No hosting subscriptions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {subscription.primaryDomain || "No domain"}
                          </p>
                          <Badge variant="outline">{subscription.hostingType}</Badge>
                        </div>
                        <Badge variant={subscription.autoRenew ? "default" : "secondary"}>
                          {subscription.autoRenew ? "Auto Renew" : "Manual"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Billing Cycle</p>
                          <p>{subscription.billingCycle}</p>
                        </div>
                        {subscription.nextRenewalDate && (
                          <div>
                            <p className="text-muted-foreground">Next Renewal</p>
                            <p>{new Date(subscription.nextRenewalDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        {subscription.expiryDate && (
                          <div>
                            <p className="text-muted-foreground">Expiry Date</p>
                            <p>{new Date(subscription.expiryDate).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="billing" className="mt-6">
              <BillingSettingsTab teamId={teamId} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        teamId={teamId}
        onSuccess={handleInviteSuccess}
      />

      <AlertDialog
        open={removeMemberDialog.open}
        onOpenChange={(open) =>
          setRemoveMemberDialog({ open, memberId: null, memberName: "" })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removeMemberDialog.memberName}</strong> from this team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMemberMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              disabled={removeMemberMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMemberMutation.isPending ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteInviteDialog.open}
        onOpenChange={(open) =>
          setDeleteInviteDialog({ open, inviteId: null, inviteEmail: "" })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invite</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the invite for <strong>{deleteInviteDialog.inviteEmail}</strong>? This action cannot be undone.
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
              {deleteInviteMutation.isPending ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Invite"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


