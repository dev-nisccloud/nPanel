"use client";

import { useNavigate } from "react-router";
import { ChevronRight, Users } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { InvoiceTeamSummary } from "@npanel/api/routers/invoicing/schemas";
import { formatInvoiceDate } from "@/lib/invoice-date";

const formatDate = (value: string | Date | null | undefined) =>
	formatInvoiceDate(value, "");

export interface InvoiceTeamsTableProps {
	teams: InvoiceTeamSummary[];
}

export function InvoiceTeamsTable({ teams }: InvoiceTeamsTableProps) {
	const navigate = useNavigate();

	return (
		<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Organization</TableHead>
						<TableHead>Invoices</TableHead>
						<TableHead>Unpaid</TableHead>
						<TableHead>Last invoice</TableHead>
						<TableHead className="w-12 pr-6" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{teams.map((team) => {
						const routeId = team.teamId ?? "unassigned";
						return (
							<TableRow
								key={routeId}
								className="cursor-pointer"
								onClick={() => navigate(`/agency/invoices/organizations/${routeId}`)}
							>
								<TableCell className="pl-6 font-medium">
									<div className="flex items-center gap-2">
										<Users className="h-4 w-4 text-muted-foreground" />
										<span>{team.teamName}</span>
										{!team.teamId ? (
											<Badge variant="outline" className="font-normal">
												No organization
											</Badge>
										) : null}
									</div>
								</TableCell>
								<TableCell>{team.invoiceCount}</TableCell>
								<TableCell>
									{team.unpaidCount > 0 ? (
										<Badge
											variant="outline"
											className="bg-destructive/10 text-destructive border-destructive/30"
										>
											{team.unpaidCount}
										</Badge>
									) : (
										<span className="text-muted-foreground">0</span>
									)}
								</TableCell>
								<TableCell>{formatDate(team.lastInvoiceAt)}</TableCell>
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
