"use client";

import { trpc } from "@/utils/trpc";

export const useGetImages = () => {
  return trpc.imageGenStudio.images.list.useQuery();
};
