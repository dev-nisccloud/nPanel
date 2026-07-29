"use client";

import * as React from "react";
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

interface ContentMentionsTabProps {
  projectId: string;
  project: SeoProject;
}

export function ContentMentionsTab({ projectId, project }: ContentMentionsTabProps) {
  const { configured } = useCredentialsConfigured();
  const [keyword, setKeyword] = React.useState(project.name);
  const [searchItems, setSearchItems] = React.useState<unknown[]>([]);
  const [summary, setSummary] = React.useState<unknown>(null);

  const mentions = trpc.seoSuite.contentMentions.useMutation({
    onSuccess: (data) => {
      const searchBlock = asArray(data.search);
      const items = asArray(
        getNested(searchBlock[0], "items") ??
          (searchBlock.length ? searchBlock : getNested(data.search, "items")),
      );
      setSearchItems(items);
      setSummary(asArray(data.summary)[0] ?? data.summary);
      toast.success("Content mentions loaded");
    },
    onError: (e) => toast.error(e.message || "Content mentions failed"),
  });

  const summaryRec = asRecord(summary);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs text-muted-foreground">Keyword / brand</label>
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
        <Button
          disabled={mentions.isPending || !keyword.trim()}
          onClick={() => {
            if (!configured) {
              toast.error(CREDENTIALS_TOAST);
              return;
            }
            mentions.mutate({ projectId, keyword: keyword.trim() });
          }}
        >
          {mentions.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Searching…
            </>
          ) : (
            "Find mentions"
          )}
        </Button>
      </div>

      {summary != null && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi label="Total count" value={formatNumber(summaryRec.total_count ?? summaryRec.count)} />
          <Kpi
            label="Domains"
            value={formatNumber(summaryRec.domains_count ?? getNested(summaryRec, "domains"))}
          />
          <Kpi
            label="Sentiment"
            value={String(
              getNested(summaryRec, "sentiment_connotations.positive") != null
                ? `+${formatNumber(getNested(summaryRec, "sentiment_connotations.positive"))}`
                : "",
            )}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">URL</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Sentiment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Search for brand or topic mentions across the web
                </TableCell>
              </TableRow>
            ) : (
              searchItems.slice(0, 40).map((item, i) => {
                const r = asRecord(item);
                return (
                  <TableRow key={i}>
                    <TableCell className="pl-6 font-medium max-w-md truncate">
                      {String(r.url ?? getNested(r, "page_content.url") ?? "")}
                    </TableCell>
                    <TableCell>{String(r.domain ?? "")}</TableCell>
                    <TableCell>
                      {String(
                        getNested(r, "sentiment_connotations") != null
                          ? JSON.stringify(getNested(r, "sentiment_connotations"))
                          : (r.sentiment_connotation ?? ""),
                      )}
                    </TableCell>
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

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}
