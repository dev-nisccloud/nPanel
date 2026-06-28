import type { ObjectStorageUploadResult } from "@/lib/object-storage-client";

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
