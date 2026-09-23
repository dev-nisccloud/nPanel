import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, inArray, lt } from "@npanel/db";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { metaAdsAccount } from "@npanel/db/schema/meta-ads";
import { googleAdsAccount } from "@npanel/db/schema/google-ads";
import { socialMediaIntegration } from "@npanel/db/schema/social-media-marketing";
import { pleskServerMetricSnapshot } from "@npanel/db/schema/plesk-server-metrics";
import { protectedProcedure, router } from "../trpc";
import { sendPleskXmlRequest } from "../lib/plesk/xml-client";
import { fetchPleskServerStats, type PleskServerStatSnapshot } from "../lib/plesk/server-stats";
import { XMLParser } from "fast-xml-parser";

const PLESK_SNAPSHOT_HOST_KEY = "default";
const PLESK_SNAPSHOT_MIN_INTERVAL_MS = 5 * 60 * 1000;
const PLESK_SNAPSHOT_RETENTION_DAYS = 14;
const PLESK_SNAPSHOT_HISTORY_DAYS = 7;
const PLESK_SNAPSHOT_HISTORY_LIMIT = 2200;

function snapshotRowFromLive(id: string, live: PleskServerStatSnapshot) {
  return {
    id,
    hostKey: PLESK_SNAPSHOT_HOST_KEY,
    capturedAt: new Date(),
    hostname: live.hostname,
    cpu: live.cpu,
    uptimeSeconds: live.uptimeSeconds,
    insideVz: live.insideVz,
    pleskVersion: live.pleskVersion,
    pleskOs: live.pleskOs,
    load1: live.load1,
    load5: live.load5,
    load15: live.load15,
    memTotal: live.memTotal,
    memUsed: live.memUsed,
    memFree: live.memFree,
    memShared: live.memShared,
    memBuffer: live.memBuffer,
    memCached: live.memCached,
    swapTotal: live.swapTotal,
    swapUsed: live.swapUsed,
    swapFree: live.swapFree,
    diskDevices: live.diskDevices,
    objects: live.objects,
    createdAt: new Date(),
  };
}

type ServerMetricsHistoryPoint = {
  capturedAt: Date;
  load1: number | null;
  load5: number | null;
  load15: number | null;
  memUsed: number | null;
  memTotal: number | null;
  swapUsed: number | null;
  swapTotal: number | null;
};

async function loadServerMetrics(opts: { persist: boolean; force: boolean }) {
  let live: PleskServerStatSnapshot | null = null;
  let unavailable = false;
  let reason: "unreachable" | "auth" | "empty" | "parse" | null = null;

  try {
    const fetched = await fetchPleskServerStats();
    live = fetched.snapshot;
    unavailable = fetched.unavailable;
    reason = fetched.reason;
  } catch (error) {
    console.error("Error fetching Plesk server stats:", error);
    unavailable = true;
    reason = "empty";
  }

  if (opts.persist && live) {
    try {
      const [latestStored] = await db
        .select({ capturedAt: pleskServerMetricSnapshot.capturedAt })
        .from(pleskServerMetricSnapshot)
        .where(eq(pleskServerMetricSnapshot.hostKey, PLESK_SNAPSHOT_HOST_KEY))
        .orderBy(desc(pleskServerMetricSnapshot.capturedAt))
        .limit(1);

      const shouldInsert =
        opts.force ||
        !latestStored?.capturedAt ||
        Date.now() - latestStored.capturedAt.getTime() >= PLESK_SNAPSHOT_MIN_INTERVAL_MS;

      if (shouldInsert) {
        await db
          .insert(pleskServerMetricSnapshot)
          .values(snapshotRowFromLive(crypto.randomUUID(), live));

        const cutoff = new Date(
          Date.now() - PLESK_SNAPSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
        );
        await db
          .delete(pleskServerMetricSnapshot)
          .where(lt(pleskServerMetricSnapshot.capturedAt, cutoff));
      }
    } catch (error) {
      console.error("Error persisting Plesk server snapshot:", error);
    }
  }

  let history: ServerMetricsHistoryPoint[] = [];

  try {
    const since = new Date(
      Date.now() - PLESK_SNAPSHOT_HISTORY_DAYS * 24 * 60 * 60 * 1000,
    );
    const rows = await db
      .select({
        capturedAt: pleskServerMetricSnapshot.capturedAt,
        load1: pleskServerMetricSnapshot.load1,
        load5: pleskServerMetricSnapshot.load5,
        load15: pleskServerMetricSnapshot.load15,
        memUsed: pleskServerMetricSnapshot.memUsed,
        memTotal: pleskServerMetricSnapshot.memTotal,
        swapUsed: pleskServerMetricSnapshot.swapUsed,
        swapTotal: pleskServerMetricSnapshot.swapTotal,
      })
      .from(pleskServerMetricSnapshot)
      .where(
        and(
          eq(pleskServerMetricSnapshot.hostKey, PLESK_SNAPSHOT_HOST_KEY),
          gte(pleskServerMetricSnapshot.capturedAt, since),
        ),
      )
      .orderBy(desc(pleskServerMetricSnapshot.capturedAt))
      .limit(PLESK_SNAPSHOT_HISTORY_LIMIT);

    history = rows.reverse();
  } catch (error) {
    console.error("Error loading Plesk server snapshot history:", error);
  }

  return {
    latest: live,
    history,
    unavailable,
    reason,
  };
}

