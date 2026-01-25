"use client";

import * as React from "react";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
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

import { CreativeBriefsListing } from "./_components/creative-briefs-listing";
import { CreateBriefSheet } from "./_components/create-brief-sheet";
import { EditBriefSheet } from "./_components/edit-brief-sheet";
import { creativeBriefSchema } from "./_components/schema";

export default function CreativeBriefsPage() {
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
      // Parse the brief through the schema to ensure proper types
      const parsedBrief = creativeBriefSchema.parse(brief);
      setEditingBrief(parsedBrief);
      setIsEditBriefOpen(true);
    }
  };

  const handleEditBrief = () => {
    refetch();
    toast.success("Creative brief updated successfully!");
  };

  // Delete mutation
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
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Creative Briefs</h1>
          <p className="text-muted-foreground">
            Create and manage creative briefs for your design projects.
          </p>
        </div>

        <div className="mt-6">
          <CreativeBriefsListing 
        data={(briefs || []).map(brief => creativeBriefSchema.parse(brief))}
        isLoading={isLoading}
        isError={isError}
        error={error ? new Error(error.message || "An error occurred") : undefined}
        onRetry={() => refetch()}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateBrief={() => setIsCreateBriefOpen(true)}
          />
        </div>
      </div>
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
      {/* Delete Confirmation Dialog */}
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
    </div>
  );
}
