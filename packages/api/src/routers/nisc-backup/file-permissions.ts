import { protectedProcedure, router } from "../../trpc";
import { FilePermission, NiscBackupListResponse } from "../../types/nisc-backup";
import { idSchema, niscBackupCall, listSchema } from "./_helpers";

export const niscBackupFilePermissionsRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return niscBackupCall<NiscBackupListResponse<FilePermission>>("listFilePermissions", input);
    }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<FilePermission>("getFilePermission", input);
    }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      return niscBackupCall("deleteFilePermission", input);
    }),
});
