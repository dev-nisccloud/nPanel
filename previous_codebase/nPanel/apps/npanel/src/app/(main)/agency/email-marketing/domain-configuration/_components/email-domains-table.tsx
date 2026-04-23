"use client";

import * as React from "react";
import { Globe, EllipsisVertical, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { ViewDomainSheet } from "./view-domain-sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { trpc, type RouterOutputs } from "@/utils/trpc";
import { toast } from "sonner";

type EmailDomainSummary = RouterOutputs["emailMarketing"]["domains"]["list"]["domains"][0];

const getStatusBadge = (status: string) => {
	switch (status) {
		case "VERIFIED":
			return (
				<Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
					<CheckCircle2 className="mr-1 h-3 w-3" />
					Verified
				</Badge>
			);
		case "PENDING":
			return (
				<Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
					<Clock className="mr-1 h-3 w-3" />
					Pending
				</Badge>
			);
		case "FAILED":
			return (
				<Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800">
					<XCircle className="mr-1 h-3 w-3" />
					Failed
				</Badge>
			);
		case "EXPIRED":
			return (
				<Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800">
					<AlertCircle className="mr-1 h-3 w-3" />
					Expired
				</Badge>
			);
		default:
			return (
				<Badge variant="outline">
					{status}
				</Badge>
			);
	}
};

const formatDate = (value: Date | string | null | undefined) => {
	if (!value) return " ";
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? " " : d.toLocaleDateString();
};

interface DomainRowActionsProps {
	domain: EmailDomainSummary;
	onRefetch?: () => void;
}

function DomainRowActions({ domain, onRefetch }: DomainRowActionsProps) {
	const utils = trpc.useUtils();
	const [isVerifying, setIsVerifying] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

	const verifyMutation = trpc.emailMarketing.domains.verify.useMutation({
		onSuccess: () => {
			toast.success("Domain verification checked", {
				description: `Verification status for ${domain.domainName} has been updated.`,
			});
			utils.emailMarketing.domains.list.invalidate();
			onRefetch?.();
			setIsVerifying(false);
		},
		onError: (e) => {
			toast.error("Failed to verify domain", { description: e.message });
			setIsVerifying(false);
		},
	});

	const deleteMutation = trpc.emailMarketing.domains.delete.useMutation({
		onSuccess: () => {
			toast.success("Domain deleted successfully", {
				description: `Domain ${domain.domainName} has been deleted.`,
			});
			utils.emailMarketing.domains.list.invalidate();
			onRefetch?.();
			setIsDeleting(false);
			setShowDeleteDialog(false);
		},
		onError: (e) => {
			toast.error("Failed to delete domain", { description: e.message });
			setIsDeleting(false);
		},
	});

	const handleVerify = async () => {
		setIsVerifying(true);
		try {
			await verifyMutation.mutateAsync({ id: domain.id });
		} catch (error) {
			// Error handled in mutation
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteMutation.mutateAsync({ id: domain.id });
		} catch (error) {
			// Error handled in mutation
		}
	};

	const busy = isVerifying || isDeleting;

	return (
		<>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<EllipsisVertical className="h-4 w-4" />
									<span className="sr-only">Actions</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem onClick={handleVerify} disabled={busy}>
									{isVerifying ? "Verifying..." : "Verify Domain"}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => setShowDeleteDialog(true)}
									disabled={busy}
									className="text-destructive focus:text-destructive"
								>
									{isDeleting ? "Deleting..." : "Delete Domain"}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</TooltipTrigger>
					<TooltipContent>Actions</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Domain</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete domain "{domain.domainName}"? This action cannot be undone and will permanently delete the domain and all associated data.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction 
							onClick={handleDelete} 
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Deleting..." : "Delete Domain"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export interface EmailDomainsTableProps {
	domains: EmailDomainSummary[];
	onRefetch?: () => void;
}

export function EmailDomainsTable({ domains, onRefetch }: EmailDomainsTableProps) {
	const [viewDomainId, setViewDomainId] = React.useState<string | null>(null);

	return (
		<>
			<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="pl-6">Domain Name</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Verified At</TableHead>
							<TableHead>Created At</TableHead>
							<TableHead className="w-12 pr-6"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{domains.map((domain) => (
							<TableRow 
								key={domain.id}
								className="cursor-pointer"
								onClick={() => setViewDomainId(domain.id)}
							>
								<TableCell className="pl-6">
									<div className="flex items-center gap-2">
										<Globe className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium">{domain.domainName}</span>
									</div>
								</TableCell>
								<TableCell>
									{getStatusBadge(domain.status)}
								</TableCell>
								<TableCell>
									{domain.verifiedAt ? formatDate(domain.verifiedAt) : " "}
								</TableCell>
								<TableCell>
									{formatDate(domain.createdAt)}
								</TableCell>
								<TableCell className="pr-6" onClick={(e) => e.stopPropagation()}>
									<DomainRowActions domain={domain} onRefetch={onRefetch} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<ViewDomainSheet
				open={!!viewDomainId}
				onOpenChange={(open) => {
					if (!open) setViewDomainId(null);
				}}
				domainId={viewDomainId}
			/>
		</>
	);
}
