import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import { assertCanAccessPleskSite } from "../../lib/plesk/hosting-access";
import { addPleskDatabaseUser, fetchPleskDatabaseById, fetchPleskDatabaseUsers, generateDatabasePassword, getSharedHostingDbHost, portForDatabaseType, setPleskDefaultDatabaseUser, } from "../../lib/plesk/database-ops";
import { escapeXml, pleskOperationError, pleskXmlInt, sendPleskXmlOrThrow, asArray, } from "../../lib/plesk/xml-utils";
function buildDatabaseCreateXml(siteId, data) {
    let dbServerIdXml = "";
    if (data.dbServerId !== undefined) {
        dbServerIdXml = `<db-server-id>${data.dbServerId}</db-server-id>`;
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <database>
    <add-db>
      <webspace-id>${siteId}</webspace-id>
      <name>${escapeXml(data.name)}</name>
      <type>${data.type}</type>
      ${dbServerIdXml}
    </add-db>
  </database>
</packet>`;
}
const usernameSchema = z
    .string()
    .min(1, { message: "Database username is required" })
    .max(32, { message: "Database username must be at most 32 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, {
    message: "Username can only contain letters, numbers, and underscores",
});
const passwordSchema = z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(64, { message: "Password must be at most 64 characters" });
export const databasesCreateRouter = router({
    create: protectedProcedure
        .input(z.object({
        siteId: z.number(),
        name: z
            .string()
            .min(1, { message: "Database name is required" })
            .max(64, { message: "Database name must be at most 64 characters" }),
        type: z.enum(["mysql", "postgresql", "mssql"]).optional().default("mysql"),
        dbServerId: z.number().optional(),
        username: usernameSchema,
        password: passwordSchema.optional(),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            await assertCanAccessPleskSite({
                siteId: input.siteId,
                userId: ctx.session.user.id,
                role: ctx.session.user.role,
            });
            if (!/^[a-zA-Z0-9_]+$/.test(input.name)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Database name can only contain letters, numbers, and underscores",
                });
            }
            const { xml, parsed } = await sendPleskXmlOrThrow(buildDatabaseCreateXml(input.siteId, {
                name: input.name,
                type: input.type ?? "mysql",
                dbServerId: input.dbServerId,
            }));
            const addDb = parsed.packet?.database;
            const result = asArray(addDb?.["add-db"]?.result)[0];
            const err = pleskOperationError(result, "Database creation failed");
            if (err) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: err.error,
                    cause: err.code,
                });
            }
            const databaseId = pleskXmlInt(result?.id);
            if (!databaseId) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Plesk did not return a database id",
                    cause: xml,
                });
            }
            const password = input.password || generateDatabasePassword();
            let userId;
            try {
                userId = await addPleskDatabaseUser({
                    databaseId,
                    login: input.username,
                    password,
                });
                await setPleskDefaultDatabaseUser(databaseId, userId);
            }
            catch (userError) {
                const detail = userError instanceof TRPCError
                    ? userError.message
                    : "Please create a database user from the connection dialog.";
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Database was created, but the user could not be created: ${detail}`,
                    cause: userError,
                });
            }
            const created = await fetchPleskDatabaseById(input.siteId, databaseId);
            const users = await fetchPleskDatabaseUsers(databaseId);
            const createdUser = users.find((user) => user.id === userId);
            return {
                databaseId,
                userId,
                name: created.name,
                username: createdUser?.login ?? input.username,
                password,
                type: created.type,
                localHost: "localhost",
                remoteHost: getSharedHostingDbHost(),
                port: portForDatabaseType(created.type),
            };
        }
        catch (error) {
            console.error("Plesk Database Create API Error:", error);
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create database",
                cause: error,
            });
        }
    }),
});
