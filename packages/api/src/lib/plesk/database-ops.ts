import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import {
  asArray,
  escapeXml,
  pleskOperationError,
  pleskXmlInt,
  pleskXmlScalar,
  sendPleskXmlOrThrow,
} from "./xml-utils";

export type PleskDatabaseType = "mysql" | "postgresql" | "mssql" | string;

export interface PleskDatabase {
  id: number;
  name: string;
  type: PleskDatabaseType;
  status?: string;
  webspaceId?: number;
  dbServerId?: number;
  /** From get-db `default-user-id`. Not the database server administrator. */
  defaultUserId: number | null;
  /**
   * Per-database size in bytes when get-db includes one.
   * The documented get-db response has no size node, so this stays null.
   */
  sizeBytes: number | null;
}

export interface PleskDatabaseUser {
  id: number;
  login: string;
  dbId?: number;
}

export function getSharedHostingDbHost(): string {
  return (
    process.env.PLESK_PUBLIC_HOSTNAME ||
    process.env.VITE_PUBLIC_PLESK_HOST ||
    "orion.nisccloud.com"
  );
}

export function portForDatabaseType(type: string | undefined): number {
  const t = (type || "mysql").toLowerCase();
  if (t === "postgresql") return 5432;
  if (t === "mssql") return 1433;
  return 3306;
}

export function isMysqlFamily(type: string | undefined): boolean {
  const t = (type || "mysql").toLowerCase();
  return t === "mysql" || t === "mariadb";
}

export function generateDatabasePassword(): string {
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowers = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const specials = "!@#$%^&*-_";
  const all = uppers + lowers + digits + specials;
  const pick = (set: string) => set[randomBytes(1)[0]! % set.length]!;
  const chars = [pick(uppers), pick(lowers), pick(digits), pick(specials)];
  for (let i = chars.length; i < 16; i++) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0]! % (i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

function packetDatabase(parsed: Record<string, unknown>): Record<string, unknown> | undefined {
  const packet = parsed.packet as Record<string, unknown> | undefined;
  return packet?.database as Record<string, unknown> | undefined;
}

function parseDbResult(raw: unknown): PleskDatabase | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = pleskXmlInt(row.id);
  const name = pleskXmlScalar(row.name);
  if (!id || !name) return null;
  const defaultUserId = pleskXmlInt(row["default-user-id"]);
  return {
    id,
    name,
    type: (pleskXmlScalar(row.type) || "mysql") as PleskDatabaseType,
    status: pleskXmlScalar(row.status),
    webspaceId: pleskXmlInt(row["webspace-id"]),
    dbServerId: pleskXmlInt(row["db-server-id"]),
    defaultUserId: defaultUserId && defaultUserId > 0 ? defaultUserId : null,
    sizeBytes: optionalByteCount(row.size ?? row["disk-usage"] ?? row.disk_usage ?? row.quota),
  };
}

function parseUserResult(raw: unknown): PleskDatabaseUser | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = pleskXmlInt(row.id);
  const login = pleskXmlScalar(row.login);
  if (!id || !login) return null;
  return {
    id,
    login,
    dbId: pleskXmlInt(row["db-id"]),
  };
}

export async function fetchPleskDatabasesBySiteId(siteId: number): Promise<PleskDatabase[]> {
  const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <database>
    <get-db>
      <filter>
        <webspace-id>${siteId}</webspace-id>
      </filter>
    </get-db>
  </database>
</packet>`);

  const getDb = packetDatabase(parsed)?.["get-db"] as Record<string, unknown> | undefined;
  return asArray(getDb?.result).map(parseDbResult).filter((db): db is PleskDatabase => db != null);
}

export async function fetchPleskDatabaseById(
  siteId: number,
  databaseId: number,
): Promise<PleskDatabase> {
  const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <database>
    <get-db>
      <filter>
        <id>${databaseId}</id>
      </filter>
    </get-db>
  </database>
</packet>`);

  const getDb = packetDatabase(parsed)?.["get-db"] as Record<string, unknown> | undefined;
  const match = asArray(getDb?.result)
    .map(parseDbResult)
    .find((db): db is PleskDatabase => db != null && db.id === databaseId);

  if (!match || (match.webspaceId != null && match.webspaceId !== siteId)) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Database not found on this hosting subscription",
    });
  }
  return match;
}

