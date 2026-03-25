"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { 
  AlertTriangle, 
  CopyIcon, 
  FileIcon, 
  Loader, 
  MoreHorizontal, 
  Search,
  Trash
} from "lucide-react";

import { useGetProjects } from "../_api/use-get-projects";
import { useDeleteProject } from "../_api/use-delete-project";
import { useDuplicateProject } from "../_api/use-duplicate-project";

import {
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Table,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";

export const ProjectsSection = () => {
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this project.",
  );
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const duplicateMutation = useDuplicateProject();
  const removeMutation = useDeleteProject();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Agency users don't use teamId
  const teamId = undefined;

  // Reset loading state when pathname changes (navigation completed)
  useEffect(() => {
    if (pathname?.includes("/editor/")) {
      setLoadingProjectId(null);
    }
  }, [pathname]);

  const handleProjectClick = (projectId: string) => {
    // Prevent clicking if another project is loading
    if (loadingProjectId) {
      return;
    }
    
    setLoadingProjectId(projectId);
    navigate(`/agency/gen-ai/image-gen-studio/editor/${projectId}`);
  };

  const onCopy = (id: string) => {
    duplicateMutation.mutate({ id });
  };

  const onDelete = async (id: string) => {
    const ok = await confirm();

    if (ok) {
      removeMutation.mutate({ id });
    }
  };

  const {
    data,
    status,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useGetProjects({ teamId });

  if (status === "pending") {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          Recent projects
        </h3>
        <div className="flex flex-col gap-y-4 items-center justify-center h-32">
          <Loader className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          Recent projects
        </h3>
        <div className="flex flex-col gap-y-4 items-center justify-center h-32">
          <AlertTriangle className="size-6 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            Failed to load projects
          </p>
        </div>
      </div>
    )
  }

  if (
    !data.pages.length ||
    !data.pages[0].data.length
  ) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          Recent projects
        </h3>
        <div className="flex flex-col gap-y-4 items-center justify-center h-32">
          <Search className="size-6 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            No projects found
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4"> 
      <ConfirmDialog />
      <h3 className="font-semibold text-lg">
        Recent projects
      </h3>
      <Table>
        <TableBody>
          {data.pages.map((group: { data: Array<{ id: string; name: string; width: number; height: number; updatedAt: Date | string }>; nextPage: number | null }, i: number) => (
            <React.Fragment key={i}>
              {group.data.map((project: { id: string; name: string; width: number; height: number; updatedAt: Date | string }) => {
                const isLoading = loadingProjectId === project.id;
                const isDisabled = loadingProjectId !== null && !isLoading;
                
                return (
                <TableRow key={project.id}>
                  <TableCell
                      onClick={() => !isDisabled && handleProjectClick(project.id)}
                      className={`font-medium flex items-center gap-x-2 ${
                        isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                      }`}
                  >
                    <FileIcon className="size-6" />
                    {project.name}
                  </TableCell>
                  <TableCell
                      onClick={() => !isDisabled && handleProjectClick(project.id)}
                      className={`hidden md:table-cell ${
                        isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                      }`}
                  >
                    {project.width} x {project.height} px
                  </TableCell>
                  <TableCell
                      onClick={() => !isDisabled && handleProjectClick(project.id)}
                      className={`hidden md:table-cell ${
                        isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                      }`}
                  >
                    {formatDistanceToNow(project.updatedAt, {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="flex items-center justify-end">
                      {isLoading ? (
                        <div className="flex items-center justify-center w-8 h-8">
                          <Loader className="size-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                              disabled={isDisabled}
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-60">
                        <DropdownMenuItem
                          className="h-10 cursor-pointer"
                              disabled={duplicateMutation.isPending || isDisabled}
                          onClick={() => onCopy(project.id)}
                        >
                          <CopyIcon className="size-4 mr-2" />
                          Make a copy
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="h-10 cursor-pointer"
                              disabled={removeMutation.isPending || isDisabled}
                          onClick={() => onDelete(project.id)}
                        >
                          <Trash className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                      )}
                  </TableCell>
                </TableRow>
                );
              })}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      {hasNextPage && (
        <div className="w-full flex items-center justify-center pt-4">
          <Button
            variant="ghost"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
};
