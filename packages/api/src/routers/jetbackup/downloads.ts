import { protectedProcedure, router } from "../../trpc";
import { Download, JetBackupListResponse } from "../../types/jetbackup";
import { z } from "zod";
import { idSchema, jetbackupCall, listSchema } from "./_helpers";

export const jetbackupDownloadsRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      return jetbackupCall<JetBackupListResponse<Download>>("listDownloads", input);
    }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return jetbackupCall<Download>("getDownload", input);
    }),

  manageNotes: protectedProcedure
    .input(z.object({
      _id: z.string(),
      notes: z.string(),
    }))
    .mutation(async ({ input }) => {
      return jetbackupCall("manageDownloadNotes", input);
    }),
});
