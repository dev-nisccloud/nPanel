import { FTP_PUBLIC_ERROR_MESSAGE } from "@npanel/api/lib/plesk/ftp-download";
import { openFtpExtractTicket, runFtpExtract } from "@npanel/api/lib/plesk/ftp-transfer";
import type { Context } from "hono";

import { readHostingFtpSession } from "./hosting-ftp-session";

function expired(reveal: boolean) {
	return Response.json(
		{
			message: reveal
				? "This extract link has expired or does not match this session."
				: FTP_PUBLIC_ERROR_MESSAGE,
		},
		{ status: 410, headers: { "Cache-Control": "no-store" } },
	);
}

export async function handleHostingFtpExtract(c: Context) {
	const token = c.req.query("ticket")?.trim();
	if (!token) {
		return c.json({ message: FTP_PUBLIC_ERROR_MESSAGE }, 400);
	}

	try {
		const session = await readHostingFtpSession(c);
		if (!session.ok) return session.response;

		const ticket = openFtpExtractTicket(token);
		if (!ticket || ticket.uid !== session.userId) return expired(session.reveal);

		return runFtpExtract(ticket, session.reveal);
	} catch (error) {
		console.error("FTP extract route failed:", error);
		return c.json({ message: FTP_PUBLIC_ERROR_MESSAGE }, 500);
	}
}
