"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { useCredentialsConfigured } from "./credentials-banner";
import { KeywordOverviewSheet } from "./keyword-overview-sheet";
import {
  asArray,
  competitionFromItem,
  cpcFromItem,
  CREDENTIALS_TOAST,
  formatNumber,
  keywordFromItem,
  searchVolumeFromItem,
  type SeoProject,
} from "./seo-suite-utils";

interface KeywordResearchTabProps {
  projectId: string;
  project: SeoProject;
}

type Mode = "ideas" | "suggestions" | "related" | "for_site";

export function KeywordResearchTab({ projectId, project }: KeywordResearchTabProps) {
  const { configured } = useCredentialsConfigured();
  const [seed, setSeed] = React.useState(project.primaryDomain);
  const [mode, setMode] = React.useState<Mode>("ideas");
  const [items, setItems] = React.useState<unknown[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [overviewKeyword, setOverviewKeyword] = React.useState<string | null>(null);

  const lists = trpc.seoSuite.listKeywordLists.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );

  const research = trpc.seoSuite.keywordResearch.useMutation({
    onSuccess: (data) => {
      const rows = asArray(data.items);
      setItems(rows);
      setSelected(new Set());
      toast.success(`Found ${rows.length} keywords`);
    },
    onError: (e) => toast.error(e.message || "Keyword research failed"),
  });

  const saveKeywords = trpc.seoSuite.saveKeywords.useMutation({
    onSuccess: (res) => {
      toast.success(`Saved ${res.count} keyword(s)`);
      setSelected(new Set());
    },
    onError: (e) => toast.error(e.message || "Failed to save keywords"),
  });

  const run = () => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    const seeds = seed
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!seeds.length) {
      toast.error("Enter at least one seed keyword or domain");
      return;
    }
    research.mutate({ projectId, mode, seeds });
  };

  const toggle = (kw: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(kw)) next.delete(kw);
      else next.add(kw);
      return next;
    });
  };

  const saveSelected = () => {
    if (!selected.size) {
      toast.error("Select keywords to save");
      return;
    }
    const defaultListId = lists.data?.[0]?.id;
    saveKeywords.mutate({
      projectId,
      listId: defaultListId,
      keywords: Array.from(selected),
      source: `research:${mode}`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs text-muted-foreground">Seed keywords / domain</label>
          <Input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="seed keyword or domain"
          />
        </div>
        <div className="w-full sm:w-48 space-y-1.5">
          <label className="text-xs text-muted-foreground">Mode</label>
          <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ideas">Ideas</SelectItem>
              <SelectItem value="suggestions">Suggestions</SelectItem>
              <SelectItem value="related">Related</SelectItem>
              <SelectItem value="for_site">For site</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={run} disabled={research.isPending}>
          {research.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Running…
            </>
          ) : (
            "Run research"
          )}
        </Button>
        <Button
          variant="outline"
          onClick={saveSelected}
          disabled={saveKeywords.isPending || selected.size === 0}
        >
          Save selected ({selected.size})
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-6" />
              <TableHead>Keyword</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Competition</TableHead>
              <TableHead>CPC</TableHead>
              <TableHead className="w-[100px]">Overview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Run research to see keyword ideas
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => {
                const kw = keywordFromItem(item) || `row-${idx}`;
                return (
                  <TableRow key={`${kw}-${idx}`}>
                    <TableCell className="pl-6">
                      <Checkbox
                        checked={selected.has(kw)}
                        onCheckedChange={() => toggle(kw)}
                        disabled={!keywordFromItem(item)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{keywordFromItem(item) || "—"}</TableCell>
                    <TableCell>{formatNumber(searchVolumeFromItem(item))}</TableCell>
                    <TableCell>{formatNumber(competitionFromItem(item))}</TableCell>
                    <TableCell>{formatNumber(cpcFromItem(item))}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!keywordFromItem(item)}
                        onClick={() => {
                          if (!configured) {
                            toast.error(CREDENTIALS_TOAST);
                            return;
                          }
                          setOverviewKeyword(keywordFromItem(item));
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <KeywordOverviewSheet
        open={!!overviewKeyword}
        onOpenChange={(open) => !open && setOverviewKeyword(null)}
        projectId={projectId}
        keyword={overviewKeyword ?? ""}
      />
    </div>
  );
}
