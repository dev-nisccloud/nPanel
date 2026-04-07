import type { QStashJobResult } from './types';
/**
 * Schedule a LinkedIn content calendar post for publishing
 * @param postId - LinkedIn content calendar post ID
 * @param pageTokenId - Organization token ID
 * @param scheduledPublishTime - When to publish (Date object)
 * @returns QStash job result with messageId
 */
export declare function scheduleLinkedInPublish(postId: string, pageTokenId: string, scheduledPublishTime: Date): Promise<QStashJobResult>;
/**
 * Cancel a scheduled LinkedIn publish job
 * @param messageId - QStash message ID to cancel
 * @throws Will not throw if message is not found (404) - job may have already been executed
 */
export declare function cancelLinkedInPublish(messageId: string): Promise<void>;
/**
 * Reschedule a LinkedIn publish job
 * This cancels the old job and creates a new one
 * @param oldMessageId - Old QStash message ID to cancel
 * @param postId - LinkedIn content calendar post ID
 * @param pageTokenId - Organization token ID
 * @param newScheduledPublishTime - New scheduled publish time
 * @returns New QStash job result
 */
export declare function rescheduleLinkedInPublish(oldMessageId: string | null, postId: string, pageTokenId: string, newScheduledPublishTime: Date): Promise<QStashJobResult>;
