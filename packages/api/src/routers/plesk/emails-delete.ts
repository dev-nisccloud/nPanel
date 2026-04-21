import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { protectedProcedure, router } from '../../trpc';
import type { EmailDeleteRequest } from '../../types/plesk/domain-emails';

/**
 * Build XML to delete a mail account for a given site ID
 */
function buildMailDeleteXml(
  siteId: number,
  mailData: EmailDeleteRequest
): string {
  const { name } = mailData;

  return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <mail>
    <remove>
      <filter>
        <site-id>${siteId}</site-id>
        <name>${name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</name>
      </filter>
    </remove>
  </mail>
</packet>`;
}

/**
 * Enhanced error parsing for better debugging
 */
function parseXmlError(xml: string): { error: string; code?: string } {
  try {
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed: any = parser.parse(xml);

    const result = parsed?.packet?.mail?.remove?.result;
    if (result?.errtext) {
      return {
        error: result.errtext,
        code: result.errcode?.toString(),
      };
    }

    const systemError = parsed?.packet?.system;
    if (systemError?.errtext) {
      return {
        error: systemError.errtext,
        code: systemError.errcode?.toString(),
      };
    }

    return { error: 'Unknown error format', code: 'UNKNOWN' };
  } catch (parseError) {
    console.error('Error parsing XML error response:', parseError);
    return { error: 'Failed to parse error response', code: 'PARSE_ERROR' };
  }
}

export const emailsDeleteRouter = router({
  // Delete an email account
  delete: protectedProcedure
    .input(z.object({
      siteId: z.number(),
      name: z.string(),
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

        const xmlRequest = buildMailDeleteXml(input.siteId, input as EmailDeleteRequest);
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
        const result = parsed?.packet?.mail?.remove?.result;
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
        console.error('Plesk Email Delete API Error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete email account",
          cause: error,
        });
      }
    }),
});