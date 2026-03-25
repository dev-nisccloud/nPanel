"use client";

import { trpc } from "@/utils/trpc";

interface UseGetUploadsProps {
  page?: number;
  limit?: number;
  teamId?: string;
}

export const useGetUploads = ({ page = 1, limit = 20, teamId }: UseGetUploadsProps = {}) => {
  return trpc.imageGenStudio.uploads.list.useQuery(
    { page, limit, teamId },
    {
      staleTime: 30000, // Cache for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    }
  );
};
