"use client";

import * as React from "react";
import { EllipsisVertical, Eye, Loader2, Plus, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { z } from "zod";

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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { agencyRoleUiSchema } from "./agency.agency-roles/_components/schema";
import { CreateRoleSheet } from "./agency.agency-roles/_components/create-role-sheet";
import { ViewRoleSheet } from "./agency.agency-roles/_components/view-role-sheet";
import { EditRoleSheet } from "./agency.agency-roles/_components/edit-role-sheet";

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
		<p className="mb-2 text-lg font-semibold">{title}</p>
		<p className="mb-4 text-muted-foreground">{description}</p>
		{action}
	</div>
);

export default function AgencyRolesPage() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [viewRoleId, setViewRoleId] = React.useState<string | null>(null);
	const [editRoleId, setEditRoleId] = React.useState<string | null>(null);
	const [pendingDeleteRole, setPendingDeleteRole] = React.useState<{ id: string; name: string } | null>(null);

	const {
		data: roles,
		isLoading,
		error,
		refetch,
	} = trpc.agencyRbac.rolesList.useQuery(undefined, {
		enabled:
			!!session?.user &&
			((session.user as { role?: string } | undefined)?.role === "AGENCY_SUPER_ADMIN"),
	});

	const utils = trpc.useUtils();

	const transformedRoles = React.useMemo(() => {
		if (!roles) return [];
		return roles.map((role) => {
			const toDate = (value: unknown): Date => {
				if (value instanceof Date) return value;
				if (typeof value === "string") return new Date(value);
				return new Date(String(value));
			};

			const mapped = {
				...role,
				createdAt: toDate(role.createdAt),
				updatedAt: toDate(role.updatedAt),
			} as z.infer<typeof agencyRoleUiSchema>;

			return mapped;
		});
	}, [roles]);

	const handleCreateSuccess = () => {
		utils.agencyRbac.rolesList.invalidate();
		setIsCreateOpen(false);
	};

	const deleteRoleMutation = trpc.agencyRbac.roleDelete.useMutation({
		onSuccess: () => {
			utils.agencyRbac.rolesList.invalidate();
			setPendingDeleteRole(null);
		},
		onError: (err) => {
			console.error("Failed to delete role:", err);
			setPendingDeleteRole(null);
		},
	});

	const handleDeleteRole = (roleId: string, roleName: string) => {
		setPendingDeleteRole({ id: roleId, name: roleName });
	};

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

	if (
		!session?.user ||
		(session.user as { role?: string } | undefined)?.role !== "AGENCY_SUPER_ADMIN"
	) {
		return (
			<div className="@container/main flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8">
				<div className="mx-auto w-full max-w-7xl">
					<div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
						<ShieldAlert className="h-8 w-8 text-destructive" />
						<p className="text-sm font-semibold">You don&apos;t have access to Agency Roles.</p>
						<p className="max-w-md text-xs text-muted-foreground">
							Only agency super admins can create or edit roles. If you believe this is a mistake, please contact your account owner.
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (isLoading) {
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
							{error.message || "Failed to load agency roles"}
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
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">Agency Roles</h1>
					<p className="text-xs text-muted-foreground">
						Define reusable roles that control which menus and tools your agency teammates can access.
					</p>
				</div>

				<div className="mt-6 flex items-center justify-between gap-4">
					<p className="text-xs text-muted-foreground">
					</p>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							onClick={() => refetch()}
							title="Refresh"
						>
							<RefreshCw className="h-4 w-4" />
						</Button>
						<Button onClick={() => setIsCreateOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							New Role
						</Button>
					</div>
				</div>

				<div className="mt-6">
					{!transformedRoles.length ? (
						<EmptyState
							title="No roles yet"
							description="Create your first agency role to start controlling sidebar access."
							action={
								<Button onClick={() => setIsCreateOpen(true)}>
									<Plus className="mr-2 h-4 w-4" />
									New Role
								</Button>
							}
						/>
					) : (
						<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="pl-6">Role</TableHead>
										<TableHead>Description</TableHead>
										<TableHead>Type</TableHead>
										<TableHead className="text-right">
											Updated
										</TableHead>
										<TableHead className="w-0 pr-6 text-right">
											<span className="sr-only">Actions</span>
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{transformedRoles.map((role) => (
										<TableRow
											key={role.id}
											className="cursor-pointer"
											onClick={() => setViewRoleId(role.id)}
										>
											<TableCell className="pl-6 font-medium">
												{role.name}
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{role.description || "—"}
											</TableCell>
											<TableCell>
												<Badge variant="outline" className="text-xs">
													{role.isSystem ? "System" : "Custom"}
												</Badge>
											</TableCell>
											<TableCell className="text-right text-xs text-muted-foreground">
												{role.updatedAt.toLocaleDateString()}
											</TableCell>
											<TableCell
												className="pr-6 text-right"
												onClick={(e) => e.stopPropagation()}
											>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
														>
															<EllipsisVertical className="h-4 w-4" />
															<span className="sr-only">Open actions</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align="end"
														className="w-40"
													>
														<DropdownMenuItem
															onSelect={() => setViewRoleId(role.id)}
														>
															<Eye className="mr-2 h-4 w-4" />
															View details
														</DropdownMenuItem>
														<DropdownMenuItem
															disabled={role.isSystem}
															onSelect={() => handleDeleteRole(role.id, role.name)}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			</div>

			<CreateRoleSheet
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				onSuccess={handleCreateSuccess}
			/>
			<ViewRoleSheet
				open={!!viewRoleId}
				onOpenChange={(open) => {
					if (!open) setViewRoleId(null);
				}}
				roleId={viewRoleId}
				onEdit={(id) => {
					setViewRoleId(null);
					setEditRoleId(id);
				}}
			/>
			<EditRoleSheet
				open={!!editRoleId}
				onOpenChange={(open) => {
					if (!open) setEditRoleId(null);
				}}
				roleId={editRoleId}
				onSuccess={() => {
					setEditRoleId(null);
					utils.agencyRbac.rolesList.invalidate();
				}}
			/>
			<AlertDialog
				open={!!pendingDeleteRole}
				onOpenChange={(open) => {
					if (!open) setPendingDeleteRole(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete agency role</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete{" "}
							<strong>{pendingDeleteRole?.name ?? "this role"}</strong>? Users assigned to this agency role
							will fall back to default sidebar access. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteRoleMutation.isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (!pendingDeleteRole) return;
								deleteRoleMutation.mutate({ roleId: pendingDeleteRole.id });
							}}
							disabled={deleteRoleMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleteRoleMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting…
								</>
							) : (
								"Delete role"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

