import { z } from "zod";
import { pleskSubscriptionResponseSchema, hostingSubscriptionSchema } from "./schema";

// Helper function to get SSL status from hosting properties
function getSslStatus(subscription: any): boolean {
  const sslProperty = subscription.data?.hosting?.vrt_hst?.property?.find(
    (prop: any) => prop.name === "ssl"
  );
  return sslProperty?.value === true || sslProperty?.value === "true";
}

// Helper function to get previous day traffic from stats
function getTrafficPrevDay(subscription: any): number {
  return subscription.data?.stat?.traffic_prevday ?? 0;
}

// Helper function to get total traffic from stats
function getTraffic(subscription: any): number {
  return subscription.data?.stat?.traffic ?? 0;
}

/**
 * Transform Plesk API response to table format
 */
export function transformPleskSubscriptionsToTable(
  pleskResponse: z.infer<typeof pleskSubscriptionResponseSchema>
): z.infer<typeof hostingSubscriptionSchema>[] {
  try {
    // Check for system errors first
    if (pleskResponse.parsed.packet.system?.status === 'error') {
      const errorCode = pleskResponse.parsed.packet.system.errcode;
      const errorText = pleskResponse.parsed.packet.system.errtext || 'Unknown error';
      throw new Error(`Plesk API Error ${errorCode}: ${errorText}`);
    }

    // Check if webspace exists
    if (!pleskResponse.parsed.packet.webspace?.get?.result) {
      // Return empty array if no subscriptions found (not an error)
      return [];
    }

    const subscriptions = pleskResponse.parsed.packet.webspace.get.result;
    
    return subscriptions.map((subscription, index) => {
      const genInfo = subscription.data?.gen_info;
      
      // Safely convert status to number
      // If status field is missing or undefined, we'll use undefined to indicate unknown status
      let status: number | undefined = undefined;
      if (genInfo && 'status' in genInfo && genInfo.status !== undefined && genInfo.status !== null) {
        // Convert to number if it's a string
        status = typeof genInfo.status === 'string' 
          ? parseInt(genInfo.status, 10) 
          : Number(genInfo.status);
        // If conversion failed, keep as undefined
        if (isNaN(status)) {
          status = undefined;
        }
      }
      
      // Safely access nested properties with fallbacks
      return {
        id: subscription.id || index,
        subscriptionName: genInfo?.name || `Subscription ${subscription.id || index}`,
        setupDate: genInfo?.["cr_date"] || new Date().toISOString().split('T')[0],
        status: status,
        dnsIpAddress: genInfo?.["dns_ip_address"] || "0.0.0.0",
        hostingType: genInfo?.htype || "unknown",
        realSize: genInfo?.["real_size"] ?? 0,
        guid: genInfo?.guid || "",
        description: genInfo?.description || "",
        sslEnabled: getSslStatus(subscription),
        trafficPrevDay: getTrafficPrevDay(subscription),
        traffic: getTraffic(subscription),
      };
    });
  } catch (error) {
    console.error("Error transforming Plesk subscriptions:", error);
    console.error("Raw response:", pleskResponse);
    throw new Error("Failed to transform subscription data");
  }
}

/**
 * Plesk status codes (bitmask system):
 * 0 = Active
 * 1 = Suspended
 * 2 = Suspended by parent object
 * 4 = Suspended due to backup/restore
 * 16 = Suspended by administrator
 * 32 = Suspended by reseller
 * 64 = Suspended by client
 * 256 = Suspended due to expiration
 * These can be combined (e.g., 3 = 1+2, 272 = 256+16)
 */

/**
 * Get status display text based on Plesk status number
 * Note: Status field may be missing from gen_info for some subscriptions
 * Simplified to show "Active" or "Suspended"
 */
export function getStatusDisplayText(status: number | undefined | null): string {
  // Handle undefined/null - status field is missing
  if (status === undefined || status === null) {
    return "Suspended";
  }

  // Handle NaN
  if (isNaN(status)) {
    return "Suspended";
  }

  // Convert to number if it's a string
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : Number(status);
  
  // If conversion failed, return Suspended
  if (isNaN(statusNum)) {
    return "Suspended";
  }

  // Active status
  if (statusNum === 0) {
    return "Active";
  }

  // All other statuses are considered suspended
  return "Suspended";
}

/**
 * Get status badge variant based on Plesk status number
 * Returns variant and optional className for green active status
 */
export function getStatusBadgeVariant(status: number | undefined | null): "default" | "secondary" | "destructive" | "outline" {
  // Handle undefined/null/NaN
  if (status === undefined || status === null || isNaN(status)) {
    return "destructive";
  }

  // Convert to number if it's a string
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;

  // Active status - use default variant (will be styled green via className)
  if (statusNum === 0) {
    return "default";
  }

  // Any suspended status should be destructive
  return "destructive";
}

/**
 * Format file size from bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
}
