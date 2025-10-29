import {
  GetSendQuotaCommand,
  GetAccountSendingEnabledCommand,
  GetSendStatisticsCommand,
  GetReputationCommand,
} from "@aws-sdk/client-ses";
import { sesClient } from "./client";

export interface SendingQuota {
  max24HourSend: number;
  sentLast24Hours: number;
  maxSendRate: number;
}

export interface ReputationMetrics {
  reputationMetricsEnabled: boolean;
  bounceRate?: number;
  complaintRate?: number;
  deliveryRate?: number;
  reputationScore?: number;
}

export interface SendStatistics {
  timestamp: Date;
  deliveryAttempts: number;
  bounces: number;
  complaints: number;
  rejects: number;
}

/**
 * Get current sending quota and usage
 */
export async function getSendingQuota(): Promise<SendingQuota> {
  try {
    const command = new GetSendQuotaCommand({});
    const response = await sesClient.send(command);

    return {
      max24HourSend: response.Max24HourSend || 0,
      sentLast24Hours: response.SentLast24Hours || 0,
      maxSendRate: response.MaxSendRate || 0,
    };
  } catch (error) {
    console.error("Error getting sending quota:", error);
    throw new Error(`Failed to get sending quota: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get account sending status
 */
export async function getAccountSendingEnabled(): Promise<boolean> {
  try {
    const command = new GetAccountSendingEnabledCommand({});
    const response = await sesClient.send(command);

    return response.Enabled || false;
  } catch (error) {
    console.error("Error getting account sending status:", error);
    throw new Error(`Failed to get account sending status: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get reputation metrics
 */
export async function getReputationMetrics(): Promise<ReputationMetrics> {
  try {
    const command = new GetReputationCommand({});
    const response = await sesClient.send(command);

    return {
      reputationMetricsEnabled: response.ReputationOptions?.ReputationMetricsEnabled || false,
      bounceRate: response.ReputationOptions?.BounceRate,
      complaintRate: response.ReputationOptions?.ComplaintRate,
      deliveryRate: response.ReputationOptions?.DeliveryRate,
      reputationScore: response.ReputationOptions?.ReputationScore,
    };
  } catch (error) {
    console.error("Error getting reputation metrics:", error);
    throw new Error(`Failed to get reputation metrics: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get send statistics for the last 24 hours
 */
export async function getSendStatistics(): Promise<SendStatistics[]> {
  try {
    const command = new GetSendStatisticsCommand({});
    const response = await sesClient.send(command);

    return (response.SendDataPoints || []).map(point => ({
      timestamp: point.Timestamp || new Date(),
      deliveryAttempts: point.DeliveryAttempts || 0,
      bounces: point.Bounces || 0,
      complaints: point.Complaints || 0,
      rejects: point.Rejects || 0,
    }));
  } catch (error) {
    console.error("Error getting send statistics:", error);
    throw new Error(`Failed to get send statistics: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Calculate bounce rate from statistics
 */
export function calculateBounceRate(statistics: SendStatistics[]): number {
  if (statistics.length === 0) return 0;

  const totalAttempts = statistics.reduce((sum, stat) => sum + stat.deliveryAttempts, 0);
  const totalBounces = statistics.reduce((sum, stat) => sum + stat.bounces, 0);

  return totalAttempts > 0 ? (totalBounces / totalAttempts) * 100 : 0;
}

/**
 * Calculate complaint rate from statistics
 */
export function calculateComplaintRate(statistics: SendStatistics[]): number {
  if (statistics.length === 0) return 0;

  const totalAttempts = statistics.reduce((sum, stat) => sum + stat.deliveryAttempts, 0);
  const totalComplaints = statistics.reduce((sum, stat) => sum + stat.complaints, 0);

  return totalAttempts > 0 ? (totalComplaints / totalAttempts) * 100 : 0;
}

/**
 * Calculate delivery rate from statistics
 */
export function calculateDeliveryRate(statistics: SendStatistics[]): number {
  if (statistics.length === 0) return 0;

  const totalAttempts = statistics.reduce((sum, stat) => sum + stat.deliveryAttempts, 0);
  const totalDeliveries = statistics.reduce((sum, stat) => sum + (stat.deliveryAttempts - stat.bounces - stat.complaints - stat.rejects), 0);

  return totalAttempts > 0 ? (totalDeliveries / totalAttempts) * 100 : 0;
}

/**
 * Sync quota and reputation data to database
 */
export async function syncQuotaToDatabase(): Promise<{
  quota: SendingQuota;
  reputation: ReputationMetrics;
  statistics: SendStatistics[];
}> {
  try {
    const [quota, reputation, statistics] = await Promise.all([
      getSendingQuota(),
      getReputationMetrics(),
      getSendStatistics(),
    ]);

    // Calculate additional metrics
    const bounceRate = calculateBounceRate(statistics);
    const complaintRate = calculateComplaintRate(statistics);
    const deliveryRate = calculateDeliveryRate(statistics);

    const enhancedReputation = {
      ...reputation,
      bounceRate,
      complaintRate,
      deliveryRate,
    };

    return {
      quota,
      reputation: enhancedReputation,
      statistics,
    };
  } catch (error) {
    console.error("Error syncing quota to database:", error);
    throw new Error(`Failed to sync quota data: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Check if account is in sandbox mode
 */
export async function isAccountInSandbox(): Promise<boolean> {
  try {
    const quota = await getSendingQuota();
    // SES sandbox typically has a very low sending limit
    return quota.max24HourSend <= 200;
  } catch (error) {
    console.error("Error checking sandbox status:", error);
    return false;
  }
}

/**
 * Get remaining sending capacity for today
 */
export async function getRemainingCapacity(): Promise<number> {
  try {
    const quota = await getSendingQuota();
    return Math.max(0, quota.max24HourSend - quota.sentLast24Hours);
  } catch (error) {
    console.error("Error getting remaining capacity:", error);
    return 0;
  }
}
