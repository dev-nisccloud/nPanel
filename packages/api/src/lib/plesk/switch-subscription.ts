/**
 * Official Plesk Obsidian XML API:
 * https://docs.plesk.com/en-US/obsidian/api-rpc/about-xml-api/reference/managing-subscriptions/switching-a-subscription-to-a-different-service-plan.66391/
 *
 * switch-subscription associates a webspace with a different service plan
 * via plan-guid (or plan-external-id / no-plan). We resolve GUID from the
 * stored nisc_product_plan.pleskServicePlanId (numeric id, name, or guid).
 *
 * Service plan GET (for GUID):
 * https://docs.plesk.com/en-US/obsidian/api-rpc/about-xml-api/reference/managing-service-plans/getting-information-on-service-plans.32915/
 */
import { TRPCError } from "@trpc/server";
import { isPleskGuid } from "../subscription-upgrade";
import {
	asArray,
	escapeXml,
	pleskOperationError,
	pleskXmlScalar,
	sendPleskXmlOrThrow,
} from "./xml-utils";

function firstServicePlanResult(parsed: Record<string, unknown>): Record<string, unknown> | undefined {
	const packet = parsed.packet as Record<string, unknown> | undefined;
	const servicePlan = packet?.["service-plan"] as Record<string, unknown> | undefined;
	const getNode = servicePlan?.get as Record<string, unknown> | undefined;
	return asArray(getNode?.result as Record<string, unknown> | Record<string, unknown>[] | undefined)[0];
}

function firstWebspaceGetResult(parsed: Record<string, unknown>): Record<string, unknown> | undefined {
	const packet = parsed.packet as Record<string, unknown> | undefined;
	const webspace = packet?.webspace as Record<string, unknown> | undefined;
	const getNode = webspace?.get as Record<string, unknown> | undefined;
	return asArray(getNode?.result as Record<string, unknown> | Record<string, unknown>[] | undefined)[0];
}

function firstSwitchResult(parsed: Record<string, unknown>): Record<string, unknown> | undefined {
	const packet = parsed.packet as Record<string, unknown> | undefined;
	const webspace = packet?.webspace as Record<string, unknown> | undefined;
	const sw = webspace?.["switch-subscription"] as Record<string, unknown> | undefined;
	return asArray(sw?.result as Record<string, unknown> | Record<string, unknown>[] | undefined)[0];
}

export async function resolvePleskServicePlanGuid(pleskServicePlanId: string): Promise<string> {
	const raw = pleskServicePlanId.trim();
	if (!raw) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "The selected plan is not linked to a Plesk service plan",
		});
	}
	if (isPleskGuid(raw)) return raw;

	const planIdNumber = Number.parseInt(raw, 10);
	const isNumeric = !Number.isNaN(planIdNumber) && String(planIdNumber) === raw;
	const filter = isNumeric
		? `<id>${planIdNumber}</id>`
		: `<name>${escapeXml(raw)}</name>`;

	const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <service-plan>
    <get>
      <filter>
        ${filter}
      </filter>
    </get>
  </service-plan>
</packet>`;

	const { parsed } = await sendPleskXmlOrThrow(xmlRequest);
	const result = firstServicePlanResult(parsed);
	const opError = pleskOperationError(result, "Failed to load Plesk service plan");
	if (opError) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: opError.code
				? `Plesk service plan error ${opError.code}: ${opError.error}`
				: opError.error,
		});
	}

	const guid = pleskXmlScalar(result?.guid);
	if (!guid) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Plesk did not return a GUID for the selected service plan",
		});
	}
	return guid;
}

export async function loadPleskWebspacePlan(filter: {
	id?: number;
	name?: string;
}): Promise<{
	webspaceId: number | null;
	planGuid: string | null;
	planId: string | null;
	planName: string | null;
} | null> {
	const idFilter =
		filter.id != null && Number.isFinite(filter.id) && filter.id > 0
			? `<id>${filter.id}</id>`
			: filter.name?.trim()
				? `<name>${escapeXml(filter.name.trim())}</name>`
				: null;
	if (!idFilter) return null;

	const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <get>
      <filter>
        ${idFilter}
      </filter>
      <dataset>
        <gen_info/>
        <subscriptions/>
      </dataset>
    </get>
  </webspace>
</packet>`;

	try {
		const { parsed } = await sendPleskXmlOrThrow(xmlRequest);
		const result = firstWebspaceGetResult(parsed);
		const opError = pleskOperationError(result, "Failed to load Plesk subscription plan");
		if (opError || !result) return null;

		const webspaceIdRaw = pleskXmlScalar(result.id);
		const webspaceId = webspaceIdRaw ? Number.parseInt(webspaceIdRaw, 10) : null;
		const data = result.data as Record<string, unknown> | undefined;
		const subscriptions = data?.subscriptions as Record<string, unknown> | undefined;
		const subscription = asArray(
			subscriptions?.subscription as Record<string, unknown> | Record<string, unknown>[] | undefined,
		)[0];
		const planNode = subscription?.plan as Record<string, unknown> | undefined;
		const planGuid = pleskXmlScalar(planNode?.["plan-guid"]) ?? null;
		if (!planGuid) {
			return {
				webspaceId: Number.isFinite(webspaceId) ? webspaceId : null,
				planGuid: null,
				planId: null,
				planName: null,
			};
		}

		const planXml = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <service-plan>
    <get>
      <filter>
        <guid>${escapeXml(planGuid)}</guid>
      </filter>
    </get>
  </service-plan>
</packet>`;
		const planParsed = await sendPleskXmlOrThrow(planXml);
		const planResult = firstServicePlanResult(planParsed.parsed);
		return {
			webspaceId: Number.isFinite(webspaceId) ? webspaceId : null,
			planGuid,
			planId: pleskXmlScalar(planResult?.id) ?? null,
			planName: pleskXmlScalar(planResult?.name) ?? null,
		};
	} catch {
		return null;
	}
}

/** Live Plesk service plan attached to a webspace (subscriptions dataset). */
export async function getPleskWebspaceCurrentPlan(webspaceId: number): Promise<{
	planGuid: string | null;
	planId: string | null;
	planName: string | null;
} | null> {
	const row = await loadPleskWebspacePlan({ id: webspaceId });
	if (!row) return null;
	return {
		planGuid: row.planGuid,
		planId: row.planId,
		planName: row.planName,
	};
}

/**
 * Switch a Plesk webspace to another service plan (official switch-subscription).
 * A `problems` table in an ok response is expected — some settings stay at
 * current values when they cannot match the requested plan.
 */
export async function switchPleskSubscriptionPlan(params: {
	webspaceId: number;
	planGuid: string;
}): Promise<{ problems: string | null }> {
	const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<packet>
  <webspace>
    <switch-subscription>
      <filter>
        <id>${params.webspaceId}</id>
      </filter>
      <plan-guid>${escapeXml(params.planGuid)}</plan-guid>
    </switch-subscription>
  </webspace>
</packet>`;

	const { parsed } = await sendPleskXmlOrThrow(xmlRequest);
	const result = firstSwitchResult(parsed);
	const opError = pleskOperationError(result, "Failed to switch Plesk subscription plan");
	if (opError) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: opError.code
				? `Plesk switch-subscription error ${opError.code}: ${opError.error}`
				: opError.error,
		});
	}

	const status = pleskXmlScalar(result?.status)?.toLowerCase();
	if (status !== "ok") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Plesk did not confirm the subscription plan switch",
		});
	}

	return { problems: pleskXmlScalar(result?.problems) ?? null };
}
