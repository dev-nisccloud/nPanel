import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { publicProcedure, router } from '../../trpc';

/** Local input type aligned with Zod schema below */
type UpdateInput = {
	siteId: number;
	name: string;
	password?: string;
	passwordType?: 'plain' | 'crypt';
	antivir?: 'off' | 'inout' | 'in' | 'out';
	outgoingMessagesLimit?: number;
	description?: string;
	forwarding?: { enabled?: boolean; addresses?: string[] };
	autoresponder?: { enabled?: boolean; subject?: string; content?: string; contentType?: string };
	mailbox?: { enabled?: boolean; quota?: number };
};

/**
 * Maps update fields to appropriate Plesk update operations
 */
interface UpdateFieldMapping {
  operation: 'add' | 'remove' | 'set';
  xmlFragment: string;
}

/**
 * Build XML for mail account update operation
 * Uses hybrid strategy: 'set' for single-value fields, 'add' for list fields
 * Based on working legacy implementation
 */
function buildMailUpdateXml(
  siteId: number,
  mailData: UpdateInput
): {
  setXml?: string;
  addXml?: string;
  removeXml?: string;
  fieldMappings: Record<string, UpdateFieldMapping>;
} {
  const { name } = mailData;
  const fieldMappings: Record<string, UpdateFieldMapping> = {};

  // Escape XML characters helper
  const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Fields that use 'set' operation (replace completely)
  const setFields: string[] = [];
  // Fields that use 'add' operation (add to existing)
  const addFields: string[] = [];
  // Fields that use 'remove' operation (remove from existing)
  const removeFields: string[] = [];

  // Password (use 'set' to replace) - WORKING: Confirmed working
  if (mailData.password) {
    const passwordType = mailData.passwordType || 'plain';
    setFields.push(`<password>
      <value>${escapeXml(mailData.password)}</value>
      <type>${passwordType}</type>
    </password>`);
    fieldMappings.password = {
      operation: 'set',
      xmlFragment: 'password',
    };
  }

  // Antivirus settings (use 'set' to replace) - TESTING: Add as separate operation
  if (mailData.antivir) {
    setFields.push(`<antivir>${mailData.antivir}</antivir>`);
    fieldMappings.antivir = {
      operation: 'set',
      xmlFragment: 'antivirus settings',
    };
  }

  // Outgoing message limit (use 'set' to replace) - TESTING: Add as separate operation
  if (mailData.outgoingMessagesLimit !== undefined) {
    setFields.push(
      `<outgoing-messages-mbox-limit>${mailData.outgoingMessagesLimit}</outgoing-messages-mbox-limit>`
    );
    fieldMappings.outgoingMessagesLimit = {
      operation: 'set',
      xmlFragment: 'outgoing messages limit',
    };
  }

  // Description (use 'set' to replace) - TESTING: Add as separate operation
  if (mailData.description !== undefined) {
    if (mailData.description) {
      setFields.push(
        `<description>${escapeXml(mailData.description)}</description>`
      );
    } else {
      setFields.push('<description></description>');
    }
    fieldMappings.description = {
      operation: 'set',
      xmlFragment: 'description',
    };
  }

  // Forwarding addresses - DISABLED: Removed entirely as requested
  // Forwarding functionality has been completely removed from edit mode

  // Autoresponder (use 'set' to replace) - NOT SUPPORTED: Confirmed by error message
  // if (mailData.autoresponder) {
  //   if (mailData.autoresponder.enabled && mailData.autoresponder.subject && mailData.autoresponder.content) {
  //     const contentType = mailData.autoresponder.contentType || 'text/plain';
  //     setFields.push(`<autoresponder>
  //       <enabled>true</enabled>
  //       <subject>${escapeXml(mailData.autoresponder.subject)}</subject>
  //       <content_type>${contentType}</content_type>
  //       <text>${escapeXml(mailData.autoresponder.content)}</text>
  //     </autoresponder>`);
  //   } else {
  //     setFields.push(`<autoresponder>
  //       <enabled>false</enabled>
  //     </autoresponder>`);
  //   }
  //   fieldMappings.autoresponder = {
  //     operation: 'set',
  //     xmlFragment: 'autoresponder settings',
  //   };
  // }

  // Mailbox settings (use 'set' to replace) - NOT SUPPORTED: Confirmed by error message
  // if (mailData.mailbox) {
  //   const enabled = mailData.mailbox.enabled !== undefined ? mailData.mailbox.enabled : true;
  //   const quota = mailData.mailbox.quota || 1073741824; // Default 1GB
  //   setFields.push(`<mailbox>
  //     <enabled>${enabled}</enabled>
  //     <quota>${quota}</quota>
  //   </mailbox>`);
  //   fieldMappings.mailbox = {
  //     operation: 'set',
  //     xmlFragment: 'mailbox settings',
  //   };
  // }

  // Build SET operation XML if we have set fields
  const setXml =
    setFields.length > 0
      ? `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <mail>
    <update>
      <set>
        <filter>
          <site-id>${siteId}</site-id>
          <mailname>
            <name>${escapeXml(name)}</name>
            ${setFields.join('\n            ')}
          </mailname>
        </filter>
      </set>
    </update>
  </mail>
</packet>`
      : undefined;

  // Build ADD operation XML if we have add fields
  const addXml =
    addFields.length > 0
      ? `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <mail>
    <update>
      <add>
        <filter>
          <site-id>${siteId}</site-id>
          <mailname>
            <name>${escapeXml(name)}</name>
            ${addFields.join('\n            ')}
          </mailname>
        </filter>
      </add>
    </update>
  </mail>
</packet>`
    : undefined;

  // Build REMOVE operation XML if we have remove fields
  const removeXml =
    removeFields.length > 0
      ? `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <mail>
    <update>
      <remove>
        <filter>
          <site-id>${siteId}</site-id>
          <mailname>
            <name>${escapeXml(name)}</name>
            ${removeFields.join('\n            ')}
          </mailname>
        </filter>
      </remove>
    </update>
  </mail>
</packet>`
    : undefined;

  return { setXml, addXml, removeXml, fieldMappings };
}

