import { createContext, t } from "@npanel/api";
import { appRouter } from "@npanel/api/routers/index";
import {
	FTP_PUBLIC_ERROR_MESSAGE,
	openFtpDownloadTicket,
	respondToFtpDownload,
} from "@npanel/api/lib/plesk/ftp-download";
import type { Context } from "hono";

const appCaller = t.createCallerFactory(appRouter);

export async function handleHostingFtpDownload(c: Context) {
	const token = c.req.query("ticket")?.trim();
	if (!token) {
		return c.json({ message: FTP_PUBLIC_ERROR_MESSAGE }, 400);
	}

	try {
		const ctx = await createContext({
			context: c,
			createCaller: (innerCtx) => appCaller(innerCtx),
		});
		const userId = ctx.session?.user?.id;
		if (!userId) {
			return c.json({ message: "Authentication required" }, 401);
		}

		const reveal = ctx.session?.user?.role?.trim().toUpperCase() === "AGENCY_SUPER_ADMIN";
		const ticket = openFtpDownloadTicket(token);
		if (!ticket || ticket.uid !== userId) {
			return c.json(
				{
					message: reveal
						? "This download link has expired or does not match this session."
						: FTP_PUBLIC_ERROR_MESSAGE,
				},
				410,
			);
		}

		return respondToFtpDownload(ticket, reveal);
	} catch (error) {
		console.error("FTP download route failed:", error);
		return c.json({ message: FTP_PUBLIC_ERROR_MESSAGE }, 500);
	}
}
