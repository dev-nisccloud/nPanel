import { protectedProcedure, router } from "../../trpc";
import { NiscBackupListResponse, QueueGroup, QueueItem, QueuePriority } from "../../types/nisc-backup";
import { z } from "zod";
import {
  extractList,
  idSchema,
  niscBackupCall,
  niscBackupCallSafe,
  NISC_BACKUP_QUEUE_TYPE_RESTORE,
  listSchema,
  queueItemSchema,
} from "./_helpers";

export const niscBackupQueuesRouter = router({
  /** Queue a full backup snapshot for restore (NiscBackup Queues API shape). */
  queueSnapshot: protectedProcedure
    .input(z.object({
      snapshot_id: z.string(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("addQueueItems", {
        type: NISC_BACKUP_QUEUE_TYPE_RESTORE,
        snapshot_id: input.snapshot_id,
      });
    }),

  addItems: protectedProcedure
    .input(z.object({
      items: z.array(queueItemSchema),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("addQueueItems", input);
    }),

  addMultiAccountItems: protectedProcedure
    .input(z.object({
      items: z.array(queueItemSchema),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("addMultiAccountQueueItems", input);
    }),

  listGroups: protectedProcedure
    .input(listSchema.extend({
      type: z.number().min(1).max(4).optional(),
    }))
    .query(async ({ input }) => {
      const { type, ...rest } = input;
      const types = type != null ? [type] : [1, 2, 4];
      const groups: QueueGroup[] = [];
      const errors: string[] = [];

      for (const queueType of types) {
        const result = await niscBackupCallSafe<NiscBackupListResponse<QueueGroup>>(
          "listQueueGroups",
          { ...rest, type: queueType },
        );
        if (result.success) {
          groups.push(
            ...(extractList(result.data, ["groups", "items", "queue_groups"]) as QueueGroup[]),
          );
        } else if (result.message) {
          errors.push(result.message);
        }
      }

      if (groups.length === 0 && errors.length > 0) {
        return {
          groups: [],
          total: 0,
          warning: errors[0],
        };
      }

      return {
        groups,
        total: groups.length,
        warning: errors.length > 0 ? errors[0] : undefined,
      };
    }),

  getGroup: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<QueueGroup>("getQueueGroup", input);
    }),

  listItems: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<QueueItem>>("listQueueItems", input);
    }),

  getItem: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<QueueItem>("getQueueItem", input);
    }),

  stopGroup: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("stopQueueGroup", input);
    }),

  stopAll: protectedProcedure.mutation(async () => {
    return niscBackupCall("stopAllQueueGroup");
  }),

  clear: protectedProcedure
    .input(z.object({ type: z.number().optional() }))
    .mutation(async ({ input }) => {
      return niscBackupCall("clearQueue", input);
    }),

  rerunFailed: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("rerunFailedQueueGroup", input);
    }),

  listPriorities: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<QueuePriority>>("listQueuePriorities", input);
    }),

  getPriority: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<QueuePriority>("getQueuePriority", input);
    }),

  managePriority: protectedProcedure
    .input(z.object({
      action: z.enum(["create", "modify"]),
      _id: z.string().optional(),
      name: z.string().optional(),
      priority: z.number().optional(),
      type: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("manageQueuePriority", input);
    }),

  deletePriority: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("deleteQueuePriority", input);
    }),
});
