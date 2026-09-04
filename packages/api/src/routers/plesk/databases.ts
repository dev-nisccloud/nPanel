import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import { assertCanAccessPleskSite } from "../../lib/plesk/hosting-access";
import { getPleskDatabaseConnectionInfo } from "../../lib/plesk/database-ops";
import { getRelatedSitesByDatabaseId } from "../../lib/plesk/database-related-site";
import { createPhpMyAdminSsoRedirect } from "../../lib/plesk/phpmyadmin-sso";
import { sendPleskXmlOrThrow } from "../../lib/plesk/xml-utils";

function buildDatabaseGetXml(siteId: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <database>
    <get-db>
      <filter>
        <webspace-id>${siteId}</webspace-id>
      </filter>
    </get-db>
  </database>
</packet>`;
}

export const databasesRouter = router({
  getBySiteId: protectedProcedure
    .input(z.object({ siteId: z.number() }))
    .query(async ({ input, ctx }) => {
      const { siteId } = input;

      try {
        await assertCanAccessPleskSite({
          siteId,
          userId: ctx.session.user.id,
          role: ctx.session.user.role,
          key: "hosting.databases",
          access: "read",
        });

        const { xml, parsed } = await sendPleskXmlOrThrow(buildDatabaseGetXml(siteId));
        return {
          raw: xml,
          parsed,
        };
      } catch (error) {
        console.error("Plesk Databases API Error:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch databases",
          cause: error,
        });
      }
    }),

  getRelatedSites: protectedProcedure
    .input(z.object({ siteId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      await assertCanAccessPleskSite({
        siteId: input.siteId,
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
      });

      try {
        return {
          relatedSites: await getRelatedSitesByDatabaseId(input.siteId),
        };
      } catch (error) {
        console.error("[Plesk related site] lookup failed:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch related sites",
          cause: error,
        });
      }
    }),

  getConnectionInfo: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        databaseId: z.number().int().positive(),
        teamId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      await assertCanAccessPleskSite({
        siteId: input.siteId,
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        teamId: input.teamId,
      });

      try {
        return await getPleskDatabaseConnectionInfo({
          siteId: input.siteId,
          databaseId: input.databaseId,
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch database connection info",
          cause: error,
        });
      }
    }),

  getPhpMyAdminUrl: protectedProcedure
    .input(
      z.object({
        siteId: z.number().int().positive(),
        databaseId: z.number().int().positive(),
        teamId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const url = await createPhpMyAdminSsoRedirect({
        siteId: input.siteId,
        databaseId: input.databaseId,
        userId: ctx.session.user.id,
        role: ctx.session.user.role,
        teamId: input.teamId,
        userIp: ctx.ipAddress,
      });
      return { url };
    }),
});
