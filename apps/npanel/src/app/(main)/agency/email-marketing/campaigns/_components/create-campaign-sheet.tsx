"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, ChevronRight, ChevronLeft, Upload, Download, FileText, Calendar as CalendarIcon, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

const STEPS = [
	{ title: "Setup", description: "Domain, from address, and subject" },
	{ title: "Email Template", description: "Upload HTML or write content" },
	{ title: "Recipients", description: "Add recipient email addresses" },
	{ title: "Review", description: "Review parsed email addresses" },
	{ title: "Schedule", description: "Schedule or send immediately" },
];

/** Build preview document so plain text preserves spaces and newlines as typed. */
function previewDoc(content: string): string {
	const trimmed = content.trim();
	if (!trimmed) return "";
	// If it looks like HTML, use as-is
	if (trimmed.includes("<") && trimmed.includes(">")) return content;
	// Plain text: escape and wrap so whitespace is preserved
	const escapeHtml = (s: string) =>
		s
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	return `<!DOCTYPE html><html><body style="white-space: pre-wrap; font-family: inherit; margin: 0; padding: 1rem;">${escapeHtml(content)}</body></html>`;
}

/** If content is plain text (no HTML tags), convert to HTML that preserves newlines when sent. */
function normalizeHtmlContent(html: string | undefined): string | undefined {
	if (html == null || html.trim() === "") return html;
	const trimmed = html.trim();
	// Already HTML
	if (trimmed.includes("<") && trimmed.includes(">")) return html;
	// Plain text: escape and wrap so email clients preserve line breaks
	const escapeHtml = (s: string) =>
		s
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	return `<div style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(html)}</div>`;
}

// Create schema: fromEmail validated against selected domain
const createFormSchema = (verifiedDomains: Array<{ id: string; domainName: string }>) => z.object({
	name: z.string().min(1, "Campaign name is required"),
	emailDomainId: z.string().nullable(),
	fromEmail: z.string(),
	fromName: z.string().optional(),
	subject: z.union([
		z.string().min(1, "Subject is required"),
		z.literal("")
	]),
	htmlContent: z.string().optional(),
	textContent: z.string().optional(),
	recipientEmails: z.union([
		z.array(z.string().email("Invalid email address")).min(1, "At least one recipient email is required"),
		z.array(z.string()).length(0)
	]),
	sendOption: z.enum(["now", "schedule"]).default("now"),
	scheduledAt: z.date().optional().nullable(),
	scheduledTime: z.string().optional(),
}).superRefine((data, ctx) => {
	if (data.emailDomainId && data.fromEmail) {
		const domain = verifiedDomains.find((d) => d.id === data.emailDomainId);
		if (domain && data.fromEmail.includes("@")) {
			if (!data.fromEmail.endsWith(`@${domain.domainName}`)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "From email must use the selected domain",
					path: ["fromEmail"],
				});
			}
		}
	}
	if (data.sendOption === "schedule") {
		if (!data.scheduledAt) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Schedule date is required when scheduling for later",
				path: ["scheduledAt"],
			});
		} else if (data.scheduledAt instanceof Date && data.scheduledAt <= new Date()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Date and time must be in the future",
				path: ["scheduledAt"],
			});
		}
	}
});

interface CreateCampaignSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

// Helper function to parse emails from text
function parseEmailsFromText(text: string): string[] {
	// Remove empty lines and split by comma, newline, or semicolon
	const emails = text
		.split(/[,\n;]/)
		.map((email) => email.trim())
		.filter((email) => email.length > 0);

	// Validate emails and filter out invalid ones
	const validEmails: string[] = [];
	const invalidEmails: string[] = [];

	emails.forEach((email) => {
		// Basic email validation regex
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (emailRegex.test(email)) {
			// Remove duplicates
			if (!validEmails.includes(email.toLowerCase())) {
				validEmails.push(email.toLowerCase());
			}
		} else {
			invalidEmails.push(email);
		}
	});

	return validEmails;
}

// Helper function to parse CSV
function parseCSV(csvText: string): string[] {
	const lines = csvText.split("\n");
	const emails: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		// Skip header row if it contains "email" (case insensitive)
		if (i === 0 && line.toLowerCase().includes("email")) {
			continue;
		}

		// Parse CSV line (handle quoted values)
		const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
		const email = values[0]?.trim();

		if (email) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (emailRegex.test(email)) {
				if (!emails.includes(email.toLowerCase())) {
					emails.push(email.toLowerCase());
				}
			}
		}
	}

	return emails;
}

