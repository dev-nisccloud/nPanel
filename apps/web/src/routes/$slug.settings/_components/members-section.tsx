"use client";

import * as React from "react";
import { Users, MoreHorizontal, UserMinus } from "lucide-react";

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
import { trpc } from "@/utils/trpc";

interface MembersSectionProps {
  teamId: string;
}

function MembersSkeleton() {
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

export function MembersSection({ teamId }: MembersSectionProps) {
  const [removeMemberDialog, setRemoveMemberDialog] = React.useState<{
    open: boolean;
    memberId: string | null;
    memberName: string;
  }>({ open: false, memberId: null, memberName: "" });

  const { data: members, isLoading } = trpc.teams.getMembersAsMember.useQuery(
    { teamId },
    { enabled: !!teamId }
  );

  const utils = trpc.useUtils();
  const removeMemberMutation = trpc.teams.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed");
      utils.teams.getMembersAsMember.invalidate({ teamId });
      setRemoveMemberDialog({ open: false, memberId: null, memberName: "" });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to remove member");
    },
  });

  const confirmRemoveMember = () => {
    if (removeMemberDialog.memberId) {
      removeMemberMutation.mutate({
        teamId,
        memberId: removeMemberDialog.memberId,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">People who have access to this company.</p>
        <MembersSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">People who have access to this company.</p>

        {members && members.length > 0 ? (
          <div className="divide-y overflow-hidden rounded-lg border bg-card">
            {members.map((member) => {
              const memberName = member.userName ?? member.userEmail ?? "Unknown";
              return (
                <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-sm font-medium">{memberName}</p>
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        {member.role}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.userEmail ? `${member.userEmail} · ` : ""}
                      Joined {new Date(member.createdAt).toLocaleDateString()}
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
                          setRemoveMemberDialog({
                            open: true,
                            memberId: member.id,
                            memberName,
                          });
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remove member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No members in this company.</p>
          </div>
        )}
      </div>

      <AlertDialog
        open={removeMemberDialog.open}
        onOpenChange={(open) =>
          setRemoveMemberDialog((prev) =>
            open ? { ...prev, open: true } : { open: false, memberId: null, memberName: "" }
          )
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removeMemberDialog.memberName}</strong> from
              this company? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMemberMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              disabled={removeMemberMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMemberMutation.isPending ? "Removing..." : "Remove member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
