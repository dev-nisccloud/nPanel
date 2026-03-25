import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { publicProcedure, router } from '../../trpc';

/**
 * Build XML request to fetch subdomains for a given parent domain.
 */
function buildSubdomainGetXml(parentDomain: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <subdomain>
    <get>
      <filter>
        <parent-name>${parentDomain}</parent-name>
      </filter>
    </get>
  </subdomain>
</packet>`;
}

export const subdomainsRouter = router({
  // Get subdomains for a parent domain
  getByParentDomain: publicProcedure
    .input(z.object({ domain: z.string() }))
    .query(async ({ input }: { input: { domain: string } }) => {
      const { domain } = input;
      
      try {
        // Check if required environment variables are set
        if (!process.env.PLESK_XML_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_XML_ENDPOINT environment variable is not set",
          });
        }

        const xmlRequest = buildSubdomainGetXml(domain);
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
        console.error('Plesk Subdomains API Error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch subdomains",
          cause: error,
        });
      }
    }),
});