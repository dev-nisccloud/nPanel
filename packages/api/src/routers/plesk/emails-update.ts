import { XMLParser } from 'fast-xml-parser';
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { protectedProcedure, router } from '../../trpc';

/** Product cap shown on the mail form. Plesk node: outgoing-messages-mbox-limit. */
export const MAX_OUTGOING_MESSAGES_PER_DAY = 120;

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
	previousForwardingAddresses?: string[];
	aliases?: string[];
	previousAliases?: string[];
	autoresponder?: {
		enabled?: boolean;
		subject?: string;
		content?: string;
		contentType?: string;
		charset?: string;
		endDate?: string;
	};
	mailbox?: { enabled?: boolean; quota?: number };
};

const escapeXml = (str: string) =>
	str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function uniqueValues(values: string[] | undefined): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const value of values ?? []) {
		const trimmed = value.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(trimmed);
	}
	return out;
}

/** Plesk alias nodes are the local part, not a full address. */
function aliasLocalPart(value: string): string {
	const trimmed = value.trim();
	const at = trimmed.indexOf('@');
	return (at === -1 ? trimmed : trimmed.slice(0, at)).trim();
}

/**
 * Maps update fields to appropriate Plesk update operations
 */
interface UpdateFieldMapping {
  operation: 'add' | 'remove' | 'set';
  xmlFragment: string;
}

/**
 * Build XML for a mail account update.
 * Child nodes follow mailnameUpdateType order from the Plesk Obsidian XML API:
 * mailbox, forwarding, alias, autoresponder, password, antivir,
 * outgoing-messages-mbox-limit, description.
 * `set` replaces the settings included in that packet.
 * Forwarding addresses and aliases use remove + add so the saved list matches
 * the form, which is how the API adds and drops list entries.
 */
