"use client";

import { trpc } from "@/utils/trpc";

interface UseGetTemplatesProps {
  page?: number;
  limit?: number;
}

export const useGetTemplates = ({ page = 1, limit = 20 }: UseGetTemplatesProps = {}) => {
  return trpc.imageGenStudio.templates.list.useQuery(
    { page, limit },
    {
      staleTime: 60000, // Cache for 60 seconds (templates change less frequently)
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    }
  );
};
