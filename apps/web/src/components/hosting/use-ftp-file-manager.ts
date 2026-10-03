import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TRPCClientError } from "@trpc/client";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";

import { trpc } from "@/utils/trpc";

import { captureEvent } from "@/lib/posthog";
import { putFtpFile } from "@/components/hosting/ftp-transfer";
import { useFtpErrorMessage } from "@/components/hosting/ftp-error-message";
import {
	fileManagerItemSchema,
	fileManagerSchema,
} from "@/routes/agency.hosting/_components/file-manager-schema";

function startBrowserDownload(url: string, filename: string) {
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename || "download";
	anchor.rel = "noopener";
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
}

/** Reuse a folder listing briefly so the table and the folder tree do not each open FTP. */
const LIST_CACHE_MS = 15_000;

const ftpCredentialsSchema = z.object({
	host: z.string().min(1, "Host is required"),
	port: z.number().min(1).max(65535).default(21),
	user: z.string().min(1, "Username is required"),
	password: z.string().min(1, "Password is required"),
	secure: z.boolean().default(true),
	timeout: z.number().min(1000).default(30000),
});

function transformFtpFileToManagerItem(
	ftpFile: {
		name: string;
		type: "file" | "directory";
		size?: number;
		date?: string;
		permissions?: string;
		owner?: string;
		group?: string;
	},
	currentPath: string,
): z.infer<typeof fileManagerItemSchema> {
	const fullPath = currentPath === "/" ? `/${ftpFile.name}` : `${currentPath}/${ftpFile.name}`;
	const extension =
		ftpFile.type === "file" ? ftpFile.name.split(".").pop()?.toLowerCase() : undefined;

	return {
		id: `${currentPath}-${ftpFile.name}`,
		name: ftpFile.name,
		type: ftpFile.type === "directory" ? "folder" : "file",
		size: ftpFile.size,
		modified: ftpFile.date || new Date().toISOString(),
		permissions: ftpFile.permissions || "644",
		path: fullPath,
		extension,
		mimeType: undefined,
	};
}

function generateBreadcrumbs(currentPath: string) {
	if (currentPath === "/") {
		return [{ name: "Root", path: "/" }];
	}

	const parts = currentPath.split("/").filter((part) => part !== "");
	const breadcrumbs = [{ name: "Root", path: "/" }];

	let path = "";
	for (const part of parts) {
		path += `/${part}`;
		breadcrumbs.push({ name: part, path });
	}

	return breadcrumbs;
}

