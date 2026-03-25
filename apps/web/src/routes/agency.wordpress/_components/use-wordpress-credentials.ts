import { useEffect } from "react";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

// Schema for WordPress credentials API response
export const wordpressCredentialsSchema = z.object({
  credentials: z.object({
    login: z.string().optional(),
    password: z.string().optional(),
  }).optional(),
  loginUrl: z.string().optional(),
});

export type WordPressCredentials = z.infer<typeof wordpressCredentialsSchema>;

/**
 * Custom hook to fetch WordPress installation credentials
 */
export function useWordPressCredentials(installationId: string) {
  const installationIdNumber = parseInt(installationId, 10);

  const {
    data: credentialsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.plesk.wpCredentials.get.useQuery(
    { installationId: installationIdNumber },
    {
      enabled: !isNaN(installationIdNumber) && installationIdNumber > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.data?.code === "UNAUTHORIZED") return false;
        // Don't retry on service unavailable errors
        if (error?.data?.code === "SERVICE_UNAVAILABLE") return false;
        // Don't retry on not found errors
        if (error?.data?.code === "NOT_FOUND") return false;
        // Don't retry on internal server errors (WP Toolkit 500 errors)
        if (error?.data?.code === "INTERNAL_SERVER_ERROR") return false;
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
      console.error("WordPress credentials fetch error:", error);

      // Show user-friendly error messages
      if (error?.data?.code === "UNAUTHORIZED") {
        toast.error("Authentication failed. Please check your Plesk credentials.");
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        toast.error("Plesk server is currently unavailable. Please try again later.");
      } else if (error?.data?.code === "NOT_FOUND") {
        toast.error("WordPress installation not found. It may have been deleted or the ID is incorrect.");
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        toast.error("Server error occurred while fetching WordPress credentials.");
      } else {
        toast.error("Failed to fetch WordPress credentials. Please try again.");
      }
    }
  }, [error]);

  // Transform and validate the data
  let transformedData: { login: string; password: string; loginUrl: string } | null = null;
  let transformationError: Error | null = null;

  if (credentialsData?.data) {
    try {
      // The API returns { data: {...} } wrapper
      const validatedData = wordpressCredentialsSchema.parse(credentialsData.data);

      // Extract credentials from direct structure
      const credentials = validatedData.credentials;
      const loginUrl = validatedData.loginUrl;

      if (credentials?.login && credentials?.password && loginUrl) {
        transformedData = {
          login: credentials.login,
          password: credentials.password,
          loginUrl: loginUrl,
        };
      } else {
        // Missing required fields - treat as error
        transformationError = new Error("Missing required credential fields (login, password, or loginUrl)");
      }
    } catch (error) {
      console.error("WordPress credentials data transformation error:", error);
      transformationError = error instanceof Error ? error : new Error("Unknown transformation error");

      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.issues);
        toast.error("WordPress credentials data validation failed. Some fields may be missing or invalid.");
      } else {
        toast.error("Failed to process WordPress credentials data. Please refresh the page.");
      }
    }
  } else if (!isLoading && credentialsData === null) {
    // API returned null/undefined - treat as error
    transformationError = new Error("WordPress credentials not available. The installation may not have credentials configured.");
  }

  return {
    data: transformedData,
    isLoading: isLoading || isRefetching,
    isError: isError || !!transformationError,
    error: error || transformationError,
    refetch,
    rawData: credentialsData,
  };
}
