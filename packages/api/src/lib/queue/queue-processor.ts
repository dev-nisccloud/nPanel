import { processCampaignSendJob, type CampaignSendJobPayload } from "./handlers/campaign-send-handler";
import { processBulkEmailSendJob, type BulkEmailSendJobPayload } from "./handlers/bulk-email-send-handler";
import { processDomainVerificationJob, type DomainVerificationJobPayload } from "./handlers/domain-verification-handler";

export interface QueueJobRequest {
  type: "CAMPAIGN_SEND" | "BULK_EMAIL_SEND" | "DOMAIN_VERIFICATION_CHECK";
  payload: unknown;
}

/**
 * Process a queue job based on its type
 * This is the main entry point for QStash webhook callbacks
 */
export async function processQueueJob(request: QueueJobRequest): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const { type, payload } = request;

  try {
    console.log(`Processing queue job: ${type}`, { payload });

    switch (type) {
      case "CAMPAIGN_SEND":
        await processCampaignSendJob(payload as CampaignSendJobPayload);
        break;
      
      case "BULK_EMAIL_SEND":
        await processBulkEmailSendJob(payload as BulkEmailSendJobPayload);
        break;
      
      case "DOMAIN_VERIFICATION_CHECK":
        await processDomainVerificationJob(payload as DomainVerificationJobPayload);
        break;
      
      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    console.log(`Queue job completed successfully: ${type}`);
    
    return {
      success: true,
      message: `Job ${type} processed successfully`,
    };

  } catch (error) {
    console.error(`Queue job failed: ${type}`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate queue job request
 */
export function validateQueueJobRequest(request: unknown): request is QueueJobRequest {
  if (typeof request !== "object" || request === null) {
    return false;
  }
  
  const req = request as Record<string, unknown>;
  
  return (
    typeof req.type === "string" &&
    ["CAMPAIGN_SEND", "BULK_EMAIL_SEND", "DOMAIN_VERIFICATION_CHECK"].includes(req.type) &&
    typeof req.payload === "object" &&
    req.payload !== null
  );
}
