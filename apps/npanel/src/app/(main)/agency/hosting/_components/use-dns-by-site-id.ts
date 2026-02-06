import { useEffect } from "react";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { pleskDnsResponseSchema, dnsRecordSchema } from "./dns-schema";
import { toast } from "sonner";

/**
 * Transform Plesk DNS API response to component format
 */
function transformPleskDnsToComponent(
  pleskResponse: z.infer<typeof pleskDnsResponseSchema>
): z.infer<typeof dnsRecordSchema>[] {
  const records = pleskResponse.parsed.packet.dns["get_rec"].result;

  return records.map((record) => ({
    id: record.id ?? 0,
    "site-id": record.data?.["site-id"] ?? 0,
    type: record.data?.type ?? "A",
    host: record.data?.host ?? "Unknown Host",
    value: record.data?.value ?? "Unknown Value",
    opt: record.data?.opt ?? "",
    ttl: record.data?.ttl ?? 3600,
    status: record.status ?? "unknown",
  }));
}

/**
 * Custom hook for fetching DNS records by site ID with extended caching
 */
export function useDnsBySiteId(siteId: number) {
  const {
    data: pleskData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.plesk.domainDns.getBySiteId.useQuery(
    { siteId },
    {
      enabled: siteId > 0,
      staleTime: 10 * 60 * 1000, // 10 minutes - longer cache for DNS
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.data?.code === "UNAUTHORIZED") return false;
        // Don't retry on service unavailable errors
        if (error?.data?.code === "SERVICE_UNAVAILABLE") return false;
        // Don't retry on not found errors
        if (error?.data?.code === "NOT_FOUND") return false;
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Only refetch on network reconnect
      refetchOnMount: false, // Don't refetch if data exists in cache
    }
  );

  // Handle API errors
  useEffect(() => {
    if (error) {
      console.error("DNS fetch error:", error);

      // Show user-friendly error messages
      if (error?.data?.code === "UNAUTHORIZED") {
        toast.error("Authentication failed. Please check your Plesk credentials.");
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        toast.error("Plesk server is currently unavailable. Please try again later.");
      } else if (error?.data?.code === "NOT_FOUND") {
        toast.error("Site not found.");
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        toast.error("Server error occurred while fetching DNS records.");
      } else {
        toast.error("Failed to fetch DNS records. Please try again.");
      }
    }
  }, [error]);

  // Transform the data
  let transformedData: z.infer<typeof dnsRecordSchema>[] = [];
  let transformationError: Error | null = null;

  if (pleskData) {
    try {
      // Validate the response against our schema
      const validatedData = pleskDnsResponseSchema.parse(pleskData);
      transformedData = transformPleskDnsToComponent(validatedData);
    } catch (error) {
      console.error("Data transformation error:", error);
      console.error("Raw API response:", pleskData);
      transformationError = error as Error;

      // Provide more specific error messages based on the error type
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.issues);
        toast.error(`Data validation failed: ${error.issues.length} field(s) have invalid data.`);
      } else {
        toast.error("Failed to process DNS data. Please refresh the page.");
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
