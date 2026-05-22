import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendPleskRestRequest } from "../../lib/plesk/rest-client";
import {
  extractTaskFromResponse,
  normalizeWpToolkitTaskUrl,
} from "../../lib/plesk/wp-meta-parser";
import { protectedProcedure, router } from "../../trpc";

function assertSafeTaskUrl(taskUrl: string): string {
  try {
    return normalizeWpToolkitTaskUrl(taskUrl);
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid background task reference",
    });
  }
}

function mapPleskError(statusCode: number, message: string): never {
  if (statusCode === 401 || statusCode === 403) {
    throw new TRPCError({ code: "UNAUTHORIZED", message });
  }
  if (statusCode === 404) {
    throw new TRPCError({ code: "NOT_FOUND", message });
  }
  if (statusCode === 503 || statusCode === 0) {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message });
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: message || `WP Toolkit returned ${statusCode}`,
  });
}

export const wpBackgroundTasksRouter = router({
  /** Poll task status from a WP Toolkit task URL (relative path only). */
  getByUrl: protectedProcedure
    .input(z.object({ taskUrl: z.string().min(1) }))
    .query(async ({ input }) => {
      const path = assertSafeTaskUrl(input.taskUrl);
      const { data, statusCode, isAuthError, isHostUnreachable } = await sendPleskRestRequest(path, "GET");

      if (isHostUnreachable) {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Plesk host is unreachable" });
      }
      if (isAuthError) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Plesk credentials" });
      }
      if (statusCode < 200 || statusCode >= 300) {
        mapPleskError(statusCode, "Failed to fetch background task");
      }

      const task = extractTaskFromResponse(data);
      return { task, raw: data };
    }),

  /**
   * Attempt to cancel a running task. WP Toolkit may not support cancel on all task types;
   * returns cancelSupported: false when the server rejects the request.
   */
  cancelByUrl: protectedProcedure
    .input(z.object({ taskUrl: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const path = assertSafeTaskUrl(input.taskUrl);

      for (const body of [{ cancel: true }, { delete: true }] as const) {
        const { statusCode, isAuthError, isHostUnreachable } = await sendPleskRestRequest(
          path,
          "DELETE",
          body,
        );

        if (isHostUnreachable) {
          throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Plesk host is unreachable" });
        }
        if (isAuthError) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid Plesk credentials" });
        }
        if (statusCode >= 200 && statusCode < 300) {
          return { cancelled: true, cancelSupported: true };
        }
        if (statusCode === 404 || statusCode === 405 || statusCode === 400) {
          continue;
        }
        mapPleskError(statusCode, "Failed to cancel background task");
      }

      return {
        cancelled: false,
        cancelSupported: false,
        message:
          "Cancel is not supported for this operation on your Plesk server. You can wait for it to finish or cancel from Plesk.",
      };
    }),
});
