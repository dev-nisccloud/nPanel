import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { publicProcedure, router } from '../../trpc';
import type { DnsRecordCreateRequest } from '../../types/plesk/domains-dns';

/**
 * Build XML to create a DNS record for a given site ID
 */
function buildDnsCreateXml(
  siteId: number,
  record: DnsRecordCreateRequest
): string {
  const { type, host, value } = record;

  // Use the same simple XML structure as the working plesk-dns-create endpoint
  // Note: We're not including opt and ttl as they seem to cause issues with this Plesk version
  return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <dns>
    <add_rec>
      <site-id>${siteId}</site-id>
      <type>${type}</type>
      <host>${host.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</host>
      <value>${value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</value>
    </add_rec>
  </dns>
</packet>`;
}

/**
 * Enhanced error parsing for better debugging
 */
function parseXmlError(xml: string): { error: string; code?: string } {
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
    const result = parsed?.packet?.dns?.add_rec?.result;
    if (result?.status === 'error') {
      return {
        error: result.errtext || 'DNS operation failed',
        code: result.errcode,
      };
    }

    return { error: 'Unknown error format', code: 'UNKNOWN' };
  } catch (parseError) {
    console.error('Error parsing XML error response:', parseError);
    return { error: 'Failed to parse error response', code: 'PARSE_ERROR' };
  }
}

export const dnsCreateRouter = router({
  // Create a DNS record
  create: publicProcedure
    .input(z.object({
      siteId: z.number(),
      type: z.string(),
      host: z.string(),
      value: z.string(),
      opt: z.string().optional(),
      ttl: z.number().optional(),
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

        const xmlRequest = buildDnsCreateXml(input.siteId, input);
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
        let parsed: any;

        try {
          parsed = parser.parse(xml);
        } catch (parseError) {
          console.error('Failed to parse XML response:', parseError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to parse Plesk response",
            cause: parseError,
          });
        }

        // Check for errors in the response
        const result = parsed?.packet?.dns?.add_rec?.result;
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
      } catch (error) {
        console.error('Plesk DNS Create API Error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create DNS record",
          cause: error,
        });
      }
    }),
});