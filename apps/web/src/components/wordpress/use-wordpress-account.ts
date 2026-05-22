import { useEffect, useMemo } from "react";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export const wordpressAccountSchema = z.object({
  loginUrl: z.string().optional(),
  currentLogin: z.string().optional(),
  currentPassword: z.string().optional(),
  currentEmail: z.string().optional(),
  currentLanguage: z.string().optional(),
  availableLogins: z
    .array(
      z.object({
        login: z.string(),
        title: z.string(),
      })
    )
    .optional(),
  availableLanguages: z
    .array(
      z.object({
        code: z.string(),
        title: z.string(),
      })
    )
    .optional(),
});

export type WordPressAccount = z.infer<typeof wordpressAccountSchema>;

export function useWordPressAccount(installationId: string) {
  const installationIdNumber = parseInt(installationId, 10);

  const query = trpc.plesk.wpCredentials.getAccount.useQuery(
    { installationId: installationIdNumber },
    {
      enabled: !isNaN(installationIdNumber) && installationIdNumber > 0,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (!query.error) return;
    const error = query.error;
    if (error.data?.code === "UNAUTHORIZED") {
      toast.error("Authentication failed. Please check your Plesk credentials.");
    } else if (error.data?.code === "SERVICE_UNAVAILABLE") {
      toast.error("Plesk server is currently unavailable. Please try again later.");
    } else if (error.data?.code === "NOT_FOUND") {
      toast.error("WordPress installation not found.");
    } else {
      toast.error("Failed to load WordPress account settings.");
    }
  }, [query.error]);

  const parsed = useMemo(() => {
    if (!query.data?.data) {
      return { account: null as WordPressAccount | null, parseError: null as Error | null };
    }
    try {
      return {
        account: wordpressAccountSchema.parse(query.data.data),
        parseError: null,
      };
    } catch (err) {
      return {
        account: null,
        parseError: err instanceof Error ? err : new Error("Failed to parse account settings"),
      };
    }
  }, [query.data?.data]);

  return {
    account: parsed.account,
    isLoading: query.isLoading || query.isRefetching,
    isError: query.isError || !!parsed.parseError,
    error: query.error || parsed.parseError,
    refetch: query.refetch,
  };
}
