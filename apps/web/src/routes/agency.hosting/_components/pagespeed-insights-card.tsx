"use client";

import * as React from "react";
import { Gauge, RefreshCw, ExternalLink, Smartphone, Monitor, TrendingUp, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/utils/trpc";

interface PageSpeedInsightsCardProps {
  domainName: string;
}

function formatMetricValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  if (value < 1000) return `${Math.round(value)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 90) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBadgeVariant(score: number | null): "default" | "secondary" | "destructive" {
  if (score === null) return "secondary";
  if (score >= 90) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
}

function MetricItem({ label, value, score, displayValue }: { 
  label: string; 
  value: number | null; 
  score: number | null;
  displayValue?: string | null;
}) {
  const scoreColor = getScoreColor(score);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {score !== null && (
          <Badge variant={getScoreBadgeVariant(score)} className="text-xs">
            {score}
          </Badge>
        )}
      </div>
      <p className={`text-sm font-semibold ${scoreColor}`}>
        {displayValue || formatMetricValue(value)}
      </p>
    </div>
  );
}

function PageSpeedSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              PageSpeed Insights
            </CardTitle>
            <CardDescription>Website performance metrics</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

export function PageSpeedInsightsCard({ domainName }: PageSpeedInsightsCardProps) {
  const [strategy, setStrategy] = React.useState<'mobile' | 'desktop'>('mobile');
  const [forceRefreshMobile, setForceRefreshMobile] = React.useState(false);
  const [forceRefreshDesktop, setForceRefreshDesktop] = React.useState(false);

  const domainUrl = React.useMemo(() => {
    if (!domainName) return null;
    const normalizedInput = domainName.trim();
    if (!normalizedInput) return null;

    const candidate = /^https?:\/\//i.test(normalizedInput)
      ? normalizedInput
      : `https://${normalizedInput}`;

    try {
      const parsed = new URL(candidate);
      if (!parsed.hostname || parsed.hostname.includes(" ")) return null;
      return parsed.toString();
    } catch {
      return null;
    }
  }, [domainName]);

  // Separate queries for mobile and desktop - React Query will cache them separately
  const mobileQuery = trpc.pagespeedInsights.getPageSpeed.useQuery(
    {
      url: domainUrl || '',
      strategy: 'mobile',
      forceRefresh: forceRefreshMobile,
    },
    {
      enabled: !!domainUrl && strategy === 'mobile',
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 1,
    }
  );

  const desktopQuery = trpc.pagespeedInsights.getPageSpeed.useQuery(
    {
      url: domainUrl || '',
      strategy: 'desktop',
      forceRefresh: forceRefreshDesktop,
    },
    {
      enabled: !!domainUrl && strategy === 'desktop',
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 1,
    }
  );

  // Get the active query based on current strategy
  const activeQuery = strategy === 'mobile' ? mobileQuery : desktopQuery;
  const { data, isLoading, error, refetch } = activeQuery;

  // Handle errors using useEffect - check both queries for errors
  React.useEffect(() => {
    const currentError = mobileQuery.error || desktopQuery.error;
    if (currentError) {
      if (currentError.data?.code === 'TOO_MANY_REQUESTS') {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (currentError.data?.code === 'UNAUTHORIZED') {
        toast.error("PageSpeed Insights API authentication failed.");
      } else {
        toast.error("Failed to fetch PageSpeed Insights data.");
      }
    }
  }, [mobileQuery.error, desktopQuery.error]);

  const handleRefresh = React.useCallback(() => {
    if (strategy === 'mobile') {
      setForceRefreshMobile(true);
      mobileQuery.refetch().finally(() => {
        setForceRefreshMobile(false);
      });
    } else {
      setForceRefreshDesktop(true);
      desktopQuery.refetch().finally(() => {
        setForceRefreshDesktop(false);
      });
    }
  }, [strategy, mobileQuery, desktopQuery]);

  const getGooglePageSpeedUrl = React.useCallback(() => {
    if (!domainUrl) return '';
    return `https://pagespeed.web.dev/report?url=${encodeURIComponent(domainUrl)}`;
  }, [domainUrl]);

  if (!domainUrl) {
    return null;
  }

  // Show full skeleton only on initial load (no data for either strategy)
  const hasAnyData = mobileQuery.data || desktopQuery.data;
  if (isLoading && !hasAnyData) {
    return <PageSpeedSkeleton />;
  }

  // Show error only if we have no data at all
  if (error && !hasAnyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            PageSpeed Insights
          </CardTitle>
          <CardDescription>Website performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              {error.message || "Failed to load PageSpeed Insights data"}
            </p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const performanceScore = data?.performance?.score ?? null;
  const metrics = data?.metrics;
  const isCached = data?.cached ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              PageSpeed Insights
            </CardTitle>
            <CardDescription>
              Discover what your real users are experiencing
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading || forceRefreshMobile || forceRefreshDesktop}
              title="Refresh PageSpeed data"
            >
              <RefreshCw className={`h-4 w-4 ${(isLoading || forceRefreshMobile || forceRefreshDesktop) ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(getGooglePageSpeedUrl(), '_blank', 'noopener,noreferrer')}
              title="View full report on Google PageSpeed Insights"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Strategy Toggle - same design as hosting Overview/DNS/Mail tabs */}
        <Tabs value={strategy} onValueChange={(value) => setStrategy(value as 'mobile' | 'desktop')}>
          <TabsList className="flex w-full flex-wrap gap-3 @sm/main:flex-nowrap @sm/main:grid @sm/main:grid-cols-2 h-auto p-0 bg-transparent">
            <TabsTrigger
              value="mobile"
              className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
            >
              <div className="flex items-center justify-between w-full">
                <Smartphone className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                {mobileQuery.isLoading && mobileQuery.isFetching ? (
                  <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col items-start gap-1 w-full">
                <span className="font-semibold text-sm">Mobile</span>
                <span className="text-xs text-muted-foreground">Performance</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="desktop"
              className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
            >
              <div className="flex items-center justify-between w-full">
                <Monitor className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                {desktopQuery.isLoading && desktopQuery.isFetching ? (
                  <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col items-start gap-1 w-full">
                <span className="font-semibold text-sm">Desktop</span>
                <span className="text-xs text-muted-foreground">Performance</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading state for content when switching tabs */}
        {isLoading && !data && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {/* Performance Score - Only show when data is loaded */}
        {!isLoading && performanceScore !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Performance Score</p>
              <Badge variant={getScoreBadgeVariant(performanceScore)} className="text-base px-3 py-1">
                {performanceScore}
              </Badge>
            </div>
            <Progress 
              value={performanceScore} 
              className="h-3"
            />
            <p className="text-xs text-muted-foreground">
              {performanceScore >= 90 ? "Excellent" : 
               performanceScore >= 50 ? "Needs Improvement" : 
               "Poor"}
            </p>
          </div>
        )}

        {/* Core Web Vitals - Only show when data is loaded */}
        {!isLoading && metrics && (
          <div className="space-y-4">
            <p className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Core Web Vitals
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.lcp && (
                <MetricItem
                  label="LCP (Largest Contentful Paint)"
                  value={metrics.lcp.value}
                  score={metrics.lcp.score}
                  displayValue={metrics.lcp.displayValue}
                />
              )}
              {metrics.fid && (
                <MetricItem
                  label="FID (First Input Delay)"
                  value={metrics.fid.value}
                  score={metrics.fid.score}
                  displayValue={metrics.fid.displayValue}
                />
              )}
              {metrics.cls && (
                <MetricItem
                  label="CLS (Cumulative Layout Shift)"
                  value={metrics.cls.value}
                  score={metrics.cls.score}
                  displayValue={metrics.cls.displayValue}
                />
              )}
            </div>
          </div>
        )}

        {/* Additional Metrics - Only show when data is loaded */}
        {!isLoading && (metrics?.fcp || metrics?.tbt || metrics?.si || metrics?.tti) && (
          <div className="space-y-4">
            <p className="text-sm font-semibold">Additional Metrics</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.fcp && (
                <MetricItem
                  label="FCP (First Contentful Paint)"
                  value={metrics.fcp.value}
                  score={metrics.fcp.score}
                  displayValue={metrics.fcp.displayValue}
                />
              )}
              {metrics.tbt && (
                <MetricItem
                  label="TBT (Total Blocking Time)"
                  value={metrics.tbt.value}
                  score={metrics.tbt.score}
                  displayValue={metrics.tbt.displayValue}
                />
              )}
              {metrics.si && (
                <MetricItem
                  label="Speed Index"
                  value={metrics.si.value}
                  score={metrics.si.score}
                  displayValue={metrics.si.displayValue}
                />
              )}
              {metrics.tti && (
                <MetricItem
                  label="TTI (Time to Interactive)"
                  value={metrics.tti.value}
                  score={metrics.tti.score}
                  displayValue={metrics.tti.displayValue}
                />
              )}
            </div>
          </div>
        )}

        {/* Category Scores - Circular Progress Indicators */}
        {!isLoading && data?.performance && (
          <div className="space-y-4">
            <p className="text-sm font-semibold">Category Scores</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Performance Score */}
              <div className="flex flex-col items-center space-y-2">
                {(() => {
                  const score = data.performance.score ?? null;
                  if (score === null || score === undefined) {
                    return (
                      <>
                        <div className="relative flex-shrink-0">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="35"
                              fill="none"
                              stroke="rgb(229 231 235)"
                              strokeWidth="8"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-muted-foreground">N/A</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Performance</p>
                      </>
                    );
                  }
                    const percentage = score;
                    const radius = 35;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (percentage / 100) * circumference;
                    
                    // Color based on score
                    let circleColor = "rgb(34 197 94)"; // Green
                    let bgColor = "rgb(220 252 231)"; // Light green
                    let textColor = "text-green-600";
                    
                    if (score < 50) {
                      circleColor = "rgb(239 68 68)"; // Red
                      bgColor = "rgb(254 226 226)"; // Light red
                      textColor = "text-red-600";
                    } else if (score < 90) {
                      circleColor = "rgb(234 179 8)"; // Yellow/Orange
                      bgColor = "rgb(254 249 195)"; // Light yellow
                      textColor = "text-yellow-600";
                    }
                    
                    return (
                      <>
                        <div className="relative flex-shrink-0">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke={bgColor}
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke={circleColor}
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-lg font-bold ${textColor}`}>{score}</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Performance</p>
                      </>
                    );
                  })()}
                </div>

              {/* Accessibility Score */}
              <div className="flex flex-col items-center space-y-2">
                {(() => {
                  const score = data.performance.accessibility ?? null;
                  if (score === null || score === undefined) {
                    return (
                      <>
                        <div className="relative flex-shrink-0">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="35"
                              fill="none"
                              stroke="rgb(229 231 235)"
                              strokeWidth="8"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-muted-foreground">N/A</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Accessibility</p>
                      </>
                    );
                  }
                    const percentage = score;
                    const radius = 35;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (percentage / 100) * circumference;
                    
                    // Color based on score
                    let circleColor = "rgb(34 197 94)"; // Green
                    let bgColor = "rgb(220 252 231)"; // Light green
                    let textColor = "text-green-600";
                    
                    if (score < 50) {
                      circleColor = "rgb(239 68 68)"; // Red
                      bgColor = "rgb(254 226 226)"; // Light red
                      textColor = "text-red-600";
                    } else if (score < 90) {
                      circleColor = "rgb(234 179 8)"; // Yellow/Orange
                      bgColor = "rgb(254 249 195)"; // Light yellow
                      textColor = "text-yellow-600";
                    }
                    
                    return (
                      <>
                        <div className="relative flex-shrink-0">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke={bgColor}
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke={circleColor}
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-lg font-bold ${textColor}`}>{score}</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Accessibility</p>
                      </>
                    );
                  })()}
                </div>

              {/* Best Practices Score */}
              <div className="flex flex-col items-center space-y-2">
                {(() => {
                  const score = data.performance.bestPractices ?? null;
                  if (score === null || score === undefined) {
                    return (
                      <>
                        <div className="relative flex-shrink-0">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="35"
                              fill="none"
                              stroke="rgb(229 231 235)"
                              strokeWidth="8"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-muted-foreground">N/A</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Best Practices</p>
                      </>
                    );
                  }
                    const percentage = score;
                    const radius = 35;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (percentage / 100) * circumference;
                    
                    // Color based on score
                    let circleColor = "rgb(34 197 94)"; // Green
                    let bgColor = "rgb(220 252 231)"; // Light green
                    let textColor = "text-green-600";
                    
                    if (score < 50) {
                      circleColor = "rgb(239 68 68)"; // Red
                      bgColor = "rgb(254 226 226)"; // Light red
                      textColor = "text-red-600";
                    } else if (score < 90) {
                      circleColor = "rgb(234 179 8)"; // Yellow/Orange
                      bgColor = "rgb(254 249 195)"; // Light yellow
                      textColor = "text-yellow-600";
                    }
                    
                    return (
                      <>
                        <div className="relative flex-shrink-0">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke={bgColor}
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke={circleColor}
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-lg font-bold ${textColor}`}>{score}</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Best Practices</p>
                      </>
                    );
                  })()}
                </div>

              {/* SEO Score */}
              <div className="flex flex-col items-center space-y-2">
                {(() => {
                  const score = data.performance.seo ?? null;
                  if (score === null || score === undefined) {
                    return (
                      <>
                        <div className="relative flex-shrink-0">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="35"
                              fill="none"
                              stroke="rgb(229 231 235)"
                              strokeWidth="8"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-muted-foreground">N/A</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">SEO</p>
                      </>
                    );
                  }
                    const percentage = score;
                    const radius = 35;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (percentage / 100) * circumference;
                    
                    // Color based on score
                    let circleColor = "rgb(34 197 94)"; // Green
                    let bgColor = "rgb(220 252 231)"; // Light green
                    let textColor = "text-green-600";
                    
                    if (score < 50) {
                      circleColor = "rgb(239 68 68)"; // Red
                      bgColor = "rgb(254 226 226)"; // Light red
                      textColor = "text-red-600";
                    } else if (score < 90) {
                      circleColor = "rgb(234 179 8)"; // Yellow/Orange
                      bgColor = "rgb(254 249 195)"; // Light yellow
                      textColor = "text-yellow-600";
                    }
                    
                    return (
                      <>
                        <div className="relative flex-shrink-0">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke={bgColor}
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke={circleColor}
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-lg font-bold ${textColor}`}>{score}</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">SEO</p>
                      </>
                    );
                  })()}
                </div>
            </div>
          </div>
        )}

        {/* Timestamp - Only show when data is loaded */}
        {!isLoading && data?.timestamp && (
          <p className="text-xs text-muted-foreground text-center">
            Last tested: {new Date(data.timestamp).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
