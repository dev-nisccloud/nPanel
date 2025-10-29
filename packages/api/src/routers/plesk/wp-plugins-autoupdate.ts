import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from '../../lib/plesk/rest-client';
import { publicProcedure, router } from '../../trpc';

async function updateWpPluginAutoUpdates(installationId: number, pluginUpdates: Array<{ slug: string; autoUpdates?: boolean; status?: boolean; }>) {
  const endpoint = `/v1/installations/${installationId}/plugins`;
  // Use POST method as per the working cURL example
  const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'POST', pluginUpdates);
  if (isHostUnreachable) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
  if (isAuthError) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
  if (statusCode === 404) throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });
  if (statusCode < 200 || statusCode >= 300 || !data) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
  return data;
}

export const wpPluginsAutoupdateRouter = router({
  update: publicProcedure
    .input(z.object({
      installationId: z.number(),
      plugins: z.array(z.object({ slug: z.string(), autoUpdates: z.boolean().optional(), status: z.boolean().optional() })).min(1),
    }))
    .mutation(async ({ input }) => {
      const data = await updateWpPluginAutoUpdates(input.installationId, input.plugins);
      return { data };
    }),
});
