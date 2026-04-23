"use client";

import * as React from "react";
import { Shield, XIcon, CheckCircle2, PencilLine } from "lucide-react";

import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { agencyRoleWithPermissionsUiSchema } from "./schema";

interface ViewRoleSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	roleId: string | null;
	onEdit?: (roleId: string) => void;
}

export function ViewRoleSheet({ open, onOpenChange, roleId, onEdit }: ViewRoleSheetProps) {
	const { data, isLoading, error } = trpc.agencyRbac.roleById.useQuery(
		{ roleId: roleId ?? "" },
		{
			enabled: open && !!roleId,
		},
	);

	if (!open || !roleId) return null;

	const safeRole = data
		? agencyRoleWithPermissionsUiSchema.parse({
				...data,
				createdAt: new Date(data.createdAt),
				updatedAt: new Date(data.updatedAt),
			})
		: null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex h-full w-full flex-col p-0 sm:max-w-2xl">
				<div className="flex h-full flex-col overflow-hidden">
					<SheetHeader className="flex flex-row items-center justify-between border-b px-6 py-4 space-y-0">
						<div className="flex items-center gap-3">
							<div className="rounded-full bg-primary/10 p-2">
								<Shield className="h-5 w-5 text-primary" />
							</div>
							<div className="space-y-1 text-left">
								<SheetTitle className="flex items-center gap-2 text-base">
									{isLoading ? "Loading role..." : safeRole?.name ?? "Role details"}
									{safeRole?.isSystem && (
										<Badge variant="outline" className="text-[10px]">
											System
										</Badge>
									)}
								</SheetTitle>
								<SheetDescription>
									{isLoading
										? "Fetching role information..."
										: "View how this role is configured and which areas it can access."}
								</SheetDescription>
							</div>
						</div>
						{safeRole && onEdit && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									onEdit(safeRole.id);
								}}
							>
								<PencilLine className="mr-1 h-4 w-4" />
								Edit
							</Button>
						)}
						<SheetClose asChild>
							<Button size="icon" variant="ghost" className="h-8 w-8 p-0">
								<XIcon className="h-5 w-5" />
							</Button>
						</SheetClose>
					</SheetHeader>

					<div className="flex-1 min-h-0 overflow-hidden">
						<ScrollArea className="h-full">
							<div className="space-y-6 px-6 py-6">
								{isLoading ? (
									<div className="flex items-center justify-center py-12">
										<Spinner size={32} />
									</div>
								) : error || !safeRole ? (
									<div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
										<p className="text-sm font-semibold text-destructive">
											{error?.message || "Role not found"}
										</p>
										<Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
											Close
										</Button>
									</div>
								) : (
									<>
										<section className="space-y-2">
											<h2 className="text-sm font-semibold">Role overview</h2>
											<p className="text-xs text-muted-foreground">
												High-level information about this role and when it was last updated.
											</p>
											<div className="mt-3 grid gap-3 rounded-md border bg-muted/40 p-3 text-xs sm:grid-cols-2">
												<div className="space-y-1">
													<p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
														Name
													</p>
													<p className="font-medium">{safeRole.name}</p>
												</div>
												<div className="space-y-1">
													<p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
														Type
													</p>
													<Badge variant="outline" className="text-[10px]">
														{safeRole.isSystem ? "System" : "Custom"}
													</Badge>
												</div>
												<div className="space-y-1 sm:col-span-2">
													<p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
														Description
													</p>
													<p className="text-xs text-muted-foreground">
														{safeRole.description || "No description set."}
													</p>
												</div>
											</div>
										</section>

										<section className="space-y-2">
											<h2 className="text-sm font-semibold">Sidebar access</h2>
											<p className="text-xs text-muted-foreground">
												Menu entries this role can see in the agency experience.
											</p>
											{safeRole.menus.length === 0 ? (
												<div className="mt-3 rounded-md border border-dashed bg-muted/40 p-4 text-center text-xs text-muted-foreground">
													This role doesn&apos;t have any sidebar permissions yet.
												</div>
											) : (
												<div className="mt-3 grid gap-2 sm:grid-cols-2">
													{safeRole.menus.map((key) => {
														return (
															<div
																key={key}
																className="flex items-start gap-2 rounded-md border bg-background px-2 py-1.5 text-xs"
															>
																<CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
																<div className="flex flex-col gap-0.5">
																	<span className="font-medium">
																		{key.replace("/agency/", "").replace(/-/g, " ")}
																	</span>
																	<span className="text-[10px] text-muted-foreground">
																		{key}
																	</span>
																</div>
															</div>
														);
													})}
												</div>
											)}
										</section>
									</>
								)}
							</div>
							<ScrollBar orientation="vertical" />
						</ScrollArea>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}

