import { request, Agent } from "undici";
import { TRPCError } from "@trpc/server";
import {
  asArray,
  escapeXml,
  pleskOperationError,
  pleskXmlInt,
  pleskXmlScalar,
  sendPleskXmlOrThrow,
} from "./xml-utils";
import { getSharedHostingDbHost } from "./database-ops";

const pleskSessionAgent = new Agent({
  connections: 4,
  pipelining: 1,
  keepAliveTimeout: 60000,
  keepAliveMaxTimeout: 60000,
});

function getPleskPort(): string {
  return process.env.PLESK_API_PORT || "8443";
}

export function getPleskPanelBase(): string {
  return `https://${getSharedHostingDbHost()}:${getPleskPort()}`;
}

function requireSecretKey(): string {
  const key = process.env.PLESK_SECRET_KEY;
  if (!key) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "PLESK_SECRET_KEY environment variable is required",
    });
  }
  return key;
}

function isPrivateOrLocalIp(ip: string | null | undefined): boolean {
  if (!ip) return true;
  const value = ip.trim().toLowerCase();
  if (value === "127.0.0.1" || value === "::1" || value === "localhost") return true;
  if (value.startsWith("10.")) return true;
  if (value.startsWith("192.168.")) return true;
  if (value.startsWith("172.")) {
    const second = Number(value.split(".")[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

function publicUserIp(ip?: string | null): string | undefined {
  if (!ip || isPrivateOrLocalIp(ip)) return undefined;
  return ip.trim();
}

function toBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

async function fetchCustomerLoginById(customerId: number): Promise<string | undefined> {
  const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <customer>
    <get>
      <filter>
        <id>${customerId}</id>
      </filter>
      <dataset>
        <gen_info/>
      </dataset>
    </get>
  </customer>
</packet>`);

  const packet = parsed.packet as Record<string, unknown> | undefined;
  const customer = packet?.customer as Record<string, unknown> | undefined;
  const getNode = customer?.get as Record<string, unknown> | undefined;
  const result = asArray(getNode?.result)[0] as Record<string, unknown> | undefined;
  if (!result || pleskXmlScalar(result.status)?.toLowerCase() === "error") {
    return undefined;
  }
  const data = result.data as Record<string, unknown> | undefined;
  const genInfo = data?.gen_info as Record<string, unknown> | undefined;
  return pleskXmlScalar(genInfo?.login);
}

export interface WebspaceOwnerContext {
  ownerLogin: string;
  domainName?: string;
}

/**
 * Plesk panel login of the subscription owner (`owner-login` / customer by `owner-id`).
 * FTP system users are not Plesk UI logins and cannot be used for phpMyAdmin SSO.
 */
export async function fetchWebspaceOwnerContext(siteId: number): Promise<WebspaceOwnerContext> {
  const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <get>
      <filter>
        <id>${siteId}</id>
      </filter>
      <dataset>
        <gen_info/>
      </dataset>
    </get>
  </webspace>
</packet>`);

  const packet = parsed.packet as Record<string, unknown> | undefined;
  const webspace = packet?.webspace as Record<string, unknown> | undefined;
  const getNode = webspace?.get as Record<string, unknown> | undefined;
  const result = asArray(getNode?.result)[0] as Record<string, unknown> | undefined;
  if (!result || pleskXmlScalar(result.status)?.toLowerCase() === "error") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Hosting subscription was not found on the server",
    });
  }

  const data = result.data as Record<string, unknown> | undefined;
  const genInfo = data?.gen_info as Record<string, unknown> | undefined;
  const domainName = pleskXmlScalar(genInfo?.name) || pleskXmlScalar(genInfo?.["ascii-name"]);
  let ownerLogin = pleskXmlScalar(genInfo?.["owner-login"]);
  if (!ownerLogin) {
    const ownerId = pleskXmlInt(genInfo?.["owner-id"]);
    if (ownerId) {
      ownerLogin = await fetchCustomerLoginById(ownerId);
    }
  }

  if (!ownerLogin) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Could not find the Plesk owner for this hosting subscription",
    });
  }

  return { ownerLogin, domainName };
}

