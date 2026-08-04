"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Spinner, type SpinnerProps } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";

/** Spinner variants by context - standardized loading states */
export const EMAIL_BUILDER_SPINNER = {
	page: "ring",
	panel: "circle-filled",
	button: "pinwheel",
	inline: "circle",
	upload: "bars",
	table: "default",
	card: "ring",
} as const satisfies Record<string, NonNullable<SpinnerProps["variant"]>>;

type EmailBuilderSpinnerProps = Omit<SpinnerProps, "variant"> & {
	context?: keyof typeof EMAIL_BUILDER_SPINNER;
	variant?: SpinnerProps["variant"];
};

/**
 * Standardized spinner for email builder.
 * Use context prop to get appropriate spinner variant for the use case.
 */
export function EmailBuilderSpinner({
	context = "inline",
	variant,
	className,
	...props
}: EmailBuilderSpinnerProps) {
	return (
		<Spinner
			variant={variant ?? EMAIL_BUILDER_SPINNER[context]}
			className={className}
			{...props}
		/>
	);
}

/**
 * Centered loading state for full-page or large containers
 */
export function EmailBuilderPageLoader({ message }: { message?: string }) {
	return (
		<div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
			<EmailBuilderSpinner context="page" size={32} className="text-primary" />
			{message && <p className="text-sm text-muted-foreground">{message}</p>}
		</div>
	);
}

/**
 * Loading state for panels/sections
 */
export function EmailBuilderPanelLoader({ message }: { message?: string }) {
	return (
		<div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
			<EmailBuilderSpinner context="panel" size={24} className="text-primary" />
			{message && <p className="text-xs text-muted-foreground">{message}</p>}
		</div>
	);
}

/**
 * Inline loading spinner with optional text
 */
export function EmailBuilderInlineLoader({ 
	text, 
	size = 16 
}: { 
	text?: string; 
	size?: number 
}) {
	return (
		<div className="flex items-center gap-2">
			<EmailBuilderSpinner context="inline" size={size} />
			{text && <span className="text-sm text-muted-foreground">{text}</span>}
		</div>
	);
}

/**
 * Button loading state
 */
export function EmailBuilderButtonLoader({ text }: { text?: string }) {
	return (
		<div className="flex items-center gap-2">
			<EmailBuilderSpinner context="button" size={14} />
			{text && <span>{text}</span>}
		</div>
	);
}

/**
 * Upload progress indicator with percentage
 */
export function EmailBuilderUploadProgress({ 
	percent, 
	label 
}: { 
	percent: number; 
	label?: string 
}) {
	return (
		<div className="flex flex-col items-center gap-2">
			<div className="relative">
				<EmailBuilderSpinner context="upload" size={40} className="text-primary" />
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="text-xs font-medium">{Math.round(percent)}%</span>
				</div>
			</div>
			{label && <p className="text-xs text-muted-foreground">{label}</p>}
		</div>
	);
}

/**
 * Save status indicator with icon and text
 */
export function EmailBuilderSaveStatus({ 
	status, 
	error 
}: { 
	status: "saving" | "saved" | "failed" | "idle"; 
	error?: string | null 
}) {
	if (status === "saving") {
		return (
			<div className="flex items-center gap-2">
				<EmailBuilderSpinner context="inline" size={16} />
				<span className="text-xs text-muted-foreground">Saving...</span>
			</div>
		);
	}

	if (status === "failed") {
		return (
			<div 
				className="flex items-center gap-2 cursor-help" 
				title={error || "Failed to save"}
			>
				<Loader2 className="size-4 text-destructive animate-pulse" />
				<span className="text-xs text-destructive font-medium">Failed to save</span>
			</div>
		);
	}

	if (status === "saved") {
		return (
			<div className="flex items-center gap-2">
				<svg 
					className="size-4 text-green-600" 
					fill="none" 
					viewBox="0 0 24 24" 
					stroke="currentColor"
				>
					<path 
						strokeLinecap="round" 
						strokeLinejoin="round" 
						strokeWidth={2} 
						d="M5 13l4 4L19 7" 
					/>
				</svg>
				<span className="text-xs text-muted-foreground">Saved</span>
			</div>
		);
	}

	return null;
}

/**
 * Skeleton loader for list items
 */
export function EmailBuilderListSkeleton({ count = 3 }: { count?: number }) {
	return (
		<div className="space-y-3">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
					<div className="size-10 rounded bg-muted" />
					<div className="flex-1 space-y-2">
						<div className="h-4 w-1/3 bg-muted rounded" />
						<div className="h-3 w-1/2 bg-muted rounded" />
					</div>
				</div>
			))}
		</div>
	);
}

/**
 * Skeleton loader for cards/grid items
 */
export function EmailBuilderCardSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="rounded-lg border overflow-hidden animate-pulse">
					<div className="aspect-video bg-muted" />
					<div className="p-4 space-y-2">
						<div className="h-4 w-2/3 bg-muted rounded" />
						<div className="h-3 w-1/2 bg-muted rounded" />
					</div>
				</div>
			))}
		</div>
	);
}

/**
 * Operation progress tracker - shows status of background operations
 */
export function EmailBuilderOperationProgress({ 
	operations 
}: { 
	operations: Array<{
		id: string;
		type: string;
		status: string;
		errorMessage?: string | null;
	}> 
}) {
	const pending = operations.filter(op => 
		op.status === "QUEUED" || op.status === "PROCESSING"
	);

	if (pending.length === 0) return null;

	return (
		<div className="rounded-lg border bg-muted/20 p-3 space-y-2">
			{pending.map(op => (
				<div key={op.id} className="flex items-center gap-2">
					<EmailBuilderSpinner context="inline" size={14} className="shrink-0" />
					<span className="text-xs text-muted-foreground capitalize">
						{op.type.toLowerCase().replace(/_/g, " ")}...
					</span>
				</div>
			))}
		</div>
	);
}
