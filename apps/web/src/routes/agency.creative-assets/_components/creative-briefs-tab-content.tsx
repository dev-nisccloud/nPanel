"use client";

import * as React from "react";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
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

import { CreativeBriefsListing } from "@/routes/agency.creative-briefs/_components/creative-briefs-listing";
import { CreateBriefSheet } from "@/routes/agency.creative-briefs/_components/create-brief-sheet";
import { EditBriefSheet } from "@/routes/agency.creative-briefs/_components/edit-brief-sheet";
import { creativeBriefSchema } from "@/routes/agency.creative-briefs/_components/schema";

export function CreativeBriefsTabContent() {
  const [isCreateBriefOpen, setIsCreateBriefOpen] = React.useState(false);
  const [isEditBriefOpen, setIsEditBriefOpen] = React.useState(false);
  const [editingBrief, setEditingBrief] = React.useState<z.infer<typeof creativeBriefSchema> | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [briefToDelete, setBriefToDelete] = React.useState<string | null>(null);

  // Fetch creative briefs
  const { data: briefs, isLoading, isError, error, refetch } = trpc.creativeBriefs.getAll.useQuery();

  const handleCreateBrief = () => {
    refetch();
    toast.success("Creative brief created successfully!");
  };

  const handleEdit = (id: string) => {
    const brief = briefs?.find((b) => b.id === id);
    if (brief) {
      const parsedBrief = creativeBriefSchema.parse(brief);
      setEditingBrief(parsedBrief);
      setIsEditBriefOpen(true);
    }
  };

  const handleEditBrief = () => {
    refetch();
    toast.success("Creative brief updated successfully!");
  };

  const deleteMutation = trpc.creativeBriefs.delete.useMutation({
    onMutate: (variables) => {
      toast.loading("Deleting brief...", {
        id: `delete-${variables.id}`,
        description: "Please wait while we delete the brief",
      });
    },
    onSuccess: (data, variables) => {
      toast.success("Brief deleted successfully", {
        id: `delete-${variables.id}`,
      });
      setDeleteDialogOpen(false);
      setBriefToDelete(null);
      refetch();
    },
    onError: (error, variables) => {
      toast.error("Failed to delete brief", {
        id: `delete-${variables.id}`,
        description: error.message,
      });
    },
  });

  const handleDelete = (id: string) => {
    setBriefToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (briefToDelete) {
      deleteMutation.mutate({ id: briefToDelete });
    }
  };

  return (
    <>
      <CreativeBriefsListing
        data={(briefs || []).map((brief) => creativeBriefSchema.parse(brief))}
        isLoading={isLoading}
        isError={isError}
        error={error ? new Error(error.message || "An error occurred") : undefined}
        onRetry={() => refetch()}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateBrief={() => setIsCreateBriefOpen(true)}
      />
      <CreateBriefSheet
        open={isCreateBriefOpen}
        onOpenChange={setIsCreateBriefOpen}
        onCreateBrief={handleCreateBrief}
      />
      <EditBriefSheet
        open={isEditBriefOpen}
        onOpenChange={(open) => {
          setIsEditBriefOpen(open);
          if (!open) {
            setEditingBrief(null);
          }
        }}
        brief={editingBrief}
        onEditBrief={handleEditBrief}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Creative Brief</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this creative brief? This action cannot be undone and will permanently remove the brief and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              onClick={() => {
                setDeleteDialogOpen(false);
                setBriefToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

