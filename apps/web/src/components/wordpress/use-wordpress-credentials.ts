import { useEffect } from "react";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const wordpressCredentialsSchema = z.object({
  credentials: z.object({
    login: z.string().optional(),
    password: z.string().optional(),
  }).optional(),
  loginUrl: z.string().optional(),
});

export type WordPressCredentials = z.infer<typeof wordpressCredentialsSchema>;

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
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.data?.code === "UNAUTHORIZED") return false;
        if (error?.data?.code === "SERVICE_UNAVAILABLE") return false;
        if (error?.data?.code === "NOT_FOUND") return false;
        if (error?.data?.code === "INTERNAL_SERVER_ERROR") return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  useEffect(() => {
    if (error) {
      console.error("WordPress credentials fetch error:", error);

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

  let transformedData: {
    login: string;
    password: string | null;
    loginUrl: string;
    hasPassword: boolean;
  } | null = null;
  let transformationError: Error | null = null;

  if (credentialsData?.data) {
    try {
      const validatedData = wordpressCredentialsSchema.parse(credentialsData.data);
      const credentials = validatedData.credentials;
      const loginUrl = validatedData.loginUrl;
      const login = credentials?.login?.trim();

      if (login && loginUrl) {
        const password = credentials?.password?.trim() || null;
        transformedData = {
          login,
          password,
          loginUrl,
          hasPassword: !!password,
        };
      } else {
        transformationError = new Error("Missing required credential fields (login or loginUrl)");
      }
    } catch (err) {
      console.error("WordPress credentials data transformation error:", err);
      transformationError = err instanceof Error ? err : new Error("Unknown transformation error");

      if (err instanceof z.ZodError) {
        console.error("Zod validation errors:", err.issues);
        toast.error("WordPress credentials data validation failed. Some fields may be missing or invalid.");
      } else {
        toast.error("Failed to process WordPress credentials data. Please refresh the page.");
      }
    }
  } else if (!isLoading && credentialsData === null) {
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
