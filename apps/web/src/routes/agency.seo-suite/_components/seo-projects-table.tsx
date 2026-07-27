"use client";

import * as React from "react";
import { Search, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSeoProjects } from "./use-seo-projects";
import { CreateProjectSheet } from "./create-project-sheet";
import { CredentialsBanner } from "./credentials-banner";
import { formatDate } from "./seo-suite-utils";

function ProjectsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectsTableError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold">Failed to load projects</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {error.message || "An error occurred while fetching SEO projects."}
      </p>
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );
}

export function SeoProjectsTable() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data, isLoading, isError, error, refetch } = useSeoProjects(debouncedSearch);

  if (isLoading) {
    return <ProjectsTableSkeleton />;
  }

  if (isError) {
    return <ProjectsTableError error={error as Error} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <CredentialsBanner />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <Badge variant="outline" className="text-muted-foreground">
              {data.length} result{data.length === 1 ? "" : "s"}
            </Badge>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New project
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Project</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No SEO projects found
                </TableCell>
              </TableRow>
            ) : (
              data.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => navigate(`/agency/seo-suite/${project.id}`)}
                >
                  <TableCell className="pl-6">
                    <Link
                      to={`/agency/seo-suite/${project.id}`}
                      className="font-medium text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {project.primaryDomain}
                  </TableCell>
                  <TableCell className="text-sm">
                    {project.locationName}
                    <span className="text-muted-foreground"> · {project.languageCode}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(project.updatedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateProjectSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={(id) => navigate(`/agency/seo-suite/${id}`)}
      />
    </div>
  );
}
