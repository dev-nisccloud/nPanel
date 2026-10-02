"use client";

import * as React from "react";
import { Archive, AlertCircle } from "lucide-react";
import { TRPCClientError } from "@trpc/client";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { postFtpExtract } from "@/components/hosting/ftp-transfer";
import { trpc } from "@/utils/trpc";
import { hostingDetailSchema } from "@/components/hosting/hosting-detail-schema";
import { captureEvent } from "@/lib/posthog";

const FTP_USER_ERROR_MESSAGE =
	"An error occurred. Please try again later or contact support.";

export type ExtractZipFile = {
	name: string;
	path: string;
	size?: number;
};

interface ExtractZipSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	file: ExtractZipFile;
	hostingData: z.infer<typeof hostingDetailSchema>;
	currentPath: string;
	onSuccess?: () => void;
}

function ftpCredentials(hostingData: z.infer<typeof hostingDetailSchema>) {
	const ftpLogin = hostingData.hosting?.vrt_hst?.property?.find(
		(prop) => prop.name === "ftp_login",
	)?.value;
	const ftpPassword = hostingData.hosting?.vrt_hst?.property?.find(
		(prop) => prop.name === "ftp_password",
	)?.value;

	if (!ftpLogin || !ftpPassword) {
		throw new Error("FTP credentials not found in hosting data");
	}

	const port = Number.parseInt(import.meta.env.VITE_PUBLIC_FTP_PORT || "21", 10);

	return {
		host: import.meta.env.VITE_PUBLIC_FTP_HOST || "orion.nisccloud.com",
		port: Number.isFinite(port) ? port : 21,
		user: String(ftpLogin),
		password: String(ftpPassword),
		secure: true,
		timeout: 300000,
	};
}

export function ExtractZipSheet({
	open,
	onOpenChange,
	file,
	hostingData,
	currentPath,
	onSuccess,
}: ExtractZipSheetProps) {
	const defaultFolderName = React.useMemo(
		() => (file?.name ? file.name.replace(/\.zip$/i, "").trim() || "extracted" : "extracted"),
		[file?.name],
	);
	const [folderName, setFolderName] = React.useState(defaultFolderName);
	const [overwrite, setOverwrite] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [failedFiles, setFailedFiles] = React.useState<string[]>([]);
	const [failedCount, setFailedCount] = React.useState(0);
	const [pending, setPending] = React.useState(false);

	const extractZip = trpc.plesk.ftp.extractZip.useMutation();

	React.useEffect(() => {
		if (!open) return;
		setFolderName(defaultFolderName);
		setOverwrite(false);
		setError(null);
		setFailedFiles([]);
		setFailedCount(0);
	}, [open, defaultFolderName]);

	const handleOpenChange = (next: boolean) => {
		if (!next && pending) {
			toast.warning("Please wait for extraction to complete");
			return;
		}
		onOpenChange(next);
	};

	const handleExtract = async () => {
		if (!file || pending) return;
		const sanitized = folderName.trim().replace(/[/\\]+/g, "").trim() || defaultFolderName;
		const extractToPath =
			currentPath === "/"
				? `/${sanitized}`.replace(/\/+/g, "/")
				: `${currentPath}/${sanitized}`.replace(/\/+/g, "/");

		setPending(true);
		setError(null);
		setFailedFiles([]);
		setFailedCount(0);
		try {
			const prepared = await extractZip.mutateAsync({
				credentials: ftpCredentials(hostingData),
				zipPath: file.path,
				extractTo: extractToPath,
				overwrite,
				maxSize: 500 * 1024 * 1024,
			});
			const result = await postFtpExtract(prepared.url);
			captureEvent("zip_extracted", { file_count: result.extractedCount });
			toast.success("Extraction completed", { description: result.message });
			onSuccess?.();
			if (result.failedCount > 0) {
				setFailedFiles(result.failedFiles);
				setFailedCount(result.failedCount);
				return;
			}
			onOpenChange(false);
		} catch (extractError) {
			const message =
				extractError instanceof TRPCClientError || extractError instanceof Error
					? extractError.message.trim() || FTP_USER_ERROR_MESSAGE
					: FTP_USER_ERROR_MESSAGE;
			setError(message);
			toast.error("Extraction failed", { description: message });
		} finally {
			setPending(false);
		}
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent className="sm:max-w-[540px]">
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						<Archive className="h-5 w-5" />
						Extract archive
					</SheetTitle>
					<SheetDescription>
						Unzip {file?.name || "this archive"} into a new folder in the current directory.
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-6">
					<div className="space-y-2">
						<Label>Current directory</Label>
						<p className="break-all text-sm text-muted-foreground">{currentPath || "/"}</p>
						<p className="text-sm text-muted-foreground">
							Contents are extracted into a new folder inside this directory.
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="extract-folder-name">Folder name</Label>
						<Input
							id="extract-folder-name"
							value={folderName}
							onChange={(event) => setFolderName(event.target.value)}
							placeholder={defaultFolderName}
							disabled={pending}
							autoComplete="off"
						/>
						<p className="text-sm text-muted-foreground">
							Name of the folder to create. The default is the zip name without the extension.
						</p>
					</div>

					<div className="flex items-start gap-3">
						<Checkbox
							id="extract-overwrite"
							checked={overwrite}
							onCheckedChange={(checked) => setOverwrite(checked === true)}
							disabled={pending}
						/>
						<div className="space-y-1">
							<Label htmlFor="extract-overwrite" className="font-medium">
								Overwrite existing files
							</Label>
							<p className="text-sm text-muted-foreground">
								Replace files in the destination when the same names are already there.
							</p>
						</div>
					</div>

					{error ? (
						<div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
							<AlertCircle className="mt-0.5 size-3.5 shrink-0" />
							<span>{error}</span>
						</div>
					) : null}

					{failedCount > 0 ? (
						<div className="space-y-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
							<p className="text-xs font-medium text-foreground">
								{failedCount} file{failedCount === 1 ? "" : "s"} could not be extracted
							</p>
							<ul className="max-h-28 space-y-1 overflow-y-auto">
								{failedFiles.slice(0, 8).map((filePath) => (
									<li key={filePath} className="truncate text-xs text-muted-foreground" title={filePath}>
										{filePath}
									</li>
								))}
							</ul>
							{failedCount > 8 ? (
								<p className="text-xs text-muted-foreground">
									and {failedCount - 8} more
								</p>
							) : null}
						</div>
					) : null}

					<SheetFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={pending}
						>
							{failedCount > 0 ? "Done" : "Cancel"}
						</Button>
						{failedCount === 0 ? (
							<Button type="button" onClick={handleExtract} disabled={pending || !file}>
								{pending ? (
									<>
										<Spinner size={16} className="mr-2" />
										Extracting...
									</>
								) : (
									<>
										<Archive className="mr-2 h-4 w-4" />
										Extract
									</>
								)}
							</Button>
						) : null}
					</SheetFooter>
				</div>
			</SheetContent>
		</Sheet>
	);
}
