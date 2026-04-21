import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { protectedProcedure, router } from '../../trpc';
import type { EmailCreateRequest } from '../../types/plesk/domain-emails';

/**
 * Build XML to create a mail account for a given site ID
 */
function buildMailCreateXml(
  siteId: number,
  mailData: EmailCreateRequest
): string {
  const {
    name,
    password,
    passwordType = 'plain',
    mailbox,
    forwarding,
    autoresponder,
    antivir = 'off',
    outgoingMessagesLimit,
    description,
  } = mailData;

  // Build mailbox XML with defaults
  const mailboxXml = `<mailbox>
      <enabled>${mailbox?.enabled ?? true}</enabled>
      <quota>${mailbox?.quota ?? -1}</quota>
    </mailbox>`;

  // Build forwarding XML if enabled
  const forwardingXml = forwarding?.enabled
    ? `<forwarding>
      <enabled>true</enabled>
      ${forwarding.addresses?.map((addr) => `<address>${addr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</address>`).join('\n      ') ?? ''}
    </forwarding>`
    : '';

  // Build autoresponder XML if enabled
  const autoresponderXml = autoresponder?.enabled
    ? `<autoresponder>
      <enabled>true</enabled>
      <subject>${autoresponder.subject?.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') ?? ''}</subject>
      <content_type>${autoresponder.contentType ?? 'text/plain'}</content_type>
      <text>${autoresponder.content?.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') ?? ''}</text>
    </autoresponder>`
    : '';

  // Note: Legacy implementation doesn't include alias in the request
  // const aliasXml = alias ? `<alias>${alias.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</alias>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <mail>
    <create>
      <filter>
        <site-id>${siteId}</site-id>
        <mailname>
          <name>${name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</name>
          ${mailboxXml}
          ${forwardingXml}
          ${autoresponderXml}
          <password>
            <value>${password.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</value>
            <type>${passwordType}</type>
          </password>
          <antivir>${antivir}</antivir>
          ${outgoingMessagesLimit !== undefined ? `<outgoing-messages-mbox-limit>${outgoingMessagesLimit}</outgoing-messages-mbox-limit>` : ''}
          ${description ? `<description>${description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</description>` : ''}

        </mailname>
      </filter>
    </create>
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

    const result = parsed?.packet?.mail?.create?.result;
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
    return { error: 'Failed to parse error response', code: 'PARSE_ERROR' };
  }
}

export const emailsCreateRouter = router({
  // Create an email account
  create: protectedProcedure
    .input(z.object({
      siteId: z.number(),
      name: z.string(),
      password: z.string(),
      passwordType: z.enum(['plain','crypt','md5','sha256','sha512']).optional(),
      mailbox: z.object({
        enabled: z.boolean().optional(),
        quota: z.number().optional(),
      }).optional(),
      forwarding: z.object({
        enabled: z.boolean(),
        addresses: z.array(z.string()).optional(),
      }).optional(),
      // Note: Legacy implementation doesn't include alias in the request
      // alias: z.string().optional(),
      autoresponder: z.object({
        enabled: z.boolean(),
        subject: z.string().optional(),
        contentType: z.string().optional(),
        content: z.string().optional(),
      }).optional(),
      antivir: z.string().optional(),
      cpAccess: z.boolean().optional(),
      outgoingMessagesLimit: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // DEBUG: sanitized payload preview (mask password)
        try {
          // Just destructure to avoid unused variable warning
          void input;
        } catch (e) {
        }

        // Check if required environment variables are set
        if (!process.env.PLESK_XML_ENDPOINT) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server configuration error: PLESK_XML_ENDPOINT environment variable is not set",
          });
        }

        const xmlRequest = buildMailCreateXml(input.siteId, input as EmailCreateRequest);

        // DEBUG: outgoing XML request (mask password value)
        try {
        } catch {}

        const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);

        // DEBUG: raw XML response
        try {
        } catch {}

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
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to parse Plesk response",
            cause: parseError,
          });
        }

        // DEBUG: parsed result summary (mail.create)
        try {
        } catch {}

        // Check for errors in the response
        const result = parsed?.packet?.mail?.create?.result;
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
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create email account",
          cause: error,
        });
      }
    }),
});