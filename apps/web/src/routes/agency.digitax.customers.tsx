"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { SaveDigitaxCustomerSheet } from "./agency.digitax/customers/_components/save-digitax-customer-sheet";
import { DigitaxPageShell } from "./agency.digitax/_components/digitax-page-shell";
import { DigitaxListToolbar } from "./agency.digitax/_components/digitax-list-toolbar";
import {
	DigitaxTableSkeleton,
	DigitaxTableEmpty,
	DigitaxTableWrapper,
	DigitaxNoSearchResults,
} from "./agency.digitax/_components/digitax-table-states";
import { extractDigitaxArray } from "./agency.digitax/_components/digitax-utils";

export default function DigitaxCustomersPage() {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [isAddOpen, setIsAddOpen] = React.useState(false);
	const [selectedCustomer, setSelectedCustomer] = React.useState<Record<string, unknown> | null>(null);

	const { data: customersData, isLoading, refetch, isFetching } = trpc.digitax.customers.getAll.useQuery({
		page_size: 50,
	});

	const deleteCustomer = trpc.digitax.customers.delete.useMutation({
		onSuccess: () => {
			toast.success("Customer removed from eTIMS system");
			void refetch();
		},
		onError: (err) => toast.error(err.message || "Failed to remove customer"),
	});

	const customers = React.useMemo(() => extractDigitaxArray<Record<string, unknown>>(customersData), [customersData]);

	const filteredCustomers = React.useMemo(() => {
		if (!searchQuery.trim()) return customers;
		const query = searchQuery.toLowerCase().trim();
		return customers.filter((c) =>
			String(c.customer_name ?? "").toLowerCase().includes(query) ||
			String(c.customer_tin ?? "").toLowerCase().includes(query) ||
			String(c.email ?? "").toLowerCase().includes(query) ||
			String(c.phone ?? "").toLowerCase().includes(query)
		);
	}, [customers, searchQuery]);

	const handleEdit = (customer: Record<string, unknown>) => {
		setSelectedCustomer(customer);
		setIsAddOpen(true);
	};

	const handleDelete = (customerId: string) => {
		if (confirm("Are you sure you want to remove this customer from eTIMS registry?")) {
			deleteCustomer.mutate({ customerId });
		}
	};

	const columns = ["Customer", "Email", "Phone", "TIN"];

	if (isLoading) {
		return (
			<DigitaxPageShell
				title="Customers"
				description="Manage and synchronise customer tax identities for eTIMS."
				action={
					<Button size="sm" disabled>
						<UserPlus className="mr-2 h-4 w-4" />
						New customer
					</Button>
				}
			>
				<DigitaxTableSkeleton columns={columns} />
			</DigitaxPageShell>
		);
	}

	return (
		<DigitaxPageShell
			title="Customers"
			description="Manage and synchronise customer tax identities for eTIMS."
			action={
				<Button
					size="sm"
					onClick={() => {
						setSelectedCustomer(null);
						setIsAddOpen(true);
					}}
				>
					<UserPlus className="mr-2 h-4 w-4" />
					New customer
				</Button>
			}
		>
			<SaveDigitaxCustomerSheet
				open={isAddOpen}
				onOpenChange={(v) => {
					setIsAddOpen(v);
					if (!v) setSelectedCustomer(null);
				}}
				onSuccess={() => refetch()}
				customer={selectedCustomer}
			/>

			{!customers.length ? (
				<DigitaxTableEmpty
					title="No customers found"
					description="Your eTIMS customer directory is currently empty."
					action={
						<Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
							New customer
						</Button>
					}
				/>
			) : (
				<>
					<DigitaxListToolbar
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						searchPlaceholder="Search by name, TIN or contact..."
						onRefresh={() => refetch()}
						isFetching={isFetching}
					/>
					<div className="mt-6">
						<DigitaxTableWrapper>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Customer</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Phone</TableHead>
									<TableHead>TIN</TableHead>
									<TableHead className="w-12" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredCustomers.length === 0 ? (
									<DigitaxNoSearchResults colSpan={5} query={searchQuery} />
								) : (
									filteredCustomers.map((customer) => (
										<TableRow key={String(customer.id)}>
											<TableCell className="pl-6 font-medium">
												{String(customer.customer_name ?? "-")}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{String(customer.email ?? "-")}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{String(customer.phone ?? "-")}
											</TableCell>
											<TableCell>{String(customer.customer_tin ?? "-")}</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon" className="h-8 w-8">
															<MoreHorizontal className="h-4 w-4" />
															<span className="sr-only">Open menu</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-40">
														<DropdownMenuItem onSelect={() => handleEdit(customer)}>
															<Pencil className="mr-2 h-4 w-4" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:text-destructive"
															onSelect={() => handleDelete(String(customer.id))}
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