async function createPleskUiSessionViaXml(
  login: string,
  userIp?: string,
  domainName?: string,
): Promise<string> {
  // XML API: values from user_ip through back_url must be Base64.
  const encodedIp = userIp ? toBase64(userIp) : "";
  const domainXml = domainName
    ? `<domain>${toBase64(domainName)}</domain>`
    : "";
  const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <server>
    <create_session>
      <login>${escapeXml(login)}</login>
      <data>
        <user_ip>${encodedIp}</user_ip>
        <source_server></source_server>
        ${domainXml}
      </data>
    </create_session>
  </server>
</packet>`);

  const packet = parsed.packet as Record<string, unknown> | undefined;
  const server = packet?.server as Record<string, unknown> | undefined;
  const createSession = server?.create_session as Record<string, unknown> | undefined;
  const result = asArray(createSession?.result)[0] as Record<string, unknown> | undefined;
  const err = pleskOperationError(result, `Failed to create Plesk session for ${login}`);
  if (err) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: err.error,
      cause: err.code,
    });
  }
  const id = pleskXmlScalar(result?.id);
  if (!id) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "Plesk did not return a session token",
    });
  }
  return id;
}

async function createPleskUiSessionViaRest(
  login: string,
  userIp?: string,
  domainName?: string,
): Promise<string> {
  const body: { login: string; user_ip?: string; domain?: string } = { login };
  if (userIp) body.user_ip = userIp;
  if (domainName) body.domain = domainName;

  const response = await request(`${getPleskPanelBase()}/api/v2/server/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": requireSecretKey(),
    },
    body: JSON.stringify(body),
    dispatcher: pleskSessionAgent,
    signal: AbortSignal.timeout(30000),
  });

  const responseText = await response.body.text();
  if (response.statusCode !== 201 && response.statusCode !== 200) {
    throw new Error(
      `REST session failed (${response.statusCode}): ${responseText.substring(0, 200)}`,
    );
  }

  const parsed = JSON.parse(responseText) as { id?: string };
  if (!parsed.id) {
    throw new Error("Plesk REST session did not return an id");
  }
  return parsed.id;
}

/**
 * One-time Plesk UI session for the subscription owner. Never impersonate via FTP system user.
 */
export async function createPleskUiSession(params: {
  login: string;
  userIp?: string | null;
  domainName?: string;
}): Promise<string> {
  const login = params.login.trim();
  if (!login) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not resolve a Plesk user for phpMyAdmin",
    });
  }

  const userIp = publicUserIp(params.userIp);
  const domainName = params.domainName?.trim() || undefined;
  try {
    return await createPleskUiSessionViaXml(login, userIp, domainName);
  } catch (xmlError) {
    try {
      return await createPleskUiSessionViaRest(login, userIp, domainName);
    } catch (restError) {
      console.error("[Plesk session] owner login failed:", {
        login,
        xml: xmlError instanceof Error ? xmlError.message : String(xmlError),
        rest: restError instanceof Error ? restError.message : String(restError),
      });
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: "Could not open phpMyAdmin. Please try again in a moment.",
      });
    }
  }
}

export function buildPleskPhpMyAdminSsoUrl(params: {
  sessionId: string;
  databaseId: number;
}): string {
  // Plesk phpMyAdmin uses signon auth. Opening /phpMyAdmin/index.php directly
  // has no MySQL credentials and shows "Cannot connect: invalid settings".
  // Webadmin looks up the DB user password stored in Plesk and then launches PMA.
  const successPath = `/smb/database/webadmin/id/${params.databaseId}`;
  const query = new URLSearchParams({
    PLESKSESSID: params.sessionId,
    success_redirect_url: successPath,
  });
  return `${getPleskPanelBase()}/enterprise/rsession_init.php?${query.toString()}`;
}
