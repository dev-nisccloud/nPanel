import { useEffect } from "react";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { pleskSubscriptionByIdResponseSchema, hostingDetailSchema } from "./hosting-detail-schema";
import { toast } from "sonner";

/**
 * Transform Plesk API response to detail page format
 */
function transformPleskSubscriptionToDetail(
  pleskResponse: z.infer<typeof pleskSubscriptionByIdResponseSchema>
): z.infer<typeof hostingDetailSchema> {
  // Check for system errors first
  if (pleskResponse.parsed.packet.system?.status === 'error') {
    const errorCode = pleskResponse.parsed.packet.system.errcode;
    const errorText = pleskResponse.parsed.packet.system.errtext || 'Unknown error';
    throw new Error(`Plesk API Error ${errorCode}: ${errorText}`);
  }

  // Check if webspace exists
  if (!pleskResponse.parsed.packet.webspace?.get?.result) {
    throw new Error('No subscription data found in Plesk response');
  }

  const result = pleskResponse.parsed.packet.webspace.get.result;
  
  return {
    id: result.id,
    gen_info: {
      "cr_date": result.data?.gen_info?.["cr_date"] || new Date().toISOString().split('T')[0],
      name: result.data?.gen_info?.name || `Subscription ${result.id}`,
      "ascii-name": result.data?.gen_info?.["ascii-name"] || "",
      status: result.data?.gen_info?.status ?? 0,
      "real_size": result.data?.gen_info?.["real_size"] ?? 0,
      "owner-login": result.data?.gen_info?.["owner-login"] || "unknown",
      "dns_ip_address": result.data?.gen_info?.["dns_ip_address"] || "0.0.0.0",
      htype: result.data?.gen_info?.htype || "unknown",
      guid: result.data?.gen_info?.guid || "",
      "vendor-guid": result.data?.gen_info?.["vendor-guid"] || "",
      "external-id": result.data?.gen_info?.["external-id"] || "",
      "sb-site-uuid": result.data?.gen_info?.["sb-site-uuid"] || "",
      description: result.data?.gen_info?.description || "",
      "admin-description": result.data?.gen_info?.["admin-description"] || "",
    },
    hosting: result.data?.hosting ? {
      vrt_hst: result.data.hosting.vrt_hst ? {
        property: result.data.hosting.vrt_hst.property || [],
        ip_address: result.data.hosting.vrt_hst.ip_address || "0.0.0.0",
      } : undefined,
    } : undefined,
    limits: result.data?.limits ? {
      overuse: result.data.limits.overuse || "block",
      limit: result.data.limits.limit || [],
    } : undefined,
    stat: result.data?.stat ? {
      traffic: result.data.stat.traffic ?? 0,
      subdom: result.data.stat.subdom ?? 0,
      wu: result.data.stat.wu ?? 0,
      box: result.data.stat.box ?? 0,
      redir: result.data.stat.redir ?? 0,
      mg: result.data.stat.mg ?? 0,
      resp: result.data.stat.resp ?? 0,
      maillists: result.data.stat.maillists ?? 0,
      db: result.data.stat.db ?? 0,
      mssql_db: result.data.stat.mssql_db ?? 0,
      traffic_prevday: result.data.stat.traffic_prevday ?? 0,
      domains: result.data.stat.domains ?? 0,
      sites: result.data.stat.sites ?? 0,
    } : undefined,
    prefs: result.data?.prefs ? {
      www: result.data.prefs.www ?? true,
      stat_ttl: result.data.prefs.stat_ttl ?? 3,
    } : undefined,
    permissions: result.data?.permissions ? {
      permission: result.data.permissions.permission || [],
    } : undefined,
  };
}

/**
 * Custom hook for fetching hosting subscription detail with subscription link (batched).
 * When teamSlug is provided, resolves teamId and passes it for ownership (required for CUID subscription ids).
 */
export function useHostingDetailBatched(subscriptionId: string, teamSlug?: string) {
  const { data: teamData } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: teamSlug ?? "" },
    { enabled: !!teamSlug }
  );
  const teamId = teamData?.id;

  const {
    data: batchedData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.hosting.getDetailWithSubscription.useQuery(
    { subscriptionId, teamId: teamId ?? undefined },
    {
      enabled: !!subscriptionId && (!!teamId || /^\d+$/.test(subscriptionId)),
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.data?.code === "UNAUTHORIZED") return false;
        // Don't retry on service unavailable errors
        if (error?.data?.code === "SERVICE_UNAVAILABLE") return false;
        // Don't retry on not found errors
        if (error?.data?.code === "NOT_FOUND") return false;
        if (error?.data?.code === "FORBIDDEN" || error?.data?.code === "BAD_REQUEST") return false;
        // Don't retry on rate limit errors
        if (error?.data?.code === "TOO_MANY_REQUESTS") return false;
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(5000 * (attemptIndex + 1), 60000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );
  const isLoadingTeam = !!teamSlug && !teamData && !!subscriptionId && !/^\d+$/.test(subscriptionId);

  // Handle API errors
  useEffect(() => {
    if (error) {
      console.error("Hosting subscription fetch error:", error);
      
      // Show user-friendly error messages
      if (error?.data?.code === "UNAUTHORIZED") {
        toast.error("Authentication failed. Please check your Plesk credentials.");
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        toast.error("Plesk server is currently unavailable. Please try again later.");
      } else if (error?.data?.code === "TOO_MANY_REQUESTS") {
        toast.error("Rate limit exceeded. Please wait a few minutes before trying again.", {
          duration: 10000,
        });
      } else if (error?.data?.code === "NOT_FOUND") {
        toast.error("Hosting subscription not found.");
      } else if (error?.data?.code === "FORBIDDEN") {
        toast.error("You do not have access to this subscription.");
      } else if (error?.data?.code === "BAD_REQUEST") {
        toast.error("Invalid request. Please open this page from your hosting list.");
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        toast.error("Server error occurred while fetching subscription details.");
      } else {
        toast.error("Failed to fetch hosting subscription details. Please try again.");
      }
    }
  }, [error]);

  // Transform the data
  let transformedData: z.infer<typeof hostingDetailSchema> | null = null;
  let subscriptionData: any = null;
  let transformationError: Error | null = null;

  if (batchedData) {
    try {
      // Validate the hosting response against our schema
      const validatedHostingData = pleskSubscriptionByIdResponseSchema.parse(batchedData.hosting);
      transformedData = transformPleskSubscriptionToDetail(validatedHostingData);
      subscriptionData = batchedData.subscription;
    } catch (error) {
      console.error("Data transformation error:", error);
      console.error("Raw API response:", batchedData);
      transformationError = error as Error;
      
      // Provide more specific error messages based on the error type
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.issues);
        toast.error(`Data validation failed: ${error.issues.length} field(s) have invalid data.`);
      } else {
        toast.error("Failed to process subscription data. Please refresh the page.");
      }
    }
  }

  return {
    data: transformedData,
    subscription: subscriptionData,
    isLoading: isLoading || isRefetching || isLoadingTeam,
    isError: isError || !!transformationError,
    error: error || transformationError,
    refetch,
    rawData: batchedData?.hosting,
  };
}

