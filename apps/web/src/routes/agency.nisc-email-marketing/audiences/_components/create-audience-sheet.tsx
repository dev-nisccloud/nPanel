"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { Users, Plus, Upload, Download, X, FileText } from "lucide-react";

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
import { useNiscEmailMarketingRoute } from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";
import { NiscEmOrganizationSelect } from "@/components/nisc-email-marketing/nisc-em-organization-select";
import { Badge } from "@/components/ui/badge";
import {
	addContactsInChunks,
	describeContactImport,
	parseContactsCsv,
} from "../_lib/contacts-csv";

const FormSchema = z.object({
	name: z.string().min(1, "Audience name is required"),
	description: z.string().optional(),
	teamId: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

type DraftContactStatus = "SUBSCRIBED" | "UNSUBSCRIBED" | "BOUNCED" | "COMPLAINED" | null;

type DraftContact = {
	id: string;
	name: string;
	phoneNumber: string;
	emailAddress: string;
	description: string;
	company: string;
	status: DraftContactStatus;
};

interface CreateAudienceSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

function generateCSVTemplate(): string {
	return [
		"name,emailAddress,phoneNumber,company,description,status",
		"Jane Doe,jane@example.com,+15555550123,Acme Inc,VIP customer,SUBSCRIBED",
		"John Smith,john@example.com,,Contoso Ltd,Agreed to receive product updates,SUBSCRIBED",
		"Alex Roe,alex@example.com,+15555550456,,Unsubscribed from all emails,UNSUBSCRIBED",
	].join("\n");
}

export function CreateAudienceSheet({ open, onOpenChange, onSuccess }: CreateAudienceSheetProps) {
	const route = useNiscEmailMarketingRoute();
	const [contacts, setContacts] = React.useState<DraftContact[]>([]);
	const [csvFileName, setCsvFileName] = React.useState<string | null>(null);
	const [isSaving, setIsSaving] = React.useState(false);

	const [draftName, setDraftName] = React.useState("");
	const [draftEmail, setDraftEmail] = React.useState("");
	const [draftPhone, setDraftPhone] = React.useState("");
	const [draftCompany, setDraftCompany] = React.useState("");
	const [draftDescription, setDraftDescription] = React.useState("");
	const [draftStatus, setDraftStatus] = React.useState<DraftContactStatus>("SUBSCRIBED");

	const fileInputRef = React.useRef<HTMLInputElement | null>(null);

	const utils = trpc.useUtils();

	const form = useForm<FormData>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			name: "",
			description: "",
			teamId: "",
		},
	});

	const createAudience = trpc.niscEmailMarketing.audiences.create.useMutation({
		onSuccess: () => {
			utils.niscEmailMarketing.audiences.list.invalidate();
		},
	});

	const addContactsBulkMutation = trpc.niscEmailMarketing.audiences.addContactsBulk.useMutation();

	const handleOpenChange = (next: boolean) => {
		if (!next) {
			form.reset();
			setContacts([]);
			setCsvFileName(null);
			setDraftName("");
			setDraftEmail("");
			setDraftPhone("");
			setDraftCompany("");
			setDraftDescription("");
			setDraftStatus("SUBSCRIBED");
			setIsSaving(false);
		}
		onOpenChange(next);
	};

	const handleAddManualContact = () => {
		if (
			!draftName &&
			!draftEmail &&
			!draftPhone &&
			!draftCompany &&
			!draftDescription
		) {
			toast.error("Cannot add empty contact", {
				description: "Fill at least one field before adding.",
			});
			return;
		}

		const contact: DraftContact = {
			id: `${Date.now()}-${contacts.length}`,
			name: draftName,
			phoneNumber: draftPhone,
			emailAddress: draftEmail,
			description: draftDescription,
			company: draftCompany,
			status: draftStatus,
		};

		setContacts((prev) => [contact, ...prev]);
		setDraftName("");
		setDraftEmail("");
		setDraftPhone("");
		setDraftCompany("");
		setDraftDescription("");
		setDraftStatus("SUBSCRIBED");
	};

	const handleRemoveContact = (id: string) => {
		setContacts((prev) => prev.filter((c) => c.id !== id));
	};

	const handleCsvUploadClick = () => {
		fileInputRef.current?.click();
	};

	const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.name.endsWith(".csv")) {
			toast.error("Invalid file type", {
				description: "Please upload a CSV file.",
			});
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			const parsed = parseContactsCsv(text);
			if (parsed.length === 0) {
				toast.error("No contacts found in CSV", {
					description: "Check the header row and make sure there are rows with data.",
				});
				return;
			}
			setContacts((prev) => [
				...parsed.map((contact) => ({
					id: contact.id,
					name: contact.name,
					phoneNumber: contact.phoneNumber,
					emailAddress: contact.emailAddress,
					description: contact.description,
					company: contact.company,
					status: contact.status,
				})),
				...prev,
			]);
			setCsvFileName(file.name);
			toast.success(`Read ${parsed.length.toLocaleString()} contact(s) from CSV`);
		};
		reader.readAsText(file);
		event.target.value = "";
	};

	const handleDownloadCsvTemplate = () => {
		const csv = generateCSVTemplate();
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "audience-contacts-template.csv";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toast.success("CSV template downloaded");
	};

	const onSubmit = async (data: FormData) => {
		try {
			setIsSaving(true);

			const audience = await createAudience.mutateAsync({
				name: data.name,
				description: data.description || undefined,
				teamId: route.isCustomer
					? route.teamId
					: data.teamId && data.teamId !== ""
						? data.teamId
						: null,
			});

			let importResult = { added: 0, skippedDuplicate: 0, skippedMissingEmail: 0 };
			if (contacts.length > 0) {
				try {
					importResult = await addContactsInChunks(
						(chunk) =>
							addContactsBulkMutation.mutateAsync({
								audienceId: audience.id,
								contacts: chunk,
							}),
						contacts.map((c) => ({
							name: c.name || undefined,
							phoneNumber: c.phoneNumber || undefined,
							emailAddress: c.emailAddress || undefined,
							description: c.description || undefined,
							company: c.company || undefined,
							status: c.status ?? undefined,
						})),
					);
				} catch (error) {
					toast.error("Audience was created, but contacts were not fully imported", {
						description:
							error instanceof Error
								? `${error.message} Open the audience and upload the CSV again. Contacts already saved will be skipped.`
								: "Open the audience and upload the CSV again. Contacts already saved will be skipped.",
					});
					handleOpenChange(false);
					onSuccess?.();
					return;
				}
			}

			const savedAll =
				contacts.length === 0 ||
				(importResult.added === contacts.length &&
					importResult.skippedDuplicate === 0 &&
					importResult.skippedMissingEmail === 0);
			const description =
				contacts.length === 0
					? "Created an empty audience. You can add contacts later."
					: describeContactImport(contacts.length, importResult);
			if (savedAll) {
				toast.success("Audience created", { description });
			} else {
				toast.warning("Audience created with some contacts skipped", { description });
			}

			handleOpenChange(false);
			onSuccess?.();
		} catch (error) {
			toast.error("Failed to create audience", {
				description: error instanceof Error ? error.message : "An error occurred",
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
				<SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Users className="h-6 w-6 text-primary" />
						</div>
						<div>
							<SheetTitle>Create audience</SheetTitle>
							<SheetDescription>
								Name your audience and optionally add contacts now or later.
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<ScrollArea className="flex-1 min-h-0 px-6 pr-4">
					<Form {...form}>
						<form
							id="create-audience-form"
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-6 pb-6"
						>
							<div className="space-y-4">
								<div>
									<h3 className="text-lg font-semibold mb-1">Audience details</h3>
									<p className="text-sm text-muted-foreground">
										Give your audience a clear name and optional description.
									</p>
								</div>

								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Name</FormLabel>
											<FormControl>
												<Input placeholder="Newsletter subscribers" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description (optional)</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Short description of this audience..."
													className="min-h-[80px] resize-y"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{route.showAdminFeatures && (
									<FormField
										control={form.control}
										name="teamId"
										render={({ field }) => (
											<NiscEmOrganizationSelect
												value={field.value ?? ""}
												onChange={field.onChange}
												disabled={isSaving}
											/>
										)}
									/>
								)}
							</div>

							<div className="space-y-4 pt-2">
								<div>
									<h3 className="text-lg font-semibold mb-1">Contacts</h3>
									<p className="text-sm text-muted-foreground">
										Add contacts manually or import from CSV. All fields are optional.
									</p>
								</div>

								<div className="space-y-3 rounded-lg border bg-muted/40 px-3 py-3">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div>
											<FormLabel className="text-xs">Name</FormLabel>
											<Input
												value={draftName}
												onChange={(e) => setDraftName(e.target.value)}
												placeholder="Jane Doe"
											/>
										</div>
										<div>
											<FormLabel className="text-xs">Email</FormLabel>
											<Input
												value={draftEmail}
												onChange={(e) => setDraftEmail(e.target.value)}
												type="email"
												placeholder="jane@example.com"
											/>
										</div>
										<div>
											<FormLabel className="text-xs">Phone</FormLabel>
											<Input
												value={draftPhone}
												onChange={(e) => setDraftPhone(e.target.value)}
												placeholder="+15555550123"
											/>
										</div>
										<div>
											<FormLabel className="text-xs">Company</FormLabel>
											<Input
												value={draftCompany}
												onChange={(e) => setDraftCompany(e.target.value)}
												placeholder="Acme Inc"
											/>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div className="md:col-span-1">
											<FormLabel className="text-xs">Status</FormLabel>
											<Select
												value={draftStatus ?? "SUBSCRIBED"}
												onValueChange={(value) =>
													setDraftStatus(value as DraftContactStatus)
												}
											>
												<SelectTrigger className="h-9">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="SUBSCRIBED">Subscribed</SelectItem>
													<SelectItem value="UNSUBSCRIBED">Unsubscribed</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									<div>
										<FormLabel className="text-xs">Description</FormLabel>
										<Textarea
											value={draftDescription}
											onChange={(e) => setDraftDescription(e.target.value)}
											placeholder="Notes about this contact..."
											className="min-h-[70px] resize-y"
										/>
									</div>

									<div className="flex justify-between items-center pt-1">
										<span className="text-[11px] text-muted-foreground">
											You can leave any field empty; only filled fields will be saved.
										</span>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleAddManualContact}
										>
											<Plus className="mr-1 h-3 w-3" />
											Add contact
										</Button>
									</div>
								</div>

								<div className="space-y-2 rounded-lg border bg-card px-3 py-3">
									<div className="flex flex-wrap items-center gap-2 justify-between">
										<div className="flex items-center gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={handleCsvUploadClick}
											>
												<Upload className="mr-2 h-4 w-4" />
												Upload CSV
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={handleDownloadCsvTemplate}
											>
												<Download className="mr-2 h-4 w-4" />
												Download CSV template
											</Button>
										</div>
										{csvFileName && (
											<span className="text-[11px] text-muted-foreground flex items-center gap-1">
												<FileText className="h-3 w-3" />
												{csvFileName}
											</span>
										)}
									</div>
									<input
										type="file"
										ref={fileInputRef}
										accept=".csv,text/csv"
										className="hidden"
										onChange={handleCsvFileChange}
									/>
								</div>

								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<p className="text-sm font-medium">
											Contacts in this audience
										</p>
										<Badge variant="outline" className="text-[11px]">
											{contacts.length.toLocaleString()} total
										</Badge>
									</div>
									<div className="rounded-lg border bg-card max-h-[260px] overflow-auto">
										{contacts.length === 0 ? (
											<div className="py-8 text-center text-xs text-muted-foreground">
												No contacts added yet. Add one manually or import from CSV.
											</div>
										) : (
											<div className="divide-y text-xs">
												{contacts.slice(0, 40).map((c) => (
													<div
														key={c.id}
														className="px-3 py-2 flex items-start justify-between gap-3"
													>
														<div className="space-y-0.5">
															<div className="flex items-center gap-2">
																<span className="font-medium">
																	{c.name || c.emailAddress || "Unnamed contact"}
																</span>
																{c.status && (
																	<Badge
																		variant="outline"
																		className={
																			c.status === "UNSUBSCRIBED"
																				? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
																				: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
																		}
																	>
																		{c.status === "UNSUBSCRIBED"
																			? "Unsubscribed"
																			: "Subscribed"}
																	</Badge>
																)}
															</div>
															<div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
																{c.emailAddress && <span>{c.emailAddress}</span>}
																{c.phoneNumber && <span>{c.phoneNumber}</span>}
																{c.company && <span>Company: {c.company}</span>}
															</div>
															{c.description && (
																<p className="text-[11px] text-muted-foreground mt-1">
																	{c.description}
																</p>
															)}
														</div>
														<Button
															type="button"
															size="icon"
															variant="ghost"
															className="h-6 w-6 text-muted-foreground"
															onClick={() => handleRemoveContact(c.id)}
														>
															<X className="h-3 w-3" />
														</Button>
													</div>
												))}
												{contacts.length > 40 ? (
													<div className="px-3 py-2 text-[11px] text-muted-foreground">
														Showing the first 40 of {contacts.length.toLocaleString()}. All of them are included when the audience is created.
													</div>
												) : null}
											</div>
										)}
									</div>
								</div>
							</div>
						</form>
					</Form>
				</ScrollArea>

				<SheetFooter className="px-6 py-4 flex-shrink-0 border-t flex-row justify-between">
					<div className="flex gap-2" />
					<div className="flex gap-2">
						<Button
							type="submit"
							form="create-audience-form"
							disabled={isSaving || createAudience.isPending}
						>
							{isSaving || createAudience.isPending ? (
								<>
									<Spinner size={16} className="mr-2" /> Creating...
								</>
							) : (
								<>
									<Plus className="mr-2 h-4 w-4" />
									Create audience
								</>
							)}
						</Button>
					</div>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

