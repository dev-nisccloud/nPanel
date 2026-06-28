/**
 * Browser client for MinIO / S3 uploads via presigned URLs from the API.
 */

export type ObjectStorageUploadResult = {
	key: string;
	publicUrl: string;
	contentType: string;
	size: number;
};

export type PresignedUploadInput = {
	uploadUrl: string;
	contentType: string;
};

export type UploadProgressHandler = (progress: { loaded: number; total: number; percent: number }) => void;

export function uploadFileWithPresignedUrl(
	file: File,
	presigned: PresignedUploadInput,
	options?: { onProgress?: UploadProgressHandler },
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", presigned.uploadUrl);
		xhr.setRequestHeader("Content-Type", presigned.contentType);

		if (options?.onProgress) {
			xhr.upload.onprogress = (event) => {
				if (!event.lengthComputable) return;
				options.onProgress?.({
					loaded: event.loaded,
					total: event.total,
					percent: Math.round((event.loaded / event.total) * 100),
				});
			};
		}

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
				return;
			}
			reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText || xhr.statusText}`));
		};

		xhr.onerror = () => reject(new Error("Network error during upload"));
		xhr.onabort = () => reject(new Error("Upload cancelled"));
		xhr.send(file);
	});
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
