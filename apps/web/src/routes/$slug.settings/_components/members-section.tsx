"use client";

import * as React from "react";
import { Users, MoreHorizontal, UserMinus } from "lucide-react";

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
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

interface MembersSectionProps {
  teamId: string;
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

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members
          </CardTitle>
          <CardDescription>People who have access to this company</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size={24} />
            </div>
          ) : !members || members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Users className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">No members in this company.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {members.map((member) => {
                const memberName =
                  member.userName ?? member.userEmail ?? "Unknown";
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/20 p-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{memberName}</p>
                      {member.userEmail && (
                        <p className="text-xs text-muted-foreground">{member.userEmail}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
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
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
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
            <AlertDialogCancel disabled={removeMemberMutation.isPending}>
              Cancel
            </AlertDialogCancel>
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
