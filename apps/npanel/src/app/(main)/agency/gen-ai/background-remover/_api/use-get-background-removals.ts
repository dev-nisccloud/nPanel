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
      staleTime: 30000, // Cache for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    }
  );
};
