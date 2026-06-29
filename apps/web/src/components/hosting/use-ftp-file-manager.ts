import { useEffect, useMemo, useState } from "react";
import { TRPCClientError } from "@trpc/client";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";

import { trpc } from "@/utils/trpc";

import {
	fileManagerItemSchema,
	fileManagerSchema,
} from "@/routes/agency.hosting/_components/file-manager-schema";

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
	const [isNavigating, setIsNavigating] = useState(false);
	const [isManualRefreshing, setIsManualRefreshing] = useState(false);
	const utils = trpc.useUtils();

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
		staleTime: 0,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: true,
		retry: (failureCount: number, err: unknown) => {
			if (
				err instanceof TRPCClientError &&
				err.data?.code === "INTERNAL_SERVER_ERROR" &&
				failureCount < 3
			) {
				return true;
			}
			return false;
		},
		retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

	useEffect(() => {
		if (!isError) return;

		if (error instanceof TRPCClientError) {
			if (error.data?.code === "INTERNAL_SERVER_ERROR") {
				toast.error("FTP Connection Error", {
					description:
						"Failed to connect to FTP server. Please check your credentials and try again.",
				});
			} else {
				toast.error("FTP Error", {
					description: error.message || "An unexpected error occurred while accessing files.",
				});
			}
			return;
		}

		toast.error("FTP Error", {
			description: error?.message || "An unexpected error occurred.",
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
			const result = await utils.plesk.ftp.list.fetch({
				credentials: ftpCredentials,
				path: newPath,
			});
			if (result.success) {
				setCurrentPath(newPath);
			}
		} catch {
			toast.error("Navigation Error", {
				description: `Cannot access path: ${newPath}`,
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

	const refreshCurrentPath = async () => {
		setIsManualRefreshing(true);
		try {
			await utils.plesk.ftp.list.fetch(listInput, { staleTime: 0 });
		} catch (err) {
			toast.error("Failed to refresh files", {
				description: err instanceof Error ? err.message : "Please try again.",
			});
		} finally {
			setIsManualRefreshing(false);
		}
	};

	const deleteFileMutation = trpc.plesk.ftp.deleteFile.useMutation({
		onSuccess: () => {
			toast.success("File deleted successfully");
			void refetch();
		},
		onError: (mutationError) => {
			toast.error("Failed to delete file", {
				description: mutationError.message,
			});
		},
	});

	const deleteDirectoryMutation = trpc.plesk.ftp.deleteDirectory.useMutation({
		onSuccess: () => {
			toast.success("Directory deleted successfully");
			void refetch();
		},
		onError: (mutationError) => {
			toast.error("Failed to delete directory", {
				description: mutationError.message,
			});
		},
	});

	const renameMutation = trpc.plesk.ftp.rename.useMutation({
		onSuccess: () => {
			toast.success("Item renamed successfully");
			void refetch();
		},
		onError: (mutationError) => {
			toast.error("Failed to rename item", {
				description: mutationError.message,
			});
		},
	});

	const createDirectoryMutation = trpc.plesk.ftp.createDirectory.useMutation({
		onSuccess: () => {
			toast.success("Directory created successfully");
			void refetch();
		},
		onError: (mutationError) => {
			toast.error("Failed to create directory", {
				description: mutationError.message,
			});
		},
	});

	const uploadFileMutation = trpc.plesk.ftp.uploadFile.useMutation({
		onSuccess: () => {
			toast.success("File uploaded successfully");
			void refetch();
		},
		onError: (mutationError) => {
			toast.error("Failed to upload file", {
				description: mutationError.message,
			});
		},
	});

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

	const createFolder = async (folderPath: string) => {
		await createDirectoryMutation.mutateAsync({
			credentials: ftpCredentials,
			path: folderPath,
		});
	};

	const uploadFile = async (file: File, remotePath: string) => {
		const fileData = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const result = reader.result as string;
				const base64 = result.split(",")[1];
				resolve(base64);
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});

		await uploadFileMutation.mutateAsync({
			credentials: ftpCredentials,
			fileData,
			fileName: file.name,
			remotePath,
		});
	};

	const downloadFileMutation = trpc.plesk.ftp.downloadFile.useMutation({
		onMutate: () => {
			toast.info("Starting file download...");
		},
		onSuccess: (data) => {
			const buffer = Buffer.from(data.data.data);
			const blob = new Blob([buffer]);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = data.filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			toast.success("File downloaded successfully");
		},
		onError: (mutationError) => {
			toast.error("Failed to download file", {
				description: mutationError.message,
			});
		},
	});

	const downloadFolderMutation = trpc.plesk.ftp.downloadFolder.useMutation({
		onMutate: () => {
			toast.info("Starting folder download...", {
				description: "This may take a moment for large folders",
			});
		},
		onSuccess: (data) => {
			const buffer = Buffer.from(data.data.data);
			const blob = new Blob([buffer]);
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = data.filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			toast.success("Folder downloaded successfully");
		},
		onError: (mutationError) => {
			toast.error("Failed to download folder", {
				description: mutationError.message,
			});
		},
	});

	const downloadItem = async (item: z.infer<typeof fileManagerItemSchema>) => {
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
	};

	const isRefreshing = isFetching || isManualRefreshing;

	return {
		data: fileManagerData,
		isLoading: isLoading || isNavigating,
		isRefreshing,
		isError,
		error,

		currentPath,
		navigateToPath,
		navigateUp,
		navigateToBreadcrumb,
		refreshCurrentPath,

		deleteItem,
		renameItem,
		moveItem,
		createFolder,
		uploadFile,
		downloadItem,
		isDeleting: deleteFileMutation.isPending || deleteDirectoryMutation.isPending,
		isRenaming: renameMutation.isPending,
		isMoving: renameMutation.isPending,
		isCreating: createDirectoryMutation.isPending,
		isUploading: uploadFileMutation.isPending,
		isDownloading: downloadFileMutation.isPending || downloadFolderMutation.isPending,
	};
}
