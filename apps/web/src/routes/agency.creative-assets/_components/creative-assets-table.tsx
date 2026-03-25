"use client";

import * as React from "react";
import { Link } from "react-router";
import { useNavigate } from "react-router";
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
import { Eye, MoreHorizontal, Edit, Archive, ArchiveRestore } from "lucide-react";
import { Globe, Lock } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import type { z } from "zod";

import { creativeAssetSchema } from "./schema";
import { AssetStatusBadge } from "./asset-status-badge";

type CreativeAsset = z.infer<typeof creativeAssetSchema>;

function formatDate(v: string | Date | null | undefined): string {
	if (!v) return "—";
	const d = typeof v === "string" ? new Date(v) : v;
	return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export interface CreativeAssetsTableProps {
	data: CreativeAsset[];
	onEdit?: (id: string) => void;
	onArchive?: (id: string) => void;
	onUnarchive?: (id: string) => void;
	archivingAssetId?: string | null;
	unarchivingAssetId?: string | null;
}

export function CreativeAssetsTable({
	data,
	onEdit,
	onArchive,
	onUnarchive,
	archivingAssetId = null,
	unarchivingAssetId = null,
}: CreativeAssetsTableProps) {
	const navigate = useNavigate();

	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Name</TableHead>
						<TableHead>Category</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Visibility</TableHead>
						<TableHead>Internal</TableHead>
						<TableHead>Public</TableHead>
						<TableHead>Updated</TableHead>
						<TableHead className="w-24">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((asset) => {
						const isArchived = asset.status === "ARCHIVED";
						const isArchiving = archivingAssetId === asset.id;
						const isUnarchiving = unarchivingAssetId === asset.id;
						return (
							<TableRow
								key={asset.id}
								className="cursor-pointer"
								onClick={() => navigate(`/agency/creative-assets/${asset.id}`)}
							>
								<TableCell className="pl-6 font-medium">
									<div className="flex flex-col gap-0.5">
										<span className="line-clamp-1">{asset.name}</span>
										{asset.description ? (
											<span className="text-xs text-muted-foreground line-clamp-1">
												{asset.description}
											</span>
										) : null}
									</div>
								</TableCell>
								<TableCell>
									<Badge variant="outline" className="text-xs font-normal">
										{asset.category ?? "—"}
									</Badge>
								</TableCell>
								<TableCell>
									<AssetStatusBadge
										status={asset.status as "DRAFT" | "IN_REVIEW" | "APPROVED" | "ARCHIVED"}
									/>
								</TableCell>
								<TableCell>
									{asset.isPublic ? (
										<span className="inline-flex items-center gap-1.5 text-xs">
											<Globe className="h-3.5 w-3.5 text-muted-foreground" />
											Public
										</span>
									) : (
										<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
											<Lock className="h-3.5 w-3.5" />
											Internal
										</span>
									)}
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{asset.currentInternalVersion != null
										? `v${asset.currentInternalVersion}`
										: "—"}
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{asset.currentPublicVersion != null
										? `v${asset.currentPublicVersion}`
										: "—"}
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{formatDate(asset.updatedAt)}
								</TableCell>
								<TableCell onClick={(e) => e.stopPropagation()}>
									<div className="flex items-center gap-1">
										<Button variant="ghost" size="sm" asChild>
											<Link to={`/agency/creative-assets/${asset.id}`}>
												<Eye className="mr-2 h-4 w-4" />
												View
											</Link>
										</Button>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-44">
												{!isArchived && onEdit ? (
													<DropdownMenuItem
														onClick={(e) => {
															e.stopPropagation();
															onEdit(asset.id);
														}}
													>
														<Edit className="mr-2 h-4 w-4" />
														Edit asset
													</DropdownMenuItem>
												) : null}
												{isArchived && onUnarchive ? (
													<DropdownMenuItem
														onClick={(e) => {
															e.stopPropagation();
															onUnarchive(asset.id);
														}}
														disabled={isUnarchiving}
														className="text-destructive focus:text-destructive"
													>
														{isUnarchiving ? (
															<>
																<Spinner variant="ellipsis" className="mr-2 h-4 w-4" size="sm" />
																Unarchiving…
															</>
														) : (
															<>
																<ArchiveRestore className="mr-2 h-4 w-4" />
																Unarchive
															</>
														)}
													</DropdownMenuItem>
												) : null}
												{!isArchived && onArchive ? (
													<DropdownMenuItem
														onClick={(e) => {
															e.stopPropagation();
															onArchive(asset.id);
														}}
														disabled={isArchiving}
														className="text-destructive focus:text-destructive"
													>
														{isArchiving ? (
															<>
																<Spinner variant="ellipsis" className="mr-2 h-4 w-4" size="sm" />
																Archiving…
															</>
														) : (
															<>
																<Archive className="mr-2 h-4 w-4" />
																Archive
															</>
														)}
													</DropdownMenuItem>
												) : null}
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
