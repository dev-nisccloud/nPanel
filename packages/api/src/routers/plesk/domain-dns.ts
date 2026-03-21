import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { publicProcedure, router } from '../../trpc';

/**
 * Build XML to get DNS records for a given site (webspace) ID.
 */
function buildDnsGetXml(siteId: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <dns>
    <get_rec>
      <filter>
        <site-id>${siteId}</site-id>
      </filter>
    </get_rec>
  </dns>
</packet>`;
}

export const domainDnsRouter = router({
  // Get DNS records for a site
  getBySiteId: publicProcedure
    .input(z.object({ siteId: z.number() }))
    .query(async ({ input }: { input: { siteId: number } }) => {
      const { siteId } = input;
      
      try {
        // Check if required environment variables are set
        if (!process.env.PLESK_XML_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_XML_ENDPOINT environment variable is not set",
          });
        }

        const xmlRequest = buildDnsGetXml(siteId);
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

        return {
          raw: xml,
          parsed,
        };
      } catch (error) {
        console.error('Plesk DNS API Error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch DNS records",
          cause: error,
        });
      }
    }),
});