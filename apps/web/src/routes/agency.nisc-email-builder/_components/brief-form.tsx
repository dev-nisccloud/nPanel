"use client";

import * as React from "react";
import { Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
	NEB_BRIEF_OTHER,
	NEB_EMAIL_AUDIENCES,
	NEB_EMAIL_GOALS,
	resolveBriefAudience,
	resolveBriefGoal,
} from "@npanel/api/lib/nisc-email-builder/brief-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { NebSpinner } from "./neb-loading";
import { trpc } from "@/utils/trpc";
import {
	BrandColorEditor,
	compactBrandColors,
	padBrandColors,
} from "./brand-color-editor";
import { CompanyResearchAccordion } from "./company-research-accordion";

const EMAIL_TYPES = [
	{ value: "promotional", label: "Promotional" },
	{ value: "newsletter", label: "Newsletter" },
	{ value: "welcome", label: "Welcome" },
	{ value: "transactional", label: "Transactional" },
	{ value: "saas_update", label: "Product update" },
] as const;

const TONES = ["Professional", "Friendly", "Witty", "Urgent", "Luxury"] as const;

export type BriefFormValues = {
	companyName: string;
	goalPreset: string;
	goalCustom: string;
	audiencePreset: string;
	audienceCustom: string;
	tone: string;
	emailType: string;
	instructions: string;
	websiteUrl: string;
	logoUrl: string;
	/** [primary, accent, secondary] */
	brandColors: string[];
	companyContext: string;
	webSearchFound: boolean;
};

export function getResolvedBriefGoal(values: BriefFormValues): string {
	return resolveBriefGoal(values.goalPreset, values.goalCustom);
}

export function getResolvedBriefAudience(values: BriefFormValues): string {
	return resolveBriefAudience(values.audiencePreset, values.audienceCustom);
}

type BriefFormProps = {
	values: BriefFormValues;
	onChange: (patch: Partial<BriefFormValues>) => void;
	onSubmit: () => void;
	isSubmitting?: boolean;
};

