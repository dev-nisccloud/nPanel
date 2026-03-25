"use client";

import { trpc } from "@/utils/trpc";

interface UseGetBackgroundRemovalsProps {
  page?: number;
  limit?: number;
  teamId?: string;
}

export const useGetBackgroundRemovals = ({ page = 1, limit = 20, teamId }: UseGetBackgroundRemovalsProps = {}) => {
  return trpc.backgroundRemover.getGenerations.useQuery(
    { page, limit, teamId },
    {
      staleTime: 5000,
      gcTime: 5 * 60 * 1000,
      refetchInterval: (query) => {
        const data = query.state.data as { data?: Array<{ status?: string }> } | undefined;
        const list = data?.data ?? [];
        const inProgress = list.some(
          (g) => g.status === "QUEUED" || g.status === "PROCESSING",
        );
        return inProgress ? 2000 : false;
      },
    },
  );
};
