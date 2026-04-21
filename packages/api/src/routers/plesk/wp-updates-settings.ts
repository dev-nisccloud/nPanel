import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from '../../lib/plesk/rest-client';
import { protectedProcedure, router } from '../../trpc';

interface AutoUpdateSettings {
  core: 'major' | 'minor' | 'none';
  plugins: {
    forceUpdates: boolean;
    newlyInstalledUpdates: boolean;
    updateVulnerable: boolean;
    deactivateVulnerable: boolean;
  };
  themes: {
    forceUpdates: boolean;
    newlyInstalledUpdates: boolean;
    updateVulnerable: boolean;
  };
  safeUpdate: boolean;
}

async function getWpUpdateSettings(installationId: number) {
  const endpoint = `/v1/installations/${installationId}/features/updates/settings`;
  const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'GET');
  if (isHostUnreachable) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
  if (isAuthError) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
  if (statusCode === 404) throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });
  if (statusCode < 200 || statusCode >= 300 || !data) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
  return data;
}

async function updateWpUpdateSettings(installationId: number, settings: AutoUpdateSettings) {
  const endpoint = `/v1/installations/${installationId}/features/updates/settings`;
  const { data, isAuthError, isHostUnreachable, statusCode } = await sendPleskRestRequest(endpoint, 'PUT', settings);
  if (isHostUnreachable) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
  if (isAuthError) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
  if (statusCode === 404) throw new TRPCError({ code: 'NOT_FOUND', message: `WordPress installation ${installationId} not found` });
  if (statusCode < 200 || statusCode >= 300 || !data) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WP Toolkit returned ${statusCode}` });
  return data;
}

export const wpUpdatesSettingsRouter = router({
  get: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      const data = await getWpUpdateSettings(input.installationId);
      return { data };
    }),
  update: protectedProcedure
    .input(z.object({
      installationId: z.number(),
      settings: z.object({
        core: z.enum(['major', 'minor', 'none']),
        plugins: z.object({
          forceUpdates: z.boolean(),
          newlyInstalledUpdates: z.boolean(),
          updateVulnerable: z.boolean(),
          deactivateVulnerable: z.boolean(),
        }),
        themes: z.object({
          forceUpdates: z.boolean(),
          newlyInstalledUpdates: z.boolean(),
          updateVulnerable: z.boolean(),
        }),
        safeUpdate: z.boolean(),
      })
    }))
    .mutation(async ({ input }) => {
      const data = await updateWpUpdateSettings(input.installationId, input.settings as AutoUpdateSettings);
      return { data };
    }),
});
