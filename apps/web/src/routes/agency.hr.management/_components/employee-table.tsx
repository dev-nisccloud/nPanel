import { Link, useNavigate } from "react-router";
import { Search } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ViewDetailsButton } from "@/components/ui/list-row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { formatPunchTime, punchStateLabel } from "./punch";

export type RosterEmployee = {
	id: string;
	empCode: string;
	name: string;
	departmentName: string | null;
	positionName: string | null;
	lastPunch: {
		punchTime: string;
		punchState: string | null;
		terminalSn: string | null;
		terminalAlias: string | null;
	} | null;
};

export function EmployeeTable({
	employees,
	deviceSn,
	searchQuery,
	onSearchChange,
}: {
	employees: RosterEmployee[];
	deviceSn: string;
	searchQuery: string;
	onSearchChange: (value: string) => void;
}) {
	const navigate = useNavigate();
	const query = searchQuery.trim().toLowerCase();
	const filtered = query
		? employees.filter((employee) => {
				return (
					employee.name.toLowerCase().includes(query) ||
					employee.empCode.toLowerCase().includes(query) ||
					(employee.departmentName ?? "").toLowerCase().includes(query)
				);
			})
		: employees;

	return (
		<div className="mt-6">
			<div className="relative max-w-sm">
				<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search by name or employee code"
					value={searchQuery}
					onChange={(event) => onSearchChange(event.target.value)}
					className="pl-9"
				/>
			</div>

			<div className="mt-6">
				{employees.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<p className="mb-2 text-lg font-semibold">No employees</p>
						<p className="text-muted-foreground">BioTime Cloud has no employees for this company.</p>
					</div>
				) : filtered.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<p className="mb-2 text-lg font-semibold">No employees found</p>
						<p className="mb-4 text-muted-foreground">No employees match "{searchQuery}".</p>
						<Button variant="outline" onClick={() => onSearchChange("")}>
							Clear search
						</Button>
					</div>
				) : (
					<div className="overflow-hidden rounded-lg border bg-card shadow-sm">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-16 pl-6">Photo</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Last check-in</TableHead>
									<TableHead>Punch state</TableHead>
									<TableHead className="pr-6 text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filtered.map((employee) => {
									const href = `/hq/hr/management/${encodeURIComponent(employee.id)}?device=${encodeURIComponent(deviceSn)}`;
									return (
										<TableRow key={employee.id}>
											<TableCell className="pl-6">
												<UserAvatar name={employee.name} className="h-10 w-10" fallbackClassName="text-xs" />
											</TableCell>
											<TableCell>
												<Link to={href} className="font-medium text-foreground hover:underline">
													{employee.name}
												</Link>
												<p className="text-sm text-muted-foreground">
													{employee.empCode}
													{employee.departmentName ? ` · ${employee.departmentName}` : ""}
												</p>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{employee.lastPunch ? formatPunchTime(employee.lastPunch.punchTime) : "No punch"}
											</TableCell>
											<TableCell>
												{employee.lastPunch ? (
													<Badge variant="outline">{punchStateLabel(employee.lastPunch.punchState)}</Badge>
												) : (
													<span className="text-sm text-muted-foreground">None</span>
												)}
											</TableCell>
											<TableCell className="pr-6 text-right">
												<ViewDetailsButton onClick={() => navigate(href)} />
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}
			</div>
		</div>
	);
}
