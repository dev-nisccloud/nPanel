import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from '../../lib/plesk/rest-client';
import { protectedProcedure, router } from '../../trpc';

async function updateWpPluginStatus(installationId: number, slug: string, status: boolean) {
  const endpoint = `/v1/installations/${installationId}/plugins/${slug}/status`;
  const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'PUT', { status });
  if (isHostUnreachable) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
  if (isAuthError) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
  if (statusCode === 404) throw new TRPCError({ code: 'NOT_FOUND', message: `Plugin '${slug}' not found for installation ${installationId}` });
  if (statusCode < 200 || statusCode >= 300 || !data) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
  return data;
}

export const wpPluginsStatusRouter = router({
  setStatus: protectedProcedure
    .input(z.object({ installationId: z.number(), slug: z.string(), status: z.boolean() }))
    .mutation(async ({ input }) => {
      const data = await updateWpPluginStatus(input.installationId, input.slug, input.status);
      return { data };
    }),
});