/**
 * Enhanced error parsing for better debugging
 */
function parseXmlError(xml: string): { error: string; code?: string } {
  try {
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);

    // Look for error in various possible locations
    const result =
      parsed?.packet?.mail?.update?.set?.result ||
      parsed?.packet?.mail?.update?.add?.result ||
      parsed?.packet?.mail?.update?.set?.r ||
      parsed?.packet?.mail?.update?.add?.r;

    if (result?.errtext && result?.errcode) {
      return {
        error: result.errtext,
        code: result.errcode.toString(),
      };
    }

    return { error: 'Unknown error occurred', code: 'UNKNOWN' };
  } catch (parseError) {
    return { error: 'Failed to parse error response', code: 'PARSE_ERROR' };
  }
}

/**
 * Process update operation result and extract field-level details
 */
function processUpdateResult(
  xml: string,
  operation: 'set' | 'add' | 'remove',
  fieldMappings: Record<string, UpdateFieldMapping>
) {
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);

  // Try different possible paths for Plesk update responses
  const result =
    parsed?.packet?.mail?.update?.[operation]?.result ||
    parsed?.packet?.mail?.update?.[operation]?.r ||
    parsed?.packet?.mail?.update?.[operation];

  // Also check if there's a system-level error
  if (parsed?.packet?.system?.status === 'error') {
    return {
      success: false,
      error: parsed.packet.system.errtext || 'System error occurred',
      errorCode: parsed.packet.system.errcode?.toString(),
      fieldResults: Object.fromEntries(
        Object.entries(fieldMappings)
          .filter(([, mapping]) => mapping.operation === operation)
          .map(([field, mapping]) => [
            field,
            {
              success: false,
              error: parsed.packet.system.errtext || 'System error occurred',
              errorCode: parsed.packet.system.errcode?.toString(),
              operation: mapping.operation,
            },
          ])
      ),
    };
  }

  if (!result) {
    return {
      success: false,
      error: 'Invalid response structure',
      fieldResults: {},
    };
  }

  if (result.status !== 'ok') {
    const { error: errorMessage, code: errorCode } = parseXmlError(xml);
    return {
      success: false,
      error: errorMessage,
      errorCode,
      fieldResults: Object.fromEntries(
        Object.entries(fieldMappings)
          .filter(([, mapping]) => mapping.operation === operation)
          .map(([field, mapping]) => [
            field,
            {
              success: false,
              error: errorMessage,
              errorCode,
              operation: mapping.operation,
            },
          ])
      ),
    };
  }

  // Success case - mark all fields in this operation as successful
  const fieldResults = Object.fromEntries(
    Object.entries(fieldMappings)
      .filter(([, mapping]) => mapping.operation === operation)
      .map(([field, mapping]) => [
        field,
        {
          success: true,
          operation: mapping.operation,
          updated: true,
        },
      ])
  );

  return {
    success: true,
    mailname: result.mailname?.name || result.mailname?.n,
    fieldResults,
  };
}

