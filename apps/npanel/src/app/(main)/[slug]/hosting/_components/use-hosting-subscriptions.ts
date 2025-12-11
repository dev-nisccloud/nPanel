import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { pleskSubscriptionResponseSchema, hostingSubscriptionSchema } from "./schema";
import { transformPleskSubscriptionsToTable } from "./hosting-utils";
import { toast } from "sonner";

/**
 * Custom hook for fetching hosting subscriptions with error handling and retries
 * Filters subscriptions based on team's active service subscriptions
 */
export function useHostingSubscriptions() {
  const pathname = usePathname();
  // Extract team slug from URL (first segment after /)
  const teamSlug = pathname.split("/")[1];

  // Get teamId from slug
  const { data: teamData, isLoading: isTeamLoading } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: teamSlug },
    {
      enabled: !!teamSlug,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Get filtered subscriptions by team - filter by WEB_HOSTING subtype
  const {
    data: pleskData,
    isLoading: isPleskLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.plesk.subscriptions.getByTeamFilterIds.useQuery(
    { 
      teamId: teamData?.id || "",
      hostingSubType: "WEB_HOSTING",
    },
    {
      enabled: !!teamData?.id,
      staleTime: 10 * 60 * 1000, // 10 minutes - increased to reduce request frequency
      gcTime: 30 * 60 * 1000, // 30 minutes - increased cache time
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.data?.code === "UNAUTHORIZED") return false;
        // Don't retry on service unavailable errors
        if (error?.data?.code === "SERVICE_UNAVAILABLE") return false;
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

  const isLoading = isTeamLoading || isPleskLoading || isRefetching;

  // Handle API errors
  useEffect(() => {
    if (error) {
      // Show user-friendly error messages
      if (error?.data?.code === "UNAUTHORIZED") {
        toast.error("Authentication failed. Please check your Plesk credentials.");
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        toast.error("Plesk server is currently unavailable. Please try again later.");
      } else if (error?.data?.code === "TOO_MANY_REQUESTS") {
        toast.error("Rate limit exceeded. Please wait a few minutes before trying again.", {
          duration: 10000, // Show for 10 seconds
        });
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        toast.error("Server error occurred while fetching subscriptions.");
      } else {
        toast.error("Failed to fetch hosting subscriptions. Please try again.");
      }
    }
  }, [error]);

  // Transform the data
  let transformedData: z.infer<typeof hostingSubscriptionSchema>[] = [];
  let transformationError: Error | null = null;
  let hasServiceSubscriptions: boolean | undefined = undefined;

  if (pleskData) {
    hasServiceSubscriptions = pleskData.hasServiceSubscriptions;
    
    try {
      // Validate the response against our schema (only if we have parsed data)
      if (pleskData.parsed?.packet?.webspace?.get?.result) {
        const validatedData = pleskSubscriptionResponseSchema.parse({
          raw: pleskData.raw,
          parsed: pleskData.parsed,
        });
      transformedData = transformPleskSubscriptionsToTable(validatedData);
      }
    } catch (error) {
      transformationError = error as Error;
      
      // Provide more specific error messages based on the error type
      if (error instanceof z.ZodError) {
        toast.error(`Data validation failed: ${error.issues.length} field(s) have invalid data.`);
      } else {
        toast.error("Failed to process subscription data. Please refresh the page.");
      }
    }
  }

  return {
    data: transformedData,
    isLoading,
    isError: isError || !!transformationError,
    error: error || transformationError,
    refetch,
    rawData: pleskData,
    hasServiceSubscriptions,
  };
}