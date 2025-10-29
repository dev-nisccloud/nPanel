import { useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

// Schema for WordPress themes API response
export const wordpressThemesResponseSchema = z.object({
  data: z.array(z.object({
    slug: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    version: z.string().optional(),
    availableVersion: z.string().nullable().optional(),
    status: z.boolean().optional(),
    autoUpdates: z.boolean().optional(),
    autoUpdatesAvailable: z.boolean().optional(),
    vulnerable: z.boolean().optional(),
    changeLogUrl: z.string().nullable().optional(),
  })),
});

// Schema for individual theme (used in components)
export const wordpressThemeSchema = z.object({
  slug: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  version: z.string().optional(),
  availableVersion: z.string().nullable().optional(),
  status: z.boolean().optional(),
  autoUpdates: z.boolean().optional(),
  autoUpdatesAvailable: z.boolean().optional(),
  vulnerable: z.boolean().optional(),
  changeLogUrl: z.string().nullable().optional(),
});

export type WordPressTheme = z.infer<typeof wordpressThemeSchema>;

/**
 * Transform WordPress themes API response to component format
 */
function transformWordPressThemesToComponent(
  wpResponse: z.infer<typeof wordpressThemesResponseSchema>
): z.infer<typeof wordpressThemeSchema>[] {
  // Access the data array directly
  const themes = wpResponse.data;

  if (!themes) {
    return [];
  }

  return themes.map((theme) => ({
    slug: theme.slug,
    title: theme.title,
    description: theme.description,
    version: theme.version,
    availableVersion: theme.availableVersion,
    status: theme.status,
    autoUpdates: theme.autoUpdates,
    autoUpdatesAvailable: theme.autoUpdatesAvailable,
    vulnerable: theme.vulnerable,
    changeLogUrl: theme.changeLogUrl,
  }));
}

/**
 * Custom hook to fetch WordPress installation themes
 */
export function useWordPressThemes(installationId: string) {
  const installationIdNumber = parseInt(installationId, 10);
  
  const {
    data: themesData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.plesk.wpThemesList.installed.useQuery(
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
      console.error("WordPress themes fetch error:", error);
      
      // Show user-friendly error messages
      if (error?.data?.code === "UNAUTHORIZED") {
        toast.error("Authentication failed. Please check your Plesk credentials.");
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        toast.error("Plesk server is currently unavailable. Please try again later.");
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        toast.error("Server error occurred while fetching WordPress themes.");
      } else {
        toast.error("Failed to fetch WordPress themes. Please try again.");
      }
    }
  }, [error]);

  // Transform and validate the data
  let data: z.infer<typeof wordpressThemeSchema>[] = [];
  let transformationError: Error | null = null;

  if (themesData) {
    try {
      // Validate the raw data against our schema
      const validatedData = wordpressThemesResponseSchema.parse(themesData);
      data = transformWordPressThemesToComponent(validatedData);
    } catch (error) {
      console.error("WordPress themes data transformation error:", error);
      transformationError = error instanceof Error ? error : new Error("Unknown transformation error");
      
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.issues);
        toast.error("WordPress themes data validation failed. Some fields may be missing or invalid.");
      } else {
        toast.error("Failed to process WordPress themes data. Please refresh the page.");
      }
    }
  }

  return {
    data,
    isLoading: isLoading || isRefetching,
    isError: isError || !!transformationError,
    error: error || transformationError,
    refetch,
    rawData: themesData,
  };
}
