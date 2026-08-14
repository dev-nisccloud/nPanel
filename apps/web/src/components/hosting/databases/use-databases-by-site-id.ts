import { useEffect } from "react";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { pleskDatabasesResponseSchema, databaseSchema } from "./databases-schema";
import { toast } from "@/components/ui/sonner";

/**
 * True if the item is a real DB row (skip Plesk `{ status: "ok" }` stubs and id: 0 placeholders).
 */
function isNonEmptyDbItem(db: { id?: number; name?: string; status?: string }): boolean {
  if (db.name != null && String(db.name).trim() !== "") return true;
  if (db.id != null && Number(db.id) > 0) return true;
  return false;
}

type RelatedSitesMap = Record<string, { id: number; name: string }>;
export type RelatedSitesStatus = "loading" | "ready" | "error";

const queryOptions = {
  staleTime: 30 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

/**
 * Transform Plesk databases API response to component format.
 * Result is normalized to an array (schema handles single object vs array); we filter empty placeholders.
 */
function transformPleskDatabasesToComponent(
  pleskResponse: z.infer<typeof pleskDatabasesResponseSchema>,
  relatedSites: RelatedSitesMap | undefined,
  relatedStatus: RelatedSitesStatus,
): z.infer<typeof databaseSchema>[] {
  const raw = pleskResponse.parsed.packet.database["get-db"].result;
  const databases = raw.filter(isNonEmptyDbItem);

  return databases.map((db) => {
    const related = relatedStatus === "ready" && db.id != null
      ? relatedSites?.[String(db.id)]
      : undefined;
    return {
      id: db.id ?? 0,
      name: db.name ?? "Unknown Database",
      type: (db.type as "mysql" | "postgresql" | "mssql") ?? "mysql",
      status: db.status ?? "unknown",
      "filter-id": db["filter-id"] ?? 0,
      "webspace-id": db["webspace-id"] ?? 0,
      "db-server-id": db["db-server-id"] ?? 0,
      "related-site-id": relatedStatus === "ready" ? (related?.id ?? 0) : null,
      "related-site-name": related?.name ?? null,
    };
  });
}

/**
 * Custom hook for fetching databases by site ID
 */
export function useDatabasesBySiteId(siteId: number) {
  const {
    data: pleskData,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.plesk.databases.getBySiteId.useQuery(
    { siteId },
    {
      enabled: siteId > 0,
      ...queryOptions,
      retry: (failureCount, error: any) => {
        if (error?.data?.code === "UNAUTHORIZED") return false;
        if (error?.data?.code === "SERVICE_UNAVAILABLE") return false;
        if (error?.data?.code === "NOT_FOUND") return false;
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

  let transformedData: z.infer<typeof databaseSchema>[] = [];
  let transformationError: Error | null = null;

  if (pleskData) {
    const getDb = (pleskData as any)?.parsed?.packet?.database?.["get-db"];
    if (getDb == null) {
      transformedData = [];
    } else {
      try {
        const validatedData = pleskDatabasesResponseSchema.parse(pleskData);
        transformedData = transformPleskDatabasesToComponent(
          validatedData,
          relatedQuery.data?.relatedSites,
          relatedStatus,
        );
      } catch (error) {
        console.error("Data transformation error:", error);
        console.error("Raw API response:", pleskData);
        transformationError = error as Error;

        if (error instanceof z.ZodError) {
          console.error("Zod validation errors:", error.issues);
          toast.error(`Data validation failed: ${error.issues.length} field(s) have invalid data.`);
        } else {
          toast.error("Failed to process databases data. Please refresh the page.");
        }
      }
    }
  }

  return {
    data: transformedData,
    isLoading,
    isError: isError || !!transformationError,
    error: error || transformationError,
    relatedSitesStatus: relatedStatus,
    refetch: async () => {
      await Promise.all([refetch(), relatedQuery.refetch()]);
    },
    rawData: pleskData,
  };
}

export function usePrefetchDatabasesBySiteId(siteId: number | undefined) {
  const enabled = (siteId ?? 0) > 0;
  trpc.plesk.databases.getBySiteId.useQuery(
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
