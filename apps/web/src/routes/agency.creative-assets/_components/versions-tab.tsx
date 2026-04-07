"use client";

import * as React from "react";
import type { z } from "zod";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Upload, Check, X, Globe, MoreHorizontal, Edit, Archive, ArchiveRestore, Lock } from "lucide-react";
import { formatFileSize, formatDate } from "./utils";
import { creativeAssetSchema, creativeAssetVersionSchema } from "./schema";
import { VersionStatusBadge } from "./version-status-badge";
import { VersionDetailSheet } from "./version-detail-sheet";

interface VersionsTabProps {
	asset: z.infer<typeof creativeAssetSchema>;
	onUploadVersion?: () => void;
	onUpdateVersionStatus?: (
		versionId: string,
		status: "PENDING" | "APPROVED" | "REJECTED" | "NOT_APPLICABLE"
	) => void;
	onMakePrivate?: (versionId: string) => void;
	onEditVersion?: (versionId: string) => void;
}

export function VersionsTab({
	asset,
	onUploadVersion,
	onUpdateVersionStatus,
	onMakePrivate,
	onEditVersion,
}: VersionsTabProps) {
	const versions = asset.versions ?? [];
	const sortedVersions = [...versions].sort(
		(a, b) => b.internalVersionNumber - a.internalVersionNumber
	);
	const [selectedVersion, setSelectedVersion] = React.useState<
		z.infer<typeof creativeAssetVersionSchema> | null
	>(null);
	const [isSheetOpen, setIsSheetOpen] = React.useState(false);

	const openVersion = (version: z.infer<typeof creativeAssetVersionSchema>) => {
		setSelectedVersion(version);
		setIsSheetOpen(true);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-base font-semibold tracking-tight">Version history</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						Manage internal and public versions of this asset
					</p>
				</div>
				{onUploadVersion ? (
					<Button type="button" size="sm" onClick={onUploadVersion}>
						<Upload className="mr-2 h-4 w-4" />
						Upload new version
					</Button>
				) : null}
			</div>

			{sortedVersions.length === 0 ? (
				<div className="overflow-hidden rounded-lg border bg-card">
					<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
						<p className="text-muted-foreground">No versions uploaded yet</p>
						{onUploadVersion ? (
							<Button type="button" className="mt-4" variant="outline" onClick={onUploadVersion}>
								<Upload className="mr-2 h-4 w-4" />
								Upload first version
							</Button>
						) : null}
					</div>
				</div>
			) : (
				<>
					<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Version</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Public</TableHead>
									<TableHead>File name</TableHead>
									<TableHead>Size</TableHead>
									<TableHead>Changes summary</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Updated</TableHead>
									<TableHead className="w-12" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{sortedVersions.map((version, index) => {
									const isLatest = index === 0;
									const isArchived = version.internalApprovalStatus === "NOT_APPLICABLE";
									const canMakePrivate = version.isPublic && onMakePrivate;
									return (
										<TableRow
											key={version.id}
											className="cursor-pointer"
											onClick={() => openVersion(version)}
										>
											<TableCell className="pl-6 font-medium">
												<div className="flex flex-wrap items-center gap-2">
													<span>v{version.internalVersionNumber}</span>
													{isLatest ? (
														<Badge variant="outline" className="text-xs">
															Latest
														</Badge>
													) : null}
													{version.isPublic && version.publicVersionNumber != null ? (
														<Badge variant="default" className="text-xs">
															<Globe className="mr-1 h-3 w-3" />
															Public v{version.publicVersionNumber}
														</Badge>
													) : null}
												</div>
											</TableCell>
											<TableCell>
												<VersionStatusBadge status={version.internalApprovalStatus} />
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{version.isPublic ? "Yes" : "Internal"}
											</TableCell>
											<TableCell className="text-sm">{version.fileName}</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{formatFileSize(version.fileSize)}
											</TableCell>
											<TableCell className="max-w-[200px] text-muted-foreground text-sm">
												{version.changesSummary ? (
													<span className="line-clamp-2">{version.changesSummary}</span>
												) : (
													"- "
												)}
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{formatDate(version.createdAt)}
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{formatDate(version.updatedAt)}
											</TableCell>
											<TableCell onClick={(e) => e.stopPropagation()}>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button type="button" variant="ghost" size="icon" className="h-8 w-8">
															<MoreHorizontal className="h-4 w-4" />
															<span className="sr-only">Actions</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-48">
														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation();
																openVersion(version);
															}}
														>
															View details
														</DropdownMenuItem>
														{onEditVersion ? (
															<DropdownMenuItem
																onClick={(e) => {
																	e.stopPropagation();
																	onEditVersion(version.id);
																}}
															>
																<Edit className="mr-2 h-4 w-4" />
																Edit
															</DropdownMenuItem>
														) : null}
														<DropdownMenuSeparator />
														{onUpdateVersionStatus ? (
															<>
																<DropdownMenuSub>
																	<DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
																	<DropdownMenuSubContent>
																		<DropdownMenuItem
																			onClick={(e) => {
																				e.stopPropagation();
																				onUpdateVersionStatus(version.id, "PENDING");
																			}}
																		>
																			Pending
																		</DropdownMenuItem>
																		<DropdownMenuItem
																			onClick={(e) => {
																				e.stopPropagation();
																				onUpdateVersionStatus(version.id, "APPROVED");
																			}}
																		>
																			<Check className="mr-2 h-4 w-4" />
																			Approved
																		</DropdownMenuItem>
																		<DropdownMenuItem
																			onClick={(e) => {
																				e.stopPropagation();
																				onUpdateVersionStatus(version.id, "REJECTED");
																			}}
																			className="text-destructive focus:text-destructive"
																		>
																			<X className="mr-2 h-4 w-4" />
																			Rejected
																		</DropdownMenuItem>
																		<DropdownMenuItem
																			onClick={(e) => {
																				e.stopPropagation();
																				onUpdateVersionStatus(version.id, "NOT_APPLICABLE");
																			}}
																			className="text-destructive focus:text-destructive"
																		>
																			<Archive className="mr-2 h-4 w-4" />
																			Not applicable
																		</DropdownMenuItem>
																	</DropdownMenuSubContent>
																</DropdownMenuSub>
																<DropdownMenuSeparator />
															</>
														) : null}
														{canMakePrivate ? (
															<>
																<DropdownMenuItem
																	onClick={(e) => {
																		e.stopPropagation();
																		onMakePrivate?.(version.id);
																	}}
																>
																	<Lock className="mr-2 h-4 w-4" />
																	Make private
																</DropdownMenuItem>
																<DropdownMenuSeparator />
															</>
														) : null}
														{!isArchived ? (
															<DropdownMenuItem
																onClick={(e) => {
																	e.stopPropagation();
																	onUpdateVersionStatus?.(version.id, "NOT_APPLICABLE");
																}}
																className="text-destructive focus:text-destructive"
															>
																<Archive className="mr-2 h-4 w-4" />
																Archive
															</DropdownMenuItem>
														) : (
															<DropdownMenuItem
																onClick={(e) => {
																	e.stopPropagation();
																	onUpdateVersionStatus?.(version.id, "PENDING");
																}}
															>
																<ArchiveRestore className="mr-2 h-4 w-4" />
																Unarchive
															</DropdownMenuItem>
														)}
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>

					{selectedVersion ? (
						<VersionDetailSheet
							open={isSheetOpen}
							onOpenChange={setIsSheetOpen}
							version={selectedVersion}
						/>
					) : null}
				</>
			)}
		</div>
	);
}
