/**
 * Facebook Pages imported for Social Media Ads.
 * Separate from ad accounts stored on customer_platform_asset.
 */

import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import {
  customerOAuthActivityLog,
  customerOAuthConnection,
  facebookPage,
} from "@npanel/db/schema";
import { MetaOAuthProvider } from "../../lib/meta-oauth-provider";
import { decryptToken, encryptToken } from "../../lib/oauth-encryption";
import { protectedProcedure, router } from "../../trpc";

const metaProvider = new MetaOAuthProvider();

function parseUtcDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date;
}

function defaultPageRange(): { since: string; until: string } {
  const until = new Date();
  const since = new Date(Date.UTC(until.getUTCFullYear(), until.getUTCMonth(), until.getUTCDate() - 29));
  const end = new Date(Date.UTC(until.getUTCFullYear(), until.getUTCMonth(), until.getUTCDate()));
  const format = (date: Date) => date.toISOString().slice(0, 10);
  return { since: format(since), until: format(end) };
}

type CachedPage = {
  platformAssetId: string;
  name: string;
  username?: string;
  profilePictureUrl?: string;
  description?: string;
  accountAccessToken?: string;
};

function cachedPages(selectionData: unknown): CachedPage[] | null {
  if (!Array.isArray(selectionData)) return null;
  return selectionData.filter(
    (page): page is CachedPage =>
      !!page &&
      typeof page === "object" &&
      typeof (page as CachedPage).platformAssetId === "string" &&
      typeof (page as CachedPage).name === "string",
  );
}

export const customerOAuthFacebookPagesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const pages = await ctx.db
      .select({
        id: facebookPage.id,
        connectionId: facebookPage.connectionId,
        pageId: facebookPage.pageId,
        name: facebookPage.name,
        username: facebookPage.username,
        category: facebookPage.category,
        pictureUrl: facebookPage.pictureUrl,
      })
      .from(facebookPage)
      .where(and(eq(facebookPage.userId, ctx.session.user.id), eq(facebookPage.isActive, true)))
      .orderBy(asc(facebookPage.name));

    return pages;
  }),

  importPages: protectedProcedure
    .input(
      z.object({
        connectionId: z.string(),
        selectedPageIds: z.array(z.string()).min(1, "Choose at least one Page"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const connection = await ctx.db.query.customerOAuthConnection.findFirst({
        where: and(
          eq(customerOAuthConnection.id, input.connectionId),
          eq(customerOAuthConnection.userId, ctx.session.user.id),
          eq(customerOAuthConnection.platform, "meta_facebook_pages"),
        ),
      });

      if (!connection) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Facebook Pages connection not found" });
      }
      if (connection.status !== "PENDING_SELECTION" && connection.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reconnect Facebook before importing Pages",
        });
      }

      let available = cachedPages(connection.selectionData);
      const selectedSet = new Set(input.selectedPageIds);
      const cacheHasSelection =
        available != null && input.selectedPageIds.every((pageId) => available?.some((page) => page.platformAssetId === pageId));

      if (!cacheHasSelection) {
        try {
          available = await metaProvider.fetchFacebookPages(decryptToken(connection.accessToken));
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Could not load Facebook Pages",
          });
        }
      }

      const selected = (available ?? []).filter((page) => selectedSet.has(page.platformAssetId));
      if (selected.length !== input.selectedPageIds.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Some selected Pages are not on this Facebook account" });
      }
      if (selected.some((page) => !page.accountAccessToken)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Facebook did not return a Page access token. Reconnect and import again.",
        });
      }

      const now = new Date();
      await ctx.db
        .update(facebookPage)
        .set({ isActive: false, updatedAt: now })
        .where(eq(facebookPage.connectionId, connection.id));

      for (const page of selected) {
        const stored = {
          name: page.name,
          username: page.username ?? null,
          category: page.description ?? null,
          pictureUrl: page.profilePictureUrl ?? null,
          pageAccessToken: encryptToken(page.accountAccessToken as string),
          isActive: true,
          updatedAt: now,
        };
        const existing = await ctx.db.query.facebookPage.findFirst({
          where: and(eq(facebookPage.connectionId, connection.id), eq(facebookPage.pageId, page.platformAssetId)),
        });
        if (existing) {
          await ctx.db.update(facebookPage).set(stored).where(eq(facebookPage.id, existing.id));
          continue;
        }
        await ctx.db.insert(facebookPage).values({
          id: crypto.randomUUID(),
          connectionId: connection.id,
          userId: connection.userId,
          pageId: page.platformAssetId,
          ...stored,
        });
      }

      await ctx.db
        .update(customerOAuthConnection)
        .set({
          status: "ACTIVE",
          awaitingAccountSelection: false,
          selectionData: null,
          updatedAt: now,
        })
        .where(eq(customerOAuthConnection.id, connection.id));

      await ctx.db.insert(customerOAuthActivityLog).values({
        id: crypto.randomUUID(),
        connectionId: connection.id,
        userId: connection.userId,
        action: "select_assets",
        status: "SUCCESS",
        description: `Imported ${selected.length} Facebook Pages`,
        metadata: { assetCount: selected.length, assetTypes: ["facebook_page"] },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { imported: selected.length };
    }),

  details: protectedProcedure
    .input(
      z.object({
        pageId: z.string(),
        timeRange: z
          .object({
            since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const page = await ctx.db.query.facebookPage.findFirst({
        where: and(
          eq(facebookPage.id, input.pageId),
          eq(facebookPage.userId, ctx.session.user.id),
          eq(facebookPage.isActive, true),
        ),
      });
      if (!page) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Facebook Page not found" });
      }

      const range = input.timeRange ?? defaultPageRange();
      const sinceDate = parseUtcDate(range.since);
      const untilDate = parseUtcDate(range.until);
      if (!sinceDate || !untilDate || sinceDate > untilDate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a valid date range" });
      }
      const since = Math.floor(sinceDate.getTime() / 1000);
      const until = Math.floor(Date.UTC(untilDate.getUTCFullYear(), untilDate.getUTCMonth(), untilDate.getUTCDate() + 1) / 1000);
      if (until - since > 90 * 86_400) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Facebook Page insights only cover 90 days at a time",
        });
      }

      const token = decryptToken(page.pageAccessToken);
      const [profile, insights, posts] = await Promise.all([
        metaProvider.fetchPageProfile(page.pageId, token),
        metaProvider.fetchPageInsights(page.pageId, token, since, until),
        metaProvider.fetchRecentPagePosts(page.pageId, token),
      ]);

      return {
        profile,
        insights,
        posts,
        timeRange: range,
      };
    }),
});
