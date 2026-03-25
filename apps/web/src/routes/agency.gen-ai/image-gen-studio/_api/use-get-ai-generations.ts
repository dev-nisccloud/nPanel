"use client";

import { trpc } from "@/utils/trpc";

interface UseGetAiGenerationsProps {
  page?: number;
  limit?: number;
  teamId?: string;
}

export const useGetAiGenerations = ({ page = 1, limit = 20, teamId }: UseGetAiGenerationsProps = {}) => {
  return trpc.imageGenStudio.aiGenerations.list.useQuery(
    { page, limit, teamId },
    {
      staleTime: 30000, // Cache for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    }
  );
};
