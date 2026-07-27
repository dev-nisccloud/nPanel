"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { formatDate, type SeoProject } from "./seo-suite-utils";

interface SavedKeywordsTabProps {
  projectId: string;
  project: SeoProject;
}

export function SavedKeywordsTab({ projectId }: SavedKeywordsTabProps) {
  const utils = trpc.useUtils();
  const [listId, setListId] = React.useState<string | "all">("all");
  const [newListName, setNewListName] = React.useState("");

  const lists = trpc.seoSuite.listKeywordLists.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );

  const keywords = trpc.seoSuite.listSavedKeywords.useQuery(
    {
      projectId,
      listId: listId === "all" ? undefined : listId,
    },
    { staleTime: 30_000, refetchOnWindowFocus: false },
  );

  const createList = trpc.seoSuite.createKeywordList.useMutation({
    onSuccess: () => {
      toast.success("List created");
      setNewListName("");
      utils.seoSuite.listKeywordLists.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Failed to create list"),
  });

  const deleteKeyword = trpc.seoSuite.deleteSavedKeyword.useMutation({
    onSuccess: () => {
      toast.success("Keyword deleted");
      utils.seoSuite.listSavedKeywords.invalidate();
    },
    onError: (e) => toast.error(e.message || "Failed to delete keyword"),
  });

  if (lists.isLoading || keywords.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (lists.isError || keywords.isError) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          {(lists.error || keywords.error)?.message || "Failed to load saved keywords"}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            lists.refetch();
            keywords.refetch();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56 space-y-1.5">
          <label className="text-xs text-muted-foreground">List</label>
          <Select value={listId} onValueChange={(v) => setListId(v as string)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All lists</SelectItem>
              {(lists.data ?? []).map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[180px] space-y-1.5">
          <label className="text-xs text-muted-foreground">New list</label>
          <Input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="List name"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={createList.isPending || !newListName.trim()}
          onClick={() => createList.mutate({ projectId, name: newListName.trim() })}
        >
          {createList.isPending ? <Spinner className="h-4 w-4" /> : "Create list"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Keyword</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(keywords.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No saved keywords
                </TableCell>
              </TableRow>
            ) : (
              (keywords.data ?? []).map((kw) => (
                <TableRow key={kw.id}>
                  <TableCell className="pl-6 font-medium">{kw.keyword}</TableCell>
                  <TableCell className="text-muted-foreground">{kw.source}</TableCell>
                  <TableCell>{kw.status}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(kw.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deleteKeyword.isPending}
                      onClick={() => deleteKeyword.mutate({ id: kw.id, projectId })}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
