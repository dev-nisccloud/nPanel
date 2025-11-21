"use client";

import * as React from "react";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamCardsList } from "./_components/team-card";
import { TeamViewDialog } from "./_components/team-view-dialog";
import { EditTeamDialog } from "./_components/edit-team-dialog";
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
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { z } from "zod";
import { teamSchema } from "./_components/schema";

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-lg font-semibold mb-2">{title}</p>
    <p className="text-muted-foreground mb-4">{description}</p>
  </div>
);

export default function ManageTeamsPage() {
  const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null);
  const [editTeamId, setEditTeamId] = React.useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    teamId: string | null;
    teamName: string;
  }>({
    open: false,
    teamId: null,
    teamName: "",
  });
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: teams, isLoading, error, refetch } = trpc.teams.getAll.useQuery();

  const utils = trpc.useUtils();

  const filteredTeams = React.useMemo(() => {
    if (!teams) return [];
    if (!searchQuery.trim()) return teams;
    
    const query = searchQuery.toLowerCase().trim();
    return teams.filter((team) => {
      return (
        team.name.toLowerCase().includes(query) ||
        team.slug.toLowerCase().includes(query) ||
        team.baseCurrency.toLowerCase().includes(query)
      );
    });
  }, [teams, searchQuery]);

  const transformedTeams = React.useMemo(() => {
    return filteredTeams.map((team) => {
      const toDate = (value: unknown): Date => {
        if (value instanceof Date) return value;
        if (typeof value === 'string') return new Date(value);
        return new Date(String(value));
      };
      
      const mappedTeam = {
        ...team,
        createdAt: toDate(team.createdAt),
        updatedAt: toDate(team.updatedAt),
      } as z.infer<typeof teamSchema>;
      return mappedTeam;
    });
  }, [filteredTeams]);

  const handleView = (id: string) => {
    setSelectedTeamId(id);
  };

  const handleEdit = (id: string) => {
    setEditTeamId(id);
  };

  const handleDelete = (id: string) => {
    const team = teams?.find((t) => t.id === id);
    if (team) {
      setDeleteDialog({
        open: true,
        teamId: id,
        teamName: team.name,
      });
    }
  };

  const deleteTeamMutation = trpc.teams.delete.useMutation({
    onSuccess: () => {
      toast.success("Team deleted successfully");
      utils.teams.getAll.invalidate();
      setDeleteDialog({
        open: false,
        teamId: null,
        teamName: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete team");
    },
  });

  const confirmDelete = () => {
    if (deleteDialog.teamId) {
      deleteTeamMutation.mutate({ teamId: deleteDialog.teamId });
    }
  };

  if (isLoading) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-center py-12">
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive mb-4">{error.message || "Failed to load teams"}</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Manage Teams</h1>
        <p className="text-muted-foreground">
          Manage all teams, view their members, invites, and hosting subscriptions.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search teams by name, slug, or currency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {!teams || teams.length === 0 ? (
        <EmptyState
          title="No teams found"
          description="No teams have been created yet."
        />
      ) : filteredTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-semibold mb-2">No teams found</p>
          <p className="text-muted-foreground mb-4">
            No teams match your search query "{searchQuery}".
          </p>
          <Button
            variant="outline"
            onClick={() => setSearchQuery("")}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <TeamCardsList
          data={transformedTeams}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          cols={3}
        />
      )}

      {selectedTeamId && (
        <TeamViewDialog
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
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the team "{deleteDialog.teamName}"? This action cannot be undone and will delete all associated data including members, invites, and subscriptions.
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
                "Delete Team"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

