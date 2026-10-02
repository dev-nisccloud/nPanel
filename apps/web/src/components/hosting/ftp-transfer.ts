const FTP_PUBLIC_ERROR_MESSAGE =
	"An error occurred. Please try again later or contact support.";

async function ftpResponseMessage(response: Response): Promise<string> {
	try {
		const data = (await response.json()) as { message?: unknown };
		if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
	} catch {
		// The body was not JSON.
	}
	return FTP_PUBLIC_ERROR_MESSAGE;
}

async function ftpFetch(url: string, init: RequestInit): Promise<Response> {
	try {
		return await fetch(url, { credentials: "include", ...init });
	} catch {
		throw new Error(FTP_PUBLIC_ERROR_MESSAGE);
	}
}

export async function putFtpFile(url: string, body: Blob): Promise<void> {
	const response = await ftpFetch(url, {
		method: "PUT",
		headers: { "Content-Type": "application/octet-stream" },
		body,
	});
	if (!response.ok) throw new Error(await ftpResponseMessage(response));
}

export async function readFtpText(url: string): Promise<string> {
	const response = await ftpFetch(url, { method: "GET" });
	if (!response.ok) throw new Error(await ftpResponseMessage(response));
	return response.text();
}

export type FtpExtractClientResult = {
	extractedCount: number;
	failedCount: number;
	failedFiles: string[];
	message: string;
};

export async function postFtpExtract(url: string): Promise<FtpExtractClientResult> {
	const response = await ftpFetch(url, { method: "POST" });
	if (!response.ok) throw new Error(await ftpResponseMessage(response));
	let data: unknown;
	try {
		data = await response.json();
	} catch {
		throw new Error(FTP_PUBLIC_ERROR_MESSAGE);
	}
	if (!data || typeof data !== "object") throw new Error(FTP_PUBLIC_ERROR_MESSAGE);
	const record = data as Record<string, unknown>;
	const failedFiles = Array.isArray(record.failedFiles)
		? record.failedFiles.filter((item): item is string => typeof item === "string")
		: [];
	return {
		extractedCount: typeof record.extractedCount === "number" ? record.extractedCount : 0,
		failedCount: typeof record.failedCount === "number" ? record.failedCount : failedFiles.length,
		failedFiles,
		message:
			typeof record.message === "string" && record.message.trim()
				? record.message.trim()
				: "Extraction completed",
	};
}
