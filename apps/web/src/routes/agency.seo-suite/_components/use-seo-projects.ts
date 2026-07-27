import { useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

export function useSeoProjects(search?: string) {
  const query = trpc.seoSuite.listProjects.useQuery(
    search?.trim() ? { search: search.trim() } : undefined,
    {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    if (query.error) {
      toast.error(query.error.message || "Failed to load SEO projects.");
    }
  }, [query.error]);

  return {
    data: query.data ?? [],
    isLoading: query.isLoading || query.isRefetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
