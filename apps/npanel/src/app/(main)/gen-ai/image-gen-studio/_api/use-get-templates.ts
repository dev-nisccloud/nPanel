"use client";

import { trpc } from "@/utils/trpc";

interface UseGetTemplatesProps {
  page?: number;
  limit?: number;
}

export const useGetTemplates = ({ page = 1, limit = 20 }: UseGetTemplatesProps = {}) => {
  return trpc.imageGenStudio.templates.list.useQuery({ page, limit });
};
