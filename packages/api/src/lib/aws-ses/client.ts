import { SESClient } from "@aws-sdk/client-ses";
import { SNSClient } from "@aws-sdk/client-sns";

// Lazy-loaded client instances
let sesClientInstance: SESClient | null = null;
let snsClientInstance: SNSClient | null = null;

/**
 * Get or create SES client (lazy initialization)
 */
export function getSESClient(): SESClient {
  if (!sesClientInstance) {
    const region = process.env.AWS_SES_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "Missing required AWS SES environment variables: AWS_SES_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
      );
    }

    sesClientInstance = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return sesClientInstance;
}

/**
 * Get or create SNS client (lazy initialization)
 */
export function getSNSClient(): SNSClient {
  if (!snsClientInstance) {
    const region = process.env.AWS_SES_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "Missing required AWS SNS environment variables: AWS_SES_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
      );
    }

    snsClientInstance = new SNSClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return snsClientInstance;
}

// Export only the getter functions (no default export to avoid module-load initialization)
export { getSESClient as default };
