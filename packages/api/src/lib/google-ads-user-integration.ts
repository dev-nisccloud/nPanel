import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "@npanel/db";

import { db } from "@npanel/db";
import { googleAdsIntegration } from "@npanel/db/schema/google-ads";

import { refreshAccessToken } from "./google-ads-client";
import {
	getGoogleAdsClientId,
	getGoogleAdsClientSecret,
} from "./google-ads-credentials";
import { GoogleAdsErrorHandler } from "./google-ads-error-handler";

async function ensureIntegrationIsUsable(integration: typeof googleAdsIntegration.$inferSelect | undefined) {
	if (!integration) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"No active Google Ads integration found. Please connect your account first.",
		});
	}

	const isExpired =
		integration.accessTokenExpiresAt &&
		new Date(integration.accessTokenExpiresAt) < new Date();

	if (isExpired && integration.refreshToken) {
		const clientId = getGoogleAdsClientId();
		const clientSecret = getGoogleAdsClientSecret();

		try {
			const tokenResponse = await refreshAccessToken(
				integration.refreshToken,
				clientId,
				clientSecret,
			);

			const expiresAt = new Date();
			expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

			await db
				.update(googleAdsIntegration)
				.set({
					accessToken: tokenResponse.access_token,
					accessTokenExpiresAt: expiresAt,
					lastTokenRefreshAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(googleAdsIntegration.id, integration.id));

			integration.accessToken = tokenResponse.access_token;
			integration.accessTokenExpiresAt = expiresAt;
		} catch (error) {
			const errorInfo = GoogleAdsErrorHandler.handleError(error);
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: `Failed to refresh access token: ${errorInfo.message}`,
			});
		}
	}

	return integration;
}

/**
 * Active Google Ads integration for a specific user, with access token refreshed when expired.
 */
export async function getUserGoogleAdsIntegration(userId: string) {
	const [integration] = await db
		.select()
		.from(googleAdsIntegration)
		.where(
			and(
				eq(googleAdsIntegration.userId, userId),
				eq(googleAdsIntegration.status, "ACTIVE"),
			),
		)
		.orderBy(desc(googleAdsIntegration.createdAt))
		.limit(1);

	return ensureIntegrationIsUsable(integration);
}

/**
 * Session-aware integration lookup.
 * Agency users share the latest active Google Ads integration across the agency.
 */
export async function getGoogleAdsIntegrationForSession(params: {
	userId: string;
	role?: string | null;
}) {
	const isAgencyUser = (params.role ?? "").includes("AGENCY");
	if (!isAgencyUser) {
		return getUserGoogleAdsIntegration(params.userId);
	}

	const [integration] = await db
		.select()
		.from(googleAdsIntegration)
		.where(eq(googleAdsIntegration.status, "ACTIVE"))
		.orderBy(desc(googleAdsIntegration.createdAt))
		.limit(1);

	return ensureIntegrationIsUsable(integration);
}
