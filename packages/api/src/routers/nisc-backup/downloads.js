import { protectedProcedure, router } from "../../trpc";
import { Download, NiscBackupListResponse } from "../../types/nisc-backup";
import { z } from "zod";
import { idSchema, niscBackupCall, NISC_BACKUP_QUEUE_TYPE_DOWNLOAD, listSchema } from "./_helpers";
export const niscBackupDownloadsRouter = router({
    list: protectedProcedure
        .input(listSchema)
        .query(async ({ input }) => {
        return niscBackupCall("listDownloads", input);
    }),
    get: protectedProcedure
        .input(idSchema)
        .query(async ({ input }) => {
        return niscBackupCall("getDownload", input);
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
