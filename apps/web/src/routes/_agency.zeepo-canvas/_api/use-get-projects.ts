import { trpc } from "@/utils/trpc";

export const useGetProjects = ({ teamId }: { teamId?: string }) => {
  return trpc.zeepoCanvas.projects.list.useInfiniteQuery(
    { teamId, limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextPage,
    }
  );
};
