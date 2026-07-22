import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "PUBLIC_",
  client: {},
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    /**
     * Comma-separated marketing / storefront origins (www, Vercel, etc.).
     * Distinct from CORS_ORIGIN (nPanel web app).
     */
    LANDING_PAGE_ORIGINS: z.string().min(1).optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    DIGITAX_API_URL: z.string().url().default("https://api.digitax.tech/ke/v2"),
    /** Required only when DigiTax / eTIMS routes are used */
    DIGITAX_API_KEY: z.string().min(1).optional(),
    QSTASH_ZEEPO_CANVAS_WORKER_ENDPOINT: z.string().url(),
    /** Optional until Replicate webhooks are configured for this environment */
    REPLICATE_ZEEPO_CANVAS_WEBHOOK_URL: z.string().url().optional(),
    /** Zeepo AI Agent (chat) - optional until configured */
    QSTASH_ZEEPO_AGENT_WORKER_ENDPOINT: z.string().url().optional(),
    REPLICATE_ZEEPO_AGENT_WEBHOOK_URL: z.string().url().optional(),
    /** Zeepo AI Agent: optional Replicate text model id from `MODELS` (category text) for chat orchestration */
    ZEEPO_AGENT_CHAT_MODEL_ID: z.string().min(1).optional(),
    /** Brave Search LLM Context API key - enables web_search tool in Zeepo Agent */
    BRAVE_SEARCH_API_KEY: z.string().min(1).optional(),
    QSTASH_EMAIL_BUILDER_AI_WORKER_ENDPOINT: z.string().url().optional(),
    REPLICATE_EMAIL_BUILDER_AI_WEBHOOK_URL: z.string().url().optional(),
    /** Nisc Email Builder (neb) - standalone AI HTML builder */
    QSTASH_NISC_EMAIL_BUILDER_WORKER_ENDPOINT: z.string().url().optional(),
    QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT: z.string().url(),
    REPLICATE_META_ADS_ANALYSIS_WEBHOOK_URL: z.string().url().optional(),
    REPLICATE_API_TOKEN: z.string().min(1),
    /** MinIO / S3-compatible object storage (optional until UploadThing migration) */
    S3_ENDPOINT: z.string().url().optional(),
    S3_ACCESS_KEY: z.string().min(1).optional(),
    S3_SECRET_KEY: z.string().min(1).optional(),
    S3_BUCKET: z.string().min(1).optional(),
    S3_REGION: z.string().min(1).default("us-east-1"),
    /** Public base URL for object reads, e.g. https://storage.nisccloud.com/npanel-uploads */
    S3_PUBLIC_BASE_URL: z.string().url().optional(),
    
    // Nisc Payment Gateway
    /** AES-256 encryption key for payment gateway credentials (hex, 64 chars) */
    NISC_PAYMENT_GATEWAY_ENCRYPTION_KEY: z.string().length(64).regex(/^[0-9a-f]{64}$/i),
    /** M-Pesa Sandbox URLs for testing */
    NISC_GATEWAY_MPESA_SANDBOX_BASE_URL: z.string().url(),
    NISC_GATEWAY_MPESA_SANDBOX_TOKEN_URL: z.string().url(),
    NISC_GATEWAY_MPESA_SANDBOX_STK_URL: z.string().url(),
    /** M-Pesa Production URLs for live payments */
    NISC_GATEWAY_MPESA_PRODUCTION_BASE_URL: z.string().url(),
    NISC_GATEWAY_MPESA_PRODUCTION_TOKEN_URL: z.string().url(),
    NISC_GATEWAY_MPESA_PRODUCTION_STK_URL: z.string().url(),
    /** Optional base URL for gateway webhooks (defaults to BETTER_AUTH_URL) */
    NISC_GATEWAY_BASE_URL: z.string().url().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
