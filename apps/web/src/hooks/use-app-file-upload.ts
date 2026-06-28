"use client";

import * as React from "react";

import type { ObjectStorageUploadResult } from "@/lib/object-storage-client";
import { normalizeImageFilesForUpload } from "@/lib/app-file-upload";
import { STORAGE_PREFIXES } from "@/lib/storage-prefixes";
import {
	type BatchUploadProgress,
	useObjectStorageUpload,
} from "@/hooks/use-object-storage-upload";

export function useAppFileUpload() {
	const { upload, uploadMany, isUploading } = useObjectStorageUpload();
	const [progressPercent, setProgressPercent] = React.useState(0);
	const [progressLabel, setProgressLabel] = React.useState<string | undefined>();

	const resetProgress = React.useCallback(() => {
		setProgressPercent(0);
		setProgressLabel(undefined);
	}, []);

	const uploadOne = React.useCallback(
		async (
			file: File,
			prefix: string,
			options?: { label?: string },
		): Promise<ObjectStorageUploadResult> => {
			setProgressLabel(options?.label ?? file.name);
			setProgressPercent(0);
			try {
				const result = await upload(file, {
					prefix,
					onProgress: ({ percent }) => setProgressPercent(percent),
				});
				setProgressPercent(100);
				return result;
			} finally {
				// Keep 100% visible briefly; caller can resetProgress when closing UI
			}
		},
		[upload],
	);

	const uploadBatch = React.useCallback(
		async (
			files: File[],
			prefix: string,
		): Promise<ObjectStorageUploadResult[]> => {
			if (files.length === 0) return [];
			setProgressLabel(
				files.length === 1 ? files[0]!.name : `${files.length} files`,
			);
			setProgressPercent(0);
			const results = await uploadMany(files, {
				prefix,
				onProgress: (p: BatchUploadProgress) => {
					setProgressPercent(p.overallPercent);
					setProgressLabel(p.fileName);
				},
			});
			setProgressPercent(100);
			return results;
		},
		[uploadMany],
	);

	const uploadAgentAttachments = React.useCallback(
		async (files: File[]): Promise<ObjectStorageUploadResult[]> => {
			const normalized = normalizeImageFilesForUpload(files);
			return uploadBatch(normalized, STORAGE_PREFIXES.ZEEPO_AGENT);
		},
		[uploadBatch],
	);

	return {
		uploadOne,
		uploadBatch,
		uploadAgentAttachments,
		isUploading,
		progressPercent,
		progressLabel,
		resetProgress,
	};
}
