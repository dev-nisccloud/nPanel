import { getQStashClient } from './client';
/**
 * Get LinkedIn worker endpoint URL
 * Priority:
 * 1. QSTASH_WORKER_ENDPOINT (full URL)
 * 2. Constructed from VITE_PUBLIC_APP_URL
 * 3. Constructed from VERCEL_URL (for Vercel deployments)
 */
function getLinkedInWorkerEndpoint() {
    // If explicitly set, use it
    if (process.env.QSTASH_LINKEDIN_WORKER_ENDPOINT) {
        return process.env.QSTASH_LINKEDIN_WORKER_ENDPOINT;
    }
    // Try to construct from available base URLs
    let baseUrl = process.env.VITE_PUBLIC_APP_URL;
    if (!baseUrl && process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    if (baseUrl) {
        // Ensure baseUrl doesn't end with a slash
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        return `${cleanBaseUrl}/api/workers/publish-linkedin-content`;
    }
    return '';
}
const LINKEDIN_WORKER_ENDPOINT = getLinkedInWorkerEndpoint();
if (!LINKEDIN_WORKER_ENDPOINT) {
    console.warn('LinkedIn worker endpoint not configured. Set QSTASH_LINKEDIN_WORKER_ENDPOINT, VITE_PUBLIC_APP_URL, or VERCEL_URL.');
}
/**
 * Schedule a LinkedIn content calendar post for publishing
 * @param postId - LinkedIn content calendar post ID
 * @param pageTokenId - Organization token ID
 * @param scheduledPublishTime - When to publish (Date object)
 * @returns QStash job result with messageId
 */
export async function scheduleLinkedInPublish(postId, pageTokenId, scheduledPublishTime) {
    if (!LINKEDIN_WORKER_ENDPOINT) {
        throw new Error('LinkedIn worker endpoint not configured. Set QSTASH_LINKEDIN_WORKER_ENDPOINT, VITE_PUBLIC_APP_URL, or VERCEL_URL.');
    }
    const client = getQStashClient();
    const now = new Date();
    const scheduledTime = scheduledPublishTime.getTime();
    if (scheduledTime <= now.getTime()) {
        throw new Error('Scheduled publish time must be in the future');
    }
    const payload = {
        postId,
        pageTokenId,
    };
    // Schedule the job using notBefore for absolute time scheduling
    // According to QStash docs: notBefore is a Unix timestamp in seconds
    // This is more precise than delay as it doesn't depend on when the job is scheduled
    const result = await client.publishJSON({
        url: LINKEDIN_WORKER_ENDPOINT,
        body: payload,
        notBefore: Math.floor(scheduledTime / 1000), // Convert to Unix timestamp (seconds)
    });
    return {
        messageId: result.messageId,
        scheduledFor: scheduledPublishTime.getTime(),
    };
}
/**
 * Cancel a scheduled LinkedIn publish job
 * @param messageId - QStash message ID to cancel
 * @throws Will not throw if message is not found (404) - job may have already been executed
 */
export async function cancelLinkedInPublish(messageId) {
    const client = getQStashClient();
    try {
        await client.messages.delete(messageId);
    }
    catch (error) {
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
 * Reschedule a LinkedIn publish job
 * This cancels the old job and creates a new one
 * @param oldMessageId - Old QStash message ID to cancel
 * @param postId - LinkedIn content calendar post ID
 * @param pageTokenId - Organization token ID
 * @param newScheduledPublishTime - New scheduled publish time
 * @returns New QStash job result
 */
export async function rescheduleLinkedInPublish(oldMessageId, postId, pageTokenId, newScheduledPublishTime) {
    // Cancel old job if it exists
    if (oldMessageId) {
        try {
            await cancelLinkedInPublish(oldMessageId);
        }
        catch (error) {
            // Ignore errors if job doesn't exist or is already processed
            console.warn('Failed to cancel old QStash job:', error);
        }
    }
    // Schedule new job
    return scheduleLinkedInPublish(postId, pageTokenId, newScheduledPublishTime);
}