function mailUpdatePacket(siteId: number, name: string, operation: "set" | "add" | "remove", fields: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <mail>
    <update>
      <${operation}>
        <filter>
          <site-id>${siteId}</site-id>
          <mailname>
            <name>${escapeXml(name)}</name>
            ${fields.join("\n            ")}
          </mailname>
        </filter>
      </${operation}>
    </update>
  </mail>
</packet>`;
}

function buildMailUpdateXml(
  siteId: number,
  mailData: UpdateInput
): {
  setXml?: string;
  addXml?: string;
  removeXml?: string;
  autoresponderXml?: string;
  fieldMappings: Record<string, UpdateFieldMapping>;
} {
  const { name } = mailData;
  const fieldMappings: Record<string, UpdateFieldMapping> = {};
  const setFields: string[] = [];
  const addFields: string[] = [];
  const removeFields: string[] = [];

  if (mailData.mailbox) {
    const enabled = mailData.mailbox.enabled !== false;
    const quotaXml = mailData.mailbox.quota !== undefined
      ? `\n      <quota>${Math.floor(mailData.mailbox.quota)}</quota>`
      : '';
    setFields.push(`<mailbox>
      <enabled>${enabled}</enabled>${quotaXml}
    </mailbox>`);
    fieldMappings.mailbox = { operation: 'set', xmlFragment: 'mailbox settings' };
  }

  if (mailData.forwarding) {
    const enabled = mailData.forwarding.enabled !== false;
    const desired = enabled ? uniqueValues(mailData.forwarding.addresses) : [];
    const addressesXml = desired
      .map((address) => `\n      <address>${escapeXml(address)}</address>`)
      .join('');
    setFields.push(`<forwarding>
      <enabled>${enabled}</enabled>${addressesXml}
    </forwarding>`);
    fieldMappings.forwarding = { operation: 'set', xmlFragment: 'forwarding settings' };
  }

  if (mailData.aliases) {
    const desired = uniqueValues(mailData.aliases.map(aliasLocalPart).filter(Boolean));
    const previous = uniqueValues((mailData.previousAliases ?? []).map(aliasLocalPart).filter(Boolean));
    const desiredKeys = new Set(desired.map((alias) => alias.toLowerCase()));
    const previousKeys = new Set(previous.map((alias) => alias.toLowerCase()));
    const removed = previous.filter((alias) => !desiredKeys.has(alias.toLowerCase()));
    const added = desired.filter((alias) => !previousKeys.has(alias.toLowerCase()));
    if (removed.length > 0) {
      removeFields.push(removed.map((alias) => `<alias>${escapeXml(alias)}</alias>`).join('\n            '));
      fieldMappings.aliasesRemoved = { operation: 'remove', xmlFragment: 'aliases' };
    }
    if (added.length > 0) {
      addFields.push(added.map((alias) => `<alias>${escapeXml(alias)}</alias>`).join('\n            '));
      fieldMappings.aliasesAdded = { operation: 'add', xmlFragment: 'aliases' };
    }
  }

  let autoresponderFields: string[] = [];
  if (mailData.autoresponder) {
    if (mailData.autoresponder.enabled) {
      const contentType = mailData.autoresponder.contentType || "text/plain";
      const charset = mailData.autoresponder.charset || "UTF-8";
      const endDate = mailData.autoresponder.endDate?.trim();
      autoresponderFields = [`<autoresponder>
      <enabled>true</enabled>
      <subject>${escapeXml(mailData.autoresponder.subject ?? "")}</subject>
      <content_type>${escapeXml(contentType)}</content_type>
      <charset>${escapeXml(charset)}</charset>
      <text>${escapeXml(mailData.autoresponder.content ?? "")}</text>${endDate ? `\n      <end_date>${escapeXml(endDate)}</end_date>` : ""}
    </autoresponder>`];
    } else {
      autoresponderFields = [`<autoresponder>
      <enabled>false</enabled>
    </autoresponder>`];
    }
    fieldMappings.autoresponder = { operation: "set", xmlFragment: "autoresponder settings" };
  }

  if (mailData.password) {
    const passwordType = mailData.passwordType || 'plain';
    setFields.push(`<password>
      <value>${escapeXml(mailData.password)}</value>
      <type>${passwordType}</type>
    </password>`);
    fieldMappings.password = { operation: 'set', xmlFragment: 'password' };
  }

  if (mailData.antivir) {
    setFields.push(`<antivir>${mailData.antivir}</antivir>`);
    fieldMappings.antivir = { operation: 'set', xmlFragment: 'antivirus settings' };
  }

  if (mailData.outgoingMessagesLimit !== undefined) {
    setFields.push(
      `<outgoing-messages-mbox-limit>${mailData.outgoingMessagesLimit}</outgoing-messages-mbox-limit>`
    );
    fieldMappings.outgoingMessagesLimit = { operation: 'set', xmlFragment: 'outgoing messages limit' };
  }

  if (mailData.description !== undefined) {
    setFields.push(`<description>${escapeXml(mailData.description)}</description>`);
    fieldMappings.description = { operation: 'set', xmlFragment: 'description' };
  }

  const setXml = setFields.length > 0 ? mailUpdatePacket(siteId, name, "set", setFields) : undefined;
  const addXml = addFields.length > 0 ? mailUpdatePacket(siteId, name, "add", addFields) : undefined;
  const removeXml = removeFields.length > 0 ? mailUpdatePacket(siteId, name, "remove", removeFields) : undefined;
  const autoresponderXml = autoresponderFields.length > 0
    ? mailUpdatePacket(siteId, name, "set", autoresponderFields)
    : undefined;

  return { setXml, addXml, removeXml, autoresponderXml, fieldMappings };
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
  update: protectedProcedure
    .input(z.object({
      siteId: z.number(),
      name: z.string(),
      password: z.string().optional(),
      passwordType: z.enum(['plain', 'crypt']).optional(),
      antivir: z.enum(['off','inout','in','out']).optional(),
      outgoingMessagesLimit: z.number().int().min(0).max(MAX_OUTGOING_MESSAGES_PER_DAY).optional(),
      description: z.string().optional(),
      forwarding: z.object({
        enabled: z.boolean().optional(),
        addresses: z.array(z.string()).optional(),
      }).optional(),
      previousForwardingAddresses: z.array(z.string()).optional(),
      aliases: z.array(z.string()).optional(),
      previousAliases: z.array(z.string()).optional(),
      autoresponder: z.object({
        enabled: z.boolean().optional(),
        subject: z.string().optional(),
        content: z.string().optional(),
        contentType: z.string().optional(),
        charset: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
      mailbox: z.object({
        enabled: z.boolean().optional(),
        quota: z.number().int().min(0).optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      try {

        if (!process.env.PLESK_XML_ENDPOINT) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Server configuration error: PLESK_XML_ENDPOINT is not set' });
        }

        const { setXml, addXml, removeXml, autoresponderXml, fieldMappings } = buildMailUpdateXml(input.siteId, input as UpdateInput);
        const mainSetMappings = Object.fromEntries(
          Object.entries(fieldMappings).filter(([field]) => field !== "autoresponder"),
        );


        if (!(setXml || addXml || removeXml || autoresponderXml)) {
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

        // Remove dropped list entries before adding or replacing the rest.
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

          const setResult = processUpdateResult(setResponse, 'set', mainSetMappings);
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

        if (autoresponderXml) {
          const { xml: autoResponse, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(autoresponderXml);

          if (isHostUnreachable) {
            throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
          }

          if (isAuthError) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication failed' });
          }

          if (!autoResponse) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Empty response from Plesk server during auto reply update' });
          }

          const autoResult = processUpdateResult(
            autoResponse,
            'set',
            fieldMappings.autoresponder ? { autoresponder: fieldMappings.autoresponder } : {},
          );
          results.operationsPerformed.push('SET_AUTORESPONDER');
          Object.assign(results.fieldResults, autoResult.fieldResults);

          if (!autoResult.success) {
            results.warnings.push(`Auto reply update failed: ${autoResult.error}`);
          }
        }

        if (results.warnings.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: results.warnings.join(' '),
            cause: results,
          });
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