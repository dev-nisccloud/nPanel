import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { publicProcedure, router } from '../../trpc';
/**
 * Build XML to create a database
 * Based on Plesk XML-RPC API: add-db operation
 * Reference: https://docs.plesk.com/en-US/obsidian/api-rpc/about-xml-api/reference/managing-databases/creating-databases.34407/
 */
function buildDatabaseCreateXml(siteId, data) {
    // Escape XML characters
    const escapeXml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    // According to Plesk docs, nodes must be in exact order: webspace-id, name, type, then optional nodes
    let dbServerIdXml = '';
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
/**
 * Parse XML error response for better error messages
 */
function parseXmlError(xml) {
    try {
        const parser = new XMLParser({ ignoreAttributes: false });
        const parsed = parser.parse(xml);
        // Check for system-level errors
        if (parsed?.packet?.system?.status === 'error') {
            return {
                error: parsed.packet.system.errtext || 'System error occurred',
                code: parsed.packet.system.errcode,
            };
        }
        // Check for database operation errors
        const result = parsed?.packet?.database?.['add-db']?.result;
        if (result?.status === 'error') {
            return {
                error: result.errtext || 'Database creation failed',
                code: result.errcode,
            };
        }
        return { error: 'Unknown error format', code: 'UNKNOWN' };
    }
    catch (parseError) {
        console.error('Error parsing XML error response:', parseError);
        return { error: 'Failed to parse error response', code: 'PARSE_ERROR' };
    }
}
export const databasesCreateRouter = router({
    // Create a database
    create: publicProcedure
        .input(z.object({
        siteId: z.number(),
        name: z.string().min(1, { message: "Database name is required" }).max(64, { message: "Database name must be at most 64 characters" }),
        type: z.enum(['mysql', 'postgresql', 'mssql']),
        dbServerId: z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        try {
            // Check if required environment variables are set
            if (!process.env.PLESK_XML_ENDPOINT) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Server configuration error: PLESK_XML_ENDPOINT environment variable is not set",
                });
            }
            // Validate database name (Plesk typically has restrictions)
            // Database names usually can't contain spaces or special characters
            if (!/^[a-zA-Z0-9_]+$/.test(input.name)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Database name can only contain letters, numbers, and underscores",
                });
            }
            const xmlRequest = buildDatabaseCreateXml(input.siteId, {
                name: input.name,
                type: input.type,
                dbServerId: input.dbServerId,
            });
            const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);
            if (isHostUnreachable) {
                throw new TRPCError({
                    code: "SERVICE_UNAVAILABLE",
                    message: "Plesk host is unreachable",
                });
            }
            if (isAuthError) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid Plesk credentials",
                });
            }
            // Check if we have valid XML response
            if (!xml || xml.trim() === '') {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Empty response from Plesk server",
                });
            }
            const parser = new XMLParser({ ignoreAttributes: false });
            let parsed;
            try {
                parsed = parser.parse(xml);
            }
            catch (parseError) {
                console.error('Failed to parse XML response:', parseError);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to parse Plesk response",
                    cause: parseError,
                });
            }
            // Check for errors in the response
            const result = parsed?.packet?.database?.['add-db']?.result;
            if (result?.status === 'error') {
                const errorInfo = parseXmlError(xml);
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: errorInfo.error,
                    cause: errorInfo.code,
                });
            }
            // Extract the database ID from successful response
            const databaseId = result?.id;
            return {
                raw: xml,
                parsed,
                databaseId,
            };
        }
        catch (error) {
            console.error('Plesk Database Create API Error:', error);
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
