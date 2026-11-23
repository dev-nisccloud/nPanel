"use client";

import * as React from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/npanel-ui/sheet";
import { formatFileBytes } from "@/components/nisc-storage/format";
import {
	loadPreviewHtml,
	previewKind,
	previewNeedsBytes,
	storageObjectUrl,
	type StoragePreviewKind,
} from "@/components/nisc-storage/storage-file-preview";

export type StoragePreviewFile = {
	key: string;
	name: string;
	size: number;
};

export function StorageFileViewer({
	open,
	onOpenChange,
	resourceId,
	file,
	onDownload,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	resourceId: string;
	file: StoragePreviewFile | null;
	onDownload: (key: string, name: string) => void;
}) {
	const kind = file ? previewKind(file.name) : "download";
	const source = file ? storageObjectUrl(resourceId, file.key) : "";
	const [html, setHtml] = React.useState<string | null>(null);
	const [failed, setFailed] = React.useState(false);

	React.useEffect(() => {
		if (!open || !file || !previewNeedsBytes(kind)) {
			setHtml(null);
			setFailed(false);
			return;
		}
		const controller = new AbortController();
		setHtml(null);
		setFailed(false);
		if (file.size > 20 * 1024 * 1024) {
			setHtml("<p>This file is too large to preview here. Download it to open the full file.</p>");
			return;
		}
		void (async () => {
			try {
				const response = await fetch(source, { credentials: "include", signal: controller.signal });
				if (!response.ok) throw new Error("The file could not be opened.");
				const bytes = await response.arrayBuffer();
				if (controller.signal.aborted) return;
				setHtml(await loadPreviewHtml(kind, file.name, bytes));
			} catch {
				if (!controller.signal.aborted) setFailed(true);
			}
		})();
		return () => controller.abort();
	}, [open, file, kind, source]);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				size="editor"
				title={file?.name ?? "File"}
				className="flex flex-col gap-4 p-4 sm:p-6"
			>
				<div className="flex items-start gap-3">
					<div className="min-w-0 flex-1">
						<SheetTitle className="truncate text-base">{file?.name ?? "File"}</SheetTitle>
						<p className="text-xs text-muted-foreground">{file ? formatFileBytes(file.size) : ""}</p>
					</div>
					<Button
						type="button"
						variant="outline"
						className="min-h-11 shrink-0"
						disabled={!file}
						onClick={() => {
							if (file) onDownload(file.key, file.name);
						}}
					>
						<Download className="size-4" />
						Download
					</Button>
				</div>
				<div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card">
					{file ? <PreviewBody kind={kind} name={file.name} source={source} html={html} failed={failed} /> : null}
				</div>
			</SheetContent>
		</Sheet>
	);
}

function PreviewBody({
	kind,
	name,
	source,
	html,
	failed,
}: {
	kind: StoragePreviewKind;
	name: string;
	source: string;
	html: string | null;
	failed: boolean;
}) {
	if (kind === "image") {
		return (
			<div className="flex h-full items-center justify-center overflow-auto p-4">
				<img src={source} alt={name} className="max-h-full max-w-full object-contain" />
			</div>
		);
	}
	if (kind === "video") {
		return <video src={source} controls className="h-full w-full bg-black" preload="metadata" />;
	}
	if (kind === "audio") {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<audio src={source} controls preload="metadata" className="w-full" />
			</div>
		);
	}
	if (kind === "pdf") {
		return <iframe title={name} src={source} className="h-full w-full bg-white" />;
	}
	if (kind === "download") {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
				<p className="text-sm font-medium">{name}</p>
				<p className="max-w-sm text-sm text-muted-foreground">Download this file to open it.</p>
			</div>
		);
	}
	if (failed) {
		return (
			<div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
				This file could not be previewed. Download it to open the full file.
			</div>
		);
	}
	if (html == null) {
		return (
			<div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">Opening the file</div>
		);
	}
	return (
		<iframe
			title={name}
			sandbox=""
			srcDoc={previewDocument(html)}
			className="h-full w-full bg-white"
		/>
	);
}

function previewDocument(body: string): string {
	return `<!doctype html><html><head><meta charset="utf-8"><style>
		body{margin:0;padding:24px;font:16px/1.5 ui-sans-serif,system-ui,sans-serif;color:#1c1917;background:#fff}
		p{margin:0 0 12px} h2{margin:24px 0 8px;font-size:16px}
		pre{white-space:pre-wrap;word-break:break-word;font:13px/1.5 ui-monospace,monospace}
		table{border-collapse:collapse;width:max-content;min-width:100%}
		td{border:1px solid #e7e5e4;padding:6px 8px;vertical-align:top}
	</style></head><body>${body}</body></html>`;
}
