"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import {
    Building2,
    Users,
    Mail,
    Calendar,
    Globe,
    UserPlus,
    CheckCircle2,
    XCircle,
    Clock,
    Ban,
    MoreHorizontal,
    UserMinus,
    Trash2,
    XIcon,
} from "lucide-react";
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
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { InviteMemberDialog } from "./invite-member-dialog";
import { AddMemberDialog } from "./add-member-dialog";
import { BillingSettingsTab } from "./billing-settings-tab";

interface TeamViewSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: string;
}

function getBillingCycleDisplayName(cycle: string | null | undefined): string {
    if (!cycle) return "—";
    const labels: Record<string, string> = {
        MONTHLY: "Monthly",
        YEARLY: "Yearly",
        BIENNIALLY: "Biennially",
        CUSTOM: "Custom",
        ONE_TIME: "One-time",
    };
    return labels[cycle] ?? cycle;
}

function formatDate(value: string | Date | null | undefined): string {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function formatDateTime(value: string | Date | null | undefined): string {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function displayServiceName(
    productName: string,
    productPlanName: string | null,
    subscriptionName: string | null,
    billingCycle?: string | null,
): string {
    if (billingCycle === "ONE_TIME" && subscriptionName?.trim()) {
        return subscriptionName.trim();
    }
    const base = productPlanName?.trim() ? `${productName} - ${productPlanName}` : productName;
    return subscriptionName?.trim() ? `${base} (${subscriptionName})` : base;
}

function getStatusBadgeClass(status: string): string {
    const statusColors: Record<string, string> = {
        ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800",
        PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
        SUSPENDED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 border-orange-200 dark:border-orange-800",
        CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
        EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
        PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-800",
        FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
        UPGRADED: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200",
        DOWNGRADED: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200",
    };
    return statusColors[status] ?? "";
}

export function TeamViewSheet({
    open,
    onOpenChange,
    teamId,
}: TeamViewSheetProps) {
    const navigate = useNavigate();
    const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false);
    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = React.useState(false);
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

    const { data: subscriptions, isLoading: isLoadingSubscriptions } =
        trpc.clientSubscriptions.listForAgency.useQuery(
            { teamId, limit: 200, offset: 0 },
            { enabled: open && !!teamId }
        );

    const utils = trpc.useUtils();

    const handleInviteSuccess = () => {
        utils.teams.getInvites.invalidate({ teamId });
        setIsInviteDialogOpen(false);
    };

    const handleAddMemberSuccess = () => {
        void utils.teams.getMembers.invalidate({ teamId });
        void utils.teams.getInvites.invalidate({ teamId });
        void utils.teams.getAll.invalidate();
        setIsAddMemberDialogOpen(false);
    };

    const existingMemberUserIds = React.useMemo(
        () => (members ?? []).map((m) => m.userId),
        [members],
    );

    const removeMemberMutation = trpc.teams.removeMember.useMutation({
        onSuccess: () => {
            toast.success("Member removed successfully");
            utils.teams.getMembers.invalidate({ teamId });
            utils.teams.getAll.invalidate();
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

    const creatorLabel = team?.createdByName || team?.createdByEmail || "Unknown";

    if (!open) return null;

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent size="wide" className="w-full min-w-0 overflow-x-hidden p-0 flex flex-col">
                    <SheetHeader className="p-6 border-b flex flex-row items-center justify-between gap-3 space-y-0 min-w-0">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-full shrink-0">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <SheetTitle className="truncate">
                                    {isLoadingTeam ? "Loading Organization..." : team?.name || "Organization Details"}
                                </SheetTitle>
                                <SheetDescription>
                                    {isLoadingTeam ? "Fetching organization information..." : "Organization details and management"}
                                </SheetDescription>
                            </div>
                        </div>
                        <SheetClose asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                                <XIcon className="h-5 w-5" />
                            </Button>
                        </SheetClose>
                    </SheetHeader>

                    <ScrollArea className="flex-1 min-h-0 min-w-0 overflow-x-hidden" viewportClassName="overflow-x-hidden">
                        <div className="min-w-0 px-6 py-6 space-y-6">
                            {isLoadingTeam ? (
                                <div className="flex items-center justify-center py-12">
                                    <Spinner size={32} />
                                </div>
                            ) : teamError || !team ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <p className="text-destructive mb-4">{teamError?.message || "Organization not found"}</p>
                                    <Button onClick={() => onOpenChange(false)} variant="outline">
                                        Close
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Card className="min-w-0 overflow-hidden">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Building2 className="h-5 w-5" />
                                                Organization Overview
                                            </CardTitle>
                                            <CardDescription>From organization record</CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Organization Name</span>
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
                                                <p className="text-sm font-medium">{creatorLabel}</p>
                                                {team.createdByEmail && team.createdByName ? (
                                                    <p className="text-xs text-muted-foreground">{team.createdByEmail}</p>
                                                ) : null}
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Created At</span>
                                                <p className="text-sm font-medium">{formatDateTime(team.createdAt)}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="min-w-0 overflow-hidden">
                                        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between min-w-0">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Users className="h-5 w-5" />
                                                    Organization Members
                                                </CardTitle>
                                                <CardDescription>
                                                    Members of this organization
                                                </CardDescription>
                                            </div>
                                            <Button size="sm" onClick={() => setIsAddMemberDialogOpen(true)}>
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Add member
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            {isLoadingMembers ? (
                                                <div className="flex items-center justify-center py-6">
                                                    <Spinner size={24} />
                                                </div>
                                            ) : !members || members.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                                    <Users className="h-10 w-10 mb-2 opacity-20" />
                                                    <p>No members found in this organization.</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {members.map((member) => {
                                                        const memberName = member.userName || member.userEmail || "Unknown";
                                                        return (
                                                            <div key={member.id} className="p-3 border rounded-lg flex items-center justify-between bg-muted/20">
                                                                <div className="space-y-0.5">
                                                                    <p className="text-sm font-semibold">{memberName}</p>
                                                                    {member.userEmail ? (
                                                                        <p className="text-xs text-muted-foreground">{member.userEmail}</p>
                                                                    ) : null}
                                                                    <p className="text-[10px] text-muted-foreground">
                                                                        Joined: {formatDate(member.createdAt)}
                                                                    </p>
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

                                    <Card className="min-w-0 overflow-hidden">
                                        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between min-w-0">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Mail className="h-5 w-5" />
                                                    Invitations
                                                </CardTitle>
                                                <CardDescription>
                                                    Email invites for this organization
                                                </CardDescription>
                                            </div>
                                            <Button size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Invite
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            {isLoadingInvites ? (
                                                <div className="flex items-center justify-center py-6">
                                                    <Spinner size={24} />
                                                </div>
                                            ) : !invites || invites.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                                    <Mail className="h-10 w-10 mb-2 opacity-20" />
                                                    <p>No invitations for this organization.</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {invites.map((invite) => {
                                                        const inviterLabel = invite.invitedByName || invite.invitedByEmail || "Unknown";
                                                        return (
                                                            <div key={invite.id} className="p-3 border rounded-lg bg-muted/20">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="space-y-0.5">
                                                                        <p className="text-sm font-semibold">{invite.email}</p>
                                                                        <p className="text-[10px] text-muted-foreground">
                                                                            Invited by: {inviterLabel}
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
                                                                    <span className="flex items-center gap-1"><Calendar className="h-2 w-2" /> Expires: {formatDate(invite.expiresAt)}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="min-w-0 overflow-hidden">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Globe className="h-5 w-5" />
                                                Subscriptions
                                            </CardTitle>
                                            <CardDescription>Nisc subscriptions linked to this organization</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {isLoadingSubscriptions ? (
                                                <div className="flex items-center justify-center py-6">
                                                    <Spinner size={24} />
                                                </div>
                                            ) : !subscriptions || subscriptions.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                                    <Globe className="h-10 w-10 mb-2 opacity-20" />
                                                    <p>No subscriptions found.</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {subscriptions.map((subscription) => (
                                                        <button
                                                            key={subscription.id}
                                                            type="button"
                                                            className="p-3 border rounded-lg space-y-3 bg-muted/20 text-left hover:bg-muted/40 transition-colors"
                                                            onClick={() => {
                                                                onOpenChange(false);
                                                                void navigate(`/agency/subscriptions?subscriptionId=${subscription.id}`);
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="space-y-0.5 min-w-0">
                                                                    <p className="text-sm font-semibold truncate">
                                                                        {displayServiceName(
                                                                            subscription.productName,
                                                                            subscription.productPlanName,
                                                                            subscription.subscriptionName,
                                                                            subscription.billingCycle,
                                                                        )}
                                                                    </p>
                                                                    {subscription.primaryDomain ? (
                                                                        <p className="text-[10px] text-muted-foreground truncate">
                                                                            {subscription.primaryDomain}
                                                                        </p>
                                                                    ) : null}
                                                                </div>
                                                                <Badge variant="outline" className={`text-[10px] shrink-0 ${getStatusBadgeClass(subscription.status)}`}>
                                                                    {subscription.status.replace(/_/g, " ")}
                                                                </Badge>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4 text-[11px]">
                                                                <div>
                                                                    <p className="text-muted-foreground">Cycle</p>
                                                                    <p className="font-medium">{getBillingCycleDisplayName(subscription.billingCycle)}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-muted-foreground">Expires</p>
                                                                    <p className="font-medium">{formatDate(subscription.expiryDate)}</p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="min-w-0 overflow-hidden">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Building2 className="h-5 w-5" />
                                                Billing Configuration
                                            </CardTitle>
                                            <CardDescription>Organization billing settings</CardDescription>
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

            <AddMemberDialog
                open={isAddMemberDialogOpen}
                onOpenChange={setIsAddMemberDialogOpen}
                teamId={teamId}
                existingMemberUserIds={existingMemberUserIds}
                onSuccess={handleAddMemberSuccess}
            />

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
                            Are you sure you want to remove <strong>{removeMemberDialog.memberName}</strong> from this organization? This action cannot be undone.
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
