import { getQStashClient } from './client';
import type { PublishContentJobPayload, QStashJobResult } from './types';

/**
 * Get worker endpoint URL
 * Priority:
 * 1. QSTASH_WORKER_ENDPOINT (full URL)
 * 2. Constructed from NEXT_PUBLIC_APP_URL
 * 3. Constructed from VERCEL_URL (for Vercel deployments)
 */
function getWorkerEndpoint(): string {
	// If explicitly set, use it
	if (process.env.QSTASH_WORKER_ENDPOINT) {
		return process.env.QSTASH_WORKER_ENDPOINT;
	}

	// Try to construct from available base URLs
	let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
	
	if (!baseUrl && process.env.VERCEL_URL) {
		baseUrl = `https://${process.env.VERCEL_URL}`;
	}

	if (baseUrl) {
		// Ensure baseUrl doesn't end with a slash
		const cleanBaseUrl = baseUrl.replace(/\/$/, '');
		return `${cleanBaseUrl}/api/workers/publish-content`;
	}

	return '';
}

const WORKER_ENDPOINT = getWorkerEndpoint();

if (!WORKER_ENDPOINT) {
	console.warn(
		'Worker endpoint not configured. Set QSTASH_WORKER_ENDPOINT, NEXT_PUBLIC_APP_URL, or VERCEL_URL.'
	);
}

/**
 * Schedule a content calendar post for publishing
 * @param postId - Content calendar post ID
 * @param pageTokenId - Page token ID
 * @param scheduledPublishTime - When to publish (Date object)
 * @returns QStash job result with messageId
 */
export async function schedulePublish(
	postId: string,
	pageTokenId: string,
	scheduledPublishTime: Date
): Promise<QStashJobResult> {
	if (!WORKER_ENDPOINT) {
		throw new Error(
			'Worker endpoint not configured. Set QSTASH_WORKER_ENDPOINT, NEXT_PUBLIC_APP_URL, or VERCEL_URL.'
		);
	}

	const client = getQStashClient();
	const now = new Date();
	const scheduledTime = scheduledPublishTime.getTime();

	if (scheduledTime <= now.getTime()) {
		throw new Error('Scheduled publish time must be in the future');
	}

	const payload: PublishContentJobPayload = {
		postId,
		pageTokenId,
	};

	// Schedule the job using notBefore for absolute time scheduling
	// According to QStash docs: notBefore is a Unix timestamp in seconds
	// This is more precise than delay as it doesn't depend on when the job is scheduled
	const result = await client.publishJSON({
		url: WORKER_ENDPOINT,
		body: payload,
		notBefore: Math.floor(scheduledTime / 1000), // Convert to Unix timestamp (seconds)
	});

	return {
		messageId: result.messageId,
		scheduledFor: scheduledPublishTime.getTime(),
	};
}

/**
 * Cancel a scheduled publish job
 * @param messageId - QStash message ID to cancel
 * @throws Will not throw if message is not found (404) - job may have already been executed
 */
export async function cancelPublish(messageId: string): Promise<void> {
	const client = getQStashClient();
	try {
		await client.messages.delete(messageId);
	} catch (error: any) {
		// If message not found (404), it likely means the job was already executed or cleaned up
		// This is not an error - we can safely ignore it
		if (error?.status === 404 || error?.message?.includes('not found')) {
			console.log(`QStash message ${messageId} not found - likely already executed or cleaned up`);
			return;
		}
		// Re-throw other errors
		throw error;
	}
}

/**
 * Reschedule a publish job
 * This cancels the old job and creates a new one
 * @param oldMessageId - Old QStash message ID to cancel
 * @param postId - Content calendar post ID
 * @param pageTokenId - Page token ID
 * @param newScheduledPublishTime - New scheduled publish time
 * @returns New QStash job result
 */
export async function reschedulePublish(
	oldMessageId: string | null,
	postId: string,
	pageTokenId: string,
	newScheduledPublishTime: Date
): Promise<QStashJobResult> {
	// Cancel old job if it exists
	if (oldMessageId) {
		try {
			await cancelPublish(oldMessageId);
		} catch (error) {
			// Ignore errors if job doesn't exist or is already processed
			console.warn('Failed to cancel old QStash job:', error);
		}
	}

	// Schedule new job
	return schedulePublish(postId, pageTokenId, newScheduledPublishTime);
}

