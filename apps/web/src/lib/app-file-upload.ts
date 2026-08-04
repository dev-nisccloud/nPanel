import type { ObjectStorageUploadResult } from "@/lib/object-storage-client";

/** Matches server CUSTOMER_UPLOAD_LIMITS for zeepo-agent (and UploadThing legacy cap). */
export const ZEEPO_AGENT_MAX_ATTACHMENT_BYTES = 16 * 1024 * 1024;
export const ZEEPO_AGENT_MAX_ATTACHMENTS = 4;

const IMAGE_MIME_BY_EXT: Record<string, string> = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",
	svg: "image/svg+xml",
	avif: "image/avif",
	heic: "image/heic",
	heif: "image/heif",
};

/** Normalize empty MIME types before presigned upload (Windows / some browsers). */
export function normalizeImageFilesForUpload(files: File[]): File[] {
	return files.map((file) => {
		const type = file.type?.trim();
		if (type && type !== "application/octet-stream") return file;
		const ext = file.name.split(".").pop()?.toLowerCase();
		const resolved = ext ? IMAGE_MIME_BY_EXT[ext] : undefined;
		if (!resolved) return file;
		return new File([file], file.name, { type: resolved, lastModified: file.lastModified });
	});
}

/** Drop oversized files and return a user-facing reason when any were rejected. */
export function filterZeepoAgentAttachmentFiles(files: File[]): {
	accepted: File[];
	rejectedMessage?: string;
} {
	const accepted: File[] = [];
	const oversized: string[] = [];
	for (const file of files) {
		if (file.size > ZEEPO_AGENT_MAX_ATTACHMENT_BYTES) {
			oversized.push(file.name);
			continue;
		}
		accepted.push(file);
	}
	if (oversized.length === 0) return { accepted };
	const label = `${Math.round(ZEEPO_AGENT_MAX_ATTACHMENT_BYTES / (1024 * 1024))}MB`;
	return {
		accepted,
		rejectedMessage:
			oversized.length === 1
				? `"${oversized[0]}" exceeds the ${label} attachment limit.`
				: `${oversized.length} file(s) exceed the ${label} attachment limit.`,
	};
}

export function uploadErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "object" && error !== null && "message" in error) {
		const msg = (error as { message: unknown }).message;
		if (typeof msg === "string" && msg) return msg;
	}
	return "Upload failed. Please try again.";
}

export function mapStorageResultToAttachment(
	result: ObjectStorageUploadResult,
	file: File,
) {
	return {
		url: result.publicUrl,
		name: file.name,
		mimeType: file.type || result.contentType || "application/octet-stream",
		storageKey: result.key,
	};
}

export function mapStorageResultToTicketAttachment(
	result: ObjectStorageUploadResult,
	file: File,
) {
	return {
		fileName: file.name,
		fileSize: result.size,
		mimeType: file.type || result.contentType || "application/octet-stream",
		fileUrl: result.publicUrl,
		storageKey: result.key,
	};
}

export function mapStorageResultToReferenceImage(result: ObjectStorageUploadResult, file: File) {
	return {
		fileUrl: result.publicUrl,
		fileKey: result.key,
		fileName: file.name,
		fileSize: result.size,
		mimeType: file.type || result.contentType || "application/octet-stream",
		fileMetadata: undefined as undefined,
	};
}

export function mapStorageResultToCreativeVersion(
	result: ObjectStorageUploadResult,
	file: File,
) {
	return {
		fileUrl: result.publicUrl,
		fileKey: result.key,
		fileName: file.name,
		fileSize: result.size,
		mimeType: file.type || result.contentType || "application/octet-stream",
	};
}
