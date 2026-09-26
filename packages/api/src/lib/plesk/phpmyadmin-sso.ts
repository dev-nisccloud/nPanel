import { TRPCError } from "@trpc/server";
import { assertCanAccessPleskSite } from "./hosting-access";
import { fetchPleskDatabaseById, fetchPleskDatabaseUsers, isMysqlFamily } from "./database-ops";
import {
  buildPleskPhpMyAdminSsoUrl,
  createPleskUiSession,
  fetchWebspaceOwnerContext,
  getPleskPanelBase,
} from "./session";

const PHP_MYADMIN_USER_ERROR =
  "An error occurred. Please try again later or contact support.";

/** Only the Plesk one-time session URL may be handed to the browser. */
export function assertPleskPhpMyAdminSsoUrl(url: string, databaseId: number): string {
  const panel = new URL(getPleskPanelBase());
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: PHP_MYADMIN_USER_ERROR,
    });
  }

  const sessionId = parsed.searchParams.get("PLESKSESSID") ?? "";
  const redirect = parsed.searchParams.get("success_redirect_url");
  const allowedKeys = new Set(["PLESKSESSID", "success_redirect_url"]);
  const unexpectedKey = [...parsed.searchParams.keys()].some((key) => !allowedKeys.has(key));

  if (
    parsed.protocol !== "https:" ||
    parsed.origin !== panel.origin ||
    parsed.username ||
    parsed.password ||
    parsed.hash ||
    parsed.pathname !== "/enterprise/rsession_init.php" ||
    unexpectedKey ||
    !sessionId ||
    sessionId.length > 512 ||
    /[\s"'<>\\]/.test(sessionId) ||
    redirect !== `/smb/database/webadmin/id/${databaseId}`
  ) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: PHP_MYADMIN_USER_ERROR,
    });
  }

  return parsed.toString();
}

export async function createPhpMyAdminSsoRedirect(params: {
  siteId: number;
  databaseId: number;
  userId: string;
  role: string | null | undefined;
  teamId?: string;
  userIp?: string | null;
}): Promise<string> {
  try {
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
        message: PHP_MYADMIN_USER_ERROR,
      });
    }

    if (users.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: PHP_MYADMIN_USER_ERROR,
      });
    }

    const sessionId = await createPleskUiSession({
      login: owner.ownerLogin,
      userIp: params.userIp,
      domainName: owner.domainName,
    });

    return assertPleskPhpMyAdminSsoUrl(
      buildPleskPhpMyAdminSsoUrl({
        sessionId,
        databaseId: database.id,
      }),
      database.id,
    );
  } catch (error) {
    console.error("[phpMyAdmin SSO]", error);
    if (error instanceof TRPCError && error.message === PHP_MYADMIN_USER_ERROR) {
      throw error;
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: PHP_MYADMIN_USER_ERROR,
    });
  }
}