export async function fetchPleskDatabaseUsers(databaseId: number): Promise<PleskDatabaseUser[]> {
  const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <database>
    <get-db-users>
      <filter>
        <db-id>${databaseId}</db-id>
      </filter>
    </get-db-users>
  </database>
</packet>`);

  const getUsers = packetDatabase(parsed)?.["get-db-users"] as Record<string, unknown> | undefined;
  return asArray(getUsers?.result)
    .map(parseUserResult)
    .filter((user): user is PleskDatabaseUser => user != null);
}

export async function fetchPleskDefaultUserId(databaseId: number): Promise<number | null> {
  try {
    const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <database>
    <get-default-user>
      <filter>
        <db-id>${databaseId}</db-id>
      </filter>
    </get-default-user>
  </database>
</packet>`);

    const getDefault = packetDatabase(parsed)?.["get-default-user"] as
      | Record<string, unknown>
      | undefined;
    const results = asArray(getDefault?.result);
    for (const raw of results) {
      if (!raw || typeof raw !== "object") continue;
      const row = raw as Record<string, unknown>;
      if (pleskXmlScalar(row.status)?.toLowerCase() === "error") continue;
      const id = pleskXmlInt(row.id) ?? pleskXmlInt(row["default-user-id"]);
      if (id && id > 0) return id;
    }
  } catch {
    return null;
  }
  return null;
}

export async function addPleskDatabaseUser(params: {
  databaseId: number;
  login: string;
  password: string;
}): Promise<number> {
  const { xml, parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <database>
    <add-db-user>
      <db-id>${params.databaseId}</db-id>
      <login>${escapeXml(params.login)}</login>
      <password>${escapeXml(params.password)}</password>
    </add-db-user>
  </database>
</packet>`);

  const addUser = packetDatabase(parsed)?.["add-db-user"] as Record<string, unknown> | undefined;
  const result = asArray(addUser?.result)[0] as Record<string, unknown> | undefined;
  const err = pleskOperationError(result, "Failed to create database user");
  if (err) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: err.error,
      cause: err.code,
    });
  }
  const userId = pleskXmlInt(result?.id);
  if (!userId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Plesk did not return a database user id",
      cause: xml,
    });
  }
  return userId;
}

export async function setPleskDefaultDatabaseUser(
  databaseId: number,
  userId: number,
): Promise<void> {
  const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <database>
    <set-default-user>
      <db-id>${databaseId}</db-id>
      <default-user-id>${userId}</default-user-id>
    </set-default-user>
  </database>
</packet>`);

  const setDefault = packetDatabase(parsed)?.["set-default-user"] as
    | Record<string, unknown>
    | undefined;
  const result = asArray(setDefault?.result)[0] as Record<string, unknown> | undefined;
  const err = pleskOperationError(result, "Failed to set default database user");
  if (err) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: err.error,
      cause: err.code,
    });
  }
}

