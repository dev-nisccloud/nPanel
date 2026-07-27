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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { useCredentialsConfigured } from "./credentials-banner";
import {
  CREDENTIALS_TOAST,
  formatNumber,
  parseCommaList,
  type SeoProject,
} from "./seo-suite-utils";

interface ContentStrategyTabProps {
  projectId: string;
  project: SeoProject;
}

export function ContentStrategyTab({ projectId, project }: ContentStrategyTabProps) {
  const { configured } = useCredentialsConfigured();
  const utils = trpc.useUtils();
  const [competitors, setCompetitors] = React.useState(
    project.competitorDomains?.join(", ") || "",
  );
  const [briefKeyword, setBriefKeyword] = React.useState("");

  const analyzeGaps = trpc.seoSuite.analyzeContentGaps.useMutation({
    onSuccess: () => toast.success("Content gap analysis complete"),
    onError: (e) => toast.error(e.message || "Failed to analyze gaps"),
  });

  const generateBrief = trpc.seoSuite.generateContentBrief.useMutation({
    onSuccess: () => {
      toast.success("Content brief generated");
      setBriefKeyword("");
      utils.seoSuite.listContentBriefs.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Failed to generate brief"),
  });

  const briefs = trpc.seoSuite.listContentBriefs.useQuery(
    { projectId },
    { staleTime: 60_000 },
  );

  const handleAnalyzeGaps = () => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    const competitorList = parseCommaList(competitors);
    if (competitorList.length === 0 || competitorList.length > 5) {
      toast.error("Please enter 1-5 competitor domains");
      return;
    }
    analyzeGaps.mutate({ projectId, competitors: competitorList });
  };

  const handleGenerateBrief = () => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    if (!briefKeyword) {
      toast.error("Please enter a keyword");
      return;
    }
    generateBrief.mutate({ projectId, keyword: briefKeyword });
  };

  if (!configured) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Configure DataForSEO credentials to use content strategy features
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Content Strategy</h2>
        <p className="text-xs text-muted-foreground">
          Find content gaps and generate SEO-optimized content briefs
        </p>
      </div>

      <Tabs defaultValue="gaps">
        <TabsList>
          <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
          <TabsTrigger value="briefs">Content Briefs</TabsTrigger>
        </TabsList>

        <TabsContent value="gaps" className="space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <label className="text-sm font-medium mb-2 block">
              Competitor Domains (1-5, comma-separated)
            </label>
            <Input
              placeholder="competitor1.com, competitor2.com"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              className="mb-3"
            />
            <Button
              onClick={handleAnalyzeGaps}
              disabled={analyzeGaps.isPending}
              size="sm"
            >
              {analyzeGaps.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Analyzing...
                </>
              ) : (
                "Analyze Content Gaps"
              )}
            </Button>
          </div>

          {analyzeGaps.data && (
            <div className="rounded-lg border bg-card shadow-sm">
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold">Content Gap Opportunities</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Keywords your competitors rank for that you don't
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Opportunity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((analyzeGaps.data as any)?.[0]?.items || [])
                    .slice(0, 50)
                    .map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.keyword}</TableCell>
                        <TableCell>{formatNumber(item.search_volume)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.keyword_difficulty > 70
                                ? "destructive"
                                : item.keyword_difficulty > 40
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {item.keyword_difficulty || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.search_volume > 1000 && item.keyword_difficulty < 40
                                ? "default"
                                : "outline"
                            }
                          >
                            {item.search_volume > 1000 && item.keyword_difficulty < 40
                              ? "High"
                              : "Medium"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="briefs" className="space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <label className="text-sm font-medium mb-2 block">
              Target Keyword
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., best seo tools"
                value={briefKeyword}
                onChange={(e) => setBriefKeyword(e.target.value)}
              />
              <Button
                onClick={handleGenerateBrief}
                disabled={generateBrief.isPending}
              >
                {generateBrief.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Generating...
                  </>
                ) : (
                  "Generate Brief"
                )}
              </Button>
            </div>
          </div>

          {briefs.data && briefs.data.length > 0 ? (
            <div className="space-y-4">
              {briefs.data.map((brief) => (
                <div key={brief.id} className="rounded-lg border bg-card p-6 shadow-sm">
                  <h3 className="text-sm font-semibold mb-2">{brief.keyword}</h3>
                  {brief.targetUrl && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Target: {brief.targetUrl}
                    </p>
                  )}
                  {brief.wordCount && (
                    <p className="text-sm mb-2">
                      Recommended word count: <strong>{brief.wordCount}</strong>
                    </p>
                  )}
                  {brief.headings && brief.headings.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-2">Suggested Headings:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {brief.headings.map((heading, i) => (
                          <li key={i}>{heading}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {brief.relatedKeywords && brief.relatedKeywords.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Related Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {brief.relatedKeywords.map((kw) => (
                          <Badge key={kw} variant="secondary">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No content briefs yet. Generate one to get started.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
