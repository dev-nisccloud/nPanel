import { protectedProcedure, router } from "../../trpc";
import { FilePermission, JetBackupListResponse } from "../../types/jetbackup";
import { idSchema, jetbackupCall, listSchema } from "./_helpers";
export const jetbackupFilePermissionsRouter = router({
    list: protectedProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        return jetbackupCall("listFilePermissions", input);
    }),
    get: protectedProcedure
        .input(idSchema)
        .query(async ({ input }) => {
        return jetbackupCall("getFilePermission", input);
    }),
    delete: protectedProcedure
        .input(idSchema)
        .mutation(async ({ input }) => {
        return jetbackupCall("deleteFilePermission", input);
    }),
});
