import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { sendPleskXmlRequest } from '../../lib/plesk/xml-client';
import { protectedProcedure, router } from '../../trpc';

/**
 * Plesk webspace status values (objectStatus / plesk_common.xsd).
 * @see https://docs.plesk.com/en-US/obsidian/api-rpc/about-xml-api/reference/managing-subscriptions/subscription-settings/general-subscription-information/node-gen_setup-type-setgensetuptype.33860/
 */
export const PLESK_WEBSPACE_STATUS = {
	ACTIVE: 0,
	DISABLED_BY_ADMIN: 16,
	DISABLED_BY_RESELLER: 32,
	DISABLED_BY_CUSTOMER: 64,
} as const;

const suspendBySchema = z.enum(['admin', 'reseller', 'customer']).default('admin');

function statusForSuspendBy(suspendedBy: z.infer<typeof suspendBySchema>): number {
	switch (suspendedBy) {
		case 'reseller':
			return PLESK_WEBSPACE_STATUS.DISABLED_BY_RESELLER;
		case 'customer':
			return PLESK_WEBSPACE_STATUS.DISABLED_BY_CUSTOMER;
		default:
			return PLESK_WEBSPACE_STATUS.DISABLED_BY_ADMIN;
	}
}

/**
 * Sets subscription status via webspace SET (no dedicated suspend operator).
 * @see https://docs.plesk.com/en-US/obsidian/api-rpc/about-xml-api/reference/managing-subscriptions/setting-subscription-parameters.33907/
 */
function buildSubscriptionStatusSetXml(subscriptionId: number, status: number): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <set>
      <filter>
        <id>${subscriptionId}</id>
      </filter>
      <values>
        <gen_setup>
          <status>${status}</status>
        </gen_setup>
      </values>
    </set>
  </webspace>
</packet>`;
}

function assertPleskSetResponse(parsed: Record<string, unknown>): void {
	const packet = parsed?.packet as Record<string, unknown> | undefined;
	const system = packet?.system as { status?: string; errcode?: number; errtext?: string } | undefined;

	if (system?.status === 'error') {
		if (system.errcode === 1010) {
			throw new TRPCError({
				code: 'TOO_MANY_REQUESTS',
				message: `Rate limit exceeded: ${system.errtext ?? 'Unknown error'}. Please wait before making another request.`,
			});
		}
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: `Plesk API Error ${system.errcode}: ${system.errtext ?? 'Unknown error'}`,
		});
	}

	const setNode = (packet?.webspace as { set?: { result?: unknown } } | undefined)?.set;
	const rawResults = setNode?.result;
	const results = rawResults === undefined ? [] : Array.isArray(rawResults) ? rawResults : [rawResults];

	for (const result of results) {
		const entry = result as { status?: string; errcode?: number; errtext?: string };
		if (entry.status === 'error') {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: `Plesk API Error ${entry.errcode}: ${entry.errtext ?? 'Unknown error'}`,
			});
		}
	}
}

async function setSubscriptionStatus(subscriptionId: number, status: number) {
	if (!process.env.PLESK_XML_ENDPOINT) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Server configuration error: PLESK_XML_ENDPOINT environment variable is not set',
		});
	}

	const xmlRequest = buildSubscriptionStatusSetXml(subscriptionId, status);
	const { xml, isAuthError, isHostUnreachable } = await sendPleskXmlRequest(xmlRequest);

	if (isHostUnreachable) {
		throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Plesk host is unreachable' });
	}
	if (isAuthError) {
		throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Plesk credentials' });
	}
	if (!xml || xml.trim() === '') {
		throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Empty response from Plesk server' });
	}

	const parser = new XMLParser({ ignoreAttributes: false });
	let parsed: Record<string, unknown>;

	try {
		parsed = parser.parse(xml) as Record<string, unknown>;
	} catch (parseError) {
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to parse Plesk response',
			cause: parseError,
		});
	}

	assertPleskSetResponse(parsed);

	return {
		raw: xml,
		parsed,
		status,
	};
}

export const subscriptionsSuspendRouter = router({
	/**
	 * Suspend a subscription (webspace) by setting gen_setup.status.
	 * Default: 16 (disabled by Administrator).
	 */
	suspend: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				suspendedBy: suspendBySchema.optional(),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const status = statusForSuspendBy(input.suspendedBy ?? 'admin');
				return await setSubscriptionStatus(input.id, status);
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to suspend subscription',
					cause: error,
				});
			}
		}),

	/**
	 * Reactivate a suspended subscription (status 0 = active).
	 */
	unsuspend: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			try {
				return await setSubscriptionStatus(input.id, PLESK_WEBSPACE_STATUS.ACTIVE);
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to unsuspend subscription',
					cause: error,
				});
			}
		}),
});
