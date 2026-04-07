"use client";

import * as React from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Users, Search, Upload, Download, Trash2, Plus, Check, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc, type RouterOutputs } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

type AudienceContactList = RouterOutputs["niscEmailMarketing"]["audiences"]["listContacts"];

const formatDateTime = (value: Date | string | null | undefined) => {
	if (!value) return "- ";
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? "- " : d.toLocaleString();
};

export default function AudienceDetailPage() {
	const params = useParams<{ audienceId: string }>();
	const navigate = useNavigate();
	const audienceId = params.audienceId;

	const [searchTerm, setSearchTerm] = React.useState("");
	const [statusFilter, setStatusFilter] = React.useState<"ALL" | "SUBSCRIBED" | "UNSUBSCRIBED">("ALL");
	const [contactsOffset, setContactsOffset] = React.useState(0);

	const [draftName, setDraftName] = React.useState("");
	const [draftEmail, setDraftEmail] = React.useState("");
	const [draftPhone, setDraftPhone] = React.useState("");
	const [draftCompany, setDraftCompany] = React.useState("");
	const [draftDescription, setDraftDescription] = React.useState("");
	const [draftStatus, setDraftStatus] = React.useState<"SUBSCRIBED" | "UNSUBSCRIBED">("SUBSCRIBED");

	const fileInputRef = React.useRef<HTMLInputElement | null>(null);
	const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
	const [showDeleteAllDialog, setShowDeleteAllDialog] = React.useState(false);
	const [showAddContactDialog, setShowAddContactDialog] = React.useState(false);

	const resetDraft = React.useCallback(() => {
		setDraftName("");
		setDraftEmail("");
		setDraftPhone("");
		setDraftCompany("");
		setDraftDescription("");
		setDraftStatus("SUBSCRIBED");
	}, []);

	const contactsPageSize = 500;

	const { data: audience, isLoading: isAudienceLoading, refetch: refetchAudience } =
		trpc.niscEmailMarketing.audiences.getById.useQuery(
			{ id: audienceId ?? "" },
			{
				enabled: !!audienceId,
				refetchOnWindowFocus: false,
			},
		);

	const {
		data: contactsData,
		isLoading: isContactsLoading,
		refetch: refetchContacts,
	} = trpc.niscEmailMarketing.audiences.listContacts.useQuery(
		{
			audienceId: audienceId ?? "",
			search: searchTerm || undefined,
			status: statusFilter === "ALL" ? undefined : statusFilter,
			limit: contactsPageSize,
			offset: contactsOffset,
		},
		{
			enabled: !!audienceId,
			refetchOnWindowFocus: false,
		},
	);

	// Reset to first page when filters change
	React.useEffect(() => {
		setContactsOffset(0);
	}, [searchTerm, statusFilter]);

	const contacts: AudienceContactList["contacts"] = contactsData?.contacts ?? [];
	const totalContacts = contactsData?.total ?? 0;
	const totalOverview = audience?.contactsCount ?? 0;
	const subscribedOverview = audience?.subscribedCount ?? 0;
	const unsubscribedOverview = audience?.unsubscribedCount ?? 0;

	const addContactsBulkMutation = trpc.niscEmailMarketing.audiences.addContactsBulk.useMutation({
		onSuccess: async (result) => {
			await Promise.all([refetchContacts(), refetchAudience()]);
			toast.success("Contacts added", {
				description: `Successfully added ${result.added} contact(s) to this audience.`,
			});
		},
		onError: (error) => {
			toast.error("Failed to add contacts", {
				description: error instanceof Error ? error.message : "An error occurred",
			});
		},
	});

	const deleteContactMutation = trpc.niscEmailMarketing.audiences.deleteContact.useMutation({
		onSuccess: async () => {
			await Promise.all([refetchContacts(), refetchAudience()]);
			toast.success("Contact deleted");
		},
		onError: (error) => {
			toast.error("Failed to delete contact", {
				description: error instanceof Error ? error.message : "An error occurred",
			});
		},
	});

	const deleteAllContactsMutation = trpc.niscEmailMarketing.audiences.deleteAllContacts.useMutation({
		onSuccess: async (result) => {
			await Promise.all([refetchContacts(), refetchAudience()]);
			toast.success("All contacts deleted", {
				description: `Deleted ${result.deleted} contact${result.deleted === 1 ? "" : "s"} from this audience.`,
			});
		},
		onError: (error) => {
			toast.error("Failed to delete all contacts", {
				description: error instanceof Error ? error.message : "An error occurred",
			});
		},
	});

	const handleDeleteClick = async (contactId: string) => {
		// First click: arm deletion (show check icon)
		if (pendingDeleteId !== contactId) {
			setPendingDeleteId(contactId);
			return;
		}

		// Second click on same contact: confirm delete
		try {
			await deleteContactMutation.mutateAsync({ id: contactId, audienceId: audienceId ?? "" });
		} catch {
			// handled in mutation
		} finally {
			setPendingDeleteId(null);
		}
	};

	const handleAddSingleContact = async () => {
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

		try {
			await addContactsBulkMutation.mutateAsync({
				audienceId: audienceId ?? "",
				contacts: [
					{
						name: draftName || undefined,
						emailAddress: draftEmail || undefined,
						phoneNumber: draftPhone || undefined,
						company: draftCompany || undefined,
						description: draftDescription || undefined,
						status: draftStatus,
					},
				],
			});

			resetDraft();
			setShowAddContactDialog(false);
		} catch {
			// handled in mutation
		}
	};

	const handleCsvUploadClick = () => {
		fileInputRef.current?.click();
	};

	const parseContactsCsv = (csvText: string) => {
		const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
		if (lines.length <= 1) return [];

		const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
		const idx = (key: string) => header.indexOf(key);

		const nameIdx = idx("name");
		const emailIdx = idx("emailaddress");
		const phoneIdx = idx("phonenumber");
		const companyIdx = idx("company");
		const descriptionIdx = idx("description");
		const statusIdx = idx("status");

		const parsed: {
			name?: string;
			emailAddress?: string;
			phoneNumber?: string;
			company?: string;
			description?: string;
			status?: "SUBSCRIBED" | "UNSUBSCRIBED";
		}[] = [];

		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];
			if (!line) continue;
			const cols = line.split(",").map((c) => c.trim());

			const rawStatus = statusIdx >= 0 ? cols[statusIdx] ?? "" : "";
			let status: "SUBSCRIBED" | "UNSUBSCRIBED" | undefined;
			if (rawStatus) {
				const upper = rawStatus.toUpperCase();
				if (upper === "SUBSCRIBED" || upper === "UNSUBSCRIBED") {
					status = upper as "SUBSCRIBED" | "UNSUBSCRIBED";
				}
			}

			parsed.push({
				name: nameIdx >= 0 ? cols[nameIdx] || undefined : undefined,
				emailAddress: emailIdx >= 0 ? cols[emailIdx] || undefined : undefined,
				phoneNumber: phoneIdx >= 0 ? cols[phoneIdx] || undefined : undefined,
				company: companyIdx >= 0 ? cols[companyIdx] || undefined : undefined,
				description: descriptionIdx >= 0 ? cols[descriptionIdx] || undefined : undefined,
				status,
			});
		}

		return parsed;
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
		reader.onload = async (e) => {
			const text = e.target?.result as string;
			const parsed = parseContactsCsv(text);
			if (parsed.length === 0) {
				toast.error("No contacts found in CSV", {
					description: "Check the header row and make sure there are rows with data.",
				});
				return;
			}

			try {
				const result = await addContactsBulkMutation.mutateAsync({
					audienceId: audienceId ?? "",
					contacts: parsed,
				});
				await refetchContacts();
				toast.success("Contacts imported", {
					description: `Imported ${result.added} contact(s) from CSV.`,
				});
			} catch {
				// handled in mutation
			}
		};
		reader.readAsText(file);
	};

	const handleDownloadCsvTemplate = () => {
		const csv = [
			"name,emailAddress,phoneNumber,company,description,status",
			"Jane Doe,jane@example.com,+15555550123,Acme Inc,VIP customer,SUBSCRIBED",
			"John Smith,john@example.com,,Contoso Ltd,Agreed to receive product updates,SUBSCRIBED",
			"Alex Roe,alex@example.com,+15555550456,,Unsubscribed from all emails,UNSUBSCRIBED",
		].join("\n");
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

	const renderStatusBadge = (status: string | null | undefined) => {
		if (!status) {
			return <Badge variant="outline">Unknown</Badge>;
		}
		if (status === "UNSUBSCRIBED") {
			return (
				<Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
					Unsubscribed
				</Badge>
			);
		}
		return (
			<Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
				Subscribed
			</Badge>
		);
	};

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto space-y-3">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => navigate("/agency/nisc-email-marketing/audiences")}
							className="px-0 text-xs"
						>
							<ArrowLeft className="mr-1 h-3 w-3" />
							Back to audiences
						</Button>
					</div>
					{audience && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm" className="h-8 text-xs gap-1">
									<MoreVertical className="h-3 w-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-52">
								<DropdownMenuItem
									onClick={() => {
										resetDraft();
										setShowAddContactDialog(true);
									}}
								>
									<Plus className="mr-2 h-3 w-3" />
									Add contact
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleDownloadCsvTemplate}>
									<Download className="mr-2 h-3.5 w-3.5" />
									Download CSV template
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleCsvUploadClick}>
									<Upload className="mr-2 h-3.5 w-3.5" />
									Upload contacts CSV
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => setShowDeleteAllDialog(true)}
									className="text-destructive focus:text-destructive"
								>
									<Trash2 className="mr-2 h-3.5 w-3.5" />
									Delete all contacts
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>

				{isAudienceLoading ? (
					<div className="space-y-4">
						<Skeleton className="h-7 w-64" />
						<Skeleton className="h-4 w-80" />
						<Skeleton className="h-40 w-full" />
					</div>
				) : !audience ? (
					<div className="py-12 text-center text-muted-foreground text-sm">
						Audience not found.
					</div>
				) : (
					<ScrollArea className="max-h-[calc(100vh-8rem)] pr-2">
						<div className="space-y-6 pb-6">
							{/* Overview */}
							<div className="space-y-2">
								<h1 className="text-base font-semibold tracking-tight flex items-center gap-2">
									<Users className="h-4 w-4 text-muted-foreground" />
									<span>{audience.name}</span>
								</h1>
								<p className="text-xs text-muted-foreground max-w-2xl">
									View and manage all contacts inside this audience.
								</p>
							</div>

							<div className="rounded-lg border bg-card p-4 space-y-3">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
									<div className="space-y-1">
										<p className="text-sm font-medium">Audience overview</p>
										{audience.description && (
											<p className="text-xs text-muted-foreground">
												{audience.description}
											</p>
										)}
									</div>
									<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
										<span>
											Created{" "}
											<span className="font-medium">
												{formatDateTime(audience.createdAt)}
											</span>
										</span>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
									<div className="rounded-lg border bg-background px-3 py-2.5 flex flex-col gap-1">
										<span className="text-[11px] text-muted-foreground uppercase tracking-wide">
											Total contacts
										</span>
										<span className="text-lg font-semibold">
											{totalOverview}
										</span>
									</div>
									<div className="rounded-lg border bg-background px-3 py-2.5 flex flex-col gap-1">
										<span className="text-[11px] text-muted-foreground uppercase tracking-wide">
											Subscribed
										</span>
										<span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
											{subscribedOverview}
										</span>
									</div>
									<div className="rounded-lg border bg-background px-3 py-2.5 flex flex-col gap-1">
										<span className="text-[11px] text-muted-foreground uppercase tracking-wide">
											Unsubscribed
										</span>
										<span className="text-lg font-semibold text-red-600 dark:text-red-400">
											{unsubscribedOverview}
										</span>
									</div>
								</div>
							</div>

							{/* Contacts and filters */}
							<div className="space-y-3">
								<div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
									<div className="space-y-1">
										<h2 className="text-sm font-semibold">Contacts</h2>
										<span className="text-xs text-muted-foreground">
											{totalContacts === 0
												? "No contacts match"
												: `Showing ${contactsOffset + 1}–${contactsOffset + contacts.length} of ${totalContacts} contact${totalContacts !== 1 ? "s" : ""}`}
											.
										</span>
									</div>
									<div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 w-full md:w-auto">
										<div className="relative flex-1 md:w-60">
											<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
											<Input
												type="search"
												placeholder="Search by name, email, or phone..."
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
												className="pl-7 h-8 text-xs"
											/>
										</div>
										<Select
											value={statusFilter}
											onValueChange={(value) =>
												setStatusFilter(value as "ALL" | "SUBSCRIBED" | "UNSUBSCRIBED")
											}
										>
											<SelectTrigger className="h-8 w-full md:w-40 text-xs">
												<SelectValue placeholder="Status" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="ALL">All statuses</SelectItem>
												<SelectItem value="SUBSCRIBED">Subscribed</SelectItem>
												<SelectItem value="UNSUBSCRIBED">Unsubscribed</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								{/* Hidden CSV input for actions menu */}
								<input
									type="file"
									ref={fileInputRef}
									accept=".csv,text/csv"
									className="hidden"
									onChange={handleCsvFileChange}
								/>

								{/* Contacts list */}
								<div className="rounded-lg border bg-card">
									{isContactsLoading ? (
										<div className="space-y-2 p-4">
											<Skeleton className="h-4 w-full" />
											<Skeleton className="h-4 w-full" />
											<Skeleton className="h-4 w-full" />
										</div>
									) : contacts.length === 0 ? (
										<div className="py-8 text-center text-xs text-muted-foreground">
											This audience does not have any contacts yet.
										</div>
									) : (
										<div className="max-h-[420px] overflow-auto divide-y">
											{contacts.map((contact) => (
												<div
													key={contact.id}
													className="px-4 py-3 text-xs flex items-start justify-between gap-3"
												>
													<div className="space-y-0.5">
														<div className="flex items-center gap-2">
															<span className="font-medium">
																{contact.name || contact.emailAddress || "Unnamed contact"}
															</span>
															{renderStatusBadge(contact.status ?? null)}
														</div>
														<div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
															{contact.emailAddress && (
																<span>{contact.emailAddress}</span>
															)}
															{contact.phoneNumber && (
																<span>{contact.phoneNumber}</span>
															)}
															{contact.company && (
																<span>Company: {contact.company}</span>
															)}
														</div>
														{contact.description && (
															<p className="text-[11px] text-muted-foreground mt-1">
																{contact.description}
															</p>
														)}
													</div>
													<div className="flex flex-col items-end gap-1 text-[10px] text-muted-foreground text-right">
														<span>Added {formatDateTime(contact.createdAt)}</span>
														<Button
															type="button"
															size="icon"
															variant="ghost"
															className="h-6 w-6 text-muted-foreground"
															onClick={() => handleDeleteClick(contact.id)}
														>
															{pendingDeleteId === contact.id ? (
																<Check className="h-3 w-3" />
															) : (
																<Trash2 className="h-3 w-3" />
															)}
														</Button>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
								{totalContacts > 0 && (
									<div className="flex justify-end pt-2">
										<div className="flex items-center gap-1">
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="h-8 px-2"
												onClick={() =>
													setContactsOffset((o) => Math.max(0, o - contactsPageSize))
												}
												disabled={contactsOffset === 0 || isContactsLoading}
											>
												<ChevronLeft className="h-4 w-4" />
												<span className="sr-only">Previous page</span>
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="h-8 px-2"
												onClick={() => setContactsOffset((o) => o + contactsPageSize)}
												disabled={
													contactsOffset + contacts.length >= totalContacts || isContactsLoading
												}
											>
												<ChevronRight className="h-4 w-4" />
												<span className="sr-only">Next page</span>
											</Button>
										</div>
									</div>
								)}
							</div>
						</div>
					</ScrollArea>
				)}
			</div>

			{/* Add contact dialog */}
			<Dialog
				open={showAddContactDialog}
				onOpenChange={(next) => {
					// Prevent closing while the mutation is in-flight, otherwise the user sees
					// no progress and only a delayed success toast after closing.
					if (addContactsBulkMutation.isPending) return;
					setShowAddContactDialog(next);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Add contact</DialogTitle>
						<DialogDescription>
							Enter at least one field. All fields are optional.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-2">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label className="text-xs">Name</Label>
								<Input
									value={draftName}
									onChange={(e) => setDraftName(e.target.value)}
									placeholder="Jane Doe"
									className="h-9"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">Email</Label>
								<Input
									value={draftEmail}
									onChange={(e) => setDraftEmail(e.target.value)}
									type="email"
									placeholder="jane@example.com"
									className="h-9"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">Phone</Label>
								<Input
									value={draftPhone}
									onChange={(e) => setDraftPhone(e.target.value)}
									placeholder="+15555550123"
									className="h-9"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">Company</Label>
								<Input
									value={draftCompany}
									onChange={(e) => setDraftCompany(e.target.value)}
									placeholder="Acme Inc"
									className="h-9"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label className="text-xs">Status</Label>
							<Select
								value={draftStatus}
								onValueChange={(value) =>
									setDraftStatus(value as "SUBSCRIBED" | "UNSUBSCRIBED")
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
						<div className="space-y-2">
							<Label className="text-xs">Description</Label>
							<Textarea
								value={draftDescription}
								onChange={(e) => setDraftDescription(e.target.value)}
								placeholder="Notes about this contact..."
								className="min-h-[70px] resize-y text-sm"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowAddContactDialog(false)}
							disabled={addContactsBulkMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleAddSingleContact}
							disabled={addContactsBulkMutation.isPending}
						>
							{addContactsBulkMutation.isPending ? (
								<>
									<Spinner className="mr-2" size="sm" />
									Adding…
								</>
							) : (
								<>
									<Plus className="mr-2 h-3 w-3" />
									Add contact
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
