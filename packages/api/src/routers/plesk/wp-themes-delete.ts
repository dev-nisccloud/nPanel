import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from '../../lib/plesk/rest-client';
import { protectedProcedure, router } from '../../trpc';

async function deleteWpThemes(installationId: number, themeSlugs: string[]) {
  const endpoint = `/v1/installations/${installationId}/themes`;
  const { isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'DELETE', themeSlugs);
  if (isHostUnreachable) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
  if (isAuthError) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
  if (statusCode === 404) throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });
  if (statusCode !== 204 && (statusCode < 200 || statusCode >= 300)) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
  return { success: true, deletedThemes: themeSlugs };
}

export const wpThemesDeleteRouter = router({
  delete: protectedProcedure
    .input(z.object({ installationId: z.number(), themes: z.array(z.string()).min(1) }))
    .mutation(async ({ input }) => {
      const data = await deleteWpThemes(input.installationId, input.themes);
      return { data };
    }),
});
