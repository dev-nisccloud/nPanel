import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { asArray, escapeXml, pleskOperationError, pleskXmlInt, pleskXmlScalar, sendPleskXmlOrThrow, } from "./xml-utils";
export function getSharedHostingDbHost() {
    return (process.env.PLESK_PUBLIC_HOSTNAME ||
        process.env.VITE_PUBLIC_PLESK_HOST ||
        "orion.nisccloud.com");
}
export function portForDatabaseType(type) {
    const t = (type || "mysql").toLowerCase();
    if (t === "postgresql")
        return 5432;
    if (t === "mssql")
        return 1433;
    return 3306;
}
export function isMysqlFamily(type) {
    const t = (type || "mysql").toLowerCase();
    return t === "mysql" || t === "mariadb";
}
export function generateDatabasePassword() {
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowers = "abcdefghijkmnopqrstuvwxyz";
    const digits = "23456789";
    const specials = "!@#$%^&*-_";
    const all = uppers + lowers + digits + specials;
    const pick = (set) => set[randomBytes(1)[0] % set.length];
    const chars = [pick(uppers), pick(lowers), pick(digits), pick(specials)];
    for (let i = chars.length; i < 16; i++)
        chars.push(pick(all));
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomBytes(1)[0] % (i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
}
function packetDatabase(parsed) {
    const packet = parsed.packet;
    return packet?.database;
}
function parseDbResult(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const row = raw;
    const id = pleskXmlInt(row.id);
    const name = pleskXmlScalar(row.name);
    if (!id || !name)
        return null;
    return {
        id,
        name,
        type: (pleskXmlScalar(row.type) || "mysql"),
        status: pleskXmlScalar(row.status),
        webspaceId: pleskXmlInt(row["webspace-id"]),
        dbServerId: pleskXmlInt(row["db-server-id"]),
    };
}
function parseUserResult(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const row = raw;
    const id = pleskXmlInt(row.id);
    const login = pleskXmlScalar(row.login);
    if (!id || !login)
        return null;
    return {
        id,
        login,
        dbId: pleskXmlInt(row["db-id"]),
    };
}
export async function fetchPleskDatabasesBySiteId(siteId) {
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
    const getDb = packetDatabase(parsed)?.["get-db"];
    return asArray(getDb?.result).map(parseDbResult).filter((db) => db != null);
}
export async function fetchPleskDatabaseById(siteId, databaseId) {
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
    const getDb = packetDatabase(parsed)?.["get-db"];
    const match = asArray(getDb?.result)
        .map(parseDbResult)
        .find((db) => db != null && db.id === databaseId);
    if (!match || (match.webspaceId != null && match.webspaceId !== siteId)) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Database not found on this hosting subscription",
        });
    }
    return match;
}
export async function fetchPleskDatabaseUsers(databaseId) {
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
    const getUsers = packetDatabase(parsed)?.["get-db-users"];
    return asArray(getUsers?.result)
        .map(parseUserResult)
        .filter((user) => user != null);
}
export async function fetchPleskDefaultUserId(databaseId) {
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
        const getDefault = packetDatabase(parsed)?.["get-default-user"];
        const results = asArray(getDefault?.result);
        for (const raw of results) {
            if (!raw || typeof raw !== "object")
                continue;
            const row = raw;
            if (pleskXmlScalar(row.status)?.toLowerCase() === "error")
                continue;
            const id = pleskXmlInt(row.id) ?? pleskXmlInt(row["default-user-id"]);
            if (id && id > 0)
                return id;
        }
    }
    catch {
        return null;
    }
    return null;
}
export async function addPleskDatabaseUser(params) {
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
    const addUser = packetDatabase(parsed)?.["add-db-user"];
    const result = asArray(addUser?.result)[0];
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
export async function setPleskDefaultDatabaseUser(databaseId, userId) {
    const { parsed } = await sendPleskXmlOrThrow(`<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <database>
    <set-default-user>
      <db-id>${databaseId}</db-id>
      <default-user-id>${userId}</default-user-id>
    </set-default-user>
  </database>
</packet>`);
    const setDefault = packetDatabase(parsed)?.["set-default-user"];
    const result = asArray(setDefault?.result)[0];
    const err = pleskOperationError(result, "Failed to set default database user");
    if (err) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: err.error,
            cause: err.code,
        });
    }
}
export async function setPleskDatabaseUser(params) {
    // Packet shape from Plesk set-db-user docs: id, password, password-type, acl/host, allow-access-from/ip-address, role.
    const parts = [`<id>${params.userId}</id>`];
    if (params.password) {
        parts.push(`<password>${escapeXml(params.password)}</password>`);
        parts.push(`<password-type>${params.passwordType || "plain"}</password-type>`);
    }
    if (params.acl && params.acl.length > 0) {
        parts.push(`<acl>${params.acl.map((host) => `<host>${escapeXml(host)}</host>`).join("")}</acl>`);
    }
    if (params.allowAccessFrom && params.allowAccessFrom.length > 0) {
        parts.push(`<allow-access-from>${params.allowAccessFrom
            .map((ip) => `<ip-address>${escapeXml(ip)}</ip-address>`)
            .join("")}</allow-access-from>`);
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
    const setUser = packetDatabase(parsed)?.["set-db-user"];
    const result = asArray(setUser?.result)[0];
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
export async function getPleskDatabaseConnectionInfo(params) {
    const database = await fetchPleskDatabaseById(params.siteId, params.databaseId);
    const [users, defaultUserId] = await Promise.all([
        fetchPleskDatabaseUsers(params.databaseId),
        fetchPleskDefaultUserId(params.databaseId),
    ]);
    const defaultUser = users.find((user) => user.id === defaultUserId) ?? users[0] ?? null;
    return {
        databaseId: database.id,
        name: database.name,
        type: database.type,
        localHost: "localhost",
        remoteHost: getSharedHostingDbHost(),
        port: portForDatabaseType(database.type),
        users: users.map((user) => ({ id: user.id, login: user.login })),
        defaultUserId: defaultUser?.id ?? defaultUserId ?? null,
        defaultUserLogin: defaultUser?.login ?? null,
    };
}
