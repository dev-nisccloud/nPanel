import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { publicProcedure, router } from '../../trpc';
/**
 * Build XML to update database user (password, permissions, roles)
 * Based on Plesk XML-RPC API: set-db-user operation
 */
function buildDatabaseSetUserXml(userId, data) {
    // Escape XML characters
    const escapeXml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    let passwordXml = '';
    if (data.password) {
        const passwordType = data.passwordType || 'plain';
        passwordXml = `<password>
      <value>${escapeXml(data.password)}</value>
      <type>${passwordType}</type>
    </password>`;
    }
    let roleXml = '';
    if (data.role) {
        roleXml = `<role>${data.role}</role>`;
    }
    let aclXml = '';
    if (data.acl && data.acl.length > 0) {
        aclXml = `<acl>${data.acl.map(host => `<host>${escapeXml(host)}</host>`).join('')}</acl>`;
    }
    let allowAccessFromXml = '';
    if (data.allowAccessFrom && data.allowAccessFrom.length > 0) {
        allowAccessFromXml = `<allow-access-from>${data.allowAccessFrom.map(ip => `<ip>${escapeXml(ip)}</ip>`).join('')}</allow-access-from>`;
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <database>
    <set-db-user>
      <filter>
        <id>${userId}</id>
      </filter>
      ${passwordXml}
      ${roleXml}
      ${aclXml}
      ${allowAccessFromXml}
    </set-db-user>
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
        const result = parsed?.packet?.database?.['set-db-user']?.result;
        if (result?.status === 'error') {
            return {
                error: result.errtext || 'Database user update failed',
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
export const databasesSetUserRouter = router({
    // Update database user (password, permissions, roles)
    update: publicProcedure
        .input(z.object({
        userId: z.number(),
        password: z.string().optional(),
        passwordType: z.enum(['plain', 'crypt']).optional(),
        role: z.enum(['readWrite', 'readOnly', 'writeOnly']).optional(),
        acl: z.array(z.string()).optional(), // Access control list
        allowAccessFrom: z.array(z.string()).optional(), // IP addresses
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
            // Validate that at least one field is being updated
            if (!input.password && !input.role && !input.acl && !input.allowAccessFrom) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "At least one field (password, role, acl, or allowAccessFrom) must be provided",
                });
            }
            // Validate password length (Plesk requires at least 5 characters)
            if (input.password && input.password.length < 5) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Password must be at least 5 characters long",
                });
            }
            const xmlRequest = buildDatabaseSetUserXml(input.userId, {
                password: input.password,
                passwordType: input.passwordType,
                role: input.role,
                acl: input.acl,
                allowAccessFrom: input.allowAccessFrom,
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
            const result = parsed?.packet?.database?.['set-db-user']?.result;
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
            console.error('Plesk Database Set User API Error:', error);
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to update database user",
                cause: error,
            });
        }
    }),
});
