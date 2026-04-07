import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { publicProcedure, router } from '../../trpc';
/**
 * Enhanced error parsing for better debugging
 */
function parseXmlError(xml, operation) {
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
        // Check for DNS operation errors
        const dnsData = parsed?.packet?.dns?.[operation];
        const result = Array.isArray(dnsData?.result) ? dnsData.result[0] : dnsData?.result;
        if (result?.status === 'error') {
            return {
                error: result.errtext || `DNS ${operation} failed`,
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
/**
 * Strips domain name from host if present to ensure relative host in Plesk
 */
function getRelativeHost(host, domainName) {
    if (!domainName)
        return host;
    // Normalize to handle case-insensitivity and trailing dots
    const lowerHost = host.toLowerCase().replace(/\.$/, '');
    const lowerDomain = domainName.toLowerCase().replace(/\.$/, '');
    if (lowerHost === lowerDomain) {
        return '';
    }
    if (lowerHost.endsWith('.' + lowerDomain)) {
        // Strip the .domain.com part
        return host.substring(0, host.length - (lowerDomain.length + 1)).replace(/\.$/, '');
    }
    // Even if it didn't match the domain suffix, we should strip trailing dots
    // because Plesk might append the domain if it thinks it's a subdomain.
    // If input was "sub.", we want "sub".
    return host.replace(/\.$/, '');
}
export const dnsUpdateRouter = router({
    update: publicProcedure
        .input(z.object({
        siteId: z.number(),
        recordId: z.number(),
        domainName: z.string().optional(),
        type: z.string(),
        host: z.string(),
        value: z.string(),
        opt: z.string().optional().or(z.number().optional()),
        ttl: z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        // 1. Delete the existing record
        const deleteXml = `<?xml version="1.0" encoding="UTF-8"?>
<packet version="1.6.9.1">
  <dns>
    <del_rec>
      <filter>
        <id>${input.recordId}</id>
      </filter>
    </del_rec>
  </dns>
</packet>`;
        const deleteResponse = await sendPleskXmlRequest(deleteXml);
        if (deleteResponse.isHostUnreachable) {
            throw new TRPCError({
                code: "SERVICE_UNAVAILABLE",
                message: "Plesk host is unreachable",
            });
        }
        if (deleteResponse.isAuthError) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Invalid Plesk credentials",
            });
        }
        if (!deleteResponse.xml || deleteResponse.xml.trim() === '') {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Empty response from Plesk server during deletion",
            });
        }
        const parser = new XMLParser({ ignoreAttributes: false });
        let parsedDelete;
        try {
            parsedDelete = parser.parse(deleteResponse.xml);
        }
        catch (e) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to parse Plesk deletion response",
            });
        }
        const deleteResult = Array.isArray(parsedDelete?.packet?.dns?.del_rec?.result)
            ? parsedDelete.packet.dns.del_rec.result[0]
            : parsedDelete?.packet?.dns?.del_rec?.result;
        if (deleteResult?.status === "error") {
            const errorInfo = parseXmlError(deleteResponse.xml, 'del_rec');
            // If the record doesn't exist, we can just proceed to create the new one.
            if (errorInfo.error !== "Record does not exist") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Failed to delete existing DNS record: ${errorInfo.error}`,
                });
            }
        }
        // 2. Create the new record
        // Ensure host is relative to domain to avoid double-suffixing in Plesk
        const relativeHost = getRelativeHost(input.host, input.domainName);
        const sanitizedHost = relativeHost.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const sanitizedValue = input.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // Using the same simple structure as dns-create.ts
        // Note: We're omitting opt and ttl for now as they cause issues with some Plesk versions
        const createXml = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <dns>
    <add_rec>
      <site-id>${input.siteId}</site-id>
      <type>${input.type}</type>
      <host>${sanitizedHost}</host>
      <value>${sanitizedValue}</value>
    </add_rec>
  </dns>
</packet>`;
        const createResponse = await sendPleskXmlRequest(createXml);
        if (createResponse.isHostUnreachable) {
            throw new TRPCError({
                code: "SERVICE_UNAVAILABLE",
                message: "Plesk host is unreachable",
            });
        }
        if (createResponse.isAuthError) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Invalid Plesk credentials",
            });
        }
        if (!createResponse.xml || createResponse.xml.trim() === '') {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "DNS record deleted, but received empty response when creating new one.",
            });
        }
        let parsedCreate;
        try {
            parsedCreate = parser.parse(createResponse.xml);
        }
        catch (e) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "DNS record deleted, but failed to parse creation response.",
            });
        }
        const createResult = Array.isArray(parsedCreate?.packet?.dns?.add_rec?.result)
            ? parsedCreate.packet.dns.add_rec.result[0]
            : parsedCreate?.packet?.dns?.add_rec?.result;
        if (createResult?.status === "error") {
            const errorInfo = parseXmlError(createResponse.xml, 'add_rec');
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: `DNS record deleted, but failed to create new one: ${errorInfo.error}. You may need to manually recreate the record.`,
            });
        }
        return {
            success: true,
            recordId: createResult?.id,
        };
    }),
});
