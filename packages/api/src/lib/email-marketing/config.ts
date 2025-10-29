import { z } from "zod";

// Environment configuration schema
const envSchema = z.object({
  // AWS SES Configuration
  AWS_SES_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY is required"),
  AWS_SES_CONFIGURATION_SET: z.string().default("npanel-email-marketing"),
  AWS_SNS_TOPIC_ARN: z.string().min(1, "AWS_SNS_TOPIC_ARN is required"),

  // Upstash QStash Configuration
  QSTASH_URL: z.string().url().default("https://qstash.upstash.io"),
  QSTASH_TOKEN: z.string().min(1, "QSTASH_TOKEN is required"),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),

  // Email Marketing Limits (System-wide)
  EMAIL_DAILY_SEND_LIMIT: z.string().transform(Number).default(() => 50000),
  EMAIL_MAX_SEND_RATE: z.string().transform(Number).default(() => 14),
  EMAIL_BATCH_SIZE: z.string().transform(Number).default(() => 50),
  EMAIL_RETRY_ATTEMPTS: z.string().transform(Number).default(() => 3),

  // Webhook Configuration
  EMAIL_WEBHOOK_BASE_URL: z.string().url().min(1, "EMAIL_WEBHOOK_BASE_URL is required"),
});

// Parse and validate environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.issues
      .filter((err: any) => err.code === "too_small" && err.minimum === 1)
      .map((err: any) => err.path.join("."));
    
    const invalidVars = error.issues
      .filter((err: any) => err.code !== "too_small" || err.minimum !== 1)
      .map((err: any) => `${err.path.join(".")}: ${err.message}`);
    
    const errorMessages = [
      ...(missingVars.length > 0 ? [`Missing required environment variables: ${missingVars.join(", ")}`] : []),
      ...(invalidVars.length > 0 ? [`Invalid environment variables: ${invalidVars.join(", ")}`] : []),
    ];
    
    throw new Error(`Environment configuration error:\n${errorMessages.join("\n")}`);
  }
  throw error;
}

// Export validated configuration
export const config = {
  aws: {
    ses: {
      region: env.AWS_SES_REGION,
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      configurationSet: env.AWS_SES_CONFIGURATION_SET,
    },
    sns: {
      topicArn: env.AWS_SNS_TOPIC_ARN,
    },
  },
  qstash: {
    url: env.QSTASH_URL,
    token: env.QSTASH_TOKEN,
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  },
  email: {
    limits: {
      dailySendLimit: env.EMAIL_DAILY_SEND_LIMIT,
      maxSendRate: env.EMAIL_MAX_SEND_RATE,
      batchSize: env.EMAIL_BATCH_SIZE,
      retryAttempts: env.EMAIL_RETRY_ATTEMPTS,
    },
  },
  webhook: {
    baseUrl: env.EMAIL_WEBHOOK_BASE_URL,
  },
} as const;

// Type for the configuration
export type EmailMarketingConfig = typeof config;

// Validation function to check if all required config is present
export function validateConfig(): void {
  // This function is called during module load, so if we get here, config is valid
  console.log("✅ Email marketing configuration validated successfully");
}

// Helper function to get configuration for specific services
export function getAWSConfig() {
  return config.aws;
}

export function getQStashConfig() {
  return config.qstash;
}

export function getEmailLimits() {
  return config.email.limits;
}

export function getWebhookConfig() {
  return config.webhook;
}
