
import { z } from "zod";
import { router, publicProcedure } from "../../trpc";
import { sendPleskRestRequest } from "../../lib/plesk/rest-client";
import { TRPCError } from "@trpc/server";

export const wpFeaturesRouter = router({
  // --- Integrity ---
  getIntegrityInfo: publicProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(`/v1/installations/${input.installationId}/features/integrity`);
    }),

  // --- Debug ---
  updateDebugStatus: publicProcedure
    .input(z.object({
      installationId: z.number(),
      status: z.boolean()
    }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/debug/status`,
        'PUT',
        { status: input.status }
      );
    }),

  getDebugSettings: publicProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(`/v1/installations/${input.installationId}/features/debug/settings`);
    }),

  updateDebugSettings: publicProcedure
    .input(z.object({
      installationId: z.number(),
      wpDebug: z.boolean().optional(),
      wpDebugLog: z.boolean().optional(),
      wpDebugDisplay: z.boolean().optional(),
      scriptDebug: z.boolean().optional(),
      saveQueries: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { installationId, ...settings } = input;
      return sendPleskRestRequest(
        `/v1/installations/${installationId}/features/debug/settings`,
        'PATCH', // Using PATCH as per API docs for partial updates if needed, though docs say PATCH for update
        settings
      );
    }),

  // --- Hotlink Protection ---
  updateHotlinkProtectionStatus: publicProcedure
    .input(z.object({
      installationId: z.number(),
      status: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/hotlink-protection/status`,
        'PUT',
        { status: input.status }
      );
    }),

  getHotlinkProtectionSettings: publicProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(`/v1/installations/${input.installationId}/features/hotlink-protection/settings`);
    }),

  // Note: Skipping complex meta endpoint for now, focusing on enabling/disabling

  // --- Indexing ---
  toggleIndexing: publicProcedure
    .input(z.object({
      installationId: z.number(),
      status: z.boolean()
    }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/indexing/status`,
        'PUT',
        { status: input.status }
      );
    }),

  // --- Maintenance ---
  getMaintenanceSettings: publicProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(`/v1/installations/${input.installationId}/features/maintenance/settings`);
    }),

  updateMaintenanceSettings: publicProcedure
    .input(z.object({
      installationId: z.number(),
      fullMode: z.boolean().optional(),
      texts: z.object({
        title: z.string().optional(),
        header: z.string().optional(),
        subheader: z.string().optional(),
      }).optional(),
      timer: z.object({
        enabled: z.boolean(),
        days: z.number().optional(),
        hours: z.number().optional(),
        minutes: z.number().optional(),
      }).optional(),
      socialNetworks: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { installationId, ...body } = input;
      return sendPleskRestRequest(
        `/v1/installations/${installationId}/features/maintenance/settings`,
        'PUT',
        body
      );
    }),

  toggleMaintenanceMode: publicProcedure
    .input(z.object({
      installationId: z.number(),
      status: z.boolean()
    }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/maintenance/status`,
        'PUT',
        { status: input.status }
      );
    }),

  // --- Nginx Caching ---
  toggleNginxCaching: publicProcedure
    .input(z.object({
      installationId: z.number(),
      status: z.boolean()
    }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/nginx-caching/status`,
        'PUT',
        { status: input.status }
      );
    }),

  // --- Password Protection ---
  getPasswordProtection: publicProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(`/v1/installations/${input.installationId}/features/password-protection`);
    }),

  updatePasswordProtection: publicProcedure
    .input(z.object({
      installationId: z.number(),
      status: z.boolean(),
      credentials: z.object({
        username: z.string(),
        password: z.string()
      }).optional()
    }))
    .mutation(async ({ input }) => {
      const { installationId, ...body } = input;
      return sendPleskRestRequest(
        `/v1/installations/${installationId}/features/password-protection`,
        'PATCH',
        body
      );
    }),

  // --- Smart Updates ---
  toggleSmartUpdate: publicProcedure
    .input(z.object({
      installationId: z.number(),
      status: z.boolean()
    }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/updates/smart/status`,
        'PUT',
        { status: input.status }
      );
    }),

  applySmartUpdate: publicProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/updates/smart/result`,
        'POST',
        { confirm: true }
      );
    }),

  discardSmartUpdate: publicProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/updates/smart/result`,
        'DELETE',
        { delete: true }
      );
    }),

  // --- Security Measures ---
  getSecurityMeasures: publicProcedure
    .query(async () => {
      return sendPleskRestRequest('/v1/security-measures');
    }),

  getSecurityStatus: publicProcedure
    .input(z.object({
      installationsIds: z.array(z.number())
    }))
    .query(async ({ input }) => {
      // Using simpler filtering for now
      const query = input.installationsIds.map(id => `installationsIds[]=${id}`).join('&');
      return sendPleskRestRequest(`/v1/security-measures/checker?${query}`);
    }),

  resolveSecurityMeasure: publicProcedure
    .input(z.object({
      installationsIds: z.array(z.number()),
      securityMeasures: z.array(z.string())
    }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        '/v1/security-measures/resolver',
        'POST',
        input
      );
    }),

  revertSecurityMeasure: publicProcedure
    .input(z.object({
      installationsIds: z.array(z.number()),
      securityMeasures: z.array(z.string())
    }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        '/v1/security-measures/reverter',
        'POST',
        input
      );
    }),

  // --- Backups ---
  createBackup: publicProcedure
    .input(z.object({
      installationId: z.number(),
      description: z.string().optional(),
      backupSettings: z.boolean().default(true)
    }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        '/v1/features/backups/creator',
        'POST',
        input
      );
    }),

  restoreBackup: publicProcedure
    .input(z.object({
      installationId: z.number(),
      fileName: z.string(),
      clobber: z.boolean().default(false),
      dropAllDatabaseTables: z.boolean().default(false),
      restoreSettings: z.boolean().default(false)
    }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        '/v1/features/backups/restorer',
        'POST',
        input
      );
    }),

  getBackups: publicProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(`/v1/installations/${input.installationId}/backups`);
    }),

  deleteBackup: publicProcedure
    .input(z.object({
      installationId: z.number(),
      fileName: z.string()
    }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/backups?files[]=${input.fileName}`,
        'DELETE',
        { delete: true }
      );
    }),
});
