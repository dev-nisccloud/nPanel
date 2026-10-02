import { FTP_PUBLIC_ERROR_MESSAGE } from "@npanel/api/lib/plesk/ftp-download";
import { openFtpUploadTicket, receiveFtpUpload } from "@npanel/api/lib/plesk/ftp-transfer";
import type { Context } from "hono";

import { readHostingFtpSession } from "./hosting-ftp-session";

function expired(reveal: boolean) {
	return Response.json(
		{
			message: reveal
				? "This upload link has expired or does not match this session."
				: FTP_PUBLIC_ERROR_MESSAGE,
		},
		{ status: 410, headers: { "Cache-Control": "no-store" } },
	);
}

export async function handleHostingFtpUpload(c: Context) {
	const token = c.req.query("ticket")?.trim();
	if (!token) {
		return c.json({ message: FTP_PUBLIC_ERROR_MESSAGE }, 400);
	}

	try {
		const session = await readHostingFtpSession(c);
		if (!session.ok) return session.response;

		const ticket = openFtpUploadTicket(token);
		if (!ticket || ticket.uid !== session.userId) return expired(session.reveal);

		const rawLength = c.req.header("content-length");
		const contentLength = rawLength == null || rawLength === "" ? null : Number(rawLength);
		if (contentLength != null && (!Number.isFinite(contentLength) || contentLength < 0)) {
			return c.json({ message: FTP_PUBLIC_ERROR_MESSAGE }, 400);
		}

		return receiveFtpUpload(ticket, c.req.raw.body, contentLength, session.reveal);
	} catch (error) {
		console.error("FTP upload route failed:", error);
		return c.json({ message: FTP_PUBLIC_ERROR_MESSAGE }, 500);
	}
}
