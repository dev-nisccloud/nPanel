"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

import { DeviceCombobox } from "./agency.hr.management/_components/device-combobox";
import { EmployeeTable } from "./agency.hr.management/_components/employee-table";

export default function HrManagementPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchQuery, setSearchQuery] = React.useState("");
	const selectedSn = searchParams.get("device") ?? "";
	const devicesQuery = trpc.biotime.devices.all.useQuery();

	React.useEffect(() => {
		const devices = devicesQuery.data;
		if (!devices?.length) return;
		if (devices.some((device) => device.sn === selectedSn)) return;
		setSearchParams(
			(current) => {
				const params = new URLSearchParams(current);
				params.set("device", devices[0].sn);
				return params;
			},
			{ replace: true },
		);
	}, [devicesQuery.data, selectedSn, setSearchParams]);

	const roster = trpc.biotime.attendance.roster.useQuery(
		{ terminalSn: selectedSn },
		{ enabled: selectedSn.length > 0 },
	);

	function selectDevice(sn: string) {
		setSearchParams(
			(current) => {
				const params = new URLSearchParams(current);
				params.set("device", sn);
				return params;
			},
			{ replace: true },
		);
	}

	if (devicesQuery.isLoading) {
		return (
			<div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
				<div className="mx-auto flex w-full max-w-7xl justify-center py-12">
					<Spinner size={32} />
				</div>
			</div>
		);
	}

	if (devicesQuery.error) {
		return (
			<div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
				<div className="mx-auto flex w-full max-w-7xl flex-col items-center py-12 text-center">
					<p className="mb-4 text-destructive">{devicesQuery.error.message}</p>
					<Button variant="outline" onClick={() => devicesQuery.refetch()}>
						Try again
					</Button>
				</div>
			</div>
		);
	}

	const devices = devicesQuery.data ?? [];

	return (
		<div className="@container/main flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8">
			<div className="mx-auto w-full max-w-7xl">
				<div className="flex items-start justify-between gap-3">
					<div className="flex flex-col gap-2">
						<h1 className="text-base font-semibold tracking-tight">Management</h1>
						<p className="text-xs text-muted-foreground">
							Employees and their latest punch on the selected device.
						</p>
					</div>
					<Button
						variant="outline"
						size="icon"
						className="size-11"
						onClick={() => {
							void devicesQuery.refetch();
							void roster.refetch();
						}}
						disabled={devicesQuery.isFetching || roster.isFetching}
						title="Refresh"
					>
						<RefreshCw className={`h-4 w-4 ${devicesQuery.isFetching || roster.isFetching ? "animate-spin" : ""}`} />
					</Button>
				</div>

				<div className="mt-6 w-full min-w-0 md:max-w-md">
					<DeviceCombobox devices={devices} selectedSn={selectedSn} onSelect={selectDevice} />
				</div>

				{devices.length === 0 ? (
					<div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
						<p className="mb-2 text-lg font-semibold">No devices</p>
						<p className="text-muted-foreground">BioTime Cloud has not reported an attendance device.</p>
					</div>
				) : !selectedSn || roster.isLoading ? (
					<div className="flex justify-center py-12">
						<Spinner size={32} />
					</div>
				) : roster.error ? (
					<div className="mt-6 flex flex-col items-center py-12 text-center">
						<p className="mb-4 text-destructive">{roster.error.message}</p>
						<Button variant="outline" onClick={() => roster.refetch()}>
							Try again
						</Button>
					</div>
				) : (
					<EmployeeTable
						employees={roster.data ?? []}
						deviceSn={selectedSn}
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
					/>
				)}
			</div>
		</div>
	);
}