// Generate CSV format template
function generateCSVTemplate(): string {
	return "email\nsample1@example.com\nsample2@example.com\nsample3@example.com";
}

// Minimum datetime: today at 00:00 (for calendar disable)
function getTodayStart(): Date {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

// Combine date and time string "HH:mm" or "HH:mm:ss" into a Date
function combineDateAndTime(date: Date, timeStr: string): Date {
	const [h = 0, m = 0, s = 0] = timeStr.split(":").map(Number);
	const out = new Date(date);
	out.setHours(h, m, s, 0);
	return out;
}

function toTimeInputValue(d: Date): string {
	return format(d, "HH:mm:ss");
}

/** Form shape used by ScheduleDateTimePicker (scheduledAt/scheduledTime). */
type ScheduleFormValues = { scheduledAt: Date | null | undefined; scheduledTime?: string };

function ScheduleDateTimePicker({ form }: { form: UseFormReturn<ScheduleFormValues> }) {
	const [open, setOpen] = React.useState(false);
	const scheduledAt = form.watch("scheduledAt");
	const scheduledTime = form.watch("scheduledTime");
	const todayStart = getTodayStart();
	const dateAt = scheduledAt instanceof Date ? scheduledAt : scheduledAt ? new Date(scheduledAt) : null;
	const isToday = dateAt && dateAt >= todayStart && dateAt < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
	const now = new Date();
	const minTime = isToday
		? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`
		: "00:00:00";

	const dateOnly = dateAt ? new Date(dateAt.getFullYear(), dateAt.getMonth(), dateAt.getDate()) : undefined;
	const timeValue: string = dateAt && scheduledTime ? scheduledTime : (dateAt ? toTimeInputValue(dateAt) : "09:00:00");

	const handleDateSelect = (date: Date | undefined) => {
		if (!date) {
			form.setValue("scheduledAt", null, { shouldValidate: true });
			return;
		}
		const timeStr = (form.getValues("scheduledTime") as string) || "09:00:00";
		const combined = combineDateAndTime(date, timeStr);
		if (combined <= new Date()) {
			const future = new Date();
			future.setMinutes(future.getMinutes() + 1, 0, 0);
			form.setValue("scheduledAt", future, { shouldValidate: true });
			form.setValue("scheduledTime", toTimeInputValue(future), { shouldValidate: false });
		} else {
			form.setValue("scheduledAt", combined, { shouldValidate: true });
			form.setValue("scheduledTime", timeStr, { shouldValidate: false });
		}
		setOpen(false);
	};

	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (!value) return;
		form.setValue("scheduledTime", value, { shouldValidate: false });
		const date = form.getValues("scheduledAt");
		const d = date instanceof Date ? date : date ? new Date(date) : null;
		const baseDate = d && d >= todayStart ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : new Date(todayStart);
		const combined = combineDateAndTime(baseDate, value);
		if (combined > new Date()) {
			form.setValue("scheduledAt", combined, { shouldValidate: true });
		}
	};

	return (
		<FormField
			control={form.control}
			name="scheduledAt"
			render={({ field }) => {
				const fieldDate = field.value instanceof Date ? field.value : field.value ? new Date(field.value) : undefined;
				return (
				<FormItem>
					<FormLabel>Date & Time</FormLabel>
					<div className="flex flex-wrap items-center gap-3">
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger asChild>
								<FormControl>
									<Button
										variant="outline"
										className="w-[180px] justify-between font-normal"
									>
										{fieldDate ? format(fieldDate, "PPP") : "Select date"}
										<ChevronDownIcon className="h-4 w-4 opacity-50" />
									</Button>
								</FormControl>
							</PopoverTrigger>
							<PopoverContent className="w-auto overflow-hidden p-0" align="start">
								<Calendar
									mode="single"
									selected={dateOnly}
									captionLayout="dropdown"
									defaultMonth={fieldDate}
									disabled={(date) => date < todayStart}
									onSelect={handleDateSelect}
								/>
							</PopoverContent>
						</Popover>
						<div className="flex flex-col gap-1">
							<Label htmlFor="schedule-time" className="text-xs text-muted-foreground">
								Time
							</Label>
							<Input
								id="schedule-time"
								type="time"
								step="1"
								value={timeValue}
								min={minTime}
								onChange={handleTimeChange}
								className="w-32 bg-background [&::-webkit-calendar-picker-indicator]:hidden"
							/>
						</div>
					</div>
					<FormMessage />
					<p className="text-xs text-muted-foreground">
						Past dates and times are disabled. Pick a future date and time.
					</p>
				</FormItem>
				);
			}}
		/>
	);
}

export function CreateCampaignSheet({ open, onOpenChange, onSuccess }: CreateCampaignSheetProps) {
	const [step, setStep] = React.useState(1);
	const [htmlFile, setHtmlFile] = React.useState<File | null>(null);
	const [htmlContent, setHtmlContent] = React.useState<string>("");
	const [emailInputText, setEmailInputText] = React.useState("");
	const [parsedEmails, setParsedEmails] = React.useState<string[]>([]);
	const [isSending, setIsSending] = React.useState(false);

	const utils = trpc.useUtils();

	// Fetch verified domains
	const { data: domainsData, isLoading: domainsLoading } = trpc.emailMarketing.domains.list.useQuery(
		{ limit: 100 },
		{
			enabled: open,
			staleTime: 5 * 60 * 1000,
		}
	);

	const verifiedDomains = React.useMemo(() => {
		if (!domainsData) return [];
		return domainsData.domains.filter((d) => d.status === "VERIFIED") as Array<{ id: string; domainName: string }>;
	}, [domainsData]);

	const FormSchema = React.useMemo(() => createFormSchema(verifiedDomains), [verifiedDomains]);
	type FormData = z.infer<typeof FormSchema>;

	const form = useForm<FormData>({
		resolver: zodResolver(FormSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		shouldFocusError: true,
		defaultValues: {
			name: "",
			emailDomainId: null,
			fromEmail: "",
			fromName: "",
			subject: "",
			htmlContent: "",
			textContent: "",
			recipientEmails: [],
			sendOption: "now",
			scheduledAt: null,
			scheduledTime: "",
		},
	});

	const selectedDomainId = form.watch("emailDomainId");
	const availableEmails = React.useMemo(() => {
		const domain = verifiedDomains.find((d) => d.id === selectedDomainId);
		if (!domain) return [];
		return [
			`noreply@${domain.domainName}`,
			`hello@${domain.domainName}`,
			`support@${domain.domainName}`,
			`info@${domain.domainName}`,
			`campaigns@${domain.domainName}`,
		];
	}, [verifiedDomains, selectedDomainId]);

	const [createdCampaignId, setCreatedCampaignId] = React.useState<string | null>(null);

	const createMutation = trpc.emailMarketing.campaigns.create.useMutation({
		onSuccess: () => {
			utils.emailMarketing.campaigns.list.invalidate();
		},
		onError: (e) => {
			toast.error("Failed to create campaign", { description: e.message });
			setIsSending(false);
		},
	});

	const sendMutation = trpc.emailMarketing.campaigns.send.useMutation({
		onError: (e) => {
			toast.error("Failed to start send", { description: e.message });
			setIsSending(false);
			setCreatedCampaignId(null);
		},
	});

	const handleOpenChange = (next: boolean) => {
		if (!next && isSending) {
			toast.warning("Please wait", {
				description: "Creating campaign and starting send…",
			});
			return;
		}
		if (!next) {
			setStep(1);
			form.reset();
			setHtmlFile(null);
			setHtmlContent("");
			setEmailInputText("");
			setParsedEmails([]);
			setIsSending(false);
			setCreatedCampaignId(null);
		}
		onOpenChange(next);
	};

	// Handle HTML file upload
	const handleHtmlFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.name.endsWith(".html") && !file.type.includes("html")) {
			toast.error("Invalid file type", { description: "Please upload an HTML file." });
			return;
		}

		setHtmlFile(file);
		const reader = new FileReader();
		reader.onload = (event) => {
			const content = event.target?.result as string;
			setHtmlContent(content);
			form.setValue("htmlContent", content, { shouldValidate: false });
		};
		reader.readAsText(file);
	};

	// Handle email text input change
	const handleEmailInputChange = (text: string) => {
		setEmailInputText(text);
		const emails = parseEmailsFromText(text);
		setParsedEmails(emails);
		form.setValue("recipientEmails", emails, { shouldValidate: false });
	};

	// Handle CSV file upload
	const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const csvText = event.target?.result as string;
			const emails = parseCSV(csvText);
			setParsedEmails(emails);
			form.setValue("recipientEmails", emails, { shouldValidate: false });
			setEmailInputText(emails.join("\n"));
			toast.success(`Parsed ${emails.length} email addresses from CSV`);
		};
		reader.readAsText(file);
	};

	// Download CSV template
	const handleDownloadCSVTemplate = () => {
		const csv = generateCSVTemplate();
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "email-list-template.csv";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toast.success("CSV template downloaded");
	};

	const onSubmit = async (data: FormData) => {
		if (step <= 5) {
			let isValid = true;
			let errorMessage = "";

			if (step === 1) {
				isValid = await form.trigger(["emailDomainId", "fromEmail", "subject"], { shouldFocus: true });
				if (!isValid) {
					await new Promise((resolve) => setTimeout(resolve, 10));
					const e = form.formState.errors;
					errorMessage = e.emailDomainId?.message ?? e.fromEmail?.message ?? e.subject?.message ?? "Please complete domain, from email, and subject.";
					toast.error("Validation failed", { description: errorMessage });
					return;
				}
			} else if (step === 2) {
				if (!htmlContent) {
					toast.error("Content required", { description: "Please write or upload HTML content." });
					return;
				}
			} else if (step === 3) {
				isValid = await form.trigger("recipientEmails", { shouldFocus: true });
				if (!isValid || parsedEmails.length === 0) {
					if (parsedEmails.length === 0) {
						toast.error("No valid emails found", { description: "Please add at least one valid email address." });
					} else {
						await new Promise((resolve) => setTimeout(resolve, 10));
						errorMessage = form.formState.errors.recipientEmails?.message ?? "Please add at least one valid recipient email.";
						toast.error("Validation failed", { description: errorMessage });
					}
					return;
				}
			} else if (step === 5) {
				isValid = await form.trigger(["sendOption", "scheduledAt"], { shouldFocus: true });
				if (!isValid) {
					await new Promise((resolve) => setTimeout(resolve, 10));
					errorMessage = form.formState.errors.scheduledAt?.message ?? form.formState.errors.sendOption?.message ?? "Please complete the schedule options.";
					toast.error("Validation failed", { description: errorMessage });
					return;
				}
				if (data.sendOption === "schedule" && !data.scheduledAt) {
					toast.error("Schedule required", { description: "Please select a date and time." });
					return;
				}
				if (data.sendOption === "now" && isValid) {
					setIsSending(true);
					handleCreateAndSend(data);
					return;
				}
				if (data.sendOption === "schedule" && isValid) {
					setIsSending(true);
					handleCreateScheduled(data);
					return;
				}
			}

			if (isValid) {
				setStep(step + 1);
			}
			return;
		}
	};

	// Handle creating campaign and sending emails in background
	const handleCreateAndSend = async (data: FormData) => {
		try {
			// Validate all fields
			const allFieldsValid = await form.trigger(undefined, { shouldFocus: true });
			if (!allFieldsValid) {
				const errors = form.formState.errors;
				const errorMessages: string[] = [];
				
				if (errors.fromEmail) {
					errorMessages.push(`From Email: ${errors.fromEmail.message || "Invalid email"}`);
				}
				if (errors.subject) {
					errorMessages.push(`Subject: ${errors.subject.message || "Required"}`);
				}
				if (errors.recipientEmails) {
					errorMessages.push(`Recipients: ${errors.recipientEmails.message || "At least one recipient required"}`);
				}
				
				const errorDescription = errorMessages.length > 0 
					? errorMessages.join(". ")
					: "Please fix all errors before submitting.";
				
				toast.error("Validation failed", { description: errorDescription });
				setIsSending(false);
				setStep(6); // Go back to schedule step
				return;
			}

			const campaign = await createMutation.mutateAsync({
				name: data.name,
				subject: data.subject,
				fromEmail: data.fromEmail,
				fromName: data.fromName || undefined,
				htmlContent: normalizeHtmlContent(data.htmlContent) ?? undefined,
				textContent: data.textContent || undefined,
				recipientEmails: data.recipientEmails,
				emailDomainId: data.emailDomainId ?? undefined,
				scheduledAt: undefined,
			});

			// Fire-and-forget: trigger send (await so we catch e.g. loopback URL errors), then close
			await sendMutation.mutateAsync({ id: campaign.id });

			utils.emailMarketing.campaigns.list.invalidate();
			toast.success("Campaign created", {
				description: "Emails are being sent in the background.",
			});
			handleOpenChange(false);
			onSuccess?.();
		} catch (error) {
			toast.error("Failed to create or start campaign", {
				description: error instanceof Error ? error.message : "An error occurred",
			});
		} finally {
			setIsSending(false);
			setCreatedCampaignId(null);
		}
	};

	// Fire-and-forget: create scheduled campaign, trigger send, then close
	const handleCreateScheduled = async (data: FormData) => {
		try {
			const allFieldsValid = await form.trigger(undefined, { shouldFocus: true });
			if (!allFieldsValid) {
				const errors = form.formState.errors;
				const errorMessages: string[] = [];
				if (errors.fromEmail) errorMessages.push(`From Email: ${errors.fromEmail.message || "Invalid email"}`);
				if (errors.subject) errorMessages.push(`Subject: ${errors.subject.message || "Required"}`);
				if (errors.recipientEmails) errorMessages.push(`Recipients: ${errors.recipientEmails.message || "At least one recipient required"}`);
				if (errors.scheduledAt) errorMessages.push(`Schedule: ${errors.scheduledAt.message || "Invalid schedule date"}`);
				toast.error("Validation failed", { description: errorMessages.join(". ") || "Please fix errors." });
				setIsSending(false);
				return;
			}
			const campaign = await createMutation.mutateAsync({
				name: data.name,
				subject: data.subject,
				fromEmail: data.fromEmail,
				fromName: data.fromName || undefined,
				htmlContent: normalizeHtmlContent(data.htmlContent) ?? undefined,
				textContent: data.textContent || undefined,
				recipientEmails: data.recipientEmails,
				emailDomainId: data.emailDomainId ?? undefined,
				scheduledAt: data.scheduledAt ?? undefined,
			});
			await sendMutation.mutateAsync({ id: campaign.id });
			utils.emailMarketing.campaigns.list.invalidate();
			toast.success("Campaign scheduled", {
				description: "Emails will be sent at the scheduled time.",
			});
			handleOpenChange(false);
			onSuccess?.();
		} catch (error) {
			toast.error("Failed to schedule campaign", {
				description: error instanceof Error ? error.message : "An error occurred",
			});
		} finally {
			setIsSending(false);
		}
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent
				size={step === 2 ? "wide" : "default"}
				className="w-full overflow-hidden flex flex-col p-0"
			>
				<SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Mail className="h-6 w-6 text-primary" />
						</div>
						<div>
							<SheetTitle>Create Campaign</SheetTitle>
							<SheetDescription>
								Step {step} of 5: {STEPS[step - 1]?.title}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<ScrollArea className="flex-1 min-h-0 px-6 pr-4">
					<Form {...form}>
						<form id="create-campaign-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
							{/* Step 1: Campaign Name, Domain, From Email, From Name, Subject */}
							{step === 1 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[0].title}</h3>
										<p className="text-sm text-muted-foreground">{STEPS[0].description}</p>
									</div>

									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Campaign Name</FormLabel>
												<FormControl>
													<Input placeholder="e.g. Welcome series" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="emailDomainId"
										render={({ field }) => (
											<FormItem className="w-full">
												<FormLabel>Domain</FormLabel>
												<Select
													value={field.value ?? ""}
													onValueChange={(value) => {
														field.onChange(value || null);
														const domain = verifiedDomains.find((d) => d.id === value);
														if (domain) form.setValue("fromEmail", `noreply@${domain.domainName}`, { shouldValidate: false });
													}}
													disabled={domainsLoading}
												>
													<FormControl>
														<SelectTrigger className="w-full">
															{domainsLoading ? (
																<span className="flex items-center gap-2">
																	<Spinner size={14} className="shrink-0" />
																	Loading domains…
																</span>
															) : (
																<SelectValue placeholder="Select a verified domain" />
															)}
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{verifiedDomains.map((d) => (
															<SelectItem key={d.id} value={d.id}>
																{d.domainName}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
												{!domainsLoading && verifiedDomains.length === 0 && (
													<p className="text-xs text-muted-foreground">
														Add and verify a domain in Domain configuration first.
													</p>
												)}
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="fromEmail"
										render={({ field }) => (
											<FormItem>
												<FormLabel>From Email</FormLabel>
												<FormControl>
													<div className="space-y-2">
														<Input
															placeholder="noreply@yourdomain.com"
															value={field.value}
															onChange={(e) => field.onChange(e.target.value)}
															onBlur={field.onBlur}
															list="from-email-suggestions"
														/>
														<datalist id="from-email-suggestions">
															{availableEmails.map((email) => (
																<option key={email} value={email} />
															))}
														</datalist>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="fromName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>From Name (Optional)</FormLabel>
												<FormControl>
													<Input placeholder="e.g. Campaigns" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="subject"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Subject</FormLabel>
												<FormControl>
													<Input placeholder="Enter email subject" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}

							{/* Step 2: Email Template — wider sheet, scrollable editor */}
							{step === 2 && (
								<div className="space-y-4 min-w-0 overflow-x-auto">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[1].title}</h3>
										<p className="text-sm text-muted-foreground">{STEPS[1].description}</p>
									</div>

									<div className="space-y-4">
										<div className="min-w-0">
											<Label>Write or paste content</Label>
											<Textarea
												placeholder="Type or paste HTML content here. You can also use plain text — line breaks will be preserved in the sent email."
												value={htmlContent}
												onChange={(e) => {
													const v = e.target.value;
													setHtmlContent(v);
													form.setValue("htmlContent", v || undefined, { shouldValidate: false });
												}}
												className="min-h-[200px] font-mono text-sm mt-2 whitespace-pre-wrap w-full max-w-full overflow-x-auto resize-y"
											/>
											<p className="text-xs text-muted-foreground mt-1">
												HTML or plain text. Use {"{{email}}"} to insert the recipient address. Plain text line breaks are preserved when sent.
											</p>
										</div>

										<div className="flex items-center gap-2">
											<div className="flex-1 border-t" />
											<span className="text-xs text-muted-foreground">OR</span>
											<div className="flex-1 border-t" />
										</div>

										<div>
											<Label>Upload HTML file</Label>
											<div className="mt-2">
												<Input
													type="file"
													accept=".html,text/html"
													onChange={handleHtmlFileChange}
													className="cursor-pointer"
												/>
											</div>
											{htmlFile && (
												<div className="mt-2 flex items-center gap-2">
													<FileText className="h-4 w-4 text-muted-foreground" />
													<span className="text-sm text-muted-foreground">{htmlFile.name}</span>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="h-6 w-6"
														onClick={() => {
															setHtmlFile(null);
															setHtmlContent("");
															form.setValue("htmlContent", "");
														}}
													>
														<X className="h-3 w-3" />
													</Button>
												</div>
											)}
										</div>

										{htmlContent && (
											<div className="space-y-2">
												<Label className="text-sm font-medium block">Preview</Label>
												<div className="rounded-lg border bg-card overflow-hidden">
													<div className="border-b bg-muted/50 px-4 py-2 flex items-center justify-between">
														<span className="text-xs font-medium">Email Preview</span>
														<span className="text-xs text-muted-foreground">
															{htmlContent.length} characters
														</span>
													</div>
													<div className="relative">
														<iframe
															srcDoc={previewDoc(htmlContent)}
															className="w-full h-[300px] border-0"
															title="Email template preview"
															sandbox="allow-same-origin"
														/>
													</div>
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Step 3: Recipients */}
							{step === 3 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[2].title}</h3>
										<p className="text-sm text-muted-foreground">{STEPS[2].description}</p>
									</div>

									<div className="space-y-4">
										<div>
											<Label>Manual Entry</Label>
											<Textarea
												placeholder="Enter email addresses separated by commas or new lines&#10;example1@email.com, example2@email.com&#10;example3@email.com"
												value={emailInputText}
												onChange={(e) => handleEmailInputChange(e.target.value)}
												className="min-h-[200px] font-mono text-sm"
											/>
											<p className="text-xs text-muted-foreground mt-1">
												Separate emails by commas, semicolons, or new lines
											</p>
										</div>

										<div className="flex items-center gap-2">
											<div className="flex-1 border-t" />
											<span className="text-xs text-muted-foreground">OR</span>
											<div className="flex-1 border-t" />
										</div>

										<div>
											<Label>Upload CSV</Label>
											<div className="mt-2 space-y-2">
												<Button
													type="button"
													variant="outline"
													onClick={handleDownloadCSVTemplate}
													className="w-full"
												>
													<Download className="mr-2 h-4 w-4" />
													Download CSV Format
												</Button>
												<Input
													type="file"
													accept=".csv,text/csv"
													onChange={handleCSVUpload}
													className="cursor-pointer"
												/>
											</div>
										</div>

										{parsedEmails.length > 0 && (
											<div className="rounded-lg border bg-card p-4">
												<div className="flex items-center justify-between mb-2">
													<span className="text-sm font-medium">
														{parsedEmails.length} email{parsedEmails.length !== 1 ? "s" : ""} found
													</span>
													<Badge variant="outline">{parsedEmails.length}</Badge>
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Step 4: Review */}
							{step === 4 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[3].title}</h3>
										<p className="text-sm text-muted-foreground">{STEPS[3].description}</p>
									</div>

									<ScrollArea className="h-[400px] rounded-lg border bg-card p-4">
										<div className="space-y-2">
											{parsedEmails.map((email, index) => (
												<div key={index} className="flex items-center gap-2 text-sm">
													<span className="text-muted-foreground">{index + 1}.</span>
													<span>{email}</span>
												</div>
											))}
										</div>
									</ScrollArea>

									<div className="rounded-lg border bg-card p-4">
										<div className="text-sm">
											<div className="flex justify-between mb-1">
												<span className="text-muted-foreground">Total Recipients:</span>
												<span className="font-medium">{parsedEmails.length}</span>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Step 5: Schedule */}
							{step === 5 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[4].title}</h3>
										<p className="text-sm text-muted-foreground">{STEPS[4].description}</p>
									</div>

									<FormField
										control={form.control}
										name="sendOption"
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<RadioGroup
														value={field.value}
														onValueChange={(value) => {
															if (value === "now") {
																form.setValue("scheduledAt", null, { shouldValidate: false });
																form.setValue("scheduledTime", "", { shouldValidate: false });
															}
															// Update without validating so "Schedule for Later" doesn't require scheduledAt until user picks a date
															form.setValue("sendOption", value as "now" | "schedule", { shouldValidate: false });
														}}
														className="space-y-4"
													>
														<div className="flex items-center space-x-2">
															<RadioGroupItem value="now" id="now" />
															<Label htmlFor="now" className="flex items-center gap-2 cursor-pointer">
																<Send className="h-4 w-4" />
																Send Immediately
															</Label>
														</div>
														<div className="flex items-center space-x-2">
															<RadioGroupItem value="schedule" id="schedule" />
															<Label htmlFor="schedule" className="flex items-center gap-2 cursor-pointer">
																<CalendarIcon className="h-4 w-4" />
																Schedule for Later
															</Label>
														</div>
													</RadioGroup>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{form.watch("sendOption") === "schedule" && (
										<ScheduleDateTimePicker form={form as unknown as UseFormReturn<ScheduleFormValues>} />
									)}
								</div>
							)}

						</form>
					</Form>
				</ScrollArea>

				<SheetFooter className="px-6 py-4 flex-shrink-0 border-t flex-row justify-between">
					<div className="flex gap-2">
						{step > 1 && step < 5 && !isSending && (
							<Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
								<ChevronLeft className="h-4 w-4 mr-1" /> Back
							</Button>
						)}
					</div>
					<div className="flex gap-2">
						<Button
							type="submit"
							form="create-campaign-form"
							disabled={isSending || createMutation.isPending}
						>
							{isSending || createMutation.isPending ? (
								<>
									<Spinner size={16} className="mr-2" /> Creating...
								</>
							) : step === 5 ? (
								<>
									<Send className="mr-2 h-4 w-4" />
									Create & Send
								</>
							) : (
								<>
									Next <ChevronRight className="h-4 w-4 ml-1" />
								</>
							)}
						</Button>
					</div>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

