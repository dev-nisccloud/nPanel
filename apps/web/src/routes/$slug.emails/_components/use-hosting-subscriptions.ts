import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { pleskSubscriptionResponseSchema, hostingSubscriptionSchema } from "./schema";
import { transformPleskSubscriptionsToTable } from "./hosting-utils";
import { toast } from "@/components/ui/sonner";

/**
 * Custom hook for fetching hosting subscriptions with error handling and retries
 */
export function useHostingSubscriptions() {
  const {
    data: pleskData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.plesk.subscriptions.getAll.useQuery(
    {},
    {
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

  // Handle API errors
  useEffect(() => {
    if (error) {
      console.error("Hosting subscriptions fetch error:", error);
      
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

  if (pleskData) {
    try {
      // Validate the response against our schema
      const validatedData = pleskSubscriptionResponseSchema.parse(pleskData);
      transformedData = transformPleskSubscriptionsToTable(validatedData);
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
