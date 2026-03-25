"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

interface UseGetProjectsProps {
  teamId?: string;
}

export const useGetProjects = ({ teamId }: UseGetProjectsProps = {}) => {
  const utils = trpc.useUtils();

  return useInfiniteQuery({
    queryKey: [["imageGenStudio", "projects", "list"], { limit: 10, teamId }],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await utils.imageGenStudio.projects.list.fetch({
        page: pageParam as number,
        limit: 10,
        teamId,
      });
      return result;
    },
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    initialPageParam: 1,
    staleTime: 30000, // Cache for 30 seconds to improve performance
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
};
