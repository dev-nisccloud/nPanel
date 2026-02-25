"use client";

import * as React from "react";
import type { z } from "zod";
import { X, Download, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Badge } from "@/components/ui/badge";

import { creativeAssetVersionSchema } from "./schema";
import { formatFileSize } from "./utils";
import { CustomDocumentViewer } from "./document-viewers/custom-document-viewer";
import { CommentsSheet } from "./comments-sheet";

interface VersionDetailSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	version: z.infer<typeof creativeAssetVersionSchema>;
}

export function VersionDetailSheet({
	open,
	onOpenChange,
	version,
}: VersionDetailSheetProps) {
	const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);

	const handleDownload = React.useCallback(async () => {
		if (!version.fileUrl) return;
		try {
			const response = await fetch(version.fileUrl);
			const blob = await response.blob();
			const blobUrl = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = version.fileName ?? "download";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
		} catch {
			window.open(version.fileUrl, "_blank");
		}
	}, [version.fileUrl, version.fileName]);

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent
					className="sm:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] w-full p-0 flex flex-col"
					side="right"
					title={`View file: ${version.fileName}`}
				>
					<div className="flex flex-col h-full overflow-hidden">
						{/* Header - actions as buttons like hosting file-viewer-sheet */}
						<SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-center gap-3 flex-1 min-w-0">
									<div className="flex-1 min-w-0">
										<SheetTitle className="text-lg font-semibold truncate">
											{version.fileName}
										</SheetTitle>
										<SheetDescription className="flex items-center gap-2 mt-1 flex-wrap">
											<Badge variant="outline" className="text-xs">
												{version.mimeType}
											</Badge>
											<span className="text-xs text-muted-foreground">
												{formatFileSize(version.fileSize)}
											</span>
										</SheetDescription>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setIsCommentsOpen(true)}
										className="gap-2"
									>
										<MessageSquare className="h-4 w-4" />
										View comments
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleDownload}
										className="gap-2"
									>
										<Download className="h-4 w-4" />
										Download
									</Button>
									<SheetClose asChild>
										<Button variant="ghost" size="icon" aria-label="Close">
											<X className="h-4 w-4" />
										</Button>
									</SheetClose>
								</div>
							</div>
						</SheetHeader>

						{/* Preview area */}
						<div className="flex-1 min-h-0 w-full bg-white overflow-hidden">
							{version.fileUrl ? (
								<CustomDocumentViewer
									fileUrl={version.fileUrl}
									fileName={version.fileName}
									mimeType={version.mimeType}
								/>
							) : (
								<div className="flex items-center justify-center w-full h-full">
									<div className="text-center space-y-2">
										<p className="text-sm font-medium text-muted-foreground">
											Unable to preview file
										</p>
										<p className="text-xs text-muted-foreground">
											File URL is not available
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</SheetContent>
			</Sheet>

			<CommentsSheet
				open={isCommentsOpen}
				onOpenChange={setIsCommentsOpen}
				version={version}
			/>
		</>
	);
}
