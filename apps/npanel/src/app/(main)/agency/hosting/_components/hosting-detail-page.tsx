"use client";

import * as React from "react";
import { ArrowLeft, MoreVertical } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { HostingOverview } from "./hosting-overview";
import { DnsTable } from "./dns-table";
import { MailTable } from "./mail-table";
import { FileManager } from "./file-manager";
import { SubdomainsTable } from "./subdomains-table";
import { hostingDetailSchema } from "./hosting-detail-schema";
import { useHostingSubscriptionById } from "./use-hosting-subscription-by-id";
import { getStatusDisplayText, getStatusBadgeVariant } from "./hosting-utils";

interface HostingDetailPageProps {
  subscriptionId: string;
}

// Loading skeleton component
function HostingDetailSkeleton() {
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
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

// Error component
function HostingDetailError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agency/hosting">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Error Loading Subscription</h1>
            <p className="text-muted-foreground">Failed to load hosting subscription details</p>
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
        <h3 className="mb-2 text-lg font-semibold">Failed to load subscription</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {error.message || "An error occurred while fetching hosting subscription details."}
        </p>
        <div className="flex gap-2">
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
          <Link href="/agency/hosting">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Hosting
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function HostingDetailPage({ subscriptionId }: HostingDetailPageProps) {
  const { data: hostingData, isLoading, isError, error, refetch } = useHostingSubscriptionById(subscriptionId);

  // Show loading state
  if (isLoading) {
    return <HostingDetailSkeleton />;
  }

  // Show error state
  if (isError || !hostingData) {
    return <HostingDetailError error={error as Error} onRetry={() => refetch()} />;
  }

  const getStatusBadge = (status: number) => {
    return (
      <Badge variant={getStatusBadgeVariant(status)}>
        {getStatusDisplayText(status)}
      </Badge>
    );
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agency/hosting">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {hostingData.gen_info.name || `Subscription ${hostingData.id}`}
            </h1>
            <p className="text-muted-foreground">Hosting subscription details</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge(hostingData.gen_info.status ?? 0)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Subscription</DropdownMenuItem>
              <DropdownMenuItem>Renew</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Active</DropdownMenuItem>
                  <DropdownMenuItem>Suspended</DropdownMenuItem>
                  <DropdownMenuItem>Disabled</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Suspend</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">Cancel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dns">DNS</TabsTrigger>
          <TabsTrigger value="mail">Mail</TabsTrigger>
          <TabsTrigger value="file-manager">File Manager</TabsTrigger>
          <TabsTrigger value="subdomains">Subdomains</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <HostingOverview hostingData={hostingData} />
        </TabsContent>
        
        <TabsContent value="dns" className="mt-6">
          <DnsTable siteId={hostingData.id} />
        </TabsContent>
        
        <TabsContent value="mail" className="mt-6">
          <MailTable siteId={hostingData.id} domainName={hostingData.gen_info?.name} />
        </TabsContent>
        
        <TabsContent value="file-manager" className="mt-6">
          <FileManager hostingData={hostingData} />
        </TabsContent>
        
        <TabsContent value="subdomains" className="mt-6">
          <SubdomainsTable domainName={hostingData.gen_info?.name || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
