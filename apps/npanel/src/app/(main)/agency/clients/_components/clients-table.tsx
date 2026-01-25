"use client";

import * as React from "react";
import { User, EllipsisVertical, Ban, Lock, Unlock, ShieldCheck, ShieldX, BadgeCheck, Eye } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { clientSchema } from "./schema";

type ClientRow = z.infer<typeof clientSchema>;

export function ClientsTableSkeleton() {
	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Created</TableHead>
						<TableHead className="w-12 pr-6"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{[...Array(5)].map((_, i) => (
						<TableRow key={i}>
							<TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
							<TableCell><Skeleton className="h-4 w-40" /></TableCell>
							<TableCell><Skeleton className="h-4 w-24" /></TableCell>
							<TableCell><Skeleton className="h-4 w-20" /></TableCell>
							<TableCell><Skeleton className="h-4 w-24" /></TableCell>
							<TableCell className="pr-6"><Skeleton className="h-8 w-8" /></TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

export interface ClientsTableProps {
	data: ClientRow[];
	onView?: (id: string) => void;
	onDeactivate?: (id: string) => void;
	onReactivate?: (id: string) => void;
	onBan?: (id: string) => void;
	onUnban?: (id: string) => void;
	onSuspend?: (id: string) => void;
	onUnsuspend?: (id: string) => void;
}

export function ClientsTable({
	data,
	onView,
	onDeactivate,
	onReactivate,
	onBan,
	onUnban,
	onSuspend,
	onUnsuspend,
}: ClientsTableProps) {
	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Created</TableHead>
						<TableHead className="w-12 pr-6"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((client) => {
						const isActive = client.status === "ACTIVE";
						const isDeactivated = client.status === "DEACTIVATED";
						const isBanned = client.status === "BANNED";
						const isSuspended = client.status === "SUSPENDED";

						const handleDeactivate = () => {
							if (isDeactivated && onReactivate) onReactivate(client.id);
							else if (onDeactivate) onDeactivate(client.id);
						};
						const handleBan = () => {
							if (isBanned && onUnban) onUnban(client.id);
							else if (onBan) onBan(client.id);
						};
						const handleSuspend = () => {
							if (isSuspended && onUnsuspend) onUnsuspend(client.id);
							else if (onSuspend) onSuspend(client.id);
						};

						return (
							<TableRow
								key={client.id}
								className="cursor-pointer"
								onClick={() => onView?.(client.id)}
							>
								<TableCell className="pl-6">
									<div className="flex items-center gap-2 font-medium">
										<User className="h-4 w-4 text-muted-foreground" />
										{client.name}
										{client.emailVerified && (
											<BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0 fill-blue-500" />
										)}
									</div>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										{client.email}
										{client.emailVerified ? (
											<ShieldCheck className="h-3 w-3 text-green-500" />
										) : (
											<ShieldX className="h-3 w-3 text-muted-foreground" />
										)}
									</div>
								</TableCell>
								<TableCell>
									<Badge variant="outline" className="text-xs">
										{client.role}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge
										variant="outline"
										className={
											isActive
												? "bg-green-600 text-white border-green-600 hover:bg-green-600 hover:text-white"
												: ""
										}
									>
										{client.status}
									</Badge>
								</TableCell>
								<TableCell>
									{new Date(client.createdAt).toLocaleDateString()}
								</TableCell>
								<TableCell onClick={(e) => e.stopPropagation()} className="pr-6">
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
														<DropdownMenuItem onSelect={() => onView?.(client.id)}>
															<Eye className="mr-2 h-4 w-4" />
															View details
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														{isDeactivated ? (
															<DropdownMenuItem onSelect={handleDeactivate}>
																<Unlock className="mr-2 h-4 w-4" />
																Reactivate Account
															</DropdownMenuItem>
														) : (
															<>
																<DropdownMenuItem
																	onSelect={handleDeactivate}
																	disabled={isDeactivated}
																>
																	<Lock className="mr-2 h-4 w-4" />
																	Deactivate Account
																</DropdownMenuItem>
																{isBanned ? (
																	<DropdownMenuItem
																		onSelect={handleBan}
																		className="text-destructive focus:text-destructive"
																	>
																		<Unlock className="mr-2 h-4 w-4" />
																		Unban Account
																	</DropdownMenuItem>
																) : (
																	<DropdownMenuItem
																		onSelect={handleBan}
																		disabled={isBanned}
																		className="text-destructive focus:text-destructive"
																	>
																		<Ban className="mr-2 h-4 w-4" />
																		Ban Account
																	</DropdownMenuItem>
																)}
																{isSuspended ? (
																	<DropdownMenuItem onSelect={handleSuspend}>
																		<Unlock className="mr-2 h-4 w-4" />
																		Unsuspend Account
																	</DropdownMenuItem>
																) : (
																	<DropdownMenuItem
																		onSelect={handleSuspend}
																		disabled={isSuspended}
																	>
																		<Lock className="mr-2 h-4 w-4" />
																		Suspend Account
																	</DropdownMenuItem>
																)}
															</>
														)}
													</DropdownMenuContent>
												</DropdownMenu>
											</TooltipTrigger>
											<TooltipContent>Actions</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
