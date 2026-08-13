import { TRPCError } from "@trpc/server";
import { assertCanAccessPleskSite } from "./hosting-access";
import { fetchPleskDatabaseById, fetchPleskDatabaseUsers, isMysqlFamily } from "./database-ops";
import {
  buildPleskPhpMyAdminSsoUrl,
  createPleskUiSession,
  fetchWebspaceOwnerContext,
} from "./session";

export async function createPhpMyAdminSsoRedirect(params: {
  siteId: number;
  databaseId: number;
  userId: string;
  role: string | null | undefined;
  teamId?: string;
  userIp?: string | null;
}): Promise<string> {
  await assertCanAccessPleskSite({
    siteId: params.siteId,
    userId: params.userId,
    role: params.role,
    teamId: params.teamId,
  });

  const [database, owner, users] = await Promise.all([
    fetchPleskDatabaseById(params.siteId, params.databaseId),
    fetchWebspaceOwnerContext(params.siteId),
    fetchPleskDatabaseUsers(params.databaseId),
  ]);

  if (!isMysqlFamily(database.type)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "phpMyAdmin is only available for MySQL and MariaDB databases",
    });
  }

  if (users.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Create a database user first. phpMyAdmin signs in with that user.",
    });
  }

  const sessionId = await createPleskUiSession({
    login: owner.ownerLogin,
    userIp: params.userIp,
    domainName: owner.domainName,
  });

  return buildPleskPhpMyAdminSsoUrl({
    sessionId,
    databaseId: database.id,
  });
}
