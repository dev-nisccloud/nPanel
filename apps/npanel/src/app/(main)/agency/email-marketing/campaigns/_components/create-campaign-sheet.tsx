"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, ChevronRight, ChevronLeft, Upload, Download, FileText, Calendar, Send, X, CheckCircle2, XCircle } from "lucide-react";

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
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const STEPS = [
	{ title: "From Email", description: "Select the email address to send from" },
	{ title: "Subject", description: "Enter the email subject line" },
	{ title: "Email Template", description: "Upload your HTML email template" },
	{ title: "Recipients", description: "Add recipient email addresses" },
	{ title: "Review", description: "Review parsed email addresses" },
	{ title: "Schedule", description: "Schedule or send immediately" },
	{ title: "Sending", description: "Creating campaign and sending emails" },
];

// Create schema with dynamic validation for fromEmail
// Make fields optional to allow step-by-step validation
const createFormSchema = (verifiedDomains: Array<{ domainName: string }>) => z.object({
	fromEmail: z.union([
		z.string()
			.email("Invalid email address")
			.min(1, "From email is required")
			.refine(
				(email) => {
					if (!email || !email.includes("@")) return false;
					const domain = email.split("@")[1];
					return verifiedDomains.some((d) => d.domainName === domain);
				},
				{ message: "Email must be from a verified domain" }
			),
		z.literal("")
	]),
	fromName: z.string().optional(),
	subject: z.union([
		z.string().min(1, "Subject is required"),
		z.literal("")
	]),
	htmlContent: z.string().optional(),
	recipientEmails: z.union([
		z.array(z.string().email("Invalid email address")).min(1, "At least one recipient email is required"),
		z.array(z.string()).length(0)
	]),
	sendOption: z.enum(["now", "schedule"]).default("now"),
	scheduledAt: z.date().optional().nullable(),
	emailDomainId: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
	// Only validate scheduledAt if sendOption is "schedule"
	// Don't validate if sendOption is "now" or not set yet
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
				message: "Schedule date must be in the future",
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

export function CreateCampaignSheet({ open, onOpenChange, onSuccess }: CreateCampaignSheetProps) {
	const [step, setStep] = React.useState(1);
	const [htmlFile, setHtmlFile] = React.useState<File | null>(null);
	const [htmlContent, setHtmlContent] = React.useState<string>("");
	const [emailInputText, setEmailInputText] = React.useState("");
	const [parsedEmails, setParsedEmails] = React.useState<string[]>([]);
	const [isSending, setIsSending] = React.useState(false);

	const utils = trpc.useUtils();

	// Fetch verified domains
	const { data: domainsData } = trpc.emailMarketing.domains.list.useQuery(
		{ limit: 100 },
		{
			enabled: open,
			staleTime: 5 * 60 * 1000,
		}
	);

	const verifiedDomains = React.useMemo(() => {
		if (!domainsData) return [];
		return domainsData.domains.filter((d) => d.status === "VERIFIED");
	}, [domainsData]);

	// Get emails from verified domains for suggestions
	const availableEmails = React.useMemo(() => {
		const emails: string[] = [];
		verifiedDomains.forEach((domain) => {
			// Generate common email addresses for each domain
			emails.push(`noreply@${domain.domainName}`);
			emails.push(`hello@${domain.domainName}`);
			emails.push(`support@${domain.domainName}`);
			emails.push(`info@${domain.domainName}`);
			emails.push(`contact@${domain.domainName}`);
			emails.push(`marketing@${domain.domainName}`);
		});
		return emails;
	}, [verifiedDomains]);

	const FormSchema = React.useMemo(() => createFormSchema(verifiedDomains), [verifiedDomains]);
	type FormData = z.infer<typeof FormSchema>;

	const form = useForm<FormData>({
		resolver: zodResolver(FormSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		shouldFocusError: true,
		defaultValues: {
			fromEmail: "",
			fromName: "",
			subject: "",
			htmlContent: "",
			recipientEmails: [],
			sendOption: "now",
			scheduledAt: null,
			emailDomainId: null,
		},
	});

	const [createdCampaignId, setCreatedCampaignId] = React.useState<string | null>(null);
	const [sendingComplete, setSendingComplete] = React.useState(false);

	const createMutation = trpc.emailMarketing.campaigns.create.useMutation({
		onSuccess: async (data) => {
			// For scheduled campaigns, show success and close
			if (form.getValues("sendOption") === "schedule") {
				toast.success("Campaign created successfully", {
					description: `Campaign "${data.name}" has been scheduled.`,
				});
				handleOpenChange(false);
				onSuccess?.();
			}
			// For immediate sending, the handleCreateAndSend function handles it
			utils.emailMarketing.campaigns.list.invalidate();
		},
		onError: (e) => {
			toast.error("Failed to create campaign", { description: e.message });
			setIsSending(false);
		},
	});

	const sendMutation = trpc.emailMarketing.campaigns.send.useMutation({
		onSuccess: (data) => {
			// The CampaignSendingStatus component will handle showing completion via polling
			// No toast here - let the status component show the final message
			// The mutation completes, but emails are still being sent
			// The status component will poll and update when status changes to SENT
		},
		onError: (e) => {
			toast.error("Failed to send campaign", { description: e.message });
			setIsSending(false);
			setCreatedCampaignId(null);
			setStep(6); // Go back to schedule step on error
		},
	});

	const handleOpenChange = (next: boolean) => {
		// Prevent closing if currently sending (but allow if sending is complete)
		if (!next && (isSending || (step === 7 && !sendingComplete))) {
			toast.warning("Please wait", {
				description: "Please wait until all emails are sent before closing.",
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
			setSendingComplete(false);
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

	// Find domain ID from email
	const getDomainIdFromEmail = (email: string): string | null => {
		const domain = email.split("@")[1];
		if (!domain) return null;
		const emailDomain = verifiedDomains.find((d) => d.domainName === domain);
		return emailDomain?.id ?? null;
	};

	const onSubmit = async (data: FormData) => {
		if (step < 7) {
			// Validate current step before moving to next
			let isValid = true;
			let errorMessage = "";
			
			if (step === 1) {
				isValid = await form.trigger("fromEmail", { shouldFocus: true });
				if (!isValid) {
					// Get error after trigger
					await new Promise(resolve => setTimeout(resolve, 10));
					const error = form.formState.errors.fromEmail;
					errorMessage = error?.message || "Please enter a valid email from a verified domain.";
					toast.error("Validation failed", { description: errorMessage });
					return;
				}
			} else if (step === 2) {
				isValid = await form.trigger("subject", { shouldFocus: true });
				if (!isValid) {
					await new Promise(resolve => setTimeout(resolve, 10));
					const error = form.formState.errors.subject;
					errorMessage = error?.message || "Please enter an email subject.";
					toast.error("Validation failed", { description: errorMessage });
					return;
				}
			} else if (step === 3) {
				if (!htmlContent) {
					toast.error("HTML template required", { description: "Please upload an HTML email template." });
					return;
				}
			} else if (step === 4) {
				isValid = await form.trigger("recipientEmails", { shouldFocus: true });
				if (!isValid || parsedEmails.length === 0) {
					if (parsedEmails.length === 0) {
						toast.error("No valid emails found", { description: "Please add at least one valid email address." });
					} else {
						await new Promise(resolve => setTimeout(resolve, 10));
						const error = form.formState.errors.recipientEmails;
						errorMessage = error?.message || "Please add at least one valid recipient email.";
						toast.error("Validation failed", { description: errorMessage });
					}
					return;
				}
			} else if (step === 6) {
				isValid = await form.trigger(["sendOption", "scheduledAt"], { shouldFocus: true });
				if (!isValid) {
					await new Promise(resolve => setTimeout(resolve, 10));
					const error = form.formState.errors.scheduledAt || form.formState.errors.sendOption;
					errorMessage = error?.message || "Please complete the schedule options.";
					toast.error("Validation failed", { description: errorMessage });
					return;
				}
				if (data.sendOption === "schedule" && !data.scheduledAt) {
					toast.error("Schedule date required", { description: "Please select a date and time to schedule the campaign." });
					return;
				}
				
				// If sending immediately, move to step 7 and start the process
				if (data.sendOption === "now" && isValid) {
					setIsSending(true);
					setStep(7);
					// Start creating and sending in background
					handleCreateAndSend(data);
					return;
				}
			}
			
			if (isValid) {
				setStep(step + 1);
			}
			return;
		}

		// Step 7: This should only be reached for scheduled campaigns
		// For immediate sending, handleCreateAndSend is called from step 6
		if (data.sendOption === "schedule") {
			// Validate all fields before submitting
			const allFieldsValid = await form.trigger(undefined, { shouldFocus: true });
			if (!allFieldsValid) {
				// Wait for form state to update
				await new Promise(resolve => setTimeout(resolve, 10));
				// Get all error messages
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
				if (errors.scheduledAt) {
					errorMessages.push(`Schedule: ${errors.scheduledAt.message || "Invalid schedule date"}`);
				}
				
				const errorDescription = errorMessages.length > 0 
					? errorMessages.join(". ")
					: "Please fix all errors before submitting.";
				
				toast.error("Validation failed", { description: errorDescription });
				return;
			}
			
			setIsSending(true);
			try {
				const emailDomainId = getDomainIdFromEmail(data.fromEmail);
				
				await createMutation.mutateAsync({
					name: `${data.subject} - ${new Date().toLocaleDateString()}`,
					subject: data.subject,
					fromEmail: data.fromEmail,
					fromName: data.fromName || undefined,
					htmlContent: data.htmlContent || undefined,
					recipientEmails: data.recipientEmails,
					emailDomainId: emailDomainId || undefined,
					scheduledAt: data.sendOption === "schedule" && data.scheduledAt ? data.scheduledAt : undefined,
					type: "MARKETING",
				});
			} catch (error) {
				// Error handled in mutation
			}
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

			// Create campaign
			const emailDomainId = getDomainIdFromEmail(data.fromEmail);
			const campaign = await createMutation.mutateAsync({
				name: `${data.subject} - ${new Date().toLocaleDateString()}`,
				subject: data.subject,
				fromEmail: data.fromEmail,
				fromName: data.fromName || undefined,
				htmlContent: data.htmlContent || undefined,
				recipientEmails: data.recipientEmails,
				emailDomainId: emailDomainId || undefined,
				scheduledAt: undefined, // Immediate sending
				type: "MARKETING",
			});

			// Set campaign ID to show status component (this will trigger the status component to render)
			setCreatedCampaignId(campaign.id);

			// Immediately invalidate to trigger refetch in status component
			utils.emailMarketing.campaigns.getById.invalidate({ id: campaign.id });

			// Start sending (don't await - let it run and update via polling)
			// The CampaignSendingStatus component will poll and show progress
			sendMutation.mutate({ id: campaign.id });
		} catch (error) {
			toast.error("Failed to create campaign", { 
				description: error instanceof Error ? error.message : "An error occurred" 
			});
			setIsSending(false);
			setCreatedCampaignId(null);
			setStep(6); // Go back to schedule step
		}
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
				<SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Mail className="h-6 w-6 text-primary" />
						</div>
						<div>
							<SheetTitle>Create Campaign</SheetTitle>
							<SheetDescription>
								Step {step} of 7: {STEPS[step - 1]?.title}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<ScrollArea className="flex-1 min-h-0 px-6 pr-4">
					<Form {...form}>
						<form id="create-campaign-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
							{/* Step 1: From Email */}
							{step === 1 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[0].title}</h3>
										<p className="text-sm text-muted-foreground">{STEPS[0].description}</p>
									</div>

									<FormField
										control={form.control}
										name="fromEmail"
										render={({ field }) => (
											<FormItem>
												<FormLabel>From Email</FormLabel>
												<FormControl>
													<div className="space-y-2">
														<Input
															placeholder="user@yourdomain.com"
															value={field.value}
															onChange={(e) => {
																const value = e.target.value;
																field.onChange(value);
																if (value.includes("@")) {
																	const domainId = getDomainIdFromEmail(value);
																	form.setValue("emailDomainId", domainId, { shouldValidate: false });
																}
															}}
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
												{verifiedDomains.length === 0 && (
													<p className="text-xs text-muted-foreground">
														You need to add and verify a domain first.
													</p>
												)}
												{verifiedDomains.length > 0 && (
													<p className="text-xs text-muted-foreground">
														Email must be from one of your verified domains: {verifiedDomains.map(d => d.domainName).join(", ")}
													</p>
												)}
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
													<Input placeholder="Your Company Name" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}

							{/* Step 2: Subject */}
							{step === 2 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[1].title}</h3>
										<p className="text-sm text-muted-foreground">{STEPS[1].description}</p>
									</div>

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

							{/* Step 3: Email Template */}
							{step === 3 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[2].title}</h3>
										<p className="text-sm text-muted-foreground">{STEPS[2].description}</p>
									</div>

									<div className="space-y-4">
										<div>
											<Label>Upload HTML Template</Label>
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
											<Label className="text-sm font-medium block">Template Preview</Label>
											<div className="rounded-lg border bg-card overflow-hidden">
												<div className="border-b bg-muted/50 px-4 py-2 flex items-center justify-between">
													<span className="text-xs font-medium">Email Preview</span>
													<span className="text-xs text-muted-foreground">
														{htmlContent.length} characters
													</span>
												</div>
												<div className="relative">
													<iframe
														srcDoc={htmlContent}
														className="w-full h-[400px] border-0"
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

							{/* Step 4: Recipients */}
							{step === 4 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[3].title}</h3>
										<p className="text-sm text-muted-foreground">{STEPS[3].description}</p>
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

							{/* Step 5: Review */}
							{step === 5 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[4].title}</h3>
										<p className="text-sm text-muted-foreground">{STEPS[4].description}</p>
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

							{/* Step 6: Schedule */}
							{step === 6 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[5].title}</h3>
										<p className="text-sm text-muted-foreground">{STEPS[5].description}</p>
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
															// Clear scheduledAt first if switching to "now"
															if (value === "now") {
																form.setValue("scheduledAt", null, { shouldValidate: false });
															}
															// Then update the sendOption
															field.onChange(value);
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
																<Calendar className="h-4 w-4" />
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
										<FormField
											control={form.control}
											name="scheduledAt"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Schedule Date & Time</FormLabel>
													<FormControl>
														<Input
															type="datetime-local"
															value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
															onChange={(e) => {
																const value = e.target.value;
																field.onChange(value ? new Date(value) : null);
															}}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}
								</div>
							)}

							{/* Step 7: Sending */}
							{step === 7 && (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold mb-1">{STEPS[6].title}</h3>
										<p className="text-sm text-muted-foreground">{STEPS[6].description}</p>
									</div>

									{createdCampaignId ? (
										<CampaignSendingStatus campaignId={createdCampaignId} onComplete={() => {
											setSendingComplete(true);
											// Small delay before closing to show final status
											setTimeout(() => {
												handleOpenChange(false);
												onSuccess?.();
											}, 500);
										}} />
									) : (
										<div className="flex flex-col items-center justify-center py-12">
											<Spinner size={32} className="mb-4" />
											<p className="text-sm font-medium">
												{isSending && !createdCampaignId ? "Creating campaign..." : "Preparing to send..."}
											</p>
											<p className="text-xs text-muted-foreground mt-2">
												Please wait while we set everything up
											</p>
										</div>
									)}
								</div>
							)}
						</form>
					</Form>
				</ScrollArea>

				<SheetFooter className="px-6 py-4 flex-shrink-0 border-t flex-row justify-between">
					<div className="flex gap-2">
						{step > 1 && step < 7 && !isSending && (
							<Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
								<ChevronLeft className="h-4 w-4 mr-1" /> Back
							</Button>
						)}
					</div>
					<div className="flex gap-2">
						{step < 7 ? (
							<Button
								type="submit"
								form="create-campaign-form"
								disabled={isSending || createMutation.isPending}
							>
								{createMutation.isPending ? (
									<>
										<Spinner size={16} className="mr-2" /> Creating...
									</>
								) : step === 6 ? (
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
						) : createdCampaignId ? (
							<div className="text-sm text-muted-foreground">
								Please wait until all emails are sent...
							</div>
						) : (
							<div className="text-sm text-muted-foreground">
								{isSending ? "Campaign is being created..." : "Ready to send"}
							</div>
						)}
					</div>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

// Component to show campaign sending status with polling
function CampaignSendingStatus({ campaignId, onComplete }: { campaignId: string; onComplete: () => void }) {
	const [status, setStatus] = React.useState<"SENDING" | "SENT" | "FAILED">("SENDING");
	const [sentCount, setSentCount] = React.useState(0);
	const [totalRecipients, setTotalRecipients] = React.useState(0);
	const onCompleteCalledRef = React.useRef(false);

	const utils = trpc.useUtils();
	const { data: campaign, isLoading, refetch } = trpc.emailMarketing.campaigns.getById.useQuery(
		{ id: campaignId },
		{
			enabled: !!campaignId,
			staleTime: 0, // Always consider data stale - never use cache for sending status
			gcTime: 0, // Don't cache - we need real-time data
			refetchOnMount: "always", // Always refetch on mount, even if data exists
			refetchOnWindowFocus: false, // Don't refetch on window focus
			refetchOnReconnect: true, // Refetch when reconnecting
			notifyOnChangeProps: ["data", "error", "status"], // Notify on all changes for immediate updates
			refetchInterval: (query) => {
				const data = query.state.data;
				// Poll every 1 second if still sending or if we don't have data yet
				if (!data || data.status === "SENDING") {
					return 1000;
				}
				// Stop polling if completed
				return false;
			},
		}
	);

	// Force immediate refetch when component mounts
	React.useEffect(() => {
		if (campaignId) {
			// Immediately refetch to get the latest status
			refetch();
		}
	}, [campaignId, refetch]);

	React.useEffect(() => {
		if (campaign) {
			setStatus(campaign.status as "SENDING" | "SENT" | "FAILED");
			setSentCount(campaign.sentCount ?? 0);
			setTotalRecipients(campaign.recipientEmails?.length ?? campaign.totalRecipients ?? 0);

			// Call onComplete when sending is done (SENT or FAILED)
			// Only auto-close if SENT (successfully sent at least some emails)
			if (campaign.status === "SENT" && !onCompleteCalledRef.current) {
				onCompleteCalledRef.current = true;
				setTimeout(() => {
					onComplete();
				}, 2000); // Wait 2 seconds to show final status
			} else if (campaign.status === "FAILED") {
				// For FAILED, show error but don't auto-close - let user close manually
				// This only happens if ALL emails failed
			}
		}
	}, [campaign, onComplete]);

	const progress = totalRecipients > 0 
		? (sentCount / totalRecipients) * 100 
		: 0;

	// Always show loader if status is SENDING or if we're loading
	const isSending = status === "SENDING" || isLoading || !campaign;

	return (
		<div className="space-y-6 py-8">
			<div className="flex flex-col items-center justify-center space-y-4">
				{isSending && (
					<>
						<Spinner size={40} className="mb-2" />
						<p className="text-lg font-semibold">
							{!campaign ? "Preparing to send..." : "Sending emails..."}
						</p>
						<p className="text-sm text-muted-foreground">
							Please wait until all emails are sent. Do not close this window.
						</p>
					</>
				)}
				{status === "SENT" && (
					<>
						<CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
						<p className="text-lg font-semibold text-green-700 dark:text-green-400">Campaign sent successfully!</p>
						<p className="text-sm text-muted-foreground">
							{sentCount} of {totalRecipients} emails sent successfully
						</p>
						<p className="text-xs text-muted-foreground mt-2">
							Closing automatically...
						</p>
					</>
				)}
				{status === "FAILED" && (
					<>
						<XCircle className="h-12 w-12 text-red-500 mb-2" />
						<p className="text-lg font-semibold text-red-700 dark:text-red-400">Campaign sending failed</p>
						<p className="text-sm text-muted-foreground">
							All emails failed to send. Please check your configuration and try again.
						</p>
					</>
				)}

				{isSending && totalRecipients > 0 && (
					<div className="w-full max-w-md space-y-2">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Progress</span>
							<span className="font-medium">
								{sentCount} / {totalRecipients}
							</span>
						</div>
						<Progress value={progress} className="h-2" />
						<div className="flex justify-center text-xs text-muted-foreground mt-1">
							<span>Sent: {sentCount}</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
