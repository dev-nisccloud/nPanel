"use client";

import * as React from "react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { TeamViewSheet } from "./agency.manage-organizations/_components/team-view-sheet";
import { EditTeamDialog } from "./agency.manage-organizations/_components/edit-team-dialog";
import { CreateTeamDialog } from "./agency.manage-organizations/_components/create-team-dialog";
import {
  OrganizationsList,
  OrganizationsListCreateButton,
} from "./agency.manage-organizations/_components/organizations-list";
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
import { trpc } from "@/utils/trpc";
import { captureEvent } from "@/lib/posthog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function ManageTeamsPage() {
  const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null);
  const [editTeamId, setEditTeamId] = React.useState<string | null>(null);
  const [createTeamOpen, setCreateTeamOpen] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    teamId: string | null;
    teamName: string;
  }>({
    open: false,
    teamId: null,
    teamName: "",
  });

  const utils = trpc.useUtils();

  const deleteTeamMutation = trpc.teams.delete.useMutation({
    onSuccess: () => {
      captureEvent("organization_deleted");
      toast.success("Organization deleted successfully");
      utils.teams.getAll.invalidate();
      setDeleteDialog({
        open: false,
        teamId: null,
        teamName: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete organization");
    },
  });

  const confirmDelete = () => {
    if (deleteDialog.teamId) {
      deleteTeamMutation.mutate({ teamId: deleteDialog.teamId });
    }
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight">Manage Organizations</h1>
            <p className="text-xs text-muted-foreground">
              Manage all organizations, view their members, invites, subscriptions, and billing.
            </p>
          </div>
          <OrganizationsListCreateButton onClick={() => setCreateTeamOpen(true)} />
        </div>

        <div className="mt-6">
          <OrganizationsList
            onView={setSelectedTeamId}
            onEdit={setEditTeamId}
            onDelete={(teamId, teamName) =>
              setDeleteDialog({
                open: true,
                teamId,
                teamName,
              })
            }
          />
        </div>
      </div>

      {selectedTeamId && (
        <TeamViewSheet
          open={!!selectedTeamId}
          onOpenChange={(open) => {
            if (!open) setSelectedTeamId(null);
          }}
          teamId={selectedTeamId}
        />
      )}

      {editTeamId && (
        <EditTeamDialog
          open={!!editTeamId}
          onOpenChange={(open) => {
            if (!open) setEditTeamId(null);
          }}
          teamId={editTeamId}
          onSuccess={() => {
            utils.teams.getAll.invalidate();
            setEditTeamId(null);
          }}
        />
      )}

      <CreateTeamDialog
        open={createTeamOpen}
        onOpenChange={setCreateTeamOpen}
        onSuccess={() => {
          utils.teams.getAll.invalidate();
        }}
      />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({
            open,
            teamId: null,
            teamName: "",
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the organization "{deleteDialog.teamName}"? This action cannot be undone and will delete all associated data including members, invites, and subscriptions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTeamMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteTeamMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTeamMutation.isPending ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Organization"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
