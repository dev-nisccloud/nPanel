import { useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

// Schema for WordPress plugins API response
export const wordpressPluginsResponseSchema = z.object({
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
    mustUse: z.boolean().optional(),
  })),
  metadata: z.object({
    endpoint: z.string().optional(),
    timestamp: z.string().optional(),
    installationId: z.number().optional(),
    apiVersion: z.string().optional(),
    note: z.string().optional(),
  }).optional(),
});

// Schema for individual plugin (used in components)
export const wordpressPluginSchema = z.object({
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
  mustUse: z.boolean().optional(),
});

export type WordPressPlugin = z.infer<typeof wordpressPluginSchema>;

/**
 * Transform WordPress plugins API response to component format
 */
function transformWordPressPluginsToComponent(
  wpResponse: z.infer<typeof wordpressPluginsResponseSchema>
): z.infer<typeof wordpressPluginSchema>[] {
  // Access the data array directly
  const plugins = wpResponse.data;

  if (!plugins) {
    return [];
  }

  return plugins.map((plugin) => ({
    slug: plugin.slug,
    title: plugin.title,
    description: plugin.description,
    version: plugin.version,
    availableVersion: plugin.availableVersion,
    status: plugin.status,
    autoUpdates: plugin.autoUpdates,
    autoUpdatesAvailable: plugin.autoUpdatesAvailable,
    vulnerable: plugin.vulnerable,
    changeLogUrl: plugin.changeLogUrl,
    mustUse: plugin.mustUse,
  }));
}

/**
 * Custom hook to fetch WordPress installation plugins
 */
export function useWordPressPlugins(installationId: string) {
  const installationIdNumber = parseInt(installationId, 10);
  
  const {
    data: pluginsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = trpc.plesk.wpPlugins.getByInstallationId.useQuery(
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
      console.error("WordPress plugins fetch error:", error);
      
      // Show user-friendly error messages
      if (error?.data?.code === "UNAUTHORIZED") {
        toast.error("Authentication failed. Please check your Plesk credentials.");
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        toast.error("Plesk server is currently unavailable. Please try again later.");
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        toast.error("Server error occurred while fetching WordPress plugins.");
      } else {
        toast.error("Failed to fetch WordPress plugins. Please try again.");
      }
    }
  }, [error]);

  // Transform and validate the data
  let data: z.infer<typeof wordpressPluginSchema>[] = [];
  let transformationError: Error | null = null;

  if (pluginsData) {
    try {
      // Validate the raw data against our schema
      const validatedData = wordpressPluginsResponseSchema.parse(pluginsData);
      data = transformWordPressPluginsToComponent(validatedData);
    } catch (error) {
      console.error("WordPress plugins data transformation error:", error);
      transformationError = error instanceof Error ? error : new Error("Unknown transformation error");
      
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.issues);
        toast.error("WordPress plugins data validation failed. Some fields may be missing or invalid.");
      } else {
        toast.error("Failed to process WordPress plugins data. Please refresh the page.");
      }
    }
  }

  return {
    data,
    isLoading: isLoading || isRefetching,
    isError: isError || !!transformationError,
    error: error || transformationError,
    refetch,
    rawData: pluginsData,
  };
}