export async function setPleskDatabaseUser(params: {
  userId: number;
  password?: string;
  passwordType?: "plain" | "crypt";
  role?: "readWrite" | "readOnly" | "writeOnly";
  acl?: string[];
  allowAccessFrom?: string[];
}): Promise<{ xml: string; parsed: Record<string, unknown> }> {
  // Packet shape from Plesk set-db-user docs: id, password, password-type, acl/host, allow-access-from/ip-address, role.
  const parts: string[] = [`<id>${params.userId}</id>`];
  if (params.password) {
    parts.push(`<password>${escapeXml(params.password)}</password>`);
    parts.push(`<password-type>${params.passwordType || "plain"}</password-type>`);
  }
  if (params.acl && params.acl.length > 0) {
    parts.push(`<acl>${params.acl.map((host) => `<host>${escapeXml(host)}</host>`).join("")}</acl>`);
  }
  if (params.allowAccessFrom && params.allowAccessFrom.length > 0) {
    parts.push(
      `<allow-access-from>${params.allowAccessFrom
        .map((ip) => `<ip-address>${escapeXml(ip)}</ip-address>`)
        .join("")}</allow-access-from>`,
    );
  }
  if (params.role) {
    parts.push(`<role>${params.role}</role>`);
  }

  const { xml, parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <database>
    <set-db-user>
      ${parts.join("\n      ")}
    </set-db-user>
  </database>
</packet>`);

  const setUser = packetDatabase(parsed)?.["set-db-user"] as Record<string, unknown> | undefined;
  const result = asArray(setUser?.result)[0] as Record<string, unknown> | undefined;
  const err = pleskOperationError(result, "Failed to update database user");
  if (err) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: err.error,
      cause: err.code,
    });
  }
  return { xml, parsed };
}

function optionalByteCount(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "object") return null;
  const n = pleskXmlInt(value);
  if (n == null || n < 0) return null;
  return n;
}

function packetOperator(
  parsed: Record<string, unknown>,
  name: string,
): Record<string, unknown> | undefined {
  const packet = parsed.packet as Record<string, unknown> | undefined;
  const node = packet?.[name];
  if (!node || typeof node !== "object") return undefined;
  return node as Record<string, unknown>;
}

/**
 * Customer-facing engine. Plesk XML API has no `mariadb` type: MariaDB is
 * created and listed as `mysql` (Creating Databases, Obsidian XML API).
 * A version string that names MySQL and not MariaDB is labeled MySQL.
 */
export function databaseEnginePresentation(
  pleskType: string | undefined,
  version: string | null,
): {
  engine: "mariadb" | "postgresql" | "mysql" | "other";
  engineLabel: string;
  pleskType: "mysql" | "postgresql";
} | null {
  const type = (pleskType || "").toLowerCase();
  const versionText = (version || "").toLowerCase();
  if (type === "postgresql") {
    return { engine: "postgresql", engineLabel: "PostgreSQL", pleskType: "postgresql" };
  }
  if (type === "mysql" || type === "mariadb") {
    if (versionText.includes("mysql") && !versionText.includes("mariadb")) {
      return { engine: "mysql", engineLabel: "MySQL", pleskType: "mysql" };
    }
    return { engine: "mariadb", engineLabel: "MariaDB", pleskType: "mysql" };
  }
  return null;
}

export interface PleskDatabaseEngineOption {
  id: "mariadb" | "postgresql" | "mysql";
  /** Value sent in add-db `<type>`. MariaDB uses `mysql`. */
  pleskType: "mysql" | "postgresql";
  label: string;
  serverId: number;
  port: number;
  /** Null when db_server/get does not include a version node. */
  version: string | null;
}

export interface PleskDatabaseUserSummary {
  id: number;
  login: string;
}

export interface PleskDatabaseCatalogEntry {
  id: number;
  name: string;
  type: string;
  status?: string;
  webspaceId?: number;
  dbServerId?: number;
  engine: "mariadb" | "postgresql" | "mysql" | "other";
  engineLabel: string;
  version: string | null;
  sizeBytes: number | null;
  port: number;
  localHost: string;
  remoteHost: string;
  users: PleskDatabaseUserSummary[];
  defaultUserId: number | null;
}

export interface PleskDatabaseCatalog {
  engines: PleskDatabaseEngineOption[];
  databases: PleskDatabaseCatalogEntry[];
  /**
   * Combined database disk usage for the subscription, from webspace disk_usage.
   * This is not a per-database size.
   */
  subscriptionDatabaseBytes: number | null;
}

interface DbServerRecord {
  id: number;
  type: string;
  host: string;
  port: number;
  status: string;
  local: boolean;
  version: string | null;
}

function readServerVersion(data: Record<string, unknown>): string | null {
  for (const key of ["version", "server-version", "server_version"]) {
    const value = pleskXmlScalar(data[key]);
    if (value) return value;
  }
  return null;
}

/** Reads db_server/get data and drops administrator login and password. */
function parseDbServerRecord(id: number, data: Record<string, unknown>): DbServerRecord {
  const type = (pleskXmlScalar(data.type) || "").toLowerCase();
  const host = pleskXmlScalar(data.host) || "localhost";
  const localHost =
    host === "localhost" || host === "127.0.0.1" || host === "::1" || "local" in data;
  return {
    id,
    type,
    host,
    port: pleskXmlInt(data.port) ?? portForDatabaseType(type),
    status: pleskXmlScalar(data.status) || "",
    local: localHost,
    version: readServerVersion(data),
  };
}

function connectionEndpoints(server: DbServerRecord | undefined, pleskType: string) {
  const port = server?.port ?? portForDatabaseType(pleskType);
  if (!server || server.local) {
    return { localHost: "localhost", remoteHost: getSharedHostingDbHost(), port };
  }
  return { localHost: server.host, remoteHost: server.host, port };
}

async function fetchDatabaseServerRecords(): Promise<Map<number, DbServerRecord>> {
  const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <db_server>
    <get>
      <filter/>
    </get>
  </db_server>
</packet>`);

  const get = packetOperator(parsed, "db_server")?.get as Record<string, unknown> | undefined;
  const servers = new Map<number, DbServerRecord>();
  for (const raw of asArray(get?.result)) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    if (pleskXmlScalar(row.status)?.toLowerCase() === "error") continue;
    const id = pleskXmlInt(row.id);
    const data = row.data;
    if (!id || !data || typeof data !== "object") continue;
    servers.set(id, parseDbServerRecord(id, data as Record<string, unknown>));
  }
  return servers;
}

