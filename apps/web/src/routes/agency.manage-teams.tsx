"use client";

import * as React from "react";
import { RefreshCw, Search, Plus, Building2, EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TeamViewSheet } from "./agency.manage-teams/_components/team-view-sheet";
import { EditTeamDialog } from "./agency.manage-teams/_components/edit-team-dialog";
import { CreateTeamDialog } from "./agency.manage-teams/_components/create-team-dialog";
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
import { z } from "zod";
import { teamSchema } from "./agency.manage-teams/_components/schema";
import { Badge } from "@/components/ui/badge";

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-lg font-semibold mb-2">{title}</p>
    <p className="text-muted-foreground mb-4">{description}</p>
  </div>
);

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
      captureEvent("organization_deleted");
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
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">{error.message || "Failed to load teams"}</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Manage Teams</h1>
          <p className="text-xs text-muted-foreground">
            Manage all teams, view their members, invites, and hosting subscriptions.
          </p>
        </div>

        <div className="mt-6">
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
                onClick={() => setCreateTeamOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Team
              </Button>
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
        </div>

        <div className="mt-6">
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
            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Team Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12 pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow
                      key={team.id}
                      className="cursor-pointer"
                      onClick={() => handleView(team.id)}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{team.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{team.slug}</TableCell>
                      <TableCell>{team.baseCurrency}</TableCell>
                      <TableCell>{team.memberCount ?? 0}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            team.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                              : ""
                          }
                        >
                          {team.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="pr-6">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <EllipsisVertical className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onSelect={() => handleEdit(team.id)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => handleDelete(team.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TooltipTrigger>
                            <TooltipContent>Actions</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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

