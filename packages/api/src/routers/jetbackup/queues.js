import { protectedProcedure, router } from "../../trpc";
import { JetBackupListResponse, QueueGroup, QueueItem, QueuePriority } from "../../types/jetbackup";
import { z } from "zod";
import { extractList, idSchema, jetbackupCall, jetbackupCallSafe, listSchema, queueItemSchema } from "./_helpers";
export const jetbackupQueuesRouter = router({
    addItems: protectedProcedure
        .input(z.object({
        items: z.array(queueItemSchema),
    }))
        .mutation(async ({ input }) => {
        return jetbackupCall("addQueueItems", input);
    }),
    addMultiAccountItems: protectedProcedure
        .input(z.object({
        items: z.array(queueItemSchema),
    }))
        .mutation(async ({ input }) => {
        return jetbackupCall("addMultiAccountQueueItems", input);
    }),
    listGroups: protectedProcedure
        .input(listSchema.extend({
        type: z.number().min(1).max(3).optional(),
    }))
        .query(async ({ input }) => {
        const { type, ...rest } = input;
        const types = type != null ? [type] : [1, 2, 3];
        const groups = [];
        const errors = [];
        for (const queueType of types) {
            const result = await jetbackupCallSafe("listQueueGroups", { ...rest, type: queueType });
            if (result.success) {
                groups.push(...extractList(result.data, ["groups", "items", "queue_groups"]));
            }
            else if (result.message) {
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
        return jetbackupCall("getQueueGroup", input);
    }),
    listItems: protectedProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        return jetbackupCall("listQueueItems", input);
    }),
    getItem: protectedProcedure
        .input(idSchema)
        .query(async ({ input }) => {
        return jetbackupCall("getQueueItem", input);
    }),
    stopGroup: protectedProcedure
        .input(idSchema)
        .mutation(async ({ input }) => {
        return jetbackupCall("stopQueueGroup", input);
    }),
    stopAll: protectedProcedure.mutation(async () => {
        return jetbackupCall("stopAllQueueGroup");
    }),
    clear: protectedProcedure
        .input(z.object({ type: z.number().optional() }))
        .mutation(async ({ input }) => {
        return jetbackupCall("clearQueue", input);
    }),
    rerunFailed: protectedProcedure
        .input(idSchema)
        .mutation(async ({ input }) => {
        return jetbackupCall("rerunFailedQueueGroup", input);
    }),
    listPriorities: protectedProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        return jetbackupCall("listQueuePriorities", input);
    }),
    getPriority: protectedProcedure
        .input(idSchema)
        .query(async ({ input }) => {
        return jetbackupCall("getQueuePriority", input);
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
        return jetbackupCall("manageQueuePriority", input);
    }),
    deletePriority: protectedProcedure
        .input(idSchema)
        .mutation(async ({ input }) => {
        return jetbackupCall("deleteQueuePriority", input);
    }),
});