async function fetchSupportedDatabaseTypes(): Promise<Set<string>> {
  const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <db_server>
    <get-supported-types/>
  </db_server>
</packet>`);

  const node = packetOperator(parsed, "db_server")?.["get-supported-types"] as
    | Record<string, unknown>
    | undefined;
  const types = new Set<string>();
  for (const raw of asArray(node?.result)) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    if (pleskXmlScalar(row.status)?.toLowerCase() === "error") continue;
    for (const typeNode of asArray(row.type)) {
      const type = (pleskXmlScalar(typeNode) || "").toLowerCase();
      if (type) types.add(type);
    }
  }
  return types;
}

async function fetchDefaultDatabaseServerIds(): Promise<Map<string, number>> {
  const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <db_server>
    <get-default>
      <filter>
        <type>mysql</type>
        <type>postgresql</type>
      </filter>
    </get-default>
  </db_server>
</packet>`);

  const node = packetOperator(parsed, "db_server")?.["get-default"] as
    | Record<string, unknown>
    | undefined;
  const defaults = new Map<string, number>();
  for (const raw of asArray(node?.result)) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    if (pleskXmlScalar(row.status)?.toLowerCase() === "error") continue;
    const type = (pleskXmlScalar(row.type) || "").toLowerCase();
    const id = pleskXmlInt(row.id);
    if (type && id) defaults.set(type, id);
  }
  return defaults;
}

async function fetchAssignedDatabaseServerIds(siteId: number): Promise<Set<number>> {
  const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <webspace>
    <db-servers>
      <list>
        <filter>
          <id>${siteId}</id>
        </filter>
      </list>
    </db-servers>
  </webspace>
</packet>`);

  const list = (packetOperator(parsed, "webspace")?.["db-servers"] as Record<string, unknown> | undefined)
    ?.list as Record<string, unknown> | undefined;
  const assigned = new Set<number>();
  for (const raw of asArray(list?.result)) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const err = pleskOperationError(row, "Failed to list database servers for this subscription");
    if (err) {
      throw new TRPCError({ code: "BAD_REQUEST", message: err.error, cause: err.code });
    }
    for (const serverNode of asArray(row["db-server"])) {
      if (!serverNode || typeof serverNode !== "object") continue;
      const id = pleskXmlInt((serverNode as Record<string, unknown>).id);
      if (id) assigned.add(id);
    }
  }
  return assigned;
}

async function fetchSubscriptionDatabaseBytes(siteId: number): Promise<number | null> {
  try {
    const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <webspace>
    <get>
      <filter>
        <id>${siteId}</id>
      </filter>
      <dataset>
        <disk_usage/>
      </dataset>
    </get>
  </webspace>
</packet>`);

    const get = packetOperator(parsed, "webspace")?.get as Record<string, unknown> | undefined;
    for (const raw of asArray(get?.result)) {
      if (!raw || typeof raw !== "object") continue;
      const row = raw as Record<string, unknown>;
      if (pleskXmlScalar(row.status)?.toLowerCase() === "error") continue;
      const data = row.data;
      if (!data || typeof data !== "object") continue;
      const disk = (data as Record<string, unknown>).disk_usage;
      if (!disk || typeof disk !== "object") continue;
      const usage = disk as Record<string, unknown>;
      const unixBytes = optionalByteCount(usage.dbases);
      if (unixBytes != null) return unixBytes;
      const windowsBytes = optionalByteCount(usage.mysql_dbases);
      if (windowsBytes != null) return windowsBytes;
    }
  } catch {
    return null;
  }
  return null;
}

