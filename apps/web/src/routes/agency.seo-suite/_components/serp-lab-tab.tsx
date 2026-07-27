"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  asArray,
  asRecord,
  CREDENTIALS_TOAST,
  formatNumber,
  getNested,
  type SeoProject,
} from "./seo-suite-utils";

interface SerpLabTabProps {
  projectId: string;
  project: SeoProject;
}

export function SerpLabTab({ projectId, project }: SerpLabTabProps) {
  const { configured } = useCredentialsConfigured();
  const [keyword, setKeyword] = React.useState("");
  const [result, setResult] = React.useState<unknown>(null);

  const serp = trpc.seoSuite.serpLive.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("SERP results loaded");
    },
    onError: (e) => toast.error(e.message || "SERP live failed"),
  });

  const items = asArray(getNested(result, "items") ?? result);
  const organic = items.filter((item) => asRecord(item).type === "organic");
  const features = Array.from(
    new Set(
      items
        .map((item) => String(asRecord(item).type ?? ""))
        .filter((t) => t && t !== "organic"),
    ),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Keyword ({project.locationName} · {project.languageCode})
          </label>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter keyword"
          />
        </div>
        <Button
          disabled={serp.isPending || !keyword.trim()}
          onClick={() => {
            if (!configured) {
              toast.error(CREDENTIALS_TOAST);
              return;
            }
            serp.mutate({ projectId, keyword: keyword.trim() });
          }}
        >
          {serp.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Running…
            </>
          ) : (
            "Run live SERP"
          )}
        </Button>
      </div>

      {features.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {features.map((f) => (
            <Badge key={f} variant="outline">
              {f}
            </Badge>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Domain</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organic.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Run a live SERP query to see organic results
                </TableCell>
              </TableRow>
            ) : (
              organic.slice(0, 20).map((item, i) => {
                const r = asRecord(item);
                return (
                  <TableRow key={i}>
                    <TableCell className="pl-6">
                      {formatNumber(r.rank_absolute ?? r.rank_group ?? i + 1)}
                    </TableCell>
                    <TableCell className="font-medium max-w-xs">
                      {String(r.title ?? "—")}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {String(r.url ?? "—")}
                    </TableCell>
                    <TableCell>{String(r.domain ?? "—")}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
