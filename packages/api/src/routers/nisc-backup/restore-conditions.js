import { protectedProcedure, router } from "../../trpc";
import { NiscBackupListResponse, RestoreCondition } from "../../types/nisc-backup";
import { z } from "zod";
import { idSchema, niscBackupCall, listSchema } from "./_helpers";
export const niscBackupRestoreConditionsRouter = router({
    list: protectedProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        return niscBackupCall("listRestoreConditions", input);
    }),
    get: protectedProcedure
        .input(idSchema)
        .query(async ({ input }) => {
        return niscBackupCall("getRestoreCondition", input);
    }),
    manage: protectedProcedure
        .input(z.object({
        action: z.enum(["create", "modify"]),
        _id: z.string().optional(),
        name: z.string().optional(),
        rules: z.array(z.record(z.string(), z.unknown())).optional(),
    }))
        .mutation(async ({ input }) => {
        return niscBackupCall("manageRestoreCondition", input);
    }),
    delete: protectedProcedure
        .input(idSchema)
        .mutation(async ({ input }) => {
        return niscBackupCall("deleteRestoreCondition", input);
    }),
});
