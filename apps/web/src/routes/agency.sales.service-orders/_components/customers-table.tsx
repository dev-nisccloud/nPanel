"use client";

import { useNavigate } from "react-router";
import { Building2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SERVICE_ORDER_BASE, formatDisplayDate } from "../_lib/model";

export type ServiceOrderCustomerRow = {
	customerGroupKey: string;
	customerName?: string | null;
	customerEmail?: string | null;
	orderCount: number;
	openCount: number;
	lastOrderAt: string | Date | null;
};

export function ServiceOrderCustomersTable({ customers }: { customers: ServiceOrderCustomerRow[] }) {
	const navigate = useNavigate();
	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Customer</TableHead>
						<TableHead>Orders</TableHead>
						<TableHead>Open</TableHead>
						<TableHead>Last order</TableHead>
						<TableHead className="w-12 pr-6" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{customers.map((customer) => {
						const path = `${SERVICE_ORDER_BASE}/customers/${encodeURIComponent(customer.customerGroupKey)}`;
						return (
							<TableRow key={customer.customerGroupKey} className="cursor-pointer" onClick={() => navigate(path)}>
								<TableCell className="pl-6 font-medium">
									<div className="flex items-start gap-2">
										<Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
										<div>
											<div>{customer.customerName || "Unassigned"}</div>
											{customer.customerEmail ? (
												<div className="text-sm font-normal text-muted-foreground">{customer.customerEmail}</div>
											) : null}
										</div>
									</div>
								</TableCell>
								<TableCell>{customer.orderCount}</TableCell>
								<TableCell>
									{customer.openCount > 0 ? (
										<Badge variant="outline">{customer.openCount}</Badge>
									) : (
										<span className="text-muted-foreground">0</span>
									)}
								</TableCell>
								<TableCell>{formatDisplayDate(customer.lastOrderAt)}</TableCell>
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
