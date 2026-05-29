"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router";
import { formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	CopyIcon,
	FileIcon,
	MoreHorizontal,
	Search,
	Trash,
	Pencil,
} from "lucide-react";

import { useGetNebDesigns } from "../_api/use-get-neb-designs";
import { useDeleteNebDesign } from "../_api/use-delete-neb-design";
import { useDuplicateNebDesign } from "../_api/use-duplicate-neb-design";

import {
	DropdownMenuContent,
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { NebSpinner } from "./neb-loading";

export const ProjectsSection = () => {
	const [ConfirmDialog, confirm] = useConfirm(
		"Are you sure?",
		"You are about to delete this email design.",
	);
	const [navigatingDesignId, setNavigatingDesignId] = useState<string | null>(null);
	const [duplicatingDesignId, setDuplicatingDesignId] = useState<string | null>(null);
	const [deletingDesignId, setDeletingDesignId] = useState<string | null>(null);
	const duplicateMutation = useDuplicateNebDesign();
	const removeMutation = useDeleteNebDesign();
	const navigate = useNavigate();

	const teamId = undefined;

	const isDeleteInProgress =
		deletingDesignId !== null || removeMutation.isPending;

	const handleDesignClick = (designId: string) => {
		if (isDeleteInProgress || duplicatingDesignId || navigatingDesignId) return;
		setNavigatingDesignId(designId);
		navigate(`/agency/nisc-email-builder/${designId}`);
	};

	const onCopy = (designId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (isDeleteInProgress) return;
		setDuplicatingDesignId(designId);
		duplicateMutation.mutate(
			{ designId },
			{
				onSettled: () => setDuplicatingDesignId(null),
			},
		);
	};

	const onDelete = async (designId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const ok = await confirm();
		if (ok) {
			setDeletingDesignId(designId);
			removeMutation.mutate(
				{ designId },
				{
					onSettled: () => setDeletingDesignId(null),
				},
			);
		}
	};

	const { data, status, fetchNextPage, isFetchingNextPage, hasNextPage } =
		useGetNebDesigns({ teamId });

	if (status === "pending" || !data) {
		return (
			<div className="space-y-4 mt-8">
				<h3 className="font-semibold text-lg">Recent designs</h3>
				<div className="flex flex-col gap-y-4 items-center justify-center h-32">
					<NebSpinner context="page" size={32} className="text-primary" />
				</div>
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className="space-y-4 mt-8">
				<h3 className="font-semibold text-lg">Recent designs</h3>
				<div className="flex flex-col gap-y-4 items-center justify-center h-32">
					<AlertTriangle className="size-6 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">Failed to load designs</p>
				</div>
			</div>
		);
	}

	const firstPageData = data.pages[0]?.data;
	if (!data.pages.length || !firstPageData?.length) {
		return (
			<div className="space-y-4 mt-8">
				<h3 className="font-semibold text-lg">Recent designs</h3>
				<div className="flex flex-col gap-y-4 items-center justify-center h-32 bg-muted/20 rounded-lg border border-dashed">
					<Search className="size-6 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">
						No designs found. Create one to get started!
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 mt-8">
			<ConfirmDialog />
			<h3 className="font-semibold text-lg">Recent designs</h3>
			<div className="rounded-md border">
				<Table>
					<TableBody>
						{data.pages.map((group, i) => (
							<React.Fragment key={i}>
								{(group.data ?? []).map((design) => {
									const isDeleting =
										deletingDesignId === design.id ||
										(removeMutation.isPending &&
											removeMutation.variables?.designId === design.id);
									const isDuplicating = duplicatingDesignId === design.id;
									const isNavigating = navigatingDesignId === design.id;
									const isRowBusy = isDeleting || isDuplicating || isNavigating;
									const canOpen =
										!isDeleteInProgress &&
										!duplicatingDesignId &&
										!navigatingDesignId &&
										!isRowBusy;

									return (
										<TableRow
											key={design.id}
											className={`hover:bg-muted/50 ${isDeleting ? "pointer-events-none opacity-60" : ""}`}
										>
											<TableCell
												onClick={() => canOpen && handleDesignClick(design.id)}
												className={`font-medium flex items-center gap-x-3 py-4 ${
													canOpen
														? "cursor-pointer"
														: "cursor-not-allowed opacity-50"
												}`}
											>
												<div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-md">
													<FileIcon className="size-5 text-blue-600 dark:text-blue-400" />
												</div>
												<div>
													<p className="font-medium text-sm">{design.name}</p>
													{design.description && (
														<p className="text-xs text-muted-foreground">
															{design.description}
														</p>
													)}
												</div>
											</TableCell>
											<TableCell
												onClick={() => canOpen && handleDesignClick(design.id)}
												className={`hidden md:table-cell py-4 ${
													canOpen
														? "cursor-pointer"
														: "cursor-not-allowed opacity-50"
												}`}
											>
												<span
													className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
														design.isPublic
															? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
															: "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10"
													}`}
												>
													{design.isPublic ? "Public" : "Private"}
												</span>
											</TableCell>
											<TableCell
												onClick={() => canOpen && handleDesignClick(design.id)}
												className={`hidden md:table-cell py-4 text-muted-foreground text-sm ${
													canOpen
														? "cursor-pointer"
														: "cursor-not-allowed opacity-50"
												}`}
											>
												{formatDistanceToNow(new Date(design.updatedAt), {
													addSuffix: true,
												})}
											</TableCell>
											<TableCell className="flex items-center justify-end py-4">
												{isRowBusy ? (
													<div className="flex items-center justify-center w-8 h-8">
														<NebSpinner context="inline" size={16} />
													</div>
												) : (
													<DropdownMenu modal={false}>
														<DropdownMenuTrigger asChild>
															<Button
																disabled={isDeleteInProgress || Boolean(duplicatingDesignId)}
																size="icon"
																variant="ghost"
																className="h-8 w-8"
															>
																<MoreHorizontal className="size-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end" className="w-56">
															<DropdownMenuItem
																className="cursor-pointer"
																disabled={!canOpen}
																onClick={() => canOpen && handleDesignClick(design.id)}
															>
																<Pencil className="size-4 mr-2" />
																Edit
															</DropdownMenuItem>
															<DropdownMenuItem
																className="cursor-pointer"
																disabled={
																	duplicateMutation.isPending ||
																	isDeleteInProgress
																}
																onClick={(e) => onCopy(design.id, e)}
															>
																<CopyIcon className="size-4 mr-2" />
																Make a copy
															</DropdownMenuItem>
															<DropdownMenuItem
																className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
																disabled={isDeleteInProgress}
																onClick={(e) => onDelete(design.id, e)}
															>
																<Trash className="size-4 mr-2" />
																Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</React.Fragment>
						))}
					</TableBody>
				</Table>
			</div>
			{hasNextPage && (
				<div className="w-full flex items-center justify-center pt-4">
					<Button
						variant="ghost"
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
					>
						Load more
					</Button>
				</div>
			)}
		</div>
	);
};
