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
import { CREDENTIALS_TOAST, formatNumber, type SeoProject } from "./seo-suite-utils";

interface CompetitorIntelligenceTabProps {
  projectId: string;
  project: SeoProject;
}

export function CompetitorIntelligenceTab({ projectId, project }: CompetitorIntelligenceTabProps) {
  const { configured } = useCredentialsConfigured();
  const [competitor, setCompetitor] = React.useState("");
  const [subdomainTarget, setSubdomainTarget] = React.useState(project.primaryDomain);

  const snapshot = trpc.seoSuite.competitorSnapshot.useMutation({
    onSuccess: () => {
      toast.success("Competitor snapshot captured");
      setCompetitor("");
    },
    onError: (e) => toast.error(e.message || "Failed to capture snapshot"),
  });

  const subdomains = trpc.seoSuite.domainSubdomains.useMutation({
    onError: (e) => toast.error(e.message || "Failed to fetch subdomains"),
  });

  const trafficEst = trpc.seoSuite.trafficEstimation.useMutation({
    onError: (e) => toast.error(e.message || "Failed to estimate traffic"),
  });

  if (!configured) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Configure DataForSEO credentials to use competitor intelligence
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Competitor Intelligence</h2>
        <p className="text-xs text-muted-foreground">
          Deep dive into competitor performance and strategies
        </p>
      </div>

      <Tabs defaultValue="snapshot">
        <TabsList>
          <TabsTrigger value="snapshot">Competitor Snapshot</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Estimation</TabsTrigger>
          <TabsTrigger value="subdomains">Subdomains</TabsTrigger>
        </TabsList>

        <TabsContent value="snapshot" className="space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <label className="text-sm font-medium mb-2 block">Competitor Domain</label>
            <div className="flex gap-2">
              <Input
                placeholder="competitor.com"
                value={competitor}
                onChange={(e) => setCompetitor(e.target.value)}
              />
              <Button
                onClick={() => {
                  if (!configured) {
                    toast.error(CREDENTIALS_TOAST);
                    return;
                  }
                  if (!competitor) {
                    toast.error("Please enter a domain");
                    return;
                  }
                  snapshot.mutate({ projectId, competitor });
                }}
                disabled={snapshot.isPending}
              >
                {snapshot.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
            </div>
          </div>

          {snapshot.data && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Organic Traffic",
                    value: (snapshot.data.overview as any)?.[0]?.items?.[0]?.metrics?.organic?.etv,
                  },
                  {
                    label: "Organic Keywords",
                    value: (snapshot.data.overview as any)?.[0]?.items?.[0]?.metrics?.organic?.count,
                  },
                  {
                    label: "Paid Traffic",
                    value: (snapshot.data.overview as any)?.[0]?.items?.[0]?.metrics?.paid?.etv,
                  },
                  {
                    label: "Paid Keywords",
                    value: (snapshot.data.overview as any)?.[0]?.items?.[0]?.metrics?.paid?.count,
                  },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight">
                      {formatNumber(kpi.value)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border bg-card shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-semibold">Top Ranking Keywords</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {((snapshot.data.ranked as any)?.[0]?.items || [])
                      .slice(0, 20)
                      .map((item: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {item.keyword || item.keyword_data?.keyword}
                          </TableCell>
                          <TableCell>
                            {item.ranked_serp_element?.serp_item?.rank_absolute || "—"}
                          </TableCell>
                          <TableCell>
                            {formatNumber(
                              item.keyword_data?.keyword_info?.search_volume,
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <Button
              onClick={() => {
                if (!configured) {
                  toast.error(CREDENTIALS_TOAST);
                  return;
                }
                const targets = [project.primaryDomain, ...project.competitorDomains];
                if (targets.length === 0) {
                  toast.error("Add competitor domains to your project first");
                  return;
                }
                trafficEst.mutate({ projectId, targets: targets.slice(0, 10) });
              }}
              disabled={trafficEst.isPending}
            >
              {trafficEst.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Estimating...
                </>
              ) : (
                "Estimate Traffic (You + Competitors)"
              )}
            </Button>
          </div>

          {trafficEst.data && (
            <div className="rounded-lg border bg-card shadow-sm">
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold">Traffic Comparison</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Est. Traffic</TableHead>
                    <TableHead>Keywords</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((trafficEst.data as any)?.[0]?.items || []).map(
                    (item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.target}</TableCell>
                        <TableCell>
                          {formatNumber(item.metrics?.organic?.etv)}
                        </TableCell>
                        <TableCell>
                          {formatNumber(item.metrics?.organic?.count)}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subdomains" className="space-y-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <label className="text-sm font-medium mb-2 block">Target Domain</label>
            <div className="flex gap-2">
              <Input
                placeholder="example.com"
                value={subdomainTarget}
                onChange={(e) => setSubdomainTarget(e.target.value)}
              />
              <Button
                onClick={() => {
                  if (!configured) {
                    toast.error(CREDENTIALS_TOAST);
                    return;
                  }
                  subdomains.mutate({ projectId, target: subdomainTarget });
                }}
                disabled={subdomains.isPending}
              >
                {subdomains.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Fetching...
                  </>
                ) : (
                  "Fetch Subdomains"
                )}
              </Button>
            </div>
          </div>

          {subdomains.data && (
            <div className="rounded-lg border bg-card shadow-sm">
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold">Subdomain Performance</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subdomain</TableHead>
                    <TableHead>Traffic</TableHead>
                    <TableHead>Keywords</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((subdomains.data as any)?.[0]?.items || []).map(
                    (item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.subdomain}</TableCell>
                        <TableCell>
                          {formatNumber(item.metrics?.organic?.etv)}
                        </TableCell>
                        <TableCell>
                          {formatNumber(item.metrics?.organic?.count)}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
