"use client";

import * as React from "react";

import {
	type ObjectStorageUploadResult,
	type UploadProgressHandler,
	uploadFileWithPresignedUrl,
} from "@/lib/object-storage-client";
import { trpc } from "@/utils/trpc";

export type UseObjectStorageUploadOptions = {
	prefix?: string;
	onProgress?: UploadProgressHandler;
};

export type BatchUploadProgress = {
	fileIndex: number;
	fileName: string;
	filePercent: number;
	overallPercent: number;
	completedCount: number;
	totalCount: number;
};

export type UploadManyOptions = {
	prefix?: string;
	onProgress?: (progress: BatchUploadProgress) => void;
};

export function useObjectStorageUpload() {
	const createUploadUrl = trpc.objectStorage.createUploadUrl.useMutation();
	const [isUploading, setIsUploading] = React.useState(false);

	const uploadOne = React.useCallback(
		async (file: File, options: UseObjectStorageUploadOptions = {}): Promise<ObjectStorageUploadResult> => {
			const contentType = file.type || "application/octet-stream";
			const presigned = await createUploadUrl.mutateAsync({
				fileName: file.name,
				contentType,
				fileSize: file.size,
				prefix: options.prefix,
			});

			await uploadFileWithPresignedUrl(
				file,
				{ uploadUrl: presigned.uploadUrl, contentType },
				{ onProgress: options.onProgress },
			);

			return {
				key: presigned.key,
				publicUrl: presigned.publicUrl,
				contentType,
				size: file.size,
			};
		},
		[createUploadUrl],
	);

	const upload = React.useCallback(
		async (file: File, options: UseObjectStorageUploadOptions = {}): Promise<ObjectStorageUploadResult> => {
			setIsUploading(true);
			try {
				return await uploadOne(file, options);
			} finally {
				setIsUploading(false);
			}
		},
		[uploadOne],
	);

	const uploadMany = React.useCallback(
		async (files: File[], options: UploadManyOptions = {}): Promise<ObjectStorageUploadResult[]> => {
			if (files.length === 0) return [];

			setIsUploading(true);
			const results: ObjectStorageUploadResult[] = [];

			try {
				for (let index = 0; index < files.length; index++) {
					const file = files[index]!;
					const result = await uploadOne(file, {
						prefix: options.prefix,
						onProgress: ({ percent }) => {
							options.onProgress?.({
								fileIndex: index,
								fileName: file.name,
								filePercent: percent,
								completedCount: index,
								totalCount: files.length,
								overallPercent: Math.round(((index + percent / 100) / files.length) * 100),
							});
						},
					});
					results.push(result);
					options.onProgress?.({
						fileIndex: index,
						fileName: file.name,
						filePercent: 100,
						completedCount: index + 1,
						totalCount: files.length,
						overallPercent: Math.round(((index + 1) / files.length) * 100),
					});
				}
				return results;
			} finally {
				setIsUploading(false);
			}
		},
		[uploadOne],
	);

	return {
		upload,
		uploadMany,
		isUploading: isUploading || createUploadUrl.isPending,
		error: createUploadUrl.error,
	};
}
