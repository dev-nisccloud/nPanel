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
  keywordFromItem,
  searchVolumeFromItem,
  type SeoProject,
} from "./seo-suite-utils";

interface CompetitorsTabProps {
  projectId: string;
  project: SeoProject;
}

export function CompetitorsTab({ projectId, project }: CompetitorsTabProps) {
  const { configured } = useCredentialsConfigured();
  const [competitor, setCompetitor] = React.useState(project.competitorDomains?.[0] ?? "");
  const [competitors, setCompetitors] = React.useState<unknown[]>([]);
  const [gapItems, setGapItems] = React.useState<unknown[]>([]);
  const [linkGapItems, setLinkGapItems] = React.useState<unknown[]>([]);

  const discover = trpc.seoSuite.competitorsDomain.useMutation({
    onSuccess: (data) => {
      const block = data.items;
      const items = asArray(
        getNested(block, "items") ?? (Array.isArray(block) ? block : asArray(block)),
      );
      setCompetitors(items);
      toast.success(`Found ${items.length} competitors`);
    },
    onError: (e) => toast.error(e.message || "Competitor discovery failed"),
  });

  const keywordGap = trpc.seoSuite.keywordGap.useMutation({
    onSuccess: (data) => {
      const items = asArray(getNested(data.items, "items") ?? data.items);
      setGapItems(items);
      toast.success(`Keyword gap: ${items.length} rows`);
    },
    onError: (e) => toast.error(e.message || "Keyword gap failed"),
  });

  const linkGap = trpc.seoSuite.linkGap.useMutation({
    onSuccess: (data) => {
      const items = asArray(getNested(data.items, "items") ?? data.items);
      setLinkGapItems(items);
      toast.success(`Link gap: ${items.length} rows`);
    },
    onError: (e) => toast.error(e.message || "Link gap failed"),
  });

  const guard = (fn: () => void) => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    fn();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <Button
          variant="outline"
          disabled={discover.isPending}
          onClick={() => guard(() => discover.mutate({ projectId }))}
        >
          {discover.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Discovering…
            </>
          ) : (
            "Discover competitors"
          )}
        </Button>
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <label className="text-xs text-muted-foreground">Competitor domain for gaps</label>
          <Input
            value={competitor}
            onChange={(e) => setCompetitor(e.target.value)}
            placeholder="competitor.com"
          />
        </div>
        <Button
          variant="outline"
          disabled={keywordGap.isPending || !competitor.trim()}
          onClick={() =>
            guard(() => keywordGap.mutate({ projectId, competitor: competitor.trim() }))
          }
        >
          Keyword gap
        </Button>
        <Button
          variant="outline"
          disabled={linkGap.isPending || !competitor.trim()}
          onClick={() =>
            guard(() =>
              linkGap.mutate({ projectId, competitors: [competitor.trim()] }),
            )
          }
        >
          Link gap
        </Button>
      </div>

      <Section title="Discovered competitors" empty="Run discover to find overlapping domains">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Domain</TableHead>
              <TableHead>Intersections</TableHead>
              <TableHead>Avg position</TableHead>
              <TableHead>ETV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.length === 0 ? (
              <EmptyRow cols={4} text="Run discover to find overlapping domains" />
            ) : (
              competitors.slice(0, 40).map((item, i) => {
                const r = asRecord(item);
                return (
                  <TableRow key={i}>
                    <TableCell className="pl-6 font-medium">
                      {String(r.domain ?? r.target ?? "—")}
                    </TableCell>
                    <TableCell>{formatNumber(r.intersections ?? r.keywords_count)}</TableCell>
                    <TableCell>{formatNumber(r.avg_position)}</TableCell>
                    <TableCell>
                      {formatNumber(getNested(r, "metrics.organic.etv") ?? r.etv)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Section>

      <Section title="Keyword gap" empty="Enter a competitor and run keyword gap">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Keyword</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Your pos</TableHead>
              <TableHead>Competitor pos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gapItems.length === 0 ? (
              <EmptyRow cols={4} text="Enter a competitor and run keyword gap" />
            ) : (
              gapItems.slice(0, 50).map((item, i) => {
                const r = asRecord(item);
                return (
                  <TableRow key={i}>
                    <TableCell className="pl-6 font-medium">
                      {keywordFromItem(item) ||
                        String(getNested(r, "keyword_data.keyword") ?? "—")}
                    </TableCell>
                    <TableCell>{formatNumber(searchVolumeFromItem(item))}</TableCell>
                    <TableCell>
                      {formatNumber(
                        getNested(r, "first_domain_serp_element.rank_absolute") ??
                          getNested(r, "intersection_result.1.rank_absolute"),
                      )}
                    </TableCell>
                    <TableCell>
                      {formatNumber(
                        getNested(r, "second_domain_serp_element.rank_absolute") ??
                          getNested(r, "intersection_result.2.rank_absolute"),
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Section>

      <Section title="Link gap" empty="Enter a competitor and run link gap">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Domain / URL</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Backlinks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linkGapItems.length === 0 ? (
              <EmptyRow cols={3} text="Enter a competitor and run link gap" />
            ) : (
              linkGapItems.slice(0, 50).map((item, i) => {
                const r = asRecord(item);
                return (
                  <TableRow key={i}>
                    <TableCell className="pl-6 font-medium max-w-md truncate">
                      {String(r.domain ?? r.url ?? r.target ?? "—")}
                    </TableCell>
                    <TableCell>{formatNumber(r.rank ?? r.domain_rank)}</TableCell>
                    <TableCell>{formatNumber(r.backlinks ?? r.referring_domains)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  empty?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">{children}</div>
    </div>
  );
}

function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="text-center py-8 text-muted-foreground">
        {text}
      </TableCell>
    </TableRow>
  );
}