function pickProvisionableServer(
  type: "mysql" | "postgresql",
  servers: Map<number, DbServerRecord>,
  supported: Set<string>,
  assignedIds: Set<number>,
  defaultId: number | undefined,
): DbServerRecord | null {
  if (!supported.has(type)) return null;
  const restricted = assignedIds.size > 0;
  const candidates: DbServerRecord[] = [];
  for (const server of servers.values()) {
    if (server.type !== type || server.status !== "NO_ERROR") continue;
    if (restricted) {
      if (assignedIds.has(server.id)) candidates.push(server);
      continue;
    }
    if (defaultId != null && server.id === defaultId) candidates.push(server);
  }
  if (candidates.length === 0) return null;
  return candidates.find((server) => server.id === defaultId) ?? candidates[0]!;
}

async function loadDatabaseServerContext(siteId: number): Promise<{
  servers: Map<number, DbServerRecord>;
  engines: PleskDatabaseEngineOption[];
}> {
  const [servers, supported, defaults, assignedIds] = await Promise.all([
    fetchDatabaseServerRecords(),
    fetchSupportedDatabaseTypes(),
    fetchDefaultDatabaseServerIds(),
    fetchAssignedDatabaseServerIds(siteId),
  ]);

  const engines: PleskDatabaseEngineOption[] = [];
  for (const type of ["mysql", "postgresql"] as const) {
    const server = pickProvisionableServer(
      type,
      servers,
      supported,
      assignedIds,
      defaults.get(type),
    );
    if (!server) continue;
    const presentation = databaseEnginePresentation(server.type, server.version);
    if (!presentation) continue;
    engines.push({
      id: presentation.engine,
      pleskType: presentation.pleskType,
      label: presentation.engineLabel,
      serverId: server.id,
      port: server.port,
      version: server.version,
    });
  }
  return { servers, engines };
}

export async function listProvisionableDatabaseEngines(
  siteId: number,
): Promise<PleskDatabaseEngineOption[]> {
  const context = await loadDatabaseServerContext(siteId);
  return context.engines;
}

