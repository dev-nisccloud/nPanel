import { protectedProcedure, router } from "../../trpc";
import { NiscBackupListResponse, QueueGroup, QueueItem, QueuePriority } from "../../types/nisc-backup";
import { z } from "zod";
import {
  buildAddQueueItemsParams,
  extractList,
  idSchema,
  jetBackupNewestFirst,
  niscBackupCall,
  niscBackupCallSafe,
  NISC_BACKUP_QUEUE_TYPE_RESTORE,
  listSchema,
  queueItemSchema,
  restoreQueueOptionsSchema,
  sortByDateDesc,
} from "./_helpers";

export const niscBackupQueuesRouter = router({
  /** Queue a backup snapshot for restore. Omit `items` for a full-account restore. */
  queueSnapshot: protectedProcedure
    .input(z.object({
      snapshot_id: z.string(),
      items: z.array(z.string()).optional(),
    }).merge(restoreQueueOptionsSchema))
    .mutation(async ({ input }) => {
      return niscBackupCall("addQueueItems", buildAddQueueItemsParams({
        type: NISC_BACKUP_QUEUE_TYPE_RESTORE,
        snapshot_id: input.snapshot_id,
        items: input.items,
        merge: input.merge,
        terminate: input.terminate,
        suspend: input.suspend,
      }));
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
          { ...jetBackupNewestFirst(rest, "created"), type: queueType },
        );
        if (result.success) {
          groups.push(
            ...(extractList(result.data, ["groups", "items", "queue_groups"]) as QueueGroup[]),
          );
        } else if (result.message) {
          errors.push(result.message);
        }
      }

      const sorted = sortByDateDesc(
        groups,
        (group) => (group as Record<string, unknown>).created,
      );

      if (sorted.length === 0 && errors.length > 0) {
        return {
          groups: [],
          total: 0,
          warning: errors[0],
        };
      }

      return {
        groups: sorted,
        total: sorted.length,
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
