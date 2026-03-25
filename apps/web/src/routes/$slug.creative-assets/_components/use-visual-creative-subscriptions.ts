import { useEffect } from "react";
import { useLocation } from "react-router";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

/**
 * Custom hook for checking if team has VISUAL_CREATIVE service subscriptions
 */
export function useVisualCreativeSubscriptions() {
  const { pathname } = useLocation();
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

  // Get service subscriptions for VISUAL_CREATIVE plan type
  const {
    data: serviceSubscriptions,
    isLoading: isSubscriptionsLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.serviceSubscriptions.getAll.useQuery(
    {
      teamId: teamData?.id || "",
      planType: "VISUAL_CREATIVE",
      status: "ACTIVE",
    },
    {
      enabled: !!teamData?.id,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.data?.code === "UNAUTHORIZED") return false;
        // Don't retry on service unavailable errors
        if (error?.data?.code === "SERVICE_UNAVAILABLE") return false;
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

  const isLoading = isTeamLoading || isSubscriptionsLoading || isRefetching;

  // Handle API errors
  useEffect(() => {
    if (error) {
      // Show user-friendly error messages
      if (error?.data?.code === "UNAUTHORIZED") {
        toast.error("Authentication failed. Please log in again.");
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        toast.error("Service is currently unavailable. Please try again later.");
      } else if (error?.data?.code === "TOO_MANY_REQUESTS") {
        toast.error("Rate limit exceeded. Please wait a few minutes before trying again.", {
          duration: 10000,
        });
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        toast.error("Server error occurred while fetching subscriptions.");
      } else {
        toast.error("Failed to fetch subscriptions. Please try again.");
      }
    }
  }, [error]);

  const hasServiceSubscriptions = serviceSubscriptions && serviceSubscriptions.length > 0;

  return {
    data: serviceSubscriptions || [],
    isLoading,
    isError,
    error,
    refetch,
    hasServiceSubscriptions: hasServiceSubscriptions ?? undefined,
  };
}


