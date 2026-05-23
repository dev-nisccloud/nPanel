"use client";

import * as React from "react";
import { Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { BrandColorEditor, padBrandColors } from "./brand-color-editor";
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
	goal: string;
	audience: string;
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
		if (data.logoUrl) patch.logoUrl = data.logoUrl;
		if (data.brandColors.length) {
			patch.brandColors = padBrandColors(data.brandColors);
		}
		if (data.siteName) {
			patch.companyName = data.siteName;
		}
		if (data.webSearchFound && data.companyContext) {
			patch.companyContext = data.companyContext;
			patch.webSearchFound = true;
		} else {
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
						{isDetecting ? <Spinner size={14} /> : "Detect brand"}
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

			<div className="space-y-2">
				<Label htmlFor="neb-goal">Goal *</Label>
				<Input
					id="neb-goal"
					placeholder="e.g. Drive sign-ups for our webinar"
					value={values.goal}
					onChange={(e) => onChange({ goal: e.target.value })}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="neb-audience">Audience *</Label>
				<Input
					id="neb-audience"
					placeholder="e.g. SMB owners in Kenya"
					value={values.audience}
					onChange={(e) => onChange({ audience: e.target.value })}
				/>
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
				<Sparkles className="size-4 mr-2" />
				Generate creative design
			</Button>
		</div>
	);
}
