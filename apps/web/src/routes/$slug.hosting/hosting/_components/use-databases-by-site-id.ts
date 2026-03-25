import { useEffect } from "react";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { pleskDatabasesResponseSchema, databaseSchema } from "./databases-schema";
import { toast } from "@/components/ui/sonner";

/**
 * True if the item has meaningful database data (avoid treating empty {} as a DB).
 */
function isNonEmptyDbItem(
  db: { id?: number; name?: string }
): boolean {
  return db.id != null || (db.name != null && String(db.name).trim() !== "");
}

/**
 * Transform Plesk databases API response to component format.
 * Result is normalized to an array (schema handles single object vs array); we filter empty placeholders.
 */
function transformPleskDatabasesToComponent(
  pleskResponse: z.infer<typeof pleskDatabasesResponseSchema>
): z.infer<typeof databaseSchema>[] {
  const raw = pleskResponse.parsed.packet.database["get-db"].result;
  const databases = raw.filter(isNonEmptyDbItem);

  return databases.map((db) => ({
    id: db.id ?? 0,
    name: db.name ?? "Unknown Database",
    type: (db.type as "mysql" | "postgresql" | "mssql") ?? "mysql",
    status: db.status ?? "unknown",
    "filter-id": db["filter-id"] ?? 0,
    "webspace-id": db["webspace-id"] ?? 0,
    "db-server-id": db["db-server-id"] ?? 0,
  }));
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
    isRefetching,
  } = trpc.plesk.databases.getBySiteId.useQuery(
    { siteId },
    {
      enabled: siteId > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.data?.code === "UNAUTHORIZED") return false;
        if (error?.data?.code === "SERVICE_UNAVAILABLE") return false;
        if (error?.data?.code === "NOT_FOUND") return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

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
        transformedData = transformPleskDatabasesToComponent(validatedData);
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
    isLoading: isLoading || isRefetching,
    isError: isError || !!transformationError,
    error: error || transformationError,
    refetch,
    rawData: pleskData,
  };
}