export const emailsUpdateRouter = router({
  update: publicProcedure
    .input(z.object({
      siteId: z.number(),
      name: z.string(),
      password: z.string().optional(),
      passwordType: z.enum(['plain', 'crypt']).optional(),
      antivir: z.enum(['off','inout','in','out']).optional(),
      outgoingMessagesLimit: z.number().optional(),
      description: z.string().optional(),
      // forwarding: z.object({ enabled: z.boolean().optional(), addresses: z.array(z.string()).optional() }).optional(), // REMOVED: Disabled in edit mode
      autoresponder: z.object({ 
        enabled: z.boolean().optional(), 
        subject: z.string().optional(), 
        content: z.string().optional(), 
        contentType: z.string().optional() 
      }).optional(),
      mailbox: z.object({ 
        enabled: z.boolean().optional(), 
        quota: z.number().optional() 
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      try {

        if (!process.env.PLESK_XML_ENDPOINT) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Server configuration error: PLESK_XML_ENDPOINT is not set' });
        }

        const { setXml, addXml, removeXml, fieldMappings } = buildMailUpdateXml(input.siteId, input as UpdateInput);


        if (!(setXml || addXml || removeXml)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No valid update fields provided',
            cause: 'No fields to update'
          });
        }

        const results = {
          success: true,
          mailName: input.name,
          siteId: input.siteId,
          operationsPerformed: [] as string[],
          fieldResults: {} as Record<string, any>,
          warnings: [] as string[],
        };

        // Execute SET operation if needed
          if (setXml) {
          const { xml: setResponse, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(setXml);

          if (isHostUnreachable) {
            throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
          }

          if (isAuthError) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication failed' });
          }

          if (!setResponse) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Empty response from Plesk server during SET operation' });
          }

          const setResult = processUpdateResult(setResponse, 'set', fieldMappings);
          results.operationsPerformed.push('SET');
          Object.assign(results.fieldResults, setResult.fieldResults);

          if (!setResult.success) {
            results.warnings.push(`SET operation failed: ${setResult.error}`);
          }
        }

        // Execute ADD operation if needed
        if (addXml) {
          const { xml: addResponse, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(addXml);

          if (isHostUnreachable) {
            throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
          }

          if (isAuthError) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication failed' });
          }

          if (!addResponse) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Empty response from Plesk server during ADD operation' });
          }

          const addResult = processUpdateResult(addResponse, 'add', fieldMappings);
          results.operationsPerformed.push('ADD');
          Object.assign(results.fieldResults, addResult.fieldResults);

          if (!addResult.success) {
            results.warnings.push(`ADD operation failed: ${addResult.error}`);
          }
        }

        // Execute REMOVE operation if needed
        if (removeXml) {
          const { xml: removeResponse, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(removeXml);

          if (isHostUnreachable) {
            throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
          }

          if (isAuthError) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication failed' });
          }

          if (!removeResponse) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Empty response from Plesk server during REMOVE operation' });
          }

          const removeResult = processUpdateResult(removeResponse, 'remove', fieldMappings);
          results.operationsPerformed.push('REMOVE');
          Object.assign(results.fieldResults, removeResult.fieldResults);

          if (!removeResult.success) {
            results.warnings.push(`REMOVE operation failed: ${removeResult.error}`);
          }
        }

        // Determine overall success
        const successfulFields = Object.values(results.fieldResults).filter(
          (result: any) => result.success
        ).length;
        const totalFields = Object.keys(results.fieldResults).length;

        if (successfulFields === 0 && totalFields > 0) {
          results.success = false;
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'All update operations failed',
            cause: results
          });
        }

        return {
          ...results,
          message: successfulFields === totalFields
            ? 'Mail account updated successfully'
            : `Partially updated: ${successfulFields}/${totalFields} fields succeeded`,
          summary: {
            total: totalFields,
            successful: successfulFields,
            failed: totalFields - successfulFields,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update email account', cause: error });
      }
    }),
});