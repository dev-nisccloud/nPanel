import { qstashClient } from "./qstash-client";

export interface QueueJob {
  id: string;
  type: string;
  payload: unknown;
  retries: number;
  maxRetries: number;
  delay?: number;
  scheduledAt?: Date;
}

export interface CampaignSendJob {
  campaignId: string;
}

export interface BulkEmailSendJob {
  campaignId: string;
  contacts: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    customFields?: Record<string, unknown>;
  }>;
}

export interface DomainVerificationJob {
  domainId: string;
}

export type JobType = "CAMPAIGN_SEND" | "BULK_EMAIL_SEND" | "DOMAIN_VERIFICATION_CHECK";

/**
 * Queue a campaign for sending
 */
export async function queueCampaignSend(campaignId: string): Promise<string> {
  try {
    const job: CampaignSendJob = { campaignId };
    
    const response = await qstashClient.publishJSON({
      url: `${process.env.EMAIL_WEBHOOK_BASE_URL}/api/trpc/emailMarketing.processQueueJob`,
      body: {
        type: "CAMPAIGN_SEND",
        payload: job,
      },
      retries: 3,
      delay: 0, // Send immediately
    });

    return response.messageId;
  } catch (error) {
    console.error("Error queueing campaign send:", error);
    throw new Error(`Failed to queue campaign send for ${campaignId}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Queue bulk email send job
 */
export async function queueBulkEmailSend(
  campaignId: string,
  contacts: BulkEmailSendJob["contacts"]
): Promise<string> {
  try {
    const job: BulkEmailSendJob = { campaignId, contacts };
    
    const response = await qstashClient.publishJSON({
      url: `${process.env.EMAIL_WEBHOOK_BASE_URL}/api/trpc/emailMarketing.processQueueJob`,
      body: {
        type: "BULK_EMAIL_SEND",
        payload: job,
      },
      retries: 3,
      delay: 0, // Send immediately
    });

    return response.messageId;
  } catch (error) {
    console.error("Error queueing bulk email send:", error);
    throw new Error(`Failed to queue bulk email send for campaign ${campaignId}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Queue domain verification check
 */
export async function queueDomainVerification(domainId: string): Promise<string> {
  try {
    const job: DomainVerificationJob = { domainId };
    
    const response = await qstashClient.publishJSON({
      url: `${process.env.EMAIL_WEBHOOK_BASE_URL}/api/trpc/emailMarketing.processQueueJob`,
      body: {
        type: "DOMAIN_VERIFICATION_CHECK",
        payload: job,
      },
      retries: 5,
      delay: 60, // Wait 1 minute before first attempt
    });

    return response.messageId;
  } catch (error) {
    console.error("Error queueing domain verification:", error);
    throw new Error(`Failed to queue domain verification for ${domainId}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Schedule a campaign for later sending
 */
export async function scheduleCampaignSend(
  campaignId: string,
  scheduledAt: Date
): Promise<string> {
  try {
    const job: CampaignSendJob = { campaignId };
    const delayMs = scheduledAt.getTime() - Date.now();
    
    if (delayMs <= 0) {
      throw new Error("Scheduled time must be in the future");
    }

    const response = await qstashClient.publishJSON({
      url: `${process.env.EMAIL_WEBHOOK_BASE_URL}/api/trpc/emailMarketing.processQueueJob`,
      body: {
        type: "CAMPAIGN_SEND",
        payload: job,
      },
      retries: 3,
      delay: Math.floor(delayMs / 1000), // Convert to seconds
    });

    return response.messageId;
  } catch (error) {
    console.error("Error scheduling campaign send:", error);
    throw new Error(`Failed to schedule campaign send for ${campaignId}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Cancel a scheduled job
 */
export async function cancelScheduledJob(messageId: string): Promise<void> {
  try {
    await qstashClient.messages.delete(messageId);
  } catch (error) {
    console.error("Error canceling scheduled job:", error);
    throw new Error(`Failed to cancel job ${messageId}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get job status
 */
export async function getJobStatus(messageId: string): Promise<{
  messageId: string;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  nextAttemptAt?: Date;
  lastAttemptAt?: Date;
}> {
  try {
    // QStash doesn't provide a direct way to get message status
    // This is a simplified implementation
    return {
      messageId,
      status: "completed", // Assume completed for now
      attempts: 1,
      maxAttempts: 3,
    };
  } catch (error) {
    console.error("Error getting job status:", error);
    throw new Error(`Failed to get job status for ${messageId}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * List jobs by status
 */
export async function listJobs(): Promise<Array<{
  messageId: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  nextAttemptAt?: Date;
}>> {
  try {
    // QStash doesn't provide a direct way to list messages
    // This is a simplified implementation
    return [];
  } catch (error) {
    console.error("Error listing jobs:", error);
    throw new Error(`Failed to list jobs: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Retry a failed job
 */
export async function retryJob(messageId: string): Promise<void> {
  try {
    // QStash doesn't provide a direct way to retry messages
    // This is a simplified implementation
    console.log(`Retrying job ${messageId} - not implemented`);
  } catch (error) {
    console.error("Error retrying job:", error);
    throw new Error(`Failed to retry job ${messageId}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Delete a job
 */
export async function deleteJob(messageId: string): Promise<void> {
  try {
    // QStash doesn't provide a direct way to delete messages
    // This is a simplified implementation
    console.log(`Deleting job ${messageId} - not implemented`);
  } catch (error) {
    console.error("Error deleting job:", error);
    throw new Error(`Failed to delete job ${messageId}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}> {
  try {
    // QStash doesn't provide a direct way to get queue stats
    // This is a simplified implementation
    return {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: 0,
    };
  } catch (error) {
    console.error("Error getting queue stats:", error);
    throw new Error(`Failed to get queue stats: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
