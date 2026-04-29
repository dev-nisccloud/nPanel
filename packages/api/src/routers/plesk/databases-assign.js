import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { protectedProcedure, router } from '../../trpc';
/**
 * Build XML to assign/move a database to a different subscription
 * Based on Plesk XML-RPC API: assign-to-subscription operation
 * Reference: https://docs.plesk.com/en-US/obsidian/api-rpc/about-xml-api/reference/managing-databases/moving-databases-to-another-subscription.75347/
 */
function buildDatabaseAssignXml(databaseId, targetWebspaceId) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <database>
    <assign-to-subscription>
      <filter>
        <id>${databaseId}</id>
      </filter>
      <webspace-id>${targetWebspaceId}</webspace-id>
    </assign-to-subscription>
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
        const result = parsed?.packet?.database?.['assign-to-subscription']?.result;
        if (result?.status === 'error') {
            return {
                error: result.errtext || 'Database assignment failed',
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
export const databasesAssignRouter = router({
    // Assign/move a database to a different subscription
    assign: protectedProcedure
        .input(z.object({
        databaseId: z.number(),
        targetWebspaceId: z.number(),
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
            const xmlRequest = buildDatabaseAssignXml(input.databaseId, input.targetWebspaceId);
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
            const result = parsed?.packet?.database?.['assign-to-subscription']?.result;
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
            console.error('Plesk Database Assign API Error:', error);
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to assign database to subscription",
                cause: error,
            });
        }
    }),
});
