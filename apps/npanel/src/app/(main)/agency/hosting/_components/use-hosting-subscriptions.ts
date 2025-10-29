import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { pleskSubscriptionResponseSchema, hostingSubscriptionSchema } from "./schema";
import { transformPleskSubscriptionsToTable } from "./hosting-utils";
import { toast } from "sonner";

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
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.data?.code === "UNAUTHORIZED") return false;
        // Don't retry on service unavailable errors
        if (error?.data?.code === "SERVICE_UNAVAILABLE") return false;
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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