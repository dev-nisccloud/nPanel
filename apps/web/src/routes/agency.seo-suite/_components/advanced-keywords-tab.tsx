"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface AdvancedKeywordsTabProps {
  projectId: string;
  project: SeoProject;
}

export function AdvancedKeywordsTab({ projectId }: AdvancedKeywordsTabProps) {
  const { configured } = useCredentialsConfigured();
  const utils = trpc.useUtils();
  const [intentKeywords, setIntentKeywords] = React.useState("");
  const [difficultyKeywords, setDifficultyKeywords] = React.useState("");
  const [clusterOpen, setClusterOpen] = React.useState(false);
  const [clusterName, setClusterName] = React.useState("");
  const [clusterPrimary, setClusterPrimary] = React.useState("");
  const [clusterKeywords, setClusterKeywords] = React.useState("");

  const bulkIntent = trpc.seoSuite.bulkKeywordIntent.useMutation({
    onSuccess: () => {
      toast.success("Intent analysis complete");
      setIntentKeywords("");
    },
    onError: (e) => toast.error(e.message || "Failed to analyze intent"),
  });

  const bulkDifficulty = trpc.seoSuite.bulkKeywordDifficulty.useMutation({
    onSuccess: () => {
      toast.success("Difficulty analysis complete");
      setDifficultyKeywords("");
    },
    onError: (e) => toast.error(e.message || "Failed to analyze difficulty"),
  });

  const topSearches = trpc.seoSuite.topSearches.useMutation({
    onError: (e) => toast.error(e.message || "Failed to fetch top searches"),
  });

  const createCluster = trpc.seoSuite.createKeywordCluster.useMutation({
    onSuccess: () => {
      toast.success("Keyword cluster created");
      setClusterOpen(false);
      setClusterName("");
      setClusterPrimary("");
      setClusterKeywords("");
      utils.seoSuite.listKeywordClusters.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Failed to create cluster"),
  });

  const clusters = trpc.seoSuite.listKeywordClusters.useQuery(
    { projectId },
    { staleTime: 60_000 },
  );

  const handleIntentAnalysis = () => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    const keywords = parseCommaList(intentKeywords);
    if (keywords.length === 0 || keywords.length > 100) {
      toast.error("Please enter 1-100 keywords (comma-separated)");
      return;
    }
    bulkIntent.mutate({ projectId, keywords });
  };

  const handleDifficultyAnalysis = () => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    const keywords = parseCommaList(difficultyKeywords);
    if (keywords.length === 0 || keywords.length > 1000) {
      toast.error("Please enter 1-1000 keywords (comma-separated)");
      return;
    }
    bulkDifficulty.mutate({ projectId, keywords });
  };

  const handleTopSearches = () => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    topSearches.mutate({ projectId, limit: 100 });
  };

  const handleCreateCluster = () => {
    if (!clusterName || !clusterPrimary || !clusterKeywords) {
      toast.error("Please fill all fields");
      return;
    }
    createCluster.mutate({
      projectId,
      name: clusterName,
      primaryKeyword: clusterPrimary,
      keywords: parseCommaList(clusterKeywords),
    });
  };

  if (!configured) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Configure DataForSEO credentials to use advanced keyword features
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Advanced Keyword Analysis</h2>
        <p className="text-xs text-muted-foreground">
          Analyze intent, difficulty, and organize keywords into clusters
        </p>
      </div>

      <Tabs defaultValue="intent">
        <TabsList>
          <TabsTrigger value="intent">Search Intent</TabsTrigger>
          <TabsTrigger value="difficulty">Difficulty</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="clusters">Clusters</TabsTrigger>
        </TabsList>

        <TabsContent value="intent" className="space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <label className="text-sm font-medium mb-2 block">
              Analyze Search Intent (1-100 keywords, comma-separated)
            </label>
            <Textarea
              placeholder="seo tools, keyword research software, best seo platform"
              value={intentKeywords}
              onChange={(e) => setIntentKeywords(e.target.value)}
              rows={3}
              className="mb-3"
            />
            <Button
              onClick={handleIntentAnalysis}
              disabled={bulkIntent.isPending}
              size="sm"
            >
              {bulkIntent.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Analyzing...
                </>
              ) : (
                "Analyze Intent"
              )}
            </Button>
          </div>

          {bulkIntent.data && (
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">Intent Analysis Results</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Intent</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((bulkIntent.data as any)?.[0]?.items || []).map(
                    (item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.keyword}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.intent === "informational"
                                ? "secondary"
                                : item.intent === "commercial"
                                  ? "default"
                                  : item.intent === "transactional"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {item.intent}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.intent_probability
                            ? `${(item.intent_probability * 100).toFixed(1)}%`
                            : ""}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="difficulty" className="space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <label className="text-sm font-medium mb-2 block">
              Analyze Keyword Difficulty (1-1000 keywords, comma-separated)
            </label>
            <Textarea
              placeholder="seo tools, keyword research, content marketing"
              value={difficultyKeywords}
              onChange={(e) => setDifficultyKeywords(e.target.value)}
              rows={3}
              className="mb-3"
            />
            <Button
              onClick={handleDifficultyAnalysis}
              disabled={bulkDifficulty.isPending}
              size="sm"
            >
              {bulkDifficulty.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Analyzing...
                </>
              ) : (
                "Analyze Difficulty"
              )}
            </Button>
          </div>

          {bulkDifficulty.data && (
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">Difficulty Scores</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>CPC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((bulkDifficulty.data as any)?.[0]?.items || []).map(
                    (item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.keyword}</TableCell>
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
                            {item.keyword_difficulty || 0}/100
                          </Badge>
                        </TableCell>
                        <TableCell>{formatNumber(item.search_volume)}</TableCell>
                        <TableCell>${item.cpc?.toFixed(2) || "0.00"}</TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <Button onClick={handleTopSearches} disabled={topSearches.isPending}>
              {topSearches.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Loading...
                </>
              ) : (
                "Fetch Top Trending Searches"
              )}
            </Button>
          </div>

          {topSearches.data && (
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">Trending Searches</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((topSearches.data as any)?.[0]?.items || []).map(
                    (item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.keyword}</TableCell>
                        <TableCell>{formatNumber(item.search_volume)}</TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="clusters" className="space-y-4">
          <Button onClick={() => setClusterOpen(true)}>Create Keyword Cluster</Button>

          {clusters.data && clusters.data.length > 0 ? (
            <div className="grid gap-4">
              {clusters.data.map((cluster) => (
                <div key={cluster.id} className="rounded-lg border bg-card p-4 shadow-sm">
                  <h3 className="text-sm font-semibold mb-2">{cluster.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Primary: {cluster.primaryKeyword}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {cluster.keywords.map((kw) => (
                      <Badge key={kw} variant="secondary">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No keyword clusters yet. Create one to organize related keywords.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={clusterOpen} onOpenChange={setClusterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Keyword Cluster</DialogTitle>
            <DialogDescription>
              Group related keywords together for better content organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Cluster Name</label>
              <Input
                placeholder="e.g., SEO Tools"
                value={clusterName}
                onChange={(e) => setClusterName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Primary Keyword</label>
              <Input
                placeholder="e.g., seo tools"
                value={clusterPrimary}
                onChange={(e) => setClusterPrimary(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Related Keywords (comma-separated)
              </label>
              <Textarea
                placeholder="seo software, seo platform, seo analyzer"
                value={clusterKeywords}
                onChange={(e) => setClusterKeywords(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClusterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCluster} disabled={createCluster.isPending}>
              {createCluster.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                "Create Cluster"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