const AGENCY_ROLES = ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"] as const;

const isAgencyUserRole = (role: string | null | undefined) =>
  (AGENCY_ROLES as readonly string[]).includes(role ?? "");

function assertAgencyDashboardAccess(role: string | null | undefined) {
  if (!isAgencyUserRole(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only agency users can view this dashboard data.",
    });
  }
}

/** Unwrap fast-xml-parser text nodes */
function pleskXmlScalar(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value === "object" && value !== null && "#text" in value) {
    const t = (value as { "#text": unknown })["#text"];
    if (t == null) return undefined;
    return String(t).trim();
  }
  return undefined;
}

export const agencyDashboardRouter = router({
  /**
   * Count customer vs agency user accounts for the agency dashboard card,
   * including active / inactive status breakdowns.
   */
  getAccountCounts: protectedProcedure.query(async ({ ctx }) => {
    const sessionUser = ctx.session?.user;
    if (!sessionUser?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." });
    }

    assertAgencyDashboardAccess((sessionUser as { role?: string })?.role);

    try {
      const agencyRoles = [...AGENCY_ROLES];
      const [
        customerTotalRow,
        customerActiveRow,
        agencyTotalRow,
        agencyActiveRow,
      ] = await Promise.all([
        db.select({ value: count() }).from(user).where(eq(user.role, "CUSTOMER")),
        db
          .select({ value: count() })
          .from(user)
          .where(and(eq(user.role, "CUSTOMER"), eq(user.status, "ACTIVE"))),
        db.select({ value: count() }).from(user).where(inArray(user.role, agencyRoles)),
        db
          .select({ value: count() })
          .from(user)
          .where(and(inArray(user.role, agencyRoles), eq(user.status, "ACTIVE"))),
      ]);

      const customersTotal = customerTotalRow[0]?.value ?? 0;
      const customersActive = customerActiveRow[0]?.value ?? 0;
      const agencyTotal = agencyTotalRow[0]?.value ?? 0;
      const agencyActive = agencyActiveRow[0]?.value ?? 0;

      return {
        customers: {
          total: customersTotal,
          active: customersActive,
          inactive: Math.max(0, customersTotal - customersActive),
        },
        agency: {
          total: agencyTotal,
          active: agencyActive,
          inactive: Math.max(0, agencyTotal - agencyActive),
        },
        total: customersTotal + agencyTotal,
      };
    } catch (error) {
      console.error("Error getting account counts:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get account counts",
      });
    }
  }),

  /**
   * Get media buying platforms connection status
   */
  getMediaBuyingPlatforms: protectedProcedure.query(async ({ ctx }) => {
    const sessionUser = ctx.session?.user;
    if (!sessionUser?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." });
    }

    assertAgencyDashboardAccess((sessionUser as { role?: string })?.role);

    try {
      // Get Meta Ads accounts count
      const metaAdsResult = await db
        .select({ count: count() })
        .from(metaAdsAccount);
      const metaAdsConnected = (metaAdsResult[0]?.count || 0) > 0;

      // Get Google Ads accounts count
      const googleAdsResult = await db
        .select({ count: count() })
        .from(googleAdsAccount);
      const googleAdsConnected = (googleAdsResult[0]?.count || 0) > 0;

      // Get LinkedIn integration count (from social_media_integration table)
      const linkedInResult = await db
        .select({ count: count() })
        .from(socialMediaIntegration)
        .where(eq(socialMediaIntegration.platform, "linkedin"));
      const linkedInConnected = (linkedInResult[0]?.count || 0) > 0;

      return {
        platforms: [
          {
            name: "Meta Ads",
            key: "meta_ads",
            connected: metaAdsConnected,
            accountCount: metaAdsResult[0]?.count || 0,
          },
          {
            name: "Google Ads",
            key: "google_ads",
            connected: googleAdsConnected,
            accountCount: googleAdsResult[0]?.count || 0,
          },
          {
            name: "LinkedIn",
            key: "linkedin",
            connected: linkedInConnected,
            accountCount: linkedInResult[0]?.count || 0,
          },
        ],
        totalConnected: [
          metaAdsConnected,
          googleAdsConnected,
          linkedInConnected,
        ].filter(Boolean).length,
      };
    } catch (error) {
      console.error("Error getting media buying platforms:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get media buying platforms status",
      });
    }
  }),

  /**
   * Get hosting subscriptions summary from Plesk
   */
  getHostingSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const sessionUser = ctx.session?.user;
    if (!sessionUser?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." });
    }

    assertAgencyDashboardAccess((sessionUser as { role?: string })?.role);

    try {
      // Fetch all subscriptions from Plesk using the same endpoint as the subscriptions router
      const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <get>
      <filter/>
      <dataset>
        <gen_info/>
        <hosting/>
        <limits/>
        <prefs/>
        <stat/>
        <permissions/>
      </dataset>
    </get>
  </webspace>
</packet>`;

      const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);

      if (isHostUnreachable || isAuthError || !xml?.trim()) {
        return {
          total: 0,
          active: 0,
          suspended: 0,
          cancelled: 0,
          expired: 0,
          pending: 0,
          inactive: 0,
        };
      }

      const parser = new XMLParser({
        ignoreAttributes: false,
        parseAttributeValue: true,
        trimValues: true,
      });
      
      const parsed = parser.parse(xml);

      // Check if webspace exists and has results
      if (!parsed?.packet?.webspace?.get?.result) {
        return {
          total: 0,
          active: 0,
          suspended: 0,
          cancelled: 0,
          expired: 0,
          pending: 0,
          inactive: 0,
        };
      }

      const results = parsed.packet.webspace.get.result;
      const resultArray = Array.isArray(results) ? results : [results];

      let total = 0;
      let active = 0;
      let suspended = 0;

      for (const result of resultArray) {
        const resultStatus = pleskXmlScalar(result?.status);
        // Only count if the result status is "ok"
        if (resultStatus?.toLowerCase() !== "ok") {
          continue;
        }

        total++;
        
        // Check gen_info status (0 = active, anything else = suspended)
        const genStatus = result?.data?.gen_info?.status;
        const genStatusNum = typeof genStatus === "number" ? genStatus : parseInt(String(genStatus || ""), 10);
        
        if (genStatusNum === 0) {
          active++;
        } else {
          suspended++;
        }
      }

      return {
        total,
        active,
        suspended,
        cancelled: 0, // Plesk doesn't have a cancelled status
        expired: 0, // Included in suspended
        pending: 0, // Plesk doesn't have a pending status
        inactive: suspended,
      };
    } catch (error) {
      console.error("Error getting hosting subscriptions from Plesk:", error);
      
      // Return zeros instead of throwing error (dashboard should still load)
      return {
        total: 0,
        active: 0,
        suspended: 0,
        cancelled: 0,
        expired: 0,
        pending: 0,
        inactive: 0,
      };
    }
  }),

  /**
   * Live Plesk server snapshot plus stored history for dashboard charts.
   * Persists a row at most every 5 minutes and drops readings older than 14 days.
   */
  getServerMetrics: protectedProcedure
    .input(
      z
        .object({
          persist: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const sessionUser = ctx.session?.user;
      if (!sessionUser?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." });
      }

      assertAgencyDashboardAccess((sessionUser as { role?: string })?.role);

      return loadServerMetrics({
        persist: input?.persist !== false,
        force: false,
      });
    }),

  /** Pull a fresh Plesk reading, always persist it, and return the updated series. */
  refreshServerMetrics: protectedProcedure.mutation(async ({ ctx }) => {
    const sessionUser = ctx.session?.user;
    if (!sessionUser?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." });
    }

    assertAgencyDashboardAccess((sessionUser as { role?: string })?.role);

    return loadServerMetrics({ persist: true, force: true });
  }),
});
