
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import { sendPleskRestRequest } from "../../lib/plesk/rest-client";
import {
  sanitizeHotlinkDomains,
  sanitizeHotlinkExtensions,
  toHotlinkPutBody,
} from "../../lib/plesk/hotlink-protection";
import {
  extractTaskFromResponse,
  parseBackupsFlatList,
  parseBackupsMetaList,
  parseHotlinkSettingsFlat,
  parseHotlinkSettingsMeta,
  parseIntegrityInfo,
  parseWpCronMeta,
  tryNormalizeWpToolkitTaskUrl,
} from "../../lib/plesk/wp-meta-parser";

function asRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return data as Record<string, unknown>;
}

export const wpFeaturesRouter = router({
  // --- Integrity ---
  getIntegrityInfo: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      const res = await sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/integrity`,
      );
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return {
          status: undefined,
          available: false,
          tasks: [],
          message: "Unable to load integrity status",
        };
      }
      return parseIntegrityInfo(res.data);
    }),

  // --- Debug ---
  updateDebugStatus: protectedProcedure
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

  getDebugSettings: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(`/v1/installations/${input.installationId}/features/debug/settings`);
    }),

  updateDebugSettings: protectedProcedure
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
  updateHotlinkProtectionStatus: protectedProcedure
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

  getHotlinkProtectionSettings: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      const base = `/v1/installations/${input.installationId}/features/hotlink-protection`;
      const metaRes = await sendPleskRestRequest(`${base}/settings/meta`);
      if (metaRes.statusCode >= 200 && metaRes.statusCode < 300 && metaRes.data) {
        const parsed = parseHotlinkSettingsMeta(metaRes.data);
        return {
          data: parsed,
          source: "meta" as const,
        };
      }
      const flatRes = await sendPleskRestRequest(`${base}/settings`);
      if (flatRes.statusCode >= 200 && flatRes.statusCode < 300 && flatRes.data) {
        const parsed = parseHotlinkSettingsFlat(flatRes.data);
        return {
          data: {
            ...parsed,
            defaultDomains: [],
            defaultFileExtensions: [],
          },
          source: "settings" as const,
        };
      }
      if (flatRes.isAuthError || metaRes.isAuthError) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Plesk credentials" });
      }
      if (flatRes.isHostUnreachable || metaRes.isHostUnreachable) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Plesk host is unreachable" });
      }
      throw new TRPCError({
        code: flatRes.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
        message: "Failed to load hotlink protection settings",
      });
    }),

  updateHotlinkProtectionSettings: protectedProcedure
    .input(
      z.object({
        installationId: z.number(),
        domains: z.array(z.string()),
        fileExtensions: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      const domains = sanitizeHotlinkDomains(input.domains);
      const fileExtensions = sanitizeHotlinkExtensions(input.fileExtensions);
      const body = toHotlinkPutBody(domains, fileExtensions);
      const res = await sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/hotlink-protection/settings`,
        "PUT",
        body,
      );
      if (res.isHostUnreachable) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Plesk host is unreachable" });
      }
      if (res.isAuthError) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Plesk credentials" });
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new TRPCError({
          code: res.statusCode === 404 ? "NOT_FOUND" : "BAD_REQUEST",
          message: "Failed to update hotlink protection settings",
        });
      }
      return { data: parseHotlinkSettingsFlat(res.data) };
    }),

  resetHotlinkProtectionSettings: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input }) => {
      const res = await sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/hotlink-protection/settings`,
        "DELETE",
        { delete: true },
      );
      if (res.isHostUnreachable) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Plesk host is unreachable" });
      }
      if (res.isAuthError) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Plesk credentials" });
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new TRPCError({
          code: res.statusCode === 404 ? "NOT_FOUND" : "BAD_REQUEST",
          message: "Failed to reset hotlink protection settings",
        });
      }
      return { data: parseHotlinkSettingsFlat(res.data) };
    }),

  // --- Indexing ---
  toggleIndexing: protectedProcedure
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
  getMaintenanceSettings: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(`/v1/installations/${input.installationId}/features/maintenance/settings`);
    }),

  updateMaintenanceSettings: protectedProcedure
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

  toggleMaintenanceMode: protectedProcedure
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

  getMaintenanceTemplateUrl: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      const res = await sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/maintenance/template-customization-url`,
      );
      if (res.statusCode >= 200 && res.statusCode < 300 && res.data && typeof res.data === "object") {
        const url = (res.data as { url?: string }).url;
        return { url: typeof url === "string" ? url : null };
      }
      return { url: null };
    }),

  restoreMaintenanceTemplate: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/maintenance/template`,
        "DELETE",
        { delete: true },
      );
    }),

  getBackupsMeta: protectedProcedure
    .input(
      z.object({
        installationId: z.number(),
        showAllBackups: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      const qs = input.showAllBackups ? "?showAllBackups=true" : "";
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/backups/meta${qs}`,
      );
    }),

  getSmartUpdateResult: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/updates/smart/result`,
      );
    }),

  getSmartPhpUpdateStub: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/updates/php/stub`,
      );
    }),

  getSmartPhpUpdateResult: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/updates/php/result`,
      );
    }),

  acceptSmartPhpUpdate: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/updates/php/result`,
        "POST",
        { confirm: true },
      );
    }),

  discardSmartPhpUpdate: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/updates/php/result`,
        "DELETE",
        { delete: true },
      );
    }),

  runSmartPhpUpdate: protectedProcedure
    .input(
      z.object({
        installationId: z.number(),
        newSubDomain: z
          .object({
            parentDomain: z.string(),
            name: z.string().optional(),
          })
          .optional(),
        php: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { installationId, ...body } = input;
      return sendPleskRestRequest("/v1/smart-php-updater", "POST", {
        installationId,
        ...body,
      });
    }),

  // --- Nginx Caching ---
  toggleNginxCaching: protectedProcedure
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
  getPasswordProtection: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(`/v1/installations/${input.installationId}/features/password-protection`);
    }),

  updatePasswordProtection: protectedProcedure
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
  toggleSmartUpdate: protectedProcedure
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

  applySmartUpdate: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/updates/smart/result`,
        'POST',
        { confirm: true }
      );
    }),

  discardSmartUpdate: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/updates/smart/result`,
        'DELETE',
        { delete: true }
      );
    }),

  // --- Security Measures ---
  getSecurityMeasures: protectedProcedure
    .query(async () => {
      return sendPleskRestRequest('/v1/security-measures');
    }),

  getSecurityStatus: protectedProcedure
    .input(
      z
        .object({
          installationsIds: z.array(z.number()).optional(),
          /** @deprecated use installationsIds — kept for mistyped clients */
          installationIds: z.array(z.number()).optional(),
        })
        .transform((v) => ({
          installationsIds: v.installationsIds ?? v.installationIds ?? [],
        }))
        .refine((v) => v.installationsIds.length > 0, {
          message: "At least one installation id is required",
        }),
    )
    .query(async ({ input }) => {
      const query = input.installationsIds.map((id) => `installationsIds[]=${id}`).join("&");
      const res = await sendPleskRestRequest(`/v1/security-measures/checker?${query}`);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return res.data;
      }
      return { data: [] };
    }),

  resolveSecurityMeasure: protectedProcedure
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

  revertSecurityMeasure: protectedProcedure
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
  createBackup: protectedProcedure
    .input(z.object({
      installationId: z.number(),
      description: z.string().optional(),
      backupSettings: z.boolean().default(true)
    }))
    .mutation(async ({ input }) => {
      const res = await sendPleskRestRequest(
        '/v1/features/backups/creator',
        'POST',
        input
      );
      if (res.isHostUnreachable) {
        throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
      }
      if (res.isAuthError) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        const msg =
          asRecord(res.data)?.meta && typeof (asRecord(res.data)?.meta as Record<string, unknown>)?.message === 'string'
            ? String((asRecord(res.data)?.meta as Record<string, unknown>).message)
            : 'Failed to start backup';
        throw new TRPCError({ code: 'BAD_REQUEST', message: msg });
      }
      const task = extractTaskFromResponse(res.data);
      const rawUrl =
        typeof (res.data as { url?: string })?.url === 'string'
          ? (res.data as { url: string }).url
          : null;
      const taskUrl =
        rawUrl && rawUrl.includes('background-tasks')
          ? tryNormalizeWpToolkitTaskUrl(rawUrl)
          : null;
      return {
        taskUrl,
        task,
        started: Boolean(taskUrl || task?.id),
      };
    }),

  restoreBackup: protectedProcedure
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

  getBackups: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(`/v1/installations/${input.installationId}/backups`);
    }),

  deleteBackup: protectedProcedure
    .input(z.object({
      installationId: z.number(),
      fileName: z.string()
    }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/backups?files[]=${encodeURIComponent(input.fileName)}`,
        'DELETE',
        { delete: true }
      );
    }),

  getBackupsList: protectedProcedure
    .input(
      z.object({
        installationId: z.number(),
        showAllBackups: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      const qs = input.showAllBackups ? "?showAllBackups=true" : "";
      const [metaRes, flatRes] = await Promise.all([
        sendPleskRestRequest(
          `/v1/installations/${input.installationId}/backups/meta${qs}`,
        ),
        sendPleskRestRequest(`/v1/installations/${input.installationId}/backups`),
      ]);

      const metaParsed =
        metaRes.statusCode >= 200 && metaRes.statusCode < 300
          ? parseBackupsMetaList(metaRes.data)
          : { items: [] as ReturnType<typeof parseBackupsMetaList>["items"] };

      const flat =
        flatRes.statusCode >= 200 && flatRes.statusCode < 300
          ? parseBackupsFlatList(flatRes.data)
          : [];

      const byName = new Map<string, (typeof metaParsed.items)[0]>();
      for (const item of [...metaParsed.items, ...flat]) {
        byName.set(item.fileName, { ...byName.get(item.fileName), ...item });
      }

      return {
        items: Array.from(byName.values()),
        fileManagerUrl: metaParsed.fileManagerUrl,
        limit: metaParsed.limit,
        dirName: metaParsed.dirName,
      };
    }),

  // --- Updates checker ---
  getUpdatesChecker: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      const q = `installationsIds[]=${input.installationId}`;
      return sendPleskRestRequest(`/v1/updates-checker?${q}`);
    }),

  startUpdatesCheck: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest("/v1/updates-checker", "POST", {
        installationsIds: [input.installationId],
        skipBrokenInstallations: false,
        skipInfectedInstallations: false,
        skipUnsupportedInstallations: false,
      });
    }),

  // --- Vulnerabilities ---
  getVulnerabilities: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      const q = `installationsIds[]=${input.installationId}`;
      return sendPleskRestRequest(`/v1/vulnerabilities-checker?${q}`);
    }),

  startVulnerabilityCheck: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest("/v1/vulnerabilities-checker", "POST", {
        installationsIds: [input.installationId],
        skipBrokenInstallations: false,
        skipInfectedInstallations: false,
        skipUnsupportedInstallations: false,
      });
    }),

  // --- Security measures (start check) ---
  startSecurityCheck: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest("/v1/security-measures/checker", "POST", {
        installationsIds: [input.installationId],
        skipBrokenInstallations: false,
        skipInfectedInstallations: false,
        skipUnsupportedInstallations: false,
      });
    }),

  // --- Security policies ---
  getSecurityPolicies: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/vulnerability/security-policies`,
      );
    }),

  updateSecurityPolicies: protectedProcedure
    .input(
      z.object({
        installationId: z.number(),
        core: z
          .object({
            updateVulnerable: z.boolean().optional(),
            applyVirtualPatches: z.boolean().optional(),
          })
          .optional(),
        plugins: z
          .object({
            updateVulnerable: z.boolean().optional(),
            deactivateVulnerable: z.boolean().optional(),
            applyVirtualPatches: z.boolean().optional(),
          })
          .optional(),
        themes: z
          .object({
            updateVulnerable: z.boolean().optional(),
            applyVirtualPatches: z.boolean().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { installationId, ...body } = input;
      return sendPleskRestRequest(
        `/v1/installations/${installationId}/features/vulnerability/security-policies`,
        "PATCH",
        body,
      );
    }),

  updateVulnerabilityFiltering: protectedProcedure
    .input(z.object({ installationId: z.number(), status: z.boolean() }))
    .mutation(async ({ input }) => {
      return sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/vulnerability/filtering`,
        "PATCH",
        { status: input.status },
      );
    }),

  applyVirtualPatches: protectedProcedure
    .input(
      z.object({
        installationId: z.number(),
        status: z.boolean(),
        dryRun: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { installationId, status, dryRun } = input;
      const qs = dryRun ? "?dry-run=true" : "";
      return sendPleskRestRequest(`/v1/features/virtual-patches/protector${qs}`, "POST", {
        installationsIds: [installationId],
        status,
        skipBrokenInstallations: false,
        skipInfectedInstallations: false,
        skipUnsupportedInstallations: false,
      });
    }),

  // --- WP-Cron takeover ---
  getWpCronTakeoverMeta: protectedProcedure
    .input(z.object({ installationId: z.number() }))
    .query(async ({ input }) => {
      const res = await sendPleskRestRequest(
        `/v1/installations/${input.installationId}/features/wp-cron-takeover/meta`,
      );
      if (res.statusCode >= 200 && res.statusCode < 300 && res.data) {
        return { data: parseWpCronMeta(res.data) };
      }
      return { data: null };
    }),

  updateWpCronTakeover: protectedProcedure
    .input(
      z.object({
        installationId: z.number(),
        status: z.boolean().optional(),
        taskReplacementStatus: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { installationId, ...body } = input;
      return sendPleskRestRequest(
        `/v1/installations/${installationId}/features/wp-cron-takeover`,
        "PATCH",
        body,
      );
    }),

  // --- License ---
  getLicenseInfo: protectedProcedure.query(async () => {
    return sendPleskRestRequest("/v1/license-info");
  }),

  refreshLicenseInfo: protectedProcedure.mutation(async () => {
    return sendPleskRestRequest("/v1/license-info/updater", "POST", { confirm: true });
  }),
});
