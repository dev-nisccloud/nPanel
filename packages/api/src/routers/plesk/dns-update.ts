import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { publicProcedure, router } from '../../trpc';

/**
 * Enhanced error parsing for better debugging
 */
function parseXmlError(xml: string, operation: 'add_rec' | 'del_rec'): { error: string; code?: string } {
    try {
        const parser = new XMLParser({ ignoreAttributes: false });
        const parsed: any = parser.parse(xml);

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
    } catch (parseError) {
        console.error('Error parsing XML error response:', parseError);
        return { error: 'Failed to parse error response', code: 'PARSE_ERROR' };
    }
}

/**
 * Strips domain name from host if present to ensure relative host in Plesk
 */
function getRelativeHost(host: string, domainName?: string): string {
    const trimmed = host.trim();
    if (trimmed === '@') return '';
    if (!domainName) return host;

    // Normalize to handle case-insensitivity and trailing dots
    const lowerHost = trimmed.toLowerCase().replace(/\.$/, '');
    const lowerDomain = domainName.toLowerCase().replace(/\.$/, '');

    if (lowerHost === lowerDomain) {
        return '';
    }

    if (lowerHost.endsWith('.' + lowerDomain)) {
        // Strip the .domain.com part
        return trimmed.substring(0, trimmed.length - (lowerDomain.length + 1)).replace(/\.$/, '');
    }

    // Even if it didn't match the domain suffix, we should strip trailing dots
    // because Plesk might append the domain if it thinks it's a subdomain.
    // If input was "sub.", we want "sub".
    return trimmed.replace(/\.$/, '');
}

function escapeXml(val: string): string {
    return val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildDnsAddRecXml(input: {
    siteId: number;
    type: string;
    host: string;
    value: string;
    opt?: string | number;
}): string {
    const optVal =
        input.opt === undefined || input.opt === null || String(input.opt).trim() === ''
            ? undefined
            : String(input.opt);

    // NOTE: Some Plesk versions reject <ttl> for add_rec ("Expected is ( opt )"), so we do not send it.
    return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <dns>
    <add_rec>
      <site-id>${input.siteId}</site-id>
      <type>${escapeXml(input.type)}</type>
      <host>${escapeXml(input.host)}</host>
      <value>${escapeXml(input.value)}</value>${optVal ? `
      <opt>${escapeXml(optVal)}</opt>` : ''}
    </add_rec>
  </dns>
</packet>`;
}

export const dnsUpdateRouter = router({
    update: publicProcedure
        .input(
            z.object({
                siteId: z.number(),
                recordId: z.number(),
                domainName: z.string().optional(),
                type: z.string(),
                host: z.string(),
                value: z.string(),
                opt: z.string().optional().or(z.number().optional()),
                ttl: z.number().optional(),
            })
        )
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
            let parsedDelete: any;
            try {
                parsedDelete = parser.parse(deleteResponse.xml);
            } catch (e) {
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
            const createXmlPrimary = buildDnsAddRecXml({
                siteId: input.siteId,
                type: input.type,
                host: relativeHost,
                value: input.value,
                opt: input.opt,
            });
            const createXmlFallback = buildDnsAddRecXml({
                siteId: input.siteId,
                type: input.type,
                host: relativeHost,
                value: input.value,
            });

            let createResponse = await sendPleskXmlRequest(createXmlPrimary);

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

            let parsedCreate: any;
            try {
                parsedCreate = parser.parse(createResponse.xml);
            } catch (e) {
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
                // Some Plesk versions reject <ttl> and/or <opt>. Retry once without them.
                createResponse = await sendPleskXmlRequest(createXmlFallback);
                if (!createResponse.xml || createResponse.xml.trim() === '') {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "DNS record deleted, but received empty response when creating new one.",
                    });
                }

                let parsedRetry: any;
                try {
                    parsedRetry = parser.parse(createResponse.xml);
                } catch {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "DNS record deleted, but failed to parse creation response.",
                    });
                }

                const retryResult = Array.isArray(parsedRetry?.packet?.dns?.add_rec?.result)
                    ? parsedRetry.packet.dns.add_rec.result[0]
                    : parsedRetry?.packet?.dns?.add_rec?.result;

                if (retryResult?.status === "error") {
                    const retryErrorInfo = parseXmlError(createResponse.xml, 'add_rec');
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `DNS record deleted, but failed to create new one: ${retryErrorInfo.error || errorInfo.error}. You may need to manually recreate the record.`,
                    });
                }

                return {
                    success: true,
                    recordId: retryResult?.id,
                };
            }

            return {
                success: true,
                recordId: createResult?.id,
            };
        }),
});
