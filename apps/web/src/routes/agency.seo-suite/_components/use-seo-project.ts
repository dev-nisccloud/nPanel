import { useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

export function useSeoProject(id: string) {
  const query = trpc.seoSuite.getProject.useQuery(
    { id },
    {
      enabled: !!id,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    if (query.error) {
      toast.error(query.error.message || "Failed to load SEO project.");
    }
  }, [query.error]);

  return {
    data: query.data ?? null,
    isLoading: query.isLoading || query.isRefetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
