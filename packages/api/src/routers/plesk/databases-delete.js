import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { protectedProcedure, router } from '../../trpc';
/**
 * Build XML to delete a database by ID
 * Based on Plesk XML-RPC API: del-db operation
 */
function buildDatabaseDeleteXml(databaseId) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <database>
    <del-db>
      <filter>
        <id>${databaseId}</id>
      </filter>
    </del-db>
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
        const result = parsed?.packet?.database?.['del-db']?.result;
        if (result?.status === 'error') {
            return {
                error: result.errtext || 'Database deletion failed',
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
export const databasesDeleteRouter = router({
    // Delete a database
    delete: protectedProcedure
        .input(z.object({
        siteId: z.number(),
        databaseId: z.number(),
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
            const xmlRequest = buildDatabaseDeleteXml(input.databaseId);
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
            const result = parsed?.packet?.database?.['del-db']?.result;
            if (result?.status === 'error') {
                const errorInfo = parseXmlError(xml);
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: errorInfo.error,
                    cause: errorInfo.code,
                });
            }
            return {
                raw: xml,
                parsed,
            };
        }
        catch (error) {
            console.error('Plesk Database Delete API Error:', error);
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to delete database",
                cause: error,
            });
        }
    }),
});
