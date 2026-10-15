"use client";

import * as React from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	Download,
	Pencil,
	Plus,
	RefreshCw,
	Trash2,
	Upload,
	Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { CleanListCell } from "@/components/ui/clean-list";
import {
	SearchableCleanList,
	type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
import { trpc, type RouterOutputs } from "@/utils/trpc";
import { useNiscEmailMarketingRoute } from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";
import { toast } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
	addContactsInChunks,
	describeContactImport,
	parseContactsCsv,
	type AudienceContactStatus,
} from "./agency.nisc-email-marketing/audiences/_lib/contacts-csv";

type AudienceContact = RouterOutputs["niscEmailMarketing"]["audiences"]["listContacts"]["contacts"][number];
type ContactStatus = AudienceContactStatus;

type ContactDraft = {
	name: string;
	email: string;
	phone: string;
	company: string;
	description: string;
	status: ContactStatus;
};

const CONTACTS_PAGE_SIZE = 50;
const ACTION_BTN = "h-7 px-2.5 text-xs";

const emptyDraft = (): ContactDraft => ({
	name: "",
	email: "",
	phone: "",
	company: "",
	description: "",
	status: "SUBSCRIBED",
});

const formatDateTime = (value: Date | string | null | undefined) => {
	if (!value) return "—";
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

function statusLabel(status: string | null | undefined) {
	switch (status) {
		case "UNSUBSCRIBED":
			return "Unsubscribed";
		case "BOUNCED":
			return "Bounced";
		case "COMPLAINED":
			return "Complained";
		default:
			return "Subscribed";
	}
}

function StatusBadge({ status }: { status: string | null | undefined }) {
	const label = statusLabel(status);
	const className =
		status === "UNSUBSCRIBED" || status === "BOUNCED"
			? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
			: status === "COMPLAINED"
				? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
				: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
	return (
		<Badge variant="outline" className={className}>
			{label}
		</Badge>
	);
}

function toDraft(contact: AudienceContact): ContactDraft {
	const status = contact.status;
	return {
		name: contact.name ?? "",
		email: contact.emailAddress ?? "",
		phone: contact.phoneNumber ?? "",
		company: contact.company ?? "",
		description: contact.description ?? "",
		status:
			status === "UNSUBSCRIBED" || status === "BOUNCED" || status === "COMPLAINED"
				? status
				: "SUBSCRIBED",
	};
}

export default function AudienceDetailPage() {
	const params = useParams<{ audienceId: string }>();
	const navigate = useNavigate();
	const route = useNiscEmailMarketingRoute();
	const audienceId = params.audienceId ?? "";

	const [searchTerm, setSearchTerm] = React.useState("");
	const [statusFilter, setStatusFilter] = React.useState<"ALL" | ContactStatus>("ALL");
	const [contactsOffset, setContactsOffset] = React.useState(0);
	const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());
	const [draft, setDraft] = React.useState<ContactDraft>(emptyDraft);
	const [contactDialog, setContactDialog] = React.useState<
		{ mode: "add" } | { mode: "edit"; contactId: string } | null
	>(null);
	const [pendingDelete, setPendingDelete] = React.useState<AudienceContact | null>(null);
	const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
	const [isImporting, setIsImporting] = React.useState(false);
	const [isRefreshing, setIsRefreshing] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement | null>(null);

	React.useEffect(() => {
		setContactsOffset(0);
		setSelectedIds(new Set());
	}, [searchTerm, statusFilter]);

	const {
		data: audience,
		isLoading: isAudienceLoading,
		refetch: refetchAudience,
	} = trpc.niscEmailMarketing.audiences.getById.useQuery(
		{ id: audienceId },
		{ enabled: Boolean(audienceId), refetchOnWindowFocus: false },
	);

	const {
		data: contactsData,
		isLoading: isContactsLoading,
		isError: isContactsError,
		error: contactsError,
		refetch: refetchContacts,
	} = trpc.niscEmailMarketing.audiences.listContacts.useQuery(
		{
			audienceId,
			search: searchTerm || undefined,
			status: statusFilter === "ALL" ? undefined : statusFilter,
			limit: CONTACTS_PAGE_SIZE,
			offset: contactsOffset,
		},
		{ enabled: Boolean(audienceId), refetchOnWindowFocus: false },
	);

	const contacts = contactsData?.contacts ?? [];
	const totalContacts = contactsData?.total ?? 0;

	React.useEffect(() => {
		if (isContactsLoading || totalContacts === 0) return;
		const lastOffset = Math.floor((totalContacts - 1) / CONTACTS_PAGE_SIZE) * CONTACTS_PAGE_SIZE;
		if (contactsOffset > lastOffset) setContactsOffset(lastOffset);
	}, [contactsOffset, isContactsLoading, totalContacts]);

	const refreshLists = React.useCallback(async () => {
		await Promise.all([refetchContacts(), refetchAudience()]);
	}, [refetchAudience, refetchContacts]);

	const addContactsBulkMutation = trpc.niscEmailMarketing.audiences.addContactsBulk.useMutation();
	const updateContactMutation = trpc.niscEmailMarketing.audiences.updateContact.useMutation();
	const deleteContactMutation = trpc.niscEmailMarketing.audiences.deleteContact.useMutation();
	const deleteContactsMutation = trpc.niscEmailMarketing.audiences.deleteContacts.useMutation();

	const selectedCount = selectedIds.size;
	const allOnPageSelected = contacts.length > 0 && contacts.every((contact) => selectedIds.has(contact.id));
	const someOnPageSelected = contacts.some((contact) => selectedIds.has(contact.id));
	const dialogBusy = addContactsBulkMutation.isPending || updateContactMutation.isPending;

	const toggleAllOnPage = (checked: boolean) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			for (const contact of contacts) {
				if (checked) next.add(contact.id);
				else next.delete(contact.id);
			}
			return next;
		});
	};

	const toggleOne = (contactId: string, checked: boolean) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (checked) next.add(contactId);
			else next.delete(contactId);
			return next;
		});
	};

	const openAddDialog = () => {
		setDraft(emptyDraft());
		setContactDialog({ mode: "add" });
	};

	const openEditDialog = (contact: AudienceContact) => {
		setDraft(toDraft(contact));
		setContactDialog({ mode: "edit", contactId: contact.id });
	};

	const handleSaveContact = async () => {
		const email = draft.email.trim();
		if (!email) {
			toast.error("Email is required", {
				description: "A contact needs an email address before it can be saved.",
			});
			return;
		}

		const payload = {
			name: draft.name.trim() || undefined,
			emailAddress: email,
			phoneNumber: draft.phone.trim() || undefined,
			company: draft.company.trim() || undefined,
			description: draft.description.trim() || undefined,
			status: draft.status,
		};

		try {
			if (contactDialog?.mode === "edit") {
				await updateContactMutation.mutateAsync({
					id: contactDialog.contactId,
					audienceId,
					name: draft.name.trim(),
					emailAddress: email,
					phoneNumber: draft.phone.trim(),
					company: draft.company.trim(),
					description: draft.description.trim(),
					status: draft.status,
				});
				toast.success("Contact updated");
			} else {
				await addContactsBulkMutation.mutateAsync({
					audienceId,
					contacts: [payload],
				});
				toast.success("Contact added");
			}
			setContactDialog(null);
			await refreshLists();
		} catch (error) {
			toast.error(contactDialog?.mode === "edit" ? "Failed to update contact" : "Failed to add contact", {
				description: error instanceof Error ? error.message : "An error occurred",
			});
		}
	};

	const handleDeleteOne = async () => {
		if (!pendingDelete) return;
		try {
			await deleteContactMutation.mutateAsync({ id: pendingDelete.id, audienceId });
			setSelectedIds((prev) => {
				const next = new Set(prev);
				next.delete(pendingDelete.id);
				return next;
			});
			setPendingDelete(null);
			toast.success("Contact deleted");
			await refreshLists();
		} catch (error) {
			toast.error("Failed to delete contact", {
				description: error instanceof Error ? error.message : "An error occurred",
			});
		}
	};

	const handleDeleteSelected = async () => {
		const ids = Array.from(selectedIds);
		if (ids.length === 0) return;
		try {
			let deleted = 0;
			for (let i = 0; i < ids.length; i += 500) {
				const result = await deleteContactsMutation.mutateAsync({
					audienceId,
					ids: ids.slice(i, i + 500),
				});
				deleted += result.deleted;
			}
			setSelectedIds(new Set());
			setBulkDeleteOpen(false);
			toast.success("Contacts deleted", {
				description: `Deleted ${deleted.toLocaleString()} contact${deleted === 1 ? "" : "s"}.`,
			});
			await refreshLists();
		} catch (error) {
			toast.error("Failed to delete contacts", {
				description: error instanceof Error ? error.message : "An error occurred",
			});
		}
	};

	const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		if (!file.name.toLowerCase().endsWith(".csv")) {
			toast.error("Invalid file type", { description: "Please upload a CSV file." });
			return;
		}

		const reader = new FileReader();
		reader.onload = async (loadEvent) => {
			const text = String(loadEvent.target?.result ?? "");
			const parsed = parseContactsCsv(text);
			if (parsed.length === 0) {
				toast.error("No contacts found in CSV", {
					description: "Check the header row and make sure there are rows with data.",
				});
				return;
			}

			setIsImporting(true);
			try {
				const result = await addContactsInChunks(
					(chunk) => addContactsBulkMutation.mutateAsync({ audienceId, contacts: chunk }),
					parsed.map((contact) => ({
						name: contact.name || undefined,
						emailAddress: contact.emailAddress || undefined,
						phoneNumber: contact.phoneNumber || undefined,
						company: contact.company || undefined,
						description: contact.description || undefined,
						status: contact.status ?? undefined,
					})),
				);
				await refreshLists();
				const description = describeContactImport(parsed.length, result);
				if (result.added === 0) {
					toast.error("No contacts were added", { description });
				} else if (result.skippedDuplicate > 0 || result.skippedMissingEmail > 0) {
					toast.warning("Contacts imported with some rows skipped", { description });
				} else {
					toast.success("Contacts imported", { description });
				}
			} catch (error) {
				toast.error("Failed to import contacts", {
					description:
						error instanceof Error
							? `${error.message} Contacts already saved were kept. Upload the same CSV again to add the rest.`
							: "Contacts already saved were kept. Upload the same CSV again to add the rest.",
				});
			} finally {
				setIsImporting(false);
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

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await refreshLists();
		} finally {
			setIsRefreshing(false);
		}
	};

	const items: SearchableCleanListItem[] = contacts.map((contact) => ({
		key: contact.id,
		title: contact.name || contact.emailAddress || "Unnamed contact",
		description: (
			<div className="space-y-0.5">
				{contact.emailAddress ? <p className="truncate">{contact.emailAddress}</p> : null}
				{contact.description ? <p className="truncate">{contact.description}</p> : null}
			</div>
		),
		leading: (
			<span onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
				<Checkbox
					checked={selectedIds.has(contact.id)}
					onCheckedChange={(value) => toggleOne(contact.id, Boolean(value))}
					aria-label={`Select ${contact.name || contact.emailAddress || "contact"}`}
				/>
			</span>
		),
		cells: {
			phone: <CleanListCell>{contact.phoneNumber || "—"}</CleanListCell>,
			company: <CleanListCell>{contact.company || "—"}</CleanListCell>,
			status: <StatusBadge status={contact.status} />,
			added: <CleanListCell>{formatDateTime(contact.createdAt)}</CleanListCell>,
		},
		actions: (
			<>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className={ACTION_BTN}
					onClick={() => openEditDialog(contact)}
				>
					<Pencil className="mr-1 h-3.5 w-3.5" />
					Edit
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className={`${ACTION_BTN} text-destructive hover:text-destructive`}
					onClick={() => setPendingDelete(contact)}
				>
					<Trash2 className="mr-1 h-3.5 w-3.5" />
					Delete
				</Button>
			</>
		),
	}));

	const columns = [
		{
			key: "name",
			label: (
				<span className="inline-flex items-center gap-2.5 normal-case tracking-normal">
					<Checkbox
						checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
						onCheckedChange={(value) => toggleAllOnPage(Boolean(value))}
						aria-label="Select all contacts on this page"
						disabled={contacts.length === 0}
					/>
					<span>Contact</span>
				</span>
			),
		},
		{ key: "phone", label: "Phone", className: "w-36", hideBelow: "@md" as const },
		{ key: "company", label: "Company", className: "w-40", hideBelow: "@lg" as const },
		{ key: "status", label: "Status", className: "w-32", hideBelow: "@xl" as const },
		{ key: "added", label: "Added", className: "w-44", hideBelow: "@2xl" as const },
		{ key: "actions", label: "Actions", align: "end" as const },
	];

	const rangeStart = totalContacts === 0 ? 0 : contactsOffset + 1;
	const rangeEnd = contactsOffset + contacts.length;

	if (isAudienceLoading) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<div className="flex flex-col gap-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-8 w-64" />
					</div>
					<Skeleton className="mt-4 h-9 w-72 rounded-md" />
					<div className="mt-6">
						<Skeleton className="h-64 rounded-lg" />
					</div>
				</div>
			</div>
		);
	}

	if (!audience) {
		return (
			<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
				<div className="w-full max-w-7xl mx-auto">
					<p className="text-muted-foreground">Audience not found.</p>
					<Button variant="link" asChild className="mt-2 px-0">
						<Link to={`${route.basePath}/audiences`}>Back to audiences</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex items-start gap-3">
						<Button variant="ghost" size="sm" onClick={() => navigate(`${route.basePath}/audiences`)}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back
						</Button>
						<div>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Users className="h-4 w-4" />
								<span>Audience</span>
							</div>
							<h1 className="mt-0.5 text-2xl font-semibold tracking-tight">{audience.name}</h1>
							<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
								{audience.description || "View and manage the contacts in this audience."}
							</p>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => void handleRefresh()}
							disabled={isRefreshing || isImporting}
						>
							<RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
							Refresh
						</Button>
						<Button variant="outline" size="sm" onClick={handleDownloadCsvTemplate} disabled={isImporting}>
							<Download className="mr-2 h-4 w-4" />
							CSV template
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => fileInputRef.current?.click()}
							disabled={isImporting}
						>
							{isImporting ? <Spinner className="mr-2" size="sm" /> : <Upload className="mr-2 h-4 w-4" />}
							{isImporting ? "Uploading…" : "Upload CSV"}
						</Button>
						<Button size="sm" onClick={openAddDialog} disabled={isImporting}>
							<Plus className="mr-2 h-4 w-4" />
							Add contact
						</Button>
					</div>
				</div>

				<input
					type="file"
					ref={fileInputRef}
					accept=".csv,text/csv"
					className="hidden"
					onChange={handleCsvFileChange}
				/>

				<div className="mt-4 inline-flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
					<span>
						Total <span className="font-medium text-foreground">{audience.contactsCount.toLocaleString()}</span>
					</span>
					<span className="text-border">|</span>
					<span>
						Subscribed{" "}
						<span className="font-medium text-emerald-600 dark:text-emerald-400">
							{audience.subscribedCount.toLocaleString()}
						</span>
					</span>
					<span className="text-border">|</span>
					<span>
						Unsubscribed{" "}
						<span className="font-medium text-red-600 dark:text-red-400">
							{audience.unsubscribedCount.toLocaleString()}
						</span>
					</span>
				</div>

				<div className="mt-4">
					<SearchableCleanList
						items={items}
						searchQuery={searchTerm}
						onSearchChange={setSearchTerm}
						totalCount={totalContacts}
						isLoading={isContactsLoading && !contactsData}
						isError={isContactsError}
						error={contactsError instanceof Error ? contactsError : null}
						onRetry={() => void refetchContacts()}
						searchPlaceholder="Search by name, email, phone, or company..."
						errorTitle="Unable to load contacts"
						emptyMessage={
							searchTerm.trim() || statusFilter !== "ALL"
								? "No contacts match your filters."
								: "This audience does not have any contacts yet."
						}
						columns={columns}
						toolbarActions={
							<>
								{selectedCount > 0 ? (
									<Button
										variant="destructive"
										size="sm"
										onClick={() => setBulkDeleteOpen(true)}
										disabled={deleteContactsMutation.isPending}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete selected ({selectedCount.toLocaleString()}{" "}
										{selectedCount === 1 ? "contact" : "contacts"})
									</Button>
								) : null}
								<Select
									value={statusFilter}
									onValueChange={(value) => setStatusFilter(value as "ALL" | ContactStatus)}
								>
									<SelectTrigger className="h-9 w-full sm:w-44">
										<SelectValue placeholder="Status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">All statuses</SelectItem>
										<SelectItem value="SUBSCRIBED">Subscribed</SelectItem>
										<SelectItem value="UNSUBSCRIBED">Unsubscribed</SelectItem>
										<SelectItem value="BOUNCED">Bounced</SelectItem>
										<SelectItem value="COMPLAINED">Complained</SelectItem>
									</SelectContent>
								</Select>
							</>
						}
					/>
					{totalContacts > 0 ? (
						<div className="mt-3 flex items-center justify-between gap-3">
							<p className="text-xs text-muted-foreground">
								Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{" "}
								{totalContacts.toLocaleString()}
							</p>
							<div className="flex items-center gap-1">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-8 px-2"
									onClick={() => setContactsOffset((offset) => Math.max(0, offset - CONTACTS_PAGE_SIZE))}
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
									onClick={() => setContactsOffset((offset) => offset + CONTACTS_PAGE_SIZE)}
									disabled={contactsOffset + contacts.length >= totalContacts || isContactsLoading}
								>
									<ChevronRight className="h-4 w-4" />
									<span className="sr-only">Next page</span>
								</Button>
							</div>
						</div>
					) : null}
				</div>
			</div>

			<Dialog
				open={contactDialog !== null}
				onOpenChange={(open) => {
					if (dialogBusy) return;
					if (!open) setContactDialog(null);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{contactDialog?.mode === "edit" ? "Edit contact" : "Add contact"}</DialogTitle>
						<DialogDescription>
							Email is required. Name, phone, company, and notes are optional.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-2">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="space-y-2">
								<Label className="text-xs">Name</Label>
								<Input
									value={draft.name}
									onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
									placeholder="Jane Doe"
									className="h-9"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">Email</Label>
								<Input
									value={draft.email}
									onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
									type="email"
									placeholder="jane@example.com"
									className="h-9"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">Phone</Label>
								<Input
									value={draft.phone}
									onChange={(event) => setDraft((prev) => ({ ...prev, phone: event.target.value }))}
									placeholder="+15555550123"
									className="h-9"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">Company</Label>
								<Input
									value={draft.company}
									onChange={(event) => setDraft((prev) => ({ ...prev, company: event.target.value }))}
									placeholder="Acme Inc"
									className="h-9"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label className="text-xs">Status</Label>
							<Select
								value={draft.status}
								onValueChange={(value) => setDraft((prev) => ({ ...prev, status: value as ContactStatus }))}
							>
								<SelectTrigger className="h-9">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="SUBSCRIBED">Subscribed</SelectItem>
									<SelectItem value="UNSUBSCRIBED">Unsubscribed</SelectItem>
									<SelectItem value="BOUNCED">Bounced</SelectItem>
									<SelectItem value="COMPLAINED">Complained</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label className="text-xs">Description</Label>
							<Textarea
								value={draft.description}
								onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
								placeholder="Notes about this contact..."
								className="min-h-[70px] resize-y text-sm"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setContactDialog(null)} disabled={dialogBusy}>
							Cancel
						</Button>
						<Button type="button" onClick={() => void handleSaveContact()} disabled={dialogBusy}>
							{dialogBusy ? (
								<>
									<Spinner className="mr-2" size="sm" />
									Saving…
								</>
							) : contactDialog?.mode === "edit" ? (
								"Save changes"
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

			<AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !deleteContactMutation.isPending && !open && setPendingDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete contact</AlertDialogTitle>
						<AlertDialogDescription>
							Delete {pendingDelete?.name || pendingDelete?.emailAddress || "this contact"} from this audience?
							This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteContactMutation.isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={deleteContactMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={(event) => {
								event.preventDefault();
								void handleDeleteOne();
							}}
						>
							{deleteContactMutation.isPending ? "Deleting…" : "Delete contact"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={bulkDeleteOpen}
				onOpenChange={(open) => !deleteContactsMutation.isPending && setBulkDeleteOpen(open)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete selected contacts</AlertDialogTitle>
						<AlertDialogDescription>
							Delete {selectedCount.toLocaleString()} {selectedCount === 1 ? "contact" : "contacts"} from this
							audience? This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteContactsMutation.isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={deleteContactsMutation.isPending || selectedCount === 0}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={(event) => {
								event.preventDefault();
								void handleDeleteSelected();
							}}
						>
							{deleteContactsMutation.isPending
								? "Deleting…"
								: `Delete selected (${selectedCount.toLocaleString()} ${selectedCount === 1 ? "contact" : "contacts"})`}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
