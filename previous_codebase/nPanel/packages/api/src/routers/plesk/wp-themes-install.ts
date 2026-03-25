import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from '../../lib/plesk/rest-client';
import { publicProcedure, router } from '../../trpc';

async function installWpTheme(installationId: number, theme: { slug: string; status: boolean }) {
  const endpoint = `/v1/installations/${installationId}/themes`;
  const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'POST', theme);
  if (isHostUnreachable) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
  if (isAuthError) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
  if (statusCode === 404) throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });
  if (statusCode < 200 || statusCode >= 300 || !data) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
  return data;
}

export const wpThemesInstallRouter = router({
  install: publicProcedure
    .input(z.object({ installationId: z.number(), slug: z.string(), status: z.boolean().default(true) }))
    .mutation(async ({ input }) => {
      const data = await installWpTheme(input.installationId, { slug: input.slug, status: input.status });
      return { data };
    }),
});
