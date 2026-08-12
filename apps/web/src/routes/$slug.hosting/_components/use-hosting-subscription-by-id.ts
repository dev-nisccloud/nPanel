import { useEffect } from "react";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { pleskSubscriptionByIdResponseSchema, hostingDetailSchema } from "./hosting-detail-schema";
import { toast } from "@/components/ui/sonner";

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
      limit: Array.isArray(result.data.limits.limit)
        ? result.data.limits.limit
        : result.data.limits.limit
          ? [result.data.limits.limit]
          : [],
    } : undefined,
    // Preserve undefined for count stats — do not invent 0 when Plesk omitted the field.
    stat: result.data?.stat ? {
      traffic: result.data.stat.traffic ?? 0,
      subdom: result.data.stat.subdom,
      wu: result.data.stat.wu,
      box: result.data.stat.box,
      redir: result.data.stat.redir,
      mg: result.data.stat.mg,
      resp: result.data.stat.resp,
      maillists: result.data.stat.maillists,
      db: result.data.stat.db,
      mssql_db: result.data.stat.mssql_db,
      traffic_prevday: result.data.stat.traffic_prevday ?? 0,
      domains: result.data.stat.domains,
      sites: result.data.stat.sites,
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
 * Custom hook for fetching a single hosting subscription by ID
 */
export function useHostingSubscriptionById(subscriptionId: string) {
  const subscriptionIdNumber = parseInt(subscriptionId, 10);
  
  const {
    data: pleskData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.plesk.subscriptions.getById.useQuery(
    { id: subscriptionIdNumber },
    {
      enabled: !isNaN(subscriptionIdNumber) && subscriptionIdNumber > 0,
      staleTime: 10 * 60 * 1000, // 10 minutes - increased to reduce request frequency
      gcTime: 30 * 60 * 1000, // 30 minutes - increased cache time
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.data?.code === "UNAUTHORIZED") return false;
        // Don't retry on service unavailable errors
        if (error?.data?.code === "SERVICE_UNAVAILABLE") return false;
        // Don't retry on not found errors
        if (error?.data?.code === "NOT_FOUND") return false;
        // Don't retry on rate limit errors - retrying makes it worse
        if (error?.data?.code === "TOO_MANY_REQUESTS") return false;
        // Retry up to 2 times for other errors (reduced from 3)
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(5000 * (attemptIndex + 1), 60000), // Slower retries: 5s, 10s, max 60s
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

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
          duration: 10000, // Show for 10 seconds
        });
      } else if (error?.data?.code === "NOT_FOUND") {
        toast.error("Hosting subscription not found.");
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        toast.error("Server error occurred while fetching subscription details.");
      } else {
        toast.error("Failed to fetch hosting subscription details. Please try again.");
      }
    }
  }, [error]);

  // Transform the data
  let transformedData: z.infer<typeof hostingDetailSchema> | null = null;
  let transformationError: Error | null = null;

  if (pleskData) {
    try {
      // Validate the response against our schema
      const validatedData = pleskSubscriptionByIdResponseSchema.parse(pleskData);
      transformedData = transformPleskSubscriptionToDetail(validatedData);
    } catch (error) {
      console.error("Data transformation error:", error);
      console.error("Raw API response:", pleskData);
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
    isLoading: isLoading || isRefetching,
    isError: isError || !!transformationError,
    error: error || transformationError,
    refetch,
    rawData: pleskData,
  };
}
