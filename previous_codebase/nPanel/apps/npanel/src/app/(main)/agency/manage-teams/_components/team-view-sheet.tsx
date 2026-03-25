"use client";

import * as React from "react";
import { Building2, Users, Mail, Calendar, Globe, UserPlus, CheckCircle2, XCircle, Clock, Ban, MoreHorizontal, UserMinus, Trash2, XIcon } from "lucide-react";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { useUsersLookup } from "@/hooks/use-user-lookup";
import { InviteMemberDialog } from "./invite-member-dialog";
import { BillingSettingsTab } from "./billing-settings-tab";

interface TeamViewSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: string;
}

export function TeamViewSheet({
    open,
    onOpenChange,
    teamId,
}: TeamViewSheetProps) {
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

    const creator = team ? usersMap.get(team.createdById) : null;

    if (!open) return null;

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
                    <SheetHeader className="p-6 border-b flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                                    {isLoadingTeam ? "Loading Team..." : team?.name || "Team Details"}
                                </SheetTitle>
                                <SheetDescription>
                                    {isLoadingTeam ? "Fetching team information..." : "Team details and management"}
                                </SheetDescription>
                            </div>
                        </div>
                        <SheetClose asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                                <XIcon className="h-5 w-5" />
                            </Button>
                        </SheetClose>
                    </SheetHeader>

                    <ScrollArea className="flex-1 min-h-0 pr-4">
                        <div className="px-6 py-6 space-y-6">
                            {isLoadingTeam ? (
                                <div className="flex items-center justify-center py-12">
                                    <Spinner size={32} />
                                </div>
                            ) : teamError || !team ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <p className="text-destructive mb-4">{teamError?.message || "Team not found"}</p>
                                    <Button onClick={() => onOpenChange(false)} variant="outline">
                                        Close
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Overview Card */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Building2 className="h-5 w-5" />
                                                Team Overview
                                            </CardTitle>
                                            <CardDescription>Basic team identification</CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Team Name</span>
                                                <p className="text-sm font-medium">{team.name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Slug</span>
                                                <p className="text-sm font-mono">{team.slug}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Currency</span>
                                                <p className="text-sm font-medium">
                                                    <Badge variant="outline">{team.baseCurrency}</Badge>
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</span>
                                                <p className="text-sm font-medium">
                                                    <Badge variant={team.isActive ? "default" : "secondary"}>
                                                        {team.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Created By</span>
                                                <p className="text-sm font-medium">
                                                    {isLoadingUsers ? "Loading..." : creator?.name || creator?.email || "Unknown"}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Created At</span>
                                                <p className="text-sm font-medium">
                                                    {new Date(team.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Members Card */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Users className="h-5 w-5" />
                                                Team Members
                                            </CardTitle>
                                            <CardDescription>Manage group access</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {isLoadingMembers || isLoadingUsers ? (
                                                <div className="flex items-center justify-center py-6">
                                                    <Spinner size={24} />
                                                </div>
                                            ) : !members || members.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                                    <Users className="h-10 w-10 mb-2 opacity-20" />
                                                    <p>No members found in this team.</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {members.map((member) => {
                                                        const user = usersMap.get(member.userId);
                                                        const memberName = user?.name || user?.email || "Unknown";
                                                        return (
                                                            <div key={member.id} className="p-3 border rounded-lg flex items-center justify-between bg-muted/20">
                                                                <div className="space-y-0.5">
                                                                    <p className="text-sm font-semibold">{memberName}</p>
                                                                    {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                                                                    <p className="text-[10px] text-muted-foreground">Joined: {new Date(member.createdAt).toLocaleDateString()}</p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="text-[10px]">{member.role}</Badge>
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
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Invitations Card */}
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Mail className="h-5 w-5" />
                                                    Active Invitations
                                                </CardTitle>
                                                <CardDescription>Pending membership requests</CardDescription>
                                            </div>
                                            <Button size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Invite
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            {isLoadingInvites || isLoadingUsers ? (
                                                <div className="flex items-center justify-center py-6">
                                                    <Spinner size={24} />
                                                </div>
                                            ) : !invites || invites.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                                    <Mail className="h-10 w-10 mb-2 opacity-20" />
                                                    <p>No pending invitations.</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {invites.map((invite) => {
                                                        const inviter = usersMap.get(invite.invitedById);
                                                        return (
                                                            <div key={invite.id} className="p-3 border rounded-lg bg-muted/20">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="space-y-0.5">
                                                                        <p className="text-sm font-semibold">{invite.email}</p>
                                                                        <p className="text-[10px] text-muted-foreground">
                                                                            Invited by: {inviter?.name || inviter?.email || "Unknown"}
                                                                        </p>
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
                                                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                                                    <span className="flex items-center gap-1 font-medium italic"><Globe className="h-2 w-2" /> Role: {invite.role}</span>
                                                                    <span className="flex items-center gap-1"><Calendar className="h-2 w-2" /> Expires: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Subscriptions Card */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Globe className="h-5 w-5" />
                                                Hosting Subscriptions
                                            </CardTitle>
                                            <CardDescription>Associated service plans</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {isLoadingSubscriptions ? (
                                                <div className="flex items-center justify-center py-6">
                                                    <Spinner size={24} />
                                                </div>
                                            ) : !subscriptions || subscriptions.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                                    <Globe className="h-10 w-10 mb-2 opacity-20" />
                                                    <p>No hosting plans found.</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {subscriptions.map((subscription) => (
                                                        <div key={subscription.id} className="p-3 border rounded-lg space-y-3 bg-muted/20">
                                                            <div className="flex items-center justify-between">
                                                                <div className="space-y-0.5">
                                                                    <p className="text-sm font-semibold">{subscription.primaryDomain || "No domain linked"}</p>
                                                                    <p className="text-[10px] text-muted-foreground uppercase">{subscription.hostingType}</p>
                                                                </div>
                                                                <Badge variant={subscription.autoRenew ? "default" : "secondary"} className="text-[10px]">
                                                                    {subscription.autoRenew ? "Auto Renew" : "Manual"}
                                                                </Badge>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4 text-[11px]">
                                                                <div>
                                                                    <p className="text-muted-foreground">Cycle</p>
                                                                    <p className="font-medium">{subscription.billingCycle}</p>
                                                                </div>
                                                                {subscription.nextRenewalDate && (
                                                                    <div>
                                                                        <p className="text-muted-foreground">Renewal</p>
                                                                        <p className="font-medium text-blue-600">{new Date(subscription.nextRenewalDate).toLocaleDateString()}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Billing Settings Card */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Building2 className="h-5 w-5" />
                                                Billing Configuration
                                            </CardTitle>
                                            <CardDescription>Team financial settings</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <BillingSettingsTab teamId={teamId} />
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

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
