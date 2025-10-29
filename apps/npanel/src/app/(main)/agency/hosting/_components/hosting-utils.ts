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
    const subscriptions = pleskResponse.parsed.packet.webspace.get.result;
    
    return subscriptions.map((subscription, index) => {
      const genInfo = subscription.data?.gen_info;
      
      // Safely access nested properties with fallbacks
      return {
        id: subscription.id || index,
        subscriptionName: genInfo?.name || `Subscription ${subscription.id || index}`,
        setupDate: genInfo?.["cr_date"] || new Date().toISOString().split('T')[0],
        status: genInfo?.status ?? 0, // Default to active if not specified
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
 * Get status display text based on Plesk status number
 */
export function getStatusDisplayText(status: number): string {
  switch (status) {
    case 0:
      return "Active";
    case 1:
      return "Suspended";
    default:
      return "Unknown";
  }
}

/**
 * Get status badge variant based on Plesk status number
 */
export function getStatusBadgeVariant(status: number): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 0:
      return "default";
    case 1:
      return "destructive";
    default:
      return "outline";
  }
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
