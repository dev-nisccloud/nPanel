import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type AttendanceDevice = {
	id: number;
	sn: string;
	alias: string | null;
	terminal_name: string | null;
	area_name: string | null;
	state: number | null;
};

export function deviceTitle(device: AttendanceDevice): string {
	const alias = device.alias?.trim();
	const name = device.terminal_name?.trim();
	if (alias && alias.toLowerCase() !== "auto add") return alias;
	if (name) return name;
	return device.sn;
}

function deviceStatus(state: number | null): string {
	if (state === 1) return "Online";
	if (state === 0) return "Offline";
	return state == null ? "Unknown" : `State ${state}`;
}

export function DeviceCombobox({
	devices,
	selectedSn,
	onSelect,
}: {
	devices: AttendanceDevice[];
	selectedSn: string;
	onSelect: (sn: string) => void;
}) {
	const [open, setOpen] = React.useState(false);
	const selected = devices.find((device) => device.sn === selectedSn);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					disabled={devices.length === 0}
					className="h-auto min-h-11 w-full items-center justify-between whitespace-normal border-muted/60 px-3 py-1.5 font-normal shadow-sm"
				>
					{selected ? (
						<span className="min-w-0 text-left">
							<span className="block truncate font-medium">{deviceTitle(selected)}</span>
							<span className="block truncate text-xs text-muted-foreground">
								{selected.sn}
								{selected.area_name ? ` · ${selected.area_name}` : ""} · {deviceStatus(selected.state)}
							</span>
						</span>
					) : (
						<span className="text-muted-foreground">{devices.length === 0 ? "No devices" : "Select a device"}</span>
					)}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
				<Command>
					<CommandInput placeholder="Search devices..." />
					<CommandList className="max-h-64 overflow-auto">
						<CommandEmpty>No device found.</CommandEmpty>
						<CommandGroup>
							{devices.map((device) => (
								<CommandItem
									key={device.id}
									value={`${deviceTitle(device)} ${device.sn} ${device.area_name ?? ""}`}
									className="items-start"
									onSelect={() => {
										onSelect(device.sn);
										setOpen(false);
									}}
								>
									<Check
										className={cn("mt-0.5 mr-2 h-4 w-4", selectedSn === device.sn ? "opacity-100" : "opacity-0")}
									/>
									<span className="min-w-0 flex-1">
										<span className="line-clamp-2 font-medium break-words whitespace-normal">{deviceTitle(device)}</span>
										<span className="block truncate text-xs text-muted-foreground">
											{device.sn}
											{device.area_name ? ` · ${device.area_name}` : ""}
										</span>
									</span>
									<span className="shrink-0 text-xs text-muted-foreground">{deviceStatus(device.state)}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
