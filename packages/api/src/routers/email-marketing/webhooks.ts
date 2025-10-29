import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../../trpc";
import { processSNSWebhook } from "../../lib/email-events/sns-webhook";
import { processQueueJob, validateQueueJobRequest } from "../../lib/queue/queue-processor";

// Dedicated Zod schemas for webhooks
const snsWebhookSchema = z.object({
  headers: z.record(z.string(), z.string()),
  body: z.string(),
});

const queueJobSchema = z.object({
  type: z.enum(["CAMPAIGN_SEND", "BULK_EMAIL_SEND", "DOMAIN_VERIFICATION_CHECK"]),
  payload: z.record(z.string(), z.unknown()),
});

export const webhooksRouter = router({
  /**
   * SNS webhook endpoint for SES events
   */
  snsWebhook: publicProcedure
    .input(snsWebhookSchema)
    .mutation(async ({ input }) => {
      try {
        // Convert headers to Record<string, string>
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(input.headers)) {
          headers[key] = String(value);
        }
        
        const result = await processSNSWebhook({
          headers,
          body: input.body,
        });
        
        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error || "Failed to process SNS webhook",
          });
        }

        return result;
      } catch (error) {
        console.error("Error processing SNS webhook:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process SNS webhook",
        });
      }
    }),

  /**
   * Queue job processor endpoint for QStash callbacks
   */
  processQueueJob: publicProcedure
    .input(queueJobSchema)
    .mutation(async ({ input }) => {
      try {
        if (!validateQueueJobRequest(input)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid queue job request",
          });
        }

        const result = await processQueueJob(input);
        
        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error || "Failed to process queue job",
          });
        }

        return result;
      } catch (error) {
        console.error("Error processing queue job:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process queue job",
        });
      }
    }),
});
