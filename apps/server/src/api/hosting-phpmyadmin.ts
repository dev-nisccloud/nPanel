import { TRPCError } from "@trpc/server";
import type { Context } from "hono";
import { createContext } from "@npanel/api";
import { createPhpMyAdminSsoRedirect } from "@npanel/api/lib/plesk/phpmyadmin-sso";
import { bootstrapPhpMyAdminEmbed } from "./hosting-phpmyadmin-proxy";

function httpStatusForTrpc(error: TRPCError): number {
  switch (error.code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "BAD_REQUEST":
      return 400;
    case "TOO_MANY_REQUESTS":
      return 429;
    case "SERVICE_UNAVAILABLE":
      return 503;
    case "BAD_GATEWAY":
      return 502;
    default:
      return 500;
  }
}

export async function handlePhpMyAdminSso(c: Context) {
  const siteId = Number(c.req.query("siteId"));
  const databaseId = Number(c.req.query("databaseId"));
  const teamId = c.req.query("teamId") || undefined;

  if (!Number.isInteger(siteId) || siteId <= 0 || !Number.isInteger(databaseId) || databaseId <= 0) {
    return c.text("siteId and databaseId are required", 400);
  }

  try {
    const ctx = await createContext({ context: c });
    if (!ctx.session?.user?.id) {
      return c.text("Unauthorized", 401);
    }

    const url = await createPhpMyAdminSsoRedirect({
      siteId,
      databaseId,
      userId: ctx.session.user.id,
      role: ctx.session.user.role,
      teamId,
      userIp: ctx.ipAddress,
    });

    const embed = c.req.query("embed") === "1";
    if (embed) {
      return bootstrapPhpMyAdminEmbed(c, url);
    }

    return c.redirect(url, 302);
  } catch (error) {
    console.error("[phpMyAdmin SSO] error:", error);
    if (error instanceof TRPCError) {
      return c.text(error.message, httpStatusForTrpc(error));
    }
    return c.text(error instanceof Error ? error.message : "Failed to open phpMyAdmin", 500);
  }
}
