import {
	FTP_PUBLIC_ERROR_MESSAGE,
	openFtpDownloadTicket,
	respondToFtpDownload,
} from "@npanel/api/lib/plesk/ftp-download";
import type { Context } from "hono";

import { readHostingFtpSession } from "./hosting-ftp-session";

export async function handleHostingFtpDownload(c: Context) {
	const token = c.req.query("ticket")?.trim();
	if (!token) {
		return c.json({ message: FTP_PUBLIC_ERROR_MESSAGE }, 400);
	}

	try {
		const session = await readHostingFtpSession(c);
		if (!session.ok) return session.response;

		const ticket = openFtpDownloadTicket(token);
		if (!ticket || ticket.uid !== session.userId) {
			return c.json(
				{
					message: session.reveal
						? "This download link has expired or does not match this session."
						: FTP_PUBLIC_ERROR_MESSAGE,
				},
				410,
			);
		}

		return respondToFtpDownload(ticket, session.reveal);
	} catch (error) {
		console.error("FTP download route failed:", error);
		return c.json({ message: FTP_PUBLIC_ERROR_MESSAGE }, 500);
	}
}