export function useFtpFileManager(
	ftpCredentials: z.infer<typeof ftpCredentialsSchema>,
	initialPath: string = "/",
) {
	const [currentPath, setCurrentPath] = useState(initialPath);
	useEffect(() => {
		setCurrentPath(initialPath || "/");
	}, [initialPath]);
	const [isNavigating, setIsNavigating] = useState(false);
	const [isManualRefreshing, setIsManualRefreshing] = useState(false);
	const [uploadsInFlight, setUploadsInFlight] = useState(0);
	const utils = trpc.useUtils();
	const ftpErrorText = useFtpErrorMessage();
	const ftpErrorTextRef = useRef(ftpErrorText);
	ftpErrorTextRef.current = ftpErrorText;

	const listInput = useMemo(
		() => ({
			credentials: ftpCredentials,
			path: currentPath,
		}),
		[
			currentPath,
			ftpCredentials.host,
			ftpCredentials.port,
			ftpCredentials.user,
			ftpCredentials.password,
			ftpCredentials.secure,
			ftpCredentials.timeout,
		],
	);

	const {
		data: ftpData,
		isLoading,
		isFetching,
		isError,
		error,
		refetch,
	} = trpc.plesk.ftp.list.useQuery(listInput, {
		staleTime: LIST_CACHE_MS,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: true,
		retry: (failureCount: number, err: unknown) => {
			if (!(err instanceof TRPCClientError)) return false;
			const code = err.data?.code;
			// A refused connection will not recover by retrying. Timeouts and
			// unexpected server errors can.
			if (code === "TIMEOUT" && failureCount < 1) return true;
			if (code === "INTERNAL_SERVER_ERROR" && failureCount < 1) return true;
			return false;
		},
		retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

	useEffect(() => {
		if (!isError) return;

		toast.error("Failed to load files", {
			description: ftpErrorTextRef.current(error),
		});
	}, [isError, error]);

	const fileManagerData: z.infer<typeof fileManagerSchema> | undefined = useMemo(() => {
		if (!ftpData?.success || !ftpData.data) {
			return undefined;
		}

		const items = ftpData.data.map((file) => transformFtpFileToManagerItem(file, currentPath));

		return {
			currentPath,
			items,
			breadcrumbs: generateBreadcrumbs(currentPath),
		};
	}, [ftpData, currentPath]);

	const navigateToPath = async (newPath: string) => {
		if (newPath === currentPath) return;

		setIsNavigating(true);
		try {
			const result = await utils.plesk.ftp.list.fetch(
				{
					credentials: ftpCredentials,
					path: newPath,
				},
				{ staleTime: LIST_CACHE_MS },
			);
			if (result.success) {
				setCurrentPath(newPath);
			}
		} catch (navigationError) {
			toast.error("Failed to open folder", {
				description: ftpErrorTextRef.current(navigationError),
			});
		} finally {
			setIsNavigating(false);
		}
	};

	const navigateUp = () => {
		if (currentPath === "/") return;
		const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
		void navigateToPath(parentPath);
	};

	const navigateToBreadcrumb = (path: string) => {
		void navigateToPath(path);
	};

	const listDirectory = useCallback(
		async (path: string) => {
			const result = await utils.plesk.ftp.list.fetch(
				{
					credentials: ftpCredentials,
					path,
				},
				{ staleTime: LIST_CACHE_MS },
			);
			if (!result?.success || !result.data) return [];
			return result.data.map((file) => transformFtpFileToManagerItem(file, path));
		},
		[
			utils,
			ftpCredentials.host,
			ftpCredentials.port,
			ftpCredentials.user,
			ftpCredentials.password,
			ftpCredentials.secure,
			ftpCredentials.timeout,
		],
	);

	const refreshCurrentPath = async () => {
		setIsManualRefreshing(true);
		try {
			await utils.plesk.ftp.list.fetch(listInput, { staleTime: 0 });
		} catch (refreshError) {
			toast.error("Failed to refresh files", {
				description: ftpErrorTextRef.current(refreshError),
			});
		} finally {
			setIsManualRefreshing(false);
		}
	};

	const deleteFileMutation = trpc.plesk.ftp.deleteFile.useMutation({
		onSuccess: () => {
			captureEvent("file_deleted", { file_type: "file" });

			toast.success("File deleted successfully");
			void refetch();
		},
		onError: (mutationError) => {
			toast.error("Failed to delete file", {
				description: ftpErrorTextRef.current(mutationError),
			});
		},
	});

	const deleteDirectoryMutation = trpc.plesk.ftp.deleteDirectory.useMutation({
		onSuccess: () => {
			captureEvent("file_deleted", { file_type: "folder" });

			toast.success("Directory deleted successfully");
			void refetch();
		},
		onError: (mutationError) => {
			toast.error("Failed to delete directory", {
				description: ftpErrorTextRef.current(mutationError),
			});
		},
	});

	const renameMutation = trpc.plesk.ftp.rename.useMutation({
		onSuccess: () => {
			captureEvent("file_renamed");

			toast.success("Item renamed successfully");
			void refetch();
		},
		onError: (mutationError) => {
			toast.error("Failed to rename item", {
				description: ftpErrorTextRef.current(mutationError),
			});
		},
	});

	const createDirectoryMutation = trpc.plesk.ftp.createDirectory.useMutation({
		onSuccess: () => {
			captureEvent("folder_created");

			toast.success("Directory created successfully");
			void refetch();
		},
		onError: (mutationError) => {
			toast.error("Failed to create directory", {
				description: ftpErrorTextRef.current(mutationError),
			});
		},
	});

	const uploadFileMutation = trpc.plesk.ftp.uploadFile.useMutation();

	const deleteItem = async (item: z.infer<typeof fileManagerItemSchema>) => {
		if (item.type === "folder") {
			await deleteDirectoryMutation.mutateAsync({
				credentials: ftpCredentials,
				path: item.path,
			});
		} else {
			await deleteFileMutation.mutateAsync({
				credentials: ftpCredentials,
				path: item.path,
			});
		}
	};

	const renameItem = async (oldPath: string, newPath: string) => {
		await renameMutation.mutateAsync({
			credentials: ftpCredentials,
			oldPath,
			newPath,
		});
	};

	const moveItem = async (oldPath: string, destinationPath: string) => {
		const fileName = oldPath.split("/").pop() || "";
		const newPath = destinationPath.endsWith("/")
			? `${destinationPath}${fileName}`
			: `${destinationPath}/${fileName}`;

		await renameMutation.mutateAsync({
			credentials: ftpCredentials,
			oldPath,
			newPath,
		});
	};

	const copyMutation = trpc.plesk.ftp.copy.useMutation();

	const copyItems = async (
		items: Array<{ path: string; type: "file" | "folder" }>,
		destinationPath: string,
	) => {
		try {
			const result = await copyMutation.mutateAsync({
				credentials: ftpCredentials,
				sources: items.map((item) => ({
					path: item.path,
					type: item.type,
				})),
				destinationPath,
			});
			captureEvent("files_copied", { count: items.length });
			toast.success(result.message || "Copied successfully");
			void refetch();
		} catch (copyError) {
			toast.error("Failed to copy", {
				description: ftpErrorTextRef.current(copyError),
			});
			throw copyError;
		}
	};

	const createFolder = async (folderPath: string) => {
		await createDirectoryMutation.mutateAsync({
			credentials: ftpCredentials,
			path: folderPath,
		});
	};

	const uploadFile = async (file: File, remotePath: string) => {
		setUploadsInFlight((count) => count + 1);
		try {
			const prepared = await uploadFileMutation.mutateAsync({
				credentials: ftpCredentials,
				fileName: file.name,
				remotePath,
				size: file.size,
			});
			await putFtpFile(prepared.url, file);
			const extension = file.name.includes(".")
				? file.name.split(".").pop()?.toLowerCase() || "unknown"
				: "unknown";
			captureEvent("file_uploaded", { file_type: extension });
			toast.success("File uploaded successfully");
			void refetch();
		} catch (uploadError) {
			toast.error("Failed to upload file", {
				description: ftpErrorTextRef.current(uploadError),
			});
			throw uploadError;
		} finally {
			setUploadsInFlight((count) => Math.max(0, count - 1));
		}
	};

	const downloadFileMutation = trpc.plesk.ftp.downloadFile.useMutation({
		onSuccess: (data) => {
			startBrowserDownload(data.url, data.filename);
			toast.success("Download started");
		},
		onError: (mutationError) => {
			toast.error("Failed to download file", {
				description: ftpErrorTextRef.current(mutationError),
			});
		},
	});

	const downloadFolderMutation = trpc.plesk.ftp.downloadFolder.useMutation({
		onSuccess: (data) => {
			startBrowserDownload(data.url, data.filename);
			toast.success("Download started");
		},
		onError: (mutationError) => {
			toast.error("Failed to download folder", {
				description: ftpErrorTextRef.current(mutationError),
			});
		},
	});

	const downloadItem = async (item: z.infer<typeof fileManagerItemSchema>) => {
		try {
			if (item.type === "folder") {
				await downloadFolderMutation.mutateAsync({
					credentials: ftpCredentials,
					remotePath: item.path,
					folderName: item.name,
				});
			} else {
				await downloadFileMutation.mutateAsync({
					credentials: ftpCredentials,
					remotePath: item.path,
				});
			}
		} catch {
			// The mutation onError handler already told the user what happened.
		}
	};

	const isRefreshing = isFetching || isManualRefreshing;

	return {
		data: fileManagerData,
		isLoading: isLoading || isNavigating,
		isRefreshing,
		isError,
		error,
		errorMessage: ftpErrorText(error),

		currentPath,
		navigateToPath,
		navigateUp,
		navigateToBreadcrumb,
		refreshCurrentPath,
		listDirectory,

		deleteItem,
		renameItem,
		moveItem,
		copyItems,
		createFolder,
		uploadFile,
		downloadItem,
		isDeleting: deleteFileMutation.isPending || deleteDirectoryMutation.isPending,
		isRenaming: renameMutation.isPending,
		isMoving: renameMutation.isPending,
		isCopying: copyMutation.isPending,
		isCreating: createDirectoryMutation.isPending,
		isUploading: uploadsInFlight > 0 || uploadFileMutation.isPending,
		isDownloading: downloadFileMutation.isPending || downloadFolderMutation.isPending,
	};
}
