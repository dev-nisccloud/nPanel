import { protectedProcedure, router } from "../../trpc";
import { Download, NiscBackupListResponse } from "../../types/nisc-backup";
import { z } from "zod";
import {
  extractList,
  idSchema,
  jetBackupNewestFirst,
  niscBackupCall,
  NISC_BACKUP_QUEUE_TYPE_DOWNLOAD,
  listSchema,
  sortByDateDesc,
} from "./_helpers";

export const niscBackupDownloadsRouter = router({
  list: protectedProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      const data = await niscBackupCall<NiscBackupListResponse<Download>>(
        "listDownloads",
        jetBackupNewestFirst(input, "created"),
      );
      const downloads = sortByDateDesc(
        extractList(data, ["downloads", "items"]) as Download[],
        (item) => (item as Record<string, unknown>).created,
      );
      return { downloads, total: downloads.length };
    }),

  get: protectedProcedure
    .input(idSchema)
    .query(async ({ input }) => {
      return niscBackupCall<Download>("getDownload", input);
    }),

  manageNotes: protectedProcedure
    .input(z.object({
      _id: z.string(),
      notes: z.string(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("manageDownloadNotes", input);
    }),

  /** Queue a full backup snapshot for download (NiscBackup Downloads API shape). */
  queueSnapshot: protectedProcedure
    .input(z.object({
      snapshot_id: z.string(),
    }))
    .mutation(async ({ input }) => {
      return niscBackupCall("addQueueItems", {
        type: NISC_BACKUP_QUEUE_TYPE_DOWNLOAD,
        snapshot_id: input.snapshot_id,
      });
    }),
});