export function BriefForm({ values, onChange, onSubmit, isSubmitting }: BriefFormProps) {
	const [detectUrl, setDetectUrl] = React.useState<string | null>(null);

	const previewQuery = trpc.niscEmailBuilder.brand.previewFromWebsite.useQuery(
		{
			websiteUrl: detectUrl ?? "",
			companyHint: values.companyName || undefined,
		},
		{ enabled: Boolean(detectUrl) },
	);

	const lastDetectRef = React.useRef<string | null>(null);

	React.useEffect(() => {
		if (!detectUrl || previewQuery.isFetching || !previewQuery.isSuccess || !previewQuery.data) {
			return;
		}
		const key = `${detectUrl}:${previewQuery.dataUpdatedAt}`;
		if (lastDetectRef.current === key) return;
		lastDetectRef.current = key;

		const data = previewQuery.data;
		const patch: Partial<BriefFormValues> = {
			websiteUrl: data.websiteUrl,
		};
		// Only fill fields the user has not set — manual edits always win.
		if (data.logoUrl && !values.logoUrl.trim()) {
			patch.logoUrl = data.logoUrl;
		}
		if (
			data.brandColors.length &&
			compactBrandColors(padBrandColors(values.brandColors)).length === 0
		) {
			patch.brandColors = padBrandColors(data.brandColors);
		}
		if (data.siteName && !values.companyName.trim()) {
			patch.companyName = data.siteName;
		}
		if (data.webSearchFound && data.companyContext) {
			if (!values.companyContext.trim()) {
				patch.companyContext = data.companyContext;
				patch.webSearchFound = true;
			}
		} else if (!values.companyContext.trim()) {
			patch.webSearchFound = false;
			patch.companyContext = "";
		}
		onChange(patch);
		if (data.logoUrl || data.brandColors.length) {
			toast.success("Brand detected from your website");
		} else if (data.warnings.length) {
			toast.message("Limited brand data found", {
				description: data.warnings.join(" "),
			});
		} else {
			toast.message("No logo or colors detected", {
				description: "Set primary, accent, and secondary below if needed.",
			});
		}
		setDetectUrl(null);
	}, [
		detectUrl,
		previewQuery.isFetching,
		previewQuery.isSuccess,
		previewQuery.data,
		previewQuery.dataUpdatedAt,
		onChange,
		values.logoUrl,
		values.brandColors,
		values.companyName,
		values.companyContext,
	]);

	React.useEffect(() => {
		if (previewQuery.isError && detectUrl) {
			toast.error(previewQuery.error.message || "Could not read website");
			setDetectUrl(null);
		}
	}, [previewQuery.isError, previewQuery.error, detectUrl]);

	const isDetecting = Boolean(detectUrl) && previewQuery.isFetching;

	const handleDetect = () => {
		const url = values.websiteUrl.trim();
		if (!url) {
			toast.error("Enter your website URL first");
			return;
		}
		setDetectUrl(url);
	};

	return (
		<div className="space-y-3 rounded-lg border bg-card p-4">
			<div className="flex items-center gap-2 text-sm font-medium">
				<Sparkles className="size-4 text-primary" />
				Start with a brief
			</div>
			<p className="text-xs text-muted-foreground">
				We&apos;ll generate a detailed creative mockup first, then build the HTML email
				after you approve.
			</p>

			<div className="space-y-2">
				<Label htmlFor="neb-website">Website (optional)</Label>
				<div className="flex gap-2">
					<div className="relative flex-1">
						<Globe className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
						<Input
							id="neb-website"
							className="pl-9"
							placeholder="https://yourcompany.com"
							value={values.websiteUrl}
							onChange={(e) => onChange({ websiteUrl: e.target.value })}
						/>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="shrink-0 h-9"
						disabled={isDetecting || isSubmitting}
						onClick={handleDetect}
					>
						{isDetecting ? (
							<NebSpinner context="inline" size={14} className="mr-1.5" />
						) : null}
						Detect brand
					</Button>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="neb-company">Company name</Label>
				<Input
					id="neb-company"
					placeholder="Filled from your site when you detect, or type your brand"
					value={values.companyName}
					onChange={(e) => onChange({ companyName: e.target.value })}
				/>
			</div>

			<div className="rounded-md border bg-muted/30 p-3 space-y-3">
				<p className="text-xs font-medium">Brand colors (optional)</p>
				<BrandColorEditor
					colors={values.brandColors}
					onChange={(brandColors) => onChange({ brandColors })}
				/>
				{values.webSearchFound && values.companyContext.trim() ? (
					<CompanyResearchAccordion content={values.companyContext} />
				) : null}
				{values.logoUrl ? (
					<div className="flex items-center gap-3 pt-1 border-t">
						<img
							src={values.logoUrl}
							alt="Brand logo"
							className="h-10 max-w-[140px] object-contain bg-white rounded border p-1"
						/>
						<span className="text-xs text-muted-foreground truncate flex-1">
							Logo for the email header
						</span>
					</div>
				) : null}
			</div>

			<div className="space-y-2 w-full">
				<Label htmlFor="neb-goal">Goal *</Label>
				<Select
					value={values.goalPreset}
					onValueChange={(v) => onChange({ goalPreset: v })}
				>
					<SelectTrigger id="neb-goal" className="w-full">
						<SelectValue placeholder="Select a campaign goal" />
					</SelectTrigger>
					<SelectContent className="w-[var(--radix-select-trigger-width)]">
						{NEB_EMAIL_GOALS.map((g) => (
							<SelectItem key={g.value} value={g.value}>
								{g.label}
							</SelectItem>
						))}
						<SelectItem value={NEB_BRIEF_OTHER}>Other — specify manually</SelectItem>
					</SelectContent>
				</Select>
				{values.goalPreset === NEB_BRIEF_OTHER ? (
					<Input
						id="neb-goal-custom"
						className="w-full"
						placeholder="Describe your campaign goal…"
						value={values.goalCustom}
						onChange={(e) => onChange({ goalCustom: e.target.value })}
					/>
				) : null}
			</div>

			<div className="space-y-2 w-full">
				<Label htmlFor="neb-audience">Audience *</Label>
				<Select
					value={values.audiencePreset}
					onValueChange={(v) => onChange({ audiencePreset: v })}
				>
					<SelectTrigger id="neb-audience" className="w-full">
						<SelectValue placeholder="Select a target audience" />
					</SelectTrigger>
					<SelectContent className="w-[var(--radix-select-trigger-width)]">
						{NEB_EMAIL_AUDIENCES.map((a) => (
							<SelectItem key={a.value} value={a.value}>
								{a.label}
							</SelectItem>
						))}
						<SelectItem value={NEB_BRIEF_OTHER}>Other — specify manually</SelectItem>
					</SelectContent>
				</Select>
				{values.audiencePreset === NEB_BRIEF_OTHER ? (
					<Input
						id="neb-audience-custom"
						className="w-full"
						placeholder="e.g. SMB owners in Kenya"
						value={values.audienceCustom}
						onChange={(e) => onChange({ audienceCustom: e.target.value })}
					/>
				) : null}
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label>Tone</Label>
					<Select value={values.tone} onValueChange={(v) => onChange({ tone: v })}>
						<SelectTrigger>
							<SelectValue placeholder="Tone" />
						</SelectTrigger>
						<SelectContent>
							{TONES.map((t) => (
								<SelectItem key={t} value={t}>
									{t}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label>Email type</Label>
					<Select
						value={values.emailType}
						onValueChange={(v) => onChange({ emailType: v })}
					>
						<SelectTrigger>
							<SelectValue placeholder="Type" />
						</SelectTrigger>
						<SelectContent>
							{EMAIL_TYPES.map((t) => (
								<SelectItem key={t.value} value={t.value}>
									{t.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="neb-instructions">Extra instructions</Label>
				<Textarea
					id="neb-instructions"
					placeholder="Offer details, links, or other creative notes…"
					value={values.instructions}
					onChange={(e) => onChange({ instructions: e.target.value })}
					rows={3}
				/>
			</div>

			<Button className="w-full" disabled={isSubmitting} onClick={onSubmit}>
				{isSubmitting ? (
					<NebSpinner context="button" size={16} className="mr-2" />
				) : (
					<Sparkles className="size-4 mr-2" />
				)}
				{isSubmitting ? "Starting build…" : "Generate creative design"}
			</Button>
		</div>
	);
}