export async function fetchPleskDatabaseUsersForDatabases(
  databaseIds: number[],
): Promise<PleskDatabaseUser[]> {
  const ids = [...new Set(databaseIds.filter((id) => id > 0))];
  if (ids.length === 0) return [];

  const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <database>
    <get-db-users>
      <filter>
        ${ids.map((id) => `<db-id>${id}</db-id>`).join("\n        ")}
      </filter>
    </get-db-users>
  </database>
</packet>`);

  const getUsers = packetDatabase(parsed)?.["get-db-users"] as Record<string, unknown> | undefined;
  return asArray(getUsers?.result)
    .map(parseUserResult)
    .filter((user): user is PleskDatabaseUser => user != null);
}

export async function listPleskDatabaseCatalog(siteId: number): Promise<PleskDatabaseCatalog> {
  const [databases, serverContext, subscriptionDatabaseBytes] = await Promise.all([
    fetchPleskDatabasesBySiteId(siteId),
    loadDatabaseServerContext(siteId),
    fetchSubscriptionDatabaseBytes(siteId),
  ]);
  const { engines, servers } = serverContext;

  const users = await fetchPleskDatabaseUsersForDatabases(databases.map((database) => database.id));
  const usersByDatabase = new Map<number, PleskDatabaseUserSummary[]>();
  for (const user of users) {
    if (!user.dbId) continue;
    const list = usersByDatabase.get(user.dbId) ?? [];
    list.push({ id: user.id, login: user.login });
    usersByDatabase.set(user.dbId, list);
  }

  return {
    engines,
    subscriptionDatabaseBytes,
    databases: databases.map((database) => {
      const server = database.dbServerId ? servers.get(database.dbServerId) : undefined;
      const presentation = databaseEnginePresentation(database.type, server?.version ?? null);
      const endpoints = connectionEndpoints(server, database.type);
      const assignedUsers = usersByDatabase.get(database.id) ?? [];
      const defaultUser =
        assignedUsers.find((user) => user.id === database.defaultUserId) ?? assignedUsers[0] ?? null;
      return {
        id: database.id,
        name: database.name,
        type: database.type,
        status: database.status,
        webspaceId: database.webspaceId,
        dbServerId: database.dbServerId,
        engine: presentation?.engine ?? "other",
        engineLabel: presentation?.engineLabel ?? database.type.toUpperCase(),
        version: server?.version ?? null,
        sizeBytes: database.sizeBytes,
        port: endpoints.port,
        localHost: endpoints.localHost,
        remoteHost: endpoints.remoteHost,
        users: assignedUsers,
        defaultUserId: defaultUser?.id ?? null,
      };
    }),
  };
}

export async function assertDatabaseEngineAllowed(params: {
  siteId: number;
  engine?: "mariadb" | "postgresql" | "mysql";
  type?: "mysql" | "postgresql" | "mssql";
}): Promise<PleskDatabaseEngineOption> {
  if (params.type === "mssql") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only MariaDB and PostgreSQL can be created for this subscription.",
    });
  }
  const engines = await listProvisionableDatabaseEngines(params.siteId);
  const requested = params.engine ?? (params.type === "postgresql" ? "postgresql" : "mariadb");
  const match = engines.find((engine) => {
    if (engine.id === requested) return true;
    if (requested === "mariadb" || requested === "mysql") {
      return engine.pleskType === "mysql";
    }
    return engine.pleskType === "postgresql" && requested === "postgresql";
  });
  if (!match) {
    const label = requested === "postgresql" ? "PostgreSQL" : "MariaDB";
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${label} is not available for this subscription. Choose a database type the subscription permits and the server can provision.`,
    });
  }
  return match;
}

export async function deletePleskDatabase(databaseId: number): Promise<void> {
  const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <database>
    <del-db>
      <filter>
        <id>${databaseId}</id>
      </filter>
    </del-db>
  </database>
</packet>`);

  const del = packetDatabase(parsed)?.["del-db"] as Record<string, unknown> | undefined;
  const result = asArray(del?.result)[0] as Record<string, unknown> | undefined;
  const err = pleskOperationError(result, "Database deletion failed");
  if (err) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: err.error,
      cause: err.code,
    });
  }
}

export async function getPleskDatabaseConnectionInfo(params: {
  siteId: number;
  databaseId: number;
}) {
  const catalog = await listPleskDatabaseCatalog(params.siteId);
  const database = catalog.databases.find((item) => item.id === params.databaseId);
  if (!database) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Database not found on this hosting subscription",
    });
  }
  const defaultUser = database.users.find((user) => user.id === database.defaultUserId) ?? null;

  return {
    databaseId: database.id,
    name: database.name,
    type: database.type,
    engine: database.engine,
    engineLabel: database.engineLabel,
    version: database.version,
    sizeBytes: database.sizeBytes,
    localHost: database.localHost,
    remoteHost: database.remoteHost,
    port: database.port,
    users: database.users,
    defaultUserId: defaultUser?.id ?? null,
    defaultUserLogin: defaultUser?.login ?? null,
  };
}
