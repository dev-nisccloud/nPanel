"use client";

import * as React from "react";
import { Check, ImageIcon, LayoutTemplate, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormItem, FormLabel } from "@/components/ui/form";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { useObjectStorageUpload } from "@/hooks/use-object-storage-upload";
import { normalizeImageFilesForUpload, uploadErrorMessage } from "@/lib/app-file-upload";
import { STORAGE_PREFIXES } from "@/lib/storage-prefixes";
import { ComboboxDropdown, type ComboboxItem } from "@npanel/ui/components/combobox-dropdown";

export const EMAIL_IMAGE_MAX_BYTES = 50 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export type CampaignImageEmail = {
	url: string;
	fileName: string;
};

type TemplateDesign = {
	id: string;
	name: string;
	description?: string | null;
};

type TemplateItem = ComboboxItem & { description?: string | null };

/** Email-client HTML whose only content is the uploaded image. */
export function buildImageEmailHtml(imageUrl: string, alt: string): string {
	const safeUrl = imageUrl.replace(/"/g, "%22");
	const safeAlt = alt
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title></title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
<tr>
<td align="center" style="padding:0;">
<img src="${safeUrl}" alt="${safeAlt}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;" />
</td>
</tr>
</table>
</body>
</html>`;
}

export function CampaignTemplateCombobox({
	designs,
	isLoading,
	isFetchingMore,
	selectedId,
	isApplying,
	emptyMessage,
	onSelect,
	onClear,
}: {
	designs: TemplateDesign[];
	isLoading: boolean;
	isFetchingMore?: boolean;
	selectedId: string | null;
	isApplying: boolean;
	emptyMessage: string;
	onSelect: (designId: string) => void;
	onClear: () => void;
}) {
	const items = React.useMemo((): TemplateItem[] => {
		return designs.map((design) => ({
			id: design.id,
			label: design.name,
			description: design.description,
			keywords: design.description ? [design.description] : undefined,
		}));
	}, [designs]);

	const selectedItem = items.find((item) => item.id === selectedId);

	return (
		<div className="space-y-3 rounded-lg border bg-muted/40 px-3 py-3">
			<div className="flex items-center gap-2">
				<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
					<LayoutTemplate className="h-4 w-4 text-primary" />
				</div>
				<div className="space-y-0.5">
					<p className="text-sm font-medium">Start from an email builder template</p>
					<p className="text-xs text-muted-foreground">
						Search saved designs and we will use that HTML for this campaign.
					</p>
				</div>
			</div>

			<div className="mt-3 space-y-2">
				{isLoading ? (
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Spinner size={14} className="shrink-0" />
						<span>Loading templates…</span>
					</div>
				) : items.length === 0 ? (
					<p className="text-xs text-muted-foreground">{emptyMessage}</p>
				) : (
					<FormItem>
						<FormLabel className="text-xs">Choose a template</FormLabel>
						<ComboboxDropdown
								items={items}
								selectedItem={selectedItem}
								onSelect={(item) => onSelect(item.id)}
								placeholder="Select a saved template"
								searchPlaceholder="Search templates..."
								emptyResults="No templates found"
								disabled={isApplying}
								inDialog
								renderListItem={({ isChecked, item }) => (
									<>
										<Check className={cn("mr-2 h-4 w-4 shrink-0", isChecked ? "opacity-100" : "opacity-0")} />
										<div className="flex min-w-0 flex-col">
											<span className="text-sm font-medium">{item.label}</span>
											{item.description ? (
												<span className="truncate text-[11px] text-muted-foreground">
													{item.description}
												</span>
											) : null}
										</div>
									</>
								)}
							/>
					</FormItem>
				)}

				<div className="flex items-center justify-between">
					{selectedId ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 text-[11px]"
							onClick={onClear}
						>
							Clear selection
						</Button>
					) : (
						<span />
					)}
					{isApplying || isFetchingMore ? (
						<div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
							<Loader2 className="h-3 w-3 animate-spin" />
							{isApplying ? "Applying template…" : "Loading more templates…"}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}

export function CampaignImageEmailUpload({
	image,
	disabled,
	onChange,
	onUploadingChange,
}: {
	image: CampaignImageEmail | null;
	disabled?: boolean;
	onChange: (next: (CampaignImageEmail & { html: string }) | null) => void;
	onUploadingChange?: (uploading: boolean) => void;
}) {
	const { upload, isUploading } = useObjectStorageUpload();

	React.useEffect(() => {
		onUploadingChange?.(isUploading);
	}, [isUploading, onUploadingChange]);

	const handleFile = async (file: File | undefined) => {
		if (!file) return;
		const [normalized] = normalizeImageFilesForUpload([file]);
		const type = normalized?.type?.toLowerCase() ?? "";
		if (!normalized || !IMAGE_TYPES.has(type)) {
			toast.error("Unsupported image", {
				description: "Use a JPEG, PNG, GIF, or WebP image.",
			});
			return;
		}
		if (normalized.size > EMAIL_IMAGE_MAX_BYTES) {
			toast.error("Image is too large", {
				description: `Email images must be ${Math.round(EMAIL_IMAGE_MAX_BYTES / (1024 * 1024))}MB or smaller.`,
			});
			return;
		}

		try {
			const uploaded = await upload(normalized, {
				prefix: STORAGE_PREFIXES.EMAIL_MARKETING_UPLOADS,
			});
			const alt = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
			onChange({
				url: uploaded.publicUrl,
				fileName: file.name,
				html: buildImageEmailHtml(uploaded.publicUrl, alt),
			});
			toast.success("Image ready", {
				description: "This image will be the email in preview and when it is sent.",
			});
		} catch (error) {
			toast.error("Upload failed", { description: uploadErrorMessage(error) });
		}
	};

	return (
		<div>
			<Label>Upload image email</Label>
			<p className="mt-1 text-xs text-muted-foreground">
				Use this when the email is a single image rather than HTML. The image is stored and sent as the email.
			</p>
			{image ? (
				<div className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3">
					<div className="flex items-center justify-between gap-2">
						<div className="flex min-w-0 items-center gap-2">
							<ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
							<span className="truncate text-sm">{image.fileName}</span>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							disabled={disabled || isUploading}
							onClick={() => onChange(null)}
						>
							<X className="h-3 w-3" />
						</Button>
					</div>
					<img
						src={image.url}
						alt=""
						className="max-h-64 w-full rounded-md border bg-background object-contain"
					/>
				</div>
			) : (
				<div className="mt-2">
					<Input
						type="file"
						accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
						disabled={disabled || isUploading}
						className="cursor-pointer"
						onChange={(event) => {
							const file = event.target.files?.[0];
							event.target.value = "";
							void handleFile(file);
						}}
					/>
					{isUploading ? (
						<div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
							<Spinner size={14} className="shrink-0" />
							Uploading image…
						</div>
					) : null}
				</div>
			)}
		</div>
	);
}
