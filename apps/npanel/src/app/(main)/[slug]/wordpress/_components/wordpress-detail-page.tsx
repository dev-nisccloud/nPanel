"use client";

import * as React from "react";
import { ArrowLeft, LayoutDashboard, ChevronRight, Lock, Code, FileText, Settings } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useParams, useSearchParams } from "next/navigation";
import { WordPressOverview } from "./wordpress-overview";
import { WordPressSiteCredentials } from "./wordpress-site-credentials";
import { WordPressPlugins } from "./wordpress-plugins";
import { WordPressThemes } from "./wordpress-themes";
import { WordPressTools } from "./wordpress-tools";
import { useWordPressDetailBatched } from "./use-wordpress-detail-batched";

interface WordPressDetailPageProps {
  installationId: string;
}

// Loading skeleton component
function WordPressDetailSkeleton() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-20" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

// Error component
function WordPressDetailError({ error, onRetry, backHref }: { error: Error; onRetry: () => void; backHref: string }) {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={backHref}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Error Loading Installation</h1>
            <p className="text-muted-foreground">Failed to load WordPress installation details</p>
          </div>
        </div>
      </div>

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
        <h3 className="mb-2 text-lg font-semibold">Failed to load installation</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {error.message || "An error occurred while fetching WordPress installation details."}
        </p>
        <div className="flex gap-2">
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
          <Link href={backHref}>
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to WordPress
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function WordPressDetailPage({ installationId }: WordPressDetailPageProps) {
  const params = useParams();
  const slug = (params?.slug as string) ?? "";
  const basePath = slug ? `/${slug}` : "/agency";
  const searchParams = useSearchParams();
  const fromHosting = searchParams.get("fromHosting");
  const backHref = fromHosting && slug ? `/${slug}/hosting/${fromHosting}` : `${basePath}/wordpress`;

  // Use batched endpoint - fetches both WordPress installation and subscription link in one request
  const { data: wpData, isLoading, isError, error, refetch } = useWordPressDetailBatched(installationId);

  // Show loading state
  if (isLoading) {
    return <WordPressDetailSkeleton />;
  }

  // Show error state - check for error or missing data
  if (isError || !wpData || !wpData.id) {
    return <WordPressDetailError error={error as Error} onRetry={() => refetch()} backHref={backHref} />;
  }

  const getStatusBadge = () => {
    if (wpData.status?.infected) {
      return <Badge variant="destructive">Infected</Badge>;
    }
    if (wpData.status?.unsupported) {
      return <Badge variant="secondary">Unsupported</Badge>;
    }
    if (wpData.status?.alive) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
          Online
        </Badge>
      );
    }
    return <Badge variant="secondary">Offline</Badge>;
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={backHref}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {wpData.displayTitle || wpData.title || `Installation ${wpData.id}`}
              </h1>
              <p className="text-muted-foreground">WordPress installation details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex w-full flex-wrap gap-3 @sm/main:flex-nowrap @sm/main:grid @sm/main:grid-cols-5 h-auto p-0 bg-transparent">
              <TabsTrigger
                value="overview"
                className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
              >
                <div className="flex items-center justify-between w-full">
                  <LayoutDashboard className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start gap-1 w-full">
                  <span className="font-semibold text-sm">Overview</span>
                  <span className="text-xs text-muted-foreground">Details</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="site-credentials"
                className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
              >
                <div className="flex items-center justify-between w-full">
                  <Lock className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start gap-1 w-full">
                  <span className="font-semibold text-sm">Site Credentials</span>
                  <span className="text-xs text-muted-foreground">Access</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="plugins"
                className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
              >
                <div className="flex items-center justify-between w-full">
                  <Code className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start gap-1 w-full">
                  <span className="font-semibold text-sm">Plugins</span>
                  <span className="text-xs text-muted-foreground">Extensions</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="themes"
                className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
              >
                <div className="flex items-center justify-between w-full">
                  <FileText className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start gap-1 w-full">
                  <span className="font-semibold text-sm">Themes</span>
                  <span className="text-xs text-muted-foreground">Designs</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="tools"
                className="group flex flex-col items-start gap-2 p-4 h-auto min-h-[100px] border rounded-lg bg-background hover:bg-muted/50 transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm flex-1 @sm/main:flex-none"
              >
                <div className="flex items-center justify-between w-full">
                  <Settings className="h-6 w-6 shrink-0 text-muted-foreground group-data-[state=active]:text-primary" />
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start gap-1 w-full">
                  <span className="font-semibold text-sm">Tools</span>
                  <span className="text-xs text-muted-foreground">Settings</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <WordPressOverview wpData={wpData} />
            </TabsContent>

            <TabsContent value="site-credentials" className="mt-6">
              <WordPressSiteCredentials installationId={String(wpData.id)} />
            </TabsContent>

            <TabsContent value="plugins" className="mt-6">
              <WordPressPlugins installationId={String(wpData.id)} />
            </TabsContent>

            <TabsContent value="themes" className="mt-6">
              <WordPressThemes installationId={String(wpData.id)} />
            </TabsContent>

            <TabsContent value="tools" className="mt-6">
              <WordPressTools installationId={String(wpData.id)} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
