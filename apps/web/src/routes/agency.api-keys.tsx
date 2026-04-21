"use client";

import * as React from "react";
import { KeyRound, Plus, RefreshCw, Trash2, Ban } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { CreateApiKeyDialog } from "./agency.api-keys/_components/create-api-key-dialog";
import { toast } from "@/components/ui/sonner";

const EmptyState = ({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action?: React.ReactNode;
}) => (
	<div className="flex flex-col items-center justify-center py-12 text-center">
		<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
			<KeyRound className="h-6 w-6 text-muted-foreground" />
		</div>
		<p className="mb-2 text-lg font-semibold">{title}</p>
		<p className="mb-4 text-muted-foreground max-w-sm">{description}</p>
		{action}
	</div>
);

export default function ApiKeysPage() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	
	const [pendingRevokeId, setPendingRevokeId] = React.useState<string | null>(null);
	const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

	const {
		data: apiKeys,
		isLoading,
		error,
		refetch,
	} = trpc.apiKeys.list.useQuery(undefined, {
		enabled: !!session?.user,
	});

	const utils = trpc.useUtils();

	const revokeMutation = trpc.apiKeys.revoke.useMutation({
		onSuccess: () => {
			toast.success("API Key revoked successfully");
			utils.apiKeys.list.invalidate();
			setPendingRevokeId(null);
		},
		onError: (err) => {
			toast.error("Failed to revoke API key", { description: err.message });
			setPendingRevokeId(null);
		},
	});

	const deleteMutation = trpc.apiKeys.delete.useMutation({
		onSuccess: () => {
			toast.success("API Key deleted successfully");
			utils.apiKeys.list.invalidate();
			setPendingDeleteId(null);
		},
		onError: (err) => {
			toast.error("Failed to delete API key", { description: err.message });
			setPendingDeleteId(null);
		},
	});

	if (sessionPending) {
		return (
			<div className="@container/main flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8">
				<div className="mx-auto w-full max-w-7xl">
					<div className="flex items-center justify-center py-12">
						<Spinner size={32} />
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="@container/main flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8">
				<div className="mx-auto w-full max-w-7xl">
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<p className="mb-4 text-destructive">
							{error.message || "Failed to load API keys"}
						</p>
						<Button onClick={() => refetch()} variant="outline">
							Try again
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="@container/main flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8">
			<div className="mx-auto w-full max-w-7xl">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="flex flex-col gap-2">
						<h1 className="text-base font-semibold tracking-tight">API Keys</h1>
						<p className="text-sm text-muted-foreground">
							Manage the API keys that allow external integrations to securely access your nPanel data.
						</p>
					</div>
					
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							onClick={() => refetch()}
							title="Refresh list"
						>
							<RefreshCw className="h-4 w-4" />
						</Button>
						<Button onClick={() => setIsCreateOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Create key
						</Button>
					</div>
				</div>

				<div className="mt-6">
					{isLoading ? (
						<div className="flex h-32 items-center justify-center rounded-lg border bg-card shadow-sm">
							<Spinner size={24} />
						</div>
					) : !apiKeys || apiKeys.length === 0 ? (
						<EmptyState
							title="No API keys found"
							description="Generate your first API key to connect external integrations with your account."
							action={
								<Button onClick={() => setIsCreateOpen(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Create key
								</Button>
							}
						/>
					) : (
						<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="pl-6">Name</TableHead>
										<TableHead>Permissions</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Last Used</TableHead>
										<TableHead>Created</TableHead>
										<TableHead className="w-[100px] pr-6 text-right">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{apiKeys.map((key) => {
										// Typecasting because dates from tRPC can come as strings depending on transformer
										const createdAtDate = typeof key.createdAt === 'string' ? new Date(key.createdAt) : key.createdAt;
										const lastUsedAtDate = key.lastUsedAt ? (typeof key.lastUsedAt === 'string' ? new Date(key.lastUsedAt) : key.lastUsedAt) : null;
										
										return (
											<TableRow key={key.id}>
												<TableCell className="pl-6 font-medium">
													{key.name}
												</TableCell>
												<TableCell>
													<Badge variant="secondary" className="font-mono text-[10px]">
														{key.permissions[0] === "*" ? "Full Access" : `${key.permissions.length} scopes`}
													</Badge>
												</TableCell>
												<TableCell>
													{key.isActive ? (
														<Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-500 bg-green-500/10">Active</Badge>
													) : (
														<Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 bg-muted/50">Revoked</Badge>
													)}
												</TableCell>
												<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
													{lastUsedAtDate ? format(lastUsedAtDate, "PPp") : "Never"}
												</TableCell>
												<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
													{format(createdAtDate, "PPp")}
												</TableCell>
												<TableCell className="pr-6 text-right">
													<div className="flex items-center justify-end gap-2">
														{key.isActive ? (
															<Button
																variant="outline"
																size="sm"
																className="h-8 shadow-none"
																onClick={() => setPendingRevokeId(key.id)}
															>
																<Ban className="mr-2 h-3.5 w-3.5" />
																Revoke
															</Button>
														) : (
															<Button
																variant="destructive"
																size="sm"
																className="h-8 shadow-none bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground dark:bg-destructive/20"
																onClick={() => setPendingDeleteId(key.id)}
															>
																<Trash2 className="mr-2 h-3.5 w-3.5" />
																Delete
															</Button>
														)}
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			</div>

			<CreateApiKeyDialog
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				onSuccess={() => utils.apiKeys.list.invalidate()}
			/>

			<AlertDialog
				open={!!pendingRevokeId}
				onOpenChange={(open) => {
					if (!open) setPendingRevokeId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
						<AlertDialogDescription>
							This will immediately disable access for any service using this key. 
							You cannot re-activate a revoked key. Are you sure?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={revokeMutation.isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (!pendingRevokeId) return;
								revokeMutation.mutate({ id: pendingRevokeId });
							}}
							disabled={revokeMutation.isPending}
						>
							{revokeMutation.isPending ? (
								<Spinner className="mr-2 size-4" />
							) : null}
							Yes, revoke key
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={!!pendingDeleteId}
				onOpenChange={(open) => {
					if (!open) setPendingDeleteId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete API Key permanently?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently remove the revoked API key record from your account history. 
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteMutation.isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (!pendingDeleteId) return;
								deleteMutation.mutate({ id: pendingDeleteId });
							}}
							disabled={deleteMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteMutation.isPending ? (
								<Spinner className="mr-2 size-4" />
							) : null}
							Yes, delete permanently
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
