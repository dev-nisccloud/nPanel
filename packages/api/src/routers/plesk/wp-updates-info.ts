import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from '../../lib/plesk/rest-client';
import { publicProcedure, router } from '../../trpc';

async function getWpUpdatesInfo(installationId: number) {
  const installationEndpoint = `/v1/installations/${installationId}`;
  const { data: installationData, isAuthError: installAuthError, isHostUnreachable: installHostError, statusCode: installStatus } = await sendPleskRestRequest(installationEndpoint, 'GET');
  if (installHostError) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
  if (installAuthError) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
  if (installStatus === 404) throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });

  const settingsEndpoint = `/v1/installations/${installationId}/features/updates/settings`;
  const { data: settingsData, isAuthError: settingsAuthError, isHostUnreachable: settingsHostError } = await sendPleskRestRequest(settingsEndpoint, 'GET');

  const pluginsEndpoint = `/v1/installations/${installationId}/plugins`;
  const { data: pluginsData, isAuthError: pluginsAuthError, isHostUnreachable: pluginsHostError } = await sendPleskRestRequest(pluginsEndpoint, 'GET');

  const themesEndpoint = `/v1/installations/${installationId}/themes`;
  const { data: themesData, isAuthError: themesAuthError, isHostUnreachable: themesHostError } = await sendPleskRestRequest(themesEndpoint, 'GET');

  if (settingsHostError || pluginsHostError || themesHostError) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
  if (settingsAuthError || pluginsAuthError || themesAuthError) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });

  return {
    installation: installationData || null,
    settings: settingsData || null,
    core: {
      currentVersion: installationData?.version || 'Unknown',
      availableVersion: null,
      needsUpdate: false,
      updateType: settingsData?.core || 'none'
    },
    plugins: Array.isArray(pluginsData) ? pluginsData : [],
    themes: Array.isArray(themesData) ? themesData : [],
  };
}

export const wpUpdatesInfoRouter = router({
  get: publicProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      const data = await getWpUpdatesInfo(input.installationId);
      return { data };
    }),
});
