"use client";

import { useNavigate } from "react-router";
import { Building2, ChevronRight } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { QuotationCustomerSummary } from "@npanel/api/routers/quotations/schemas";

const formatDate = (value: string | Date | null | undefined) => {
	if (!value) return "";
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

export interface QuotationCustomersTableProps {
	customers: QuotationCustomerSummary[];
}

export function QuotationCustomersTable({ customers }: QuotationCustomersTableProps) {
	const navigate = useNavigate();

	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Customer</TableHead>
						<TableHead>Quotations</TableHead>
						<TableHead>Open</TableHead>
						<TableHead>Last quotation</TableHead>
						<TableHead className="w-12 pr-6" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{customers.map((customer) => {
						const path = `/agency/quotations/customers/${encodeURIComponent(customer.customerGroupKey)}`;
						const isUnassigned = customer.customerGroupKey === "unassigned";
						return (
							<TableRow
								key={customer.customerGroupKey}
								className="cursor-pointer"
								onClick={() => navigate(path)}
							>
								<TableCell className="pl-6 font-medium">
									<div className="flex items-start gap-2">
										<Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
										<div className="flex flex-col gap-0.5">
											<div className="flex items-center gap-2">
												<span>{customer.customerName ?? "Unassigned"}</span>
												{isUnassigned ? (
													<Badge variant="outline" className="font-normal">
														No customer
													</Badge>
												) : null}
											</div>
											{customer.customerEmail ? (
												<span className="text-sm font-normal text-muted-foreground">
													{customer.customerEmail}
												</span>
											) : null}
										</div>
									</div>
								</TableCell>
								<TableCell>{customer.quotationCount}</TableCell>
								<TableCell>
									{customer.openCount > 0 ? (
										<Badge variant="outline">{customer.openCount}</Badge>
									) : (
										<span className="text-muted-foreground">0</span>
									)}
								</TableCell>
								<TableCell>{formatDate(customer.lastQuotationAt)}</TableCell>
								<TableCell className="pr-6">
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
