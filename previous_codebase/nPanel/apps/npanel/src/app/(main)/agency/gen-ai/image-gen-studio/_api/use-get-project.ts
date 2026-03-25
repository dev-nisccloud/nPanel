"use client";

import { trpc } from "@/utils/trpc";

export const useGetProject = (id: string) => {
  return trpc.imageGenStudio.projects.get.useQuery(
    { id },
    {
      enabled: !!id,
    }
  );
};

export type ResponseType = NonNullable<ReturnType<typeof useGetProject>["data"]>["data"];
