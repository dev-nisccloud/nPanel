"use client";

import * as React from "react";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RegisterDigitaxItemSheet } from "./agency.digitax/products/_components/register-digitax-item-sheet";
import { DigitaxPageShell } from "./agency.digitax/_components/digitax-page-shell";
import { DigitaxListToolbar } from "./agency.digitax/_components/digitax-list-toolbar";
import {
	DigitaxTableSkeleton,
	DigitaxTableEmpty,
	DigitaxTableWrapper,
	DigitaxNoSearchResults,
} from "./agency.digitax/_components/digitax-table-states";
import { extractDigitaxArray } from "./agency.digitax/_components/digitax-utils";

export default function DigitaxProductsPage() {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [isAddOpen, setIsAddOpen] = React.useState(false);
	const [selectedItem, setSelectedItem] = React.useState<Record<string, unknown> | null>(null);

	const { data: itemsData, isLoading, refetch, isFetching } = trpc.digitax.items.getAll.useQuery({
		page_size: 50,
	});

	const deleteItem = trpc.digitax.items.delete.useMutation({
		onSuccess: () => {
			toast.success("Product removed from eTIMS catalog");
			void refetch();
		},
		onError: (err) => toast.error(err.message || "Failed to remove product"),
	});

	const items = React.useMemo(() => extractDigitaxArray<Record<string, unknown>>(itemsData), [itemsData]);

	const filteredItems = React.useMemo(() => {
		if (!searchQuery.trim()) return items;
		const query = searchQuery.toLowerCase().trim();
		return items.filter((item) =>
			String(item.item_name ?? "").toLowerCase().includes(query) ||
			String(item.etims_item_code ?? "").toLowerCase().includes(query) ||
			String(item.item_class_code ?? "").toLowerCase().includes(query)
		);
	}, [items, searchQuery]);

	const handleEdit = (item: Record<string, unknown>) => {
		setSelectedItem(item);
		setIsAddOpen(true);
	};

	const handleDelete = (itemId: string) => {
		if (confirm("Are you sure you want to remove this item? This action cannot be undone.")) {
			deleteItem.mutate({ itemId });
		}
	};

	const handleSheetClose = (open: boolean) => {
		setIsAddOpen(open);
		if (!open) setSelectedItem(null);
	};

	const columns = ["Name", "eTIMS code", "Type", "Price", "HS code"];

	if (isLoading) {
		return (
			<DigitaxPageShell
				title="Catalog & inventory"
				description="Manage items and services registered for eTIMS compliance."
				action={
					<Button size="sm" disabled>
						<Plus className="mr-2 h-4 w-4" />
						Add product
					</Button>
				}
			>
				<DigitaxTableSkeleton columns={columns} />
			</DigitaxPageShell>
		);
	}

	return (
		<DigitaxPageShell
			title="Catalog & inventory"
			description="Manage items and services registered for eTIMS compliance."
			action={
				<Button
					size="sm"
					onClick={() => {
						setSelectedItem(null);
						setIsAddOpen(true);
					}}
				>
					<Plus className="mr-2 h-4 w-4" />
					Add product
				</Button>
			}
		>
			<RegisterDigitaxItemSheet
				open={isAddOpen}
				onOpenChange={handleSheetClose}
				onSuccess={() => refetch()}
				item={selectedItem}
			/>

			{!items.length ? (
				<DigitaxTableEmpty
					title="No products found"
					description="Register products or services to enable compliant invoicing."
					action={
						<Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
							Add product
						</Button>
					}
				/>
			) : (
				<>
					<DigitaxListToolbar
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						searchPlaceholder="Search by name or code..."
						onRefresh={() => refetch()}
						isFetching={isFetching}
					/>
					<div className="mt-6">
						<DigitaxTableWrapper>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Name</TableHead>
									<TableHead>eTIMS code</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Price</TableHead>
									<TableHead>HS code</TableHead>
									<TableHead className="w-12" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredItems.length === 0 ? (
									<DigitaxNoSearchResults colSpan={6} query={searchQuery} />
								) : (
									filteredItems.map((item) => (
										<TableRow key={String(item.id)}>
											<TableCell className="pl-6 font-medium">{String(item.item_name ?? "-")}</TableCell>
											<TableCell className="text-muted-foreground">{String(item.etims_item_code ?? "-")}</TableCell>
											<TableCell>
												<Badge variant="outline">
													{item.item_type_code === "3" ? "Service" : "Product"}
												</Badge>
											</TableCell>
											<TableCell>
												{Number(item.default_unit_price ?? 0).toLocaleString()} KES
											</TableCell>
											<TableCell>{String(item.item_class_code ?? "-")}</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon" className="h-8 w-8">
															<MoreHorizontal className="h-4 w-4" />
															<span className="sr-only">Open menu</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-40">
														<DropdownMenuItem onSelect={() => handleEdit(item)}>
															<Pencil className="mr-2 h-4 w-4" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:text-destructive"
															onSelect={() => handleDelete(String(item.id))}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</DigitaxTableWrapper>
					</div>
				</>
			)}
		</DigitaxPageShell>
	);
}
