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
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    DIGITAX_API_URL: z.string().url().default("https://api.digitax.tech/ke/v2"),
    DIGITAX_API_KEY: z.string().min(1),
    QSTASH_ZEEPO_CANVAS_WORKER_ENDPOINT: z.string().url(),
    REPLICATE_ZEEPO_CANVAS_WEBHOOK_URL: z.string().url(),
    /** Zeepo AI Agent (chat) - optional until configured */
    QSTASH_ZEEPO_AGENT_WORKER_ENDPOINT: z.string().url().optional(),
    REPLICATE_ZEEPO_AGENT_WEBHOOK_URL: z.string().url().optional(),
    /** Zeepo AI Agent: optional Replicate text model id from `MODELS` (category text) for chat orchestration */
    ZEEPO_AGENT_CHAT_MODEL_ID: z.string().min(1).optional(),
    /** Brave Search LLM Context API key - enables web_search tool in Zeepo Agent */
    BRAVE_SEARCH_API_KEY: z.string().min(1).optional(),
    QSTASH_EMAIL_BUILDER_AI_WORKER_ENDPOINT: z.string().url(),
    REPLICATE_EMAIL_BUILDER_AI_WEBHOOK_URL: z.string().url(),
    /** Nisc Email Builder (neb) - standalone AI HTML builder */
    QSTASH_NISC_EMAIL_BUILDER_WORKER_ENDPOINT: z.string().url().optional(),
    QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT: z.string().url(),
    REPLICATE_META_ADS_ANALYSIS_WEBHOOK_URL: z.string().url(),
    REPLICATE_API_TOKEN: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
