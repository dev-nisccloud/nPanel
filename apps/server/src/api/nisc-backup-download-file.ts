import { createContext, t } from "@npanel/api";
import { appRouter } from "@npanel/api/routers/index";
import { fetchNiscBackupDownloadArchive } from "@npanel/api/lib/nisc-backup/client";
import type { Context } from "hono";

const appCaller = t.createCallerFactory(appRouter);

export async function handleNiscBackupDownloadFile(c: Context) {
  const downloadId = c.req.param("id");
  if (!downloadId?.trim()) {
    return c.text("Download ID is required", 400);
  }

  try {
    const ctx = await createContext({
      context: c,
      createCaller: (innerCtx) => appCaller(innerCtx),
    });

    if (!ctx.session?.user?.id) {
      return c.text("Unauthorized", 401);
    }

    const meta = await appCaller(ctx).niscBackup.downloads.get({ _id: downloadId });
    const filename =
      (meta && typeof meta === "object" && "path" in meta && typeof meta.path === "string"
        ? meta.path
        : undefined) ?? `nisc-backup-download-${downloadId}.tar.gz`;

    const file = await fetchNiscBackupDownloadArchive(downloadId);
    if (!file.success || !file.body) {
      return c.text(file.message ?? "Failed to fetch download file", file.statusCode || 502);
    }

    const headers: Record<string, string> = {
      "Content-Type": file.contentType ?? "application/gzip",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
    };
    if (file.contentLength != null) {
      headers["Content-Length"] = String(file.contentLength);
    }

    return new Response(file.body, { status: 200, headers });
  } catch (error) {
    console.error("[NiscBackup] download file error:", error);
    return c.text(error instanceof Error ? error.message : "Download failed", 500);
  }
}
