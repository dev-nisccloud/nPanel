import { useEffect, useMemo } from "react";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { databaseSchema } from "./databases-schema";
import { toast } from "@/components/ui/sonner";

type RelatedSitesMap = Record<string, { id: number; name: string }>;
export type RelatedSitesStatus = "loading" | "ready" | "error";

const queryOptions = {
  staleTime: 30 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

function withRelatedSite(
  database: z.infer<typeof databaseSchema>,
  relatedSites: RelatedSitesMap | undefined,
  relatedStatus: RelatedSitesStatus,
): z.infer<typeof databaseSchema> {
  const related = relatedStatus === "ready" && database.id != null
    ? relatedSites?.[String(database.id)]
    : undefined;
  return {
    ...database,
    "related-site-id": relatedStatus === "ready" ? (related?.id ?? 0) : null,
    "related-site-name": related?.name ?? null,
  };
}

/**
 * Custom hook for fetching databases by site ID
 */
export function useDatabasesBySiteId(siteId: number) {
  const {
    data: catalog,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.plesk.databases.listBySiteId.useQuery(
    { siteId },
    {
      enabled: siteId > 0,
      ...queryOptions,
      retry: (failureCount, error: { data?: { code?: string } }) => {
        if (error?.data?.code === "UNAUTHORIZED") return false;
        if (error?.data?.code === "SERVICE_UNAVAILABLE") return false;
        if (error?.data?.code === "NOT_FOUND") return false;
        if (error?.data?.code === "FORBIDDEN") return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnReconnect: true,
    }
  );

  const relatedQuery = trpc.plesk.databases.getRelatedSites.useQuery(
    { siteId },
    {
      enabled: siteId > 0,
      ...queryOptions,
    },
  );

  const relatedStatus: RelatedSitesStatus = relatedQuery.isError
    ? "error"
    : relatedQuery.isSuccess
      ? "ready"
      : "loading";

  useEffect(() => {
    if (error) {
      console.error("Databases fetch error:", error);

      if (error?.data?.code === "UNAUTHORIZED") {
        toast.error("Authentication failed. Please check your Plesk credentials.");
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        toast.error("Plesk server is currently unavailable. Please try again later.");
      } else if (error?.data?.code === "NOT_FOUND") {
        toast.error("Site not found.");
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        toast.error("Server error occurred while fetching databases.");
      } else {
        toast.error("Failed to fetch databases. Please try again.");
      }
    }
  }, [error]);

  const transformed = useMemo(() => {
    if (!catalog) return { data: [] as z.infer<typeof databaseSchema>[], error: null as Error | null };
    try {
      return {
        data: catalog.databases.map((database) =>
          withRelatedSite(databaseSchema.parse(database), relatedQuery.data?.relatedSites, relatedStatus),
        ),
        error: null as Error | null,
      };
    } catch (parseError) {
      console.error("Data transformation error:", parseError);
      return { data: [] as z.infer<typeof databaseSchema>[], error: parseError as Error };
    }
  }, [catalog, relatedQuery.data?.relatedSites, relatedStatus]);

  useEffect(() => {
    if (transformed.error) {
      toast.error("Failed to process databases data. Please refresh the page.");
    }
  }, [transformed.error]);

  return {
    data: transformed.data,
    engines: catalog?.engines ?? [],
    subscriptionDatabaseBytes: catalog?.subscriptionDatabaseBytes ?? null,
    isLoading,
    isError: isError || !!transformed.error,
    error: error || transformed.error,
    relatedSitesStatus: relatedStatus,
    refetch: async () => {
      await Promise.all([refetch(), relatedQuery.refetch()]);
    },
    rawData: catalog,
  };
}

export function usePrefetchDatabasesBySiteId(siteId: number | undefined) {
  const enabled = (siteId ?? 0) > 0;
  trpc.plesk.databases.listBySiteId.useQuery(
    { siteId: siteId ?? 0 },
    {
      enabled,
      ...queryOptions,
    },
  );
  trpc.plesk.databases.getRelatedSites.useQuery(
    { siteId: siteId ?? 0 },
    {
      enabled,
      ...queryOptions,
    },
  );
}
