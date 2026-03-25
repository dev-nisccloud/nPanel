import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from '../../lib/plesk/rest-client';
import { publicProcedure, router } from '../../trpc';

async function deleteWpPlugins(installationId: number, pluginSlugs: string[]) {
  const endpoint = `/v1/installations/${installationId}/plugins`;
  const { isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'DELETE', pluginSlugs);
  if (isHostUnreachable) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
  if (isAuthError) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
  if (statusCode === 404) throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });
  
  // DELETE operations often return 200/204 with empty body - this is normal
  if (statusCode >= 200 && statusCode < 300) {
    return { success: true, deletedPlugins: pluginSlugs };
  }
  
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
}

export const wpPluginsDeleteRouter = router({
  delete: publicProcedure
    .input(z.object({ installationId: z.number(), plugins: z.array(z.string()).min(1) }))
    .mutation(async ({ input }) => {
      const data = await deleteWpPlugins(input.installationId, input.plugins);
      return { data };
    }),
});
